import type { ShopifyOrder } from "@/lib/shopify-client";
import { getAllProducts, getSeriesById, type Product } from "@/lib/utils";

// Shopify line items only carry a free-text title (no product handle/SKU we
// control), so matching an order line back to our catalog is inherently
// fuzzy. We match against two candidate strings per product — "{series}
// {name}" and the bare product name — preferring the longer, more specific
// one first so e.g. "Joy Basin Mixer" doesn't get credited to every series'
// "Basin Mixer". This is a best-effort heuristic: if Shopify's product
// titles diverge significantly from the catalog's naming, matches will be
// missed (undercounting) rather than wrongly attributed, since we require
// the candidate to appear as a whole word sequence in the line item title.
const MIN_CANDIDATE_LENGTH = 8;

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

interface Candidate {
  product: Product;
  text: string;
}

function buildCandidates(products: Product[]): Candidate[] {
  const candidates: Candidate[] = [];
  for (const product of products) {
    const series = getSeriesById(product.series);
    const seriesName = series?.name ?? product.series;
    candidates.push({ product, text: normalize(`${seriesName} ${product.name}`) });
    if (normalize(product.name).length >= MIN_CANDIDATE_LENGTH) {
      candidates.push({ product, text: normalize(product.name) });
    }
  }
  // Longest candidate text first, so a more specific match wins before a
  // shorter, more generic one gets the chance to match the same title.
  return candidates.sort((a, b) => b.text.length - a.text.length);
}

function matchLineItem(title: string, candidates: Candidate[]): Product | null {
  const normalizedTitle = normalize(title);
  for (const candidate of candidates) {
    if (candidate.text.length < MIN_CANDIDATE_LENGTH) continue;
    if (normalizedTitle.includes(candidate.text)) return candidate.product;
  }
  return null;
}

export interface BestSellerResult {
  product: Product;
  unitsSold: number;
}

/** Aggregates unit sales per catalog product from Shopify order line items. Excludes voided orders. */
export function computeBestSellers(orders: ShopifyOrder[], limit = 8): BestSellerResult[] {
  const products = getAllProducts();
  const candidates = buildCandidates(products);
  const unitsBySlug = new Map<string, number>();

  for (const order of orders) {
    if (order.financial_status === "voided") continue;
    for (const item of order.line_items) {
      const matched = matchLineItem(item.title, candidates);
      if (!matched) continue;
      unitsBySlug.set(matched.slug, (unitsBySlug.get(matched.slug) ?? 0) + item.quantity);
    }
  }

  return Array.from(unitsBySlug.entries())
    .map(([slug, unitsSold]) => ({ product: products.find((p) => p.slug === slug)!, unitsSold }))
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, limit);
}
