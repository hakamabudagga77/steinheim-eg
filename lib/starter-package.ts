import { getProductsBySeries, type Product } from "@/lib/utils";

/**
 * The practical first bathroom set for a collection: what actually has to be
 * specified to make one room work, in the order a specifier thinks about it.
 *
 * Deliberately short. This is the opening move on a collection page, not a
 * full schedule — the Trade Studio owns room-by-room quantities.
 */
const STARTER_TYPES = ["basin-mixer", "concealed-shower", "accessories"] as const;

export type StarterLine = {
  product: Product;
  finish: string;
  price: number;
};

export type StarterPackage = {
  lines: StarterLine[];
  /** Products in the set whose catalogue entry has no variant in the chosen
   * finish — surfaced to the shopper rather than silently dropped. */
  unavailable: Product[];
  total: number;
};

/**
 * Builds the starter set for `seriesId` in `finishId`.
 *
 * `livePrices` is keyed `${slug}::${finish}` so the panel can show the same
 * Shopify price the product cards show; the catalogue price is the fallback.
 */
export function buildStarterPackage(
  seriesId: string,
  finishId: string,
  livePrices: Record<string, number> = {}
): StarterPackage {
  const inSeries = getProductsBySeries(seriesId);
  const lines: StarterLine[] = [];
  const unavailable: Product[] = [];

  for (const type of STARTER_TYPES) {
    const product = inSeries.find((entry) => entry.type === type);
    if (!product) continue; // Not every collection carries every type.

    const variant = product.variants.find((entry) => entry.finish === finishId);
    if (!variant) {
      unavailable.push(product);
      continue;
    }

    lines.push({
      product,
      finish: finishId,
      price: livePrices[`${product.slug}::${finishId}`] ?? variant.price,
    });
  }

  return {
    lines,
    unavailable,
    total: lines.reduce((sum, line) => sum + line.price, 0),
  };
}
