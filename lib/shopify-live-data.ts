import { fetchAllProducts, type ShopifyProduct } from "./shopify-client";
import { SLUG_TO_HANDLE, FINISH_ALIASES } from "./shopify-product-map";

export interface LiveVariantData {
  finish: string;
  price: number;
  inventory: number;
  inStock: boolean;
}

export interface LiveProductData {
  slug: string;
  variants: LiveVariantData[];
}

let cachedProducts: { data: ShopifyProduct[]; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

async function getCachedProducts(): Promise<ShopifyProduct[]> {
  if (cachedProducts && Date.now() - cachedProducts.fetchedAt < CACHE_TTL) {
    return cachedProducts.data;
  }
  const data = await fetchAllProducts();
  cachedProducts = { data, fetchedAt: Date.now() };
  return data;
}

const FINISH_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(FINISH_ALIASES).map(([local, shopify]) => [shopify.toLowerCase(), local])
);

export async function getLiveProductData(slug: string): Promise<LiveProductData | null> {
  const handle = SLUG_TO_HANDLE[slug];
  if (!handle) return null;

  try {
    const products = await getCachedProducts();
    const shopifyProduct = products.find((p) => p.handle === handle);
    if (!shopifyProduct) return null;

    const variants: LiveVariantData[] = shopifyProduct.variants.map((v) => {
      const shopifyFinish = (v.option1 ?? "").toLowerCase();
      const localFinish = FINISH_REVERSE[shopifyFinish] ?? shopifyFinish.replace(/\s+/g, "-");
      return {
        finish: localFinish,
        price: parseFloat(v.price),
        inventory: v.inventory_quantity,
        inStock: v.inventory_quantity > 0,
      };
    });

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

      const variants: LiveVariantData[] = shopifyProduct.variants.map((v) => {
        const shopifyFinish = (v.option1 ?? "").toLowerCase();
        const localFinish = FINISH_REVERSE[shopifyFinish] ?? shopifyFinish.replace(/\s+/g, "-");
        return {
          finish: localFinish,
          price: parseFloat(v.price),
          inventory: v.inventory_quantity,
          inStock: v.inventory_quantity > 0,
        };
      });

      map.set(slug, { slug, variants });
    }
  } catch (error) {
    console.error("Failed to fetch all live data:", error);
  }

  return map;
}
