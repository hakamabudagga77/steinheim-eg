import productsData from "@/data/products.json";
import finishesData from "@/data/finishes.json";
import { getProductDefaultImage, getProductImage } from "@/data/images";

export type Finish = (typeof finishesData)[number];
export type Series = (typeof productsData.series)[number];
export type Product = (typeof productsData.products)[number];
export type Variant = Product["variants"][number];

export function getAllSeries(): Series[] {
  return productsData.series;
}

export function getSeriesById(id: string): Series | undefined {
  return productsData.series.find((s) => s.id === id);
}

export function getProductsBySeries(seriesId: string): Product[] {
  return productsData.products.filter((p) => p.series === seriesId);
}

export function getProductBySlug(slug: string): Product | undefined {
  return productsData.products.find((p) => p.slug === slug);
}

export function getAllProducts(): Product[] {
  return productsData.products;
}

export function getAllFinishes(): Finish[] {
  return finishesData;
}

export function getFinishById(id: string): Finish | undefined {
  return finishesData.find((f) => f.id === id);
}

export function formatPrice(price: number, currency = "LE"): string {
  return `${currency} ${price.toLocaleString("en-US")}`;
}

export function getProductTypes(): string[] {
  const types = new Set(productsData.products.map((p) => p.type));
  return Array.from(types);
}

export function getProductsByType(type: string): Product[] {
  return productsData.products.filter((p) => p.type === type);
}

const REPRESENTATIVE_SERIES_PRIORITY = ["joy", "up", "art", "quatro"];

export function getRepresentativeProductForType(type: string): Product | undefined {
  const candidates = getProductsByType(type);
  for (const seriesId of REPRESENTATIVE_SERIES_PRIORITY) {
    const match = candidates.find((p) => p.series === seriesId);
    if (match) return match;
  }
  return candidates[0];
}

// Every collection's product shown in the "what's needed" mosaic, always in
// matte black - keeps every card's photography visually consistent instead
// of mixing finishes.
const MOSAIC_SERIES_ORDER = ["joy", "up", "art", "quatro"];
const MOSAIC_FINISH = "matte-black";

export function getVariantMosaicForType(type: string): Array<{ product: Product; image: string }> {
  const candidates = getProductsByType(type);
  const entries: Array<{ product: Product; image: string }> = [];
  for (const seriesId of MOSAIC_SERIES_ORDER) {
    const product = candidates.find((p) => p.series === seriesId);
    if (!product) continue;
    const image = getProductImage(product.slug, MOSAIC_FINISH) ?? getProductDefaultImage(product.slug);
    if (!image) continue;
    entries.push({ product, image });
  }
  return entries;
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return productsData.products
    .filter((p) => p.series === product.series && p.slug !== product.slug)
    .slice(0, limit);
}
