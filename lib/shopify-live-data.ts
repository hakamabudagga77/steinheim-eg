import { fetchAllProducts, type ShopifyProduct } from "./shopify-client";
import { SLUG_TO_HANDLE, FINISH_ALIASES } from "./shopify-product-map";
import { redisGet, redisSetEx, redisDel } from "@/lib/server/redis";
import { validCompareAtPrice } from "@/lib/discount-pricing";

export interface LiveVariantData {
  finish: string;
  price: number;
  compareAtPrice: number | null;
  inventory: number;
  inStock: boolean;
}

export interface LiveProductData {
  slug: string;
  variants: LiveVariantData[];
}

const REDIS_CACHE_KEY = "steinheim:shopify:products";
const CACHE_TTL_SECONDS = 5 * 60;

// Per-instance fallback for when Redis isn't configured (local dev). On
// serverless with Redis configured this is bypassed in favor of the shared
// cache below, which the Shopify webhook can actually invalidate.
let memoryCache: { data: ShopifyProduct[]; fetchedAt: number } | null = null;

async function getCachedProducts(): Promise<ShopifyProduct[]> {
  const cached = await redisGet(REDIS_CACHE_KEY).catch(() => null);
  if (cached) {
    try {
      return JSON.parse(cached) as ShopifyProduct[];
    } catch {
      // Corrupt cache entry — fall through and refetch.
    }
  }

  if (!cached && memoryCache && Date.now() - memoryCache.fetchedAt < CACHE_TTL_SECONDS * 1000) {
    return memoryCache.data;
  }

  const data = await fetchAllProducts();
  memoryCache = { data, fetchedAt: Date.now() };
  await redisSetEx(REDIS_CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(data)).catch(() => {});
  return data;
}

/** Called by the Shopify webhook handler when inventory or prices change. */
export async function invalidateShopifyProductCache(): Promise<void> {
  memoryCache = null;
  await redisDel(REDIS_CACHE_KEY).catch(() => {});
}

const FINISH_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(FINISH_ALIASES).map(([local, shopify]) => [shopify.toLowerCase(), local])
);

function toLiveVariant(variant: ShopifyProduct["variants"][number]): LiveVariantData {
  const shopifyFinish = (variant.option1 ?? "").toLowerCase();
  const finish = FINISH_REVERSE[shopifyFinish] ?? shopifyFinish.replace(/\s+/g, "-");
  const price = Number.parseFloat(variant.price);
  const rawCompareAtPrice = variant.compare_at_price
    ? Number.parseFloat(variant.compare_at_price)
    : null;

  return {
    finish,
    price,
    compareAtPrice: validCompareAtPrice(price, rawCompareAtPrice),
    inventory: variant.inventory_quantity,
    inStock: variant.inventory_quantity > 0,
  };
}

export async function getLiveProductData(slug: string): Promise<LiveProductData | null> {
  const handle = SLUG_TO_HANDLE[slug];
  if (!handle) return null;

  try {
    const products = await getCachedProducts();
    const shopifyProduct = products.find((p) => p.handle === handle);
    if (!shopifyProduct) return null;

    const variants = shopifyProduct.variants.map(toLiveVariant);

    return { slug, variants };
  } catch (error) {
    console.error(`Failed to fetch live data for ${slug}:`, error);
    return null;
  }
}

export async function getAllLiveData(): Promise<Map<string, LiveProductData>> {
  const map = new Map<string, LiveProductData>();

  try {
    const products = await getCachedProducts();

    for (const [slug, handle] of Object.entries(SLUG_TO_HANDLE)) {
      if (!handle) continue;
      const shopifyProduct = products.find((p) => p.handle === handle);
      if (!shopifyProduct) continue;

      const variants = shopifyProduct.variants.map(toLiveVariant);

      map.set(slug, { slug, variants });
    }
  } catch (error) {
    console.error("Failed to fetch all live data:", error);
  }

  return map;
}
