import productsData from "@/data/products.json";
import finishesData from "@/data/finishes.json";

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

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return productsData.products
    .filter((p) => p.series === product.series && p.slug !== product.slug)
    .slice(0, limit);
}
