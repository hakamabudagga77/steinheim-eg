import productsData from "@/data/products.json";
import finishesData from "@/data/finishes.json";
import generatedCatalog from "@/data/shopify-catalog.generated.json";
import { getProductDefaultImage, getProductImage } from "@/data/images";

export interface Variant {
  finish: string;
  model: string;
  price: number;
  compareAtPrice?: number;
}

export interface Product {
  slug: string;
  series: string;
  name: string;
  type: string;
  material?: string;
  cartridge?: string;
  aerator?: string;
  inletPipe?: string;
  connectionSize?: string;
  pressureRange?: string;
  maxPressure?: string;
  maxTemperature?: string;
  operatingTemperature?: string;
  mountingAperture?: string;
  variants: Variant[];
}

export interface Series {
  id: string;
  name: string;
  code: string;
  shape: string;
  description: string;
  finishes: string[];
}

export interface Finish {
  id: string;
  name: string;
  code: string;
  hex: string;
  type: string;
  series: string[];
  careInstructions: string;
}

const variantAdditions = generatedCatalog.variantAdditions as Record<string, Variant[]>;
const generatedProducts = generatedCatalog.products as Product[];

const allProducts: Product[] = [
  ...(productsData.products as Product[]).map((product) => {
    const additions = variantAdditions[product.slug] ?? [];
    const existingFinishes = new Set(product.variants.map((variant) => variant.finish));
    return additions.length === 0
      ? product
      : {
          ...product,
          variants: [
            ...product.variants,
            ...additions.filter((variant) => !existingFinishes.has(variant.finish)),
          ],
        };
  }),
  ...generatedProducts,
];

const allSeries: Series[] = (productsData.series as Series[]).map((series) => {
  const observedFinishes = allProducts
    .filter((product) => product.series === series.id)
    .flatMap((product) => product.variants.map((variant) => variant.finish));
  return {
    ...series,
    finishes: [...new Set([...series.finishes, ...observedFinishes])],
  };
});

const allFinishes: Finish[] = [
  ...(finishesData as Finish[]),
  ...(generatedCatalog.finishAdditions as Finish[]),
].map((finish) => {
  const observedSeries = allProducts
    .filter((product) => product.variants.some((variant) => variant.finish === finish.id))
    .map((product) => product.series);
  return {
    ...finish,
    series: [...new Set([...finish.series, ...observedSeries])],
  };
});

export function getAllSeries(): Series[] {
  return allSeries;
}

export function getSeriesById(id: string): Series | undefined {
  return allSeries.find((s) => s.id === id);
}

export function getProductsBySeries(seriesId: string): Product[] {
  return allProducts.filter((p) => p.series === seriesId);
}

export function getProductBySlug(slug: string): Product | undefined {
  return allProducts.find((p) => p.slug === slug);
}

export function getAllProducts(): Product[] {
  return allProducts;
}

export function getAllFinishes(): Finish[] {
  return allFinishes;
}

export function getFinishById(id: string): Finish | undefined {
  return allFinishes.find((f) => f.id === id);
}

export function formatPrice(price: number, currency = "LE"): string {
  return `${currency} ${price.toLocaleString("en-US")}`;
}

export function getProductTypes(): string[] {
  const types = new Set(allProducts.map((p) => p.type));
  return Array.from(types);
}

export function getProductsByType(type: string): Product[] {
  return allProducts.filter((p) => p.type === type);
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
  return allProducts
    .filter((p) => p.series === product.series && p.slug !== product.slug)
    .slice(0, limit);
}
