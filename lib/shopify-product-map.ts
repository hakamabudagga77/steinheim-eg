import type { ShopifyProduct } from "./shopify-client";

const FINISH_ALIASES: Record<string, string> = {
  "chrome": "Chrome",
  "brushed-nickel": "Brushed Nickel",
  "matte-black": "Matte Black",
  "brushed-gold": "Brushed Gold",
  "coffee-gold": "Coffee Gold",
  "metal-gun": "Gun Metal Grey",
};

const SLUG_TO_HANDLE: Record<string, string> = {
  "art-basin-mixer": "art-basin-mixer-w-o-puw",
  "art-tall-basin-mixer": "art-tall-basin-mixer-w-o-puw",
  "art-wall-mounted-basin-mixer": "art-wall-mounted-mixer-two-hole-basn",
  "art-concealed-shower": "art-bath-concealed-shower-mixer",
  "art-free-standing-bath-mixer": "art-free-standing-mixer",
  "joy-basin-mixer": "joy-single-lever-basin-mixer",
  "joy-tall-basin-mixer": "joy-single-lever-tall-basin-mixer",
  "joy-wall-mounted-basin-mixer": "joy-single-wall-mounted-mixer",
  "joy-concealed-shower": "joy-concealed-bath-shower-set",
  "joy-shower-column": "joy-colum-shower-set",
  "joy-free-standing-bath-mixer": "joy-free-stand-bath-mixer",
  "joy-accessories-set": "joy-joy-accessories",
  "joy-bidet-spray": "joy-abidet-spray",
  "joy-click-clack-waste": "steinheim-click-clack-waste-for-basin-without-overflow",
  "joy-angle-valve": "steinheim-angle-valve-1-2-x-1-2-brass",
  "joy-bottle-trap": "",
  "up-basin-mixer": "up-single-lever-basin-mixer",
  "up-tall-basin-mixer": "up-single-lever-tall-basin-mixer",
  "up-wall-mounted-basin-mixer": "up-single-wall-mounted-mixer",
  "up-concealed-shower": "up-concealed-bath-shower-set",
  "up-shower-column": "up-colum-shower-set",
  "up-free-standing-bath-mixer": "up-free-stand-bath-mixer",
  "up-accessories-set": "up-up-accessories",
  "quatro-basin-mixer": "quatro-single-lever-basin-mixer",
  "quatro-tall-basin-mixer": "quatro-single-lever-tall-basin-mixer",
  "quatro-wall-mounted-basin-mixer": "quatro-quatro-wall-mounted-basin-mixer",
  "quatro-concealed-shower": "quatro-concealed-bath-shower-set",
};

export function resolveVariantId(
  slug: string,
  finish: string,
  shopifyProducts: ShopifyProduct[]
): number | null {
  const handle = SLUG_TO_HANDLE[slug];
  if (!handle) return null;

  const product = shopifyProducts.find((p) => p.handle === handle);
  if (!product) return null;

  const finishName = FINISH_ALIASES[finish] ?? finish;
  const variant = product.variants.find(
    (v) => v.option1?.toLowerCase() === finishName.toLowerCase()
  );
  return variant?.id ?? null;
}

export function resolveVariantPrice(
  slug: string,
  finish: string,
  shopifyProducts: ShopifyProduct[]
): number | null {
  const handle = SLUG_TO_HANDLE[slug];
  if (!handle) return null;

  const product = shopifyProducts.find((p) => p.handle === handle);
  if (!product) return null;

  const finishName = FINISH_ALIASES[finish] ?? finish;
  const variant = product.variants.find(
    (v) => v.option1?.toLowerCase() === finishName.toLowerCase()
  );
  return variant ? parseFloat(variant.price) : null;
}

export function resolveInventory(
  slug: string,
  finish: string,
  shopifyProducts: ShopifyProduct[]
): number | null {
  const handle = SLUG_TO_HANDLE[slug];
  if (!handle) return null;

  const product = shopifyProducts.find((p) => p.handle === handle);
  if (!product) return null;

  const finishName = FINISH_ALIASES[finish] ?? finish;
  const variant = product.variants.find(
    (v) => v.option1?.toLowerCase() === finishName.toLowerCase()
  );
  return variant?.inventory_quantity ?? null;
}

export { SLUG_TO_HANDLE, FINISH_ALIASES };
