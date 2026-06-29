import productsData from "@/data/products.json";
import finishesData from "@/data/finishes.json";
import { getProductImage } from "@/data/images";

export type EgyptSeriesId = "joy" | "up" | "art" | "quatro";
export type EgyptFinishId =
  | "chrome"
  | "brushed-nickel"
  | "matte-black"
  | "brushed-gold"
  | "coffee-gold"
  | "metal-gun";

export type EgyptVariant = {
  finish: EgyptFinishId;
  model: string;
  price: number;
};

export type EgyptProduct = {
  slug: string;
  series: EgyptSeriesId;
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
  variants: EgyptVariant[];
};

export const egyptCatalogMeta = {
  market: "Egypt",
  brand: "Steinheim Egypt",
  currency: "EGP",
  activeProductFamilyCount: 26,
  activeCollectionIds: ["joy", "up", "art", "quatro"] as EgyptSeriesId[],
  sourceDate: "2026",
  lastVerifiedByCodex: "2026-06-25",
  status:
    "Retail-reference catalogue for Steinheim Egypt. Trade pricing, stock, lead time, and discounts must be confirmed by Kareem/the Steinheim Egypt trade team.",
  sourceDocuments: [
    "Steinheim Price List 2026.pdf",
    "Steinheim technical data .pdf",
    "Steinheim Brochure 2026.pdf",
    "Karim's organized STEINHEIM digital assets folder",
  ],
} as const;

export const egyptSourceHierarchy = [
  {
    rank: 1,
    source: "Steinheim Price List 2026.pdf",
    governs: "Active Egypt sellable SKUs, finishes, model numbers, and retail-reference prices.",
  },
  {
    rank: 2,
    source: "Steinheim technical data .pdf",
    governs: "Materials, cartridges, aerators, pressure, temperature, mounting, and connection specifications.",
  },
  {
    rank: 3,
    source: "Karim's organized digital assets folder",
    governs: "Approved visual material only. An image does not prove the SKU is actively sold in Egypt.",
  },
  {
    rank: 4,
    source: "Steinheim brochure, story, color, and about sheets",
    governs: "Brand positioning, warranty language, care positioning, and design narrative.",
  },
] as const;

export const egyptCollectionPositioning: Record<
  EgyptSeriesId,
  {
    role: string;
    bestFor: string[];
    caution?: string;
    signatureFinishes: EgyptFinishId[];
  }
> = {
  joy: {
    role: "The warm premium collection: soft, round, confident, and easiest to specify for luxury residential bathrooms.",
    bestFor: ["villas", "premium apartments", "hotel suites", "warm stone bathrooms", "spa-style bathrooms"],
    signatureFinishes: ["brushed-gold", "coffee-gold", "brushed-nickel"],
  },
  up: {
    role: "The trade workhorse: streamlined, complete, repeatable, and strongest for B2B schedules.",
    bestFor: ["hotels", "compounds", "developer projects", "repeatable apartment bathrooms", "modern compact bathrooms"],
    signatureFinishes: ["brushed-nickel", "metal-gun", "chrome"],
  },
  art: {
    role: "The architectural statement: stainless-steel character, tighter range, and a stronger specification story.",
    bestFor: ["architect-led homes", "boutique hospitality", "coastal projects", "high-design bathrooms"],
    caution: "Art gold assets exist in the broader asset set, but the Egypt 2026 price list only sells Chrome/Polished, Brushed Nickel/Brushed, and Matte Black.",
    signatureFinishes: ["brushed-nickel", "matte-black", "chrome"],
  },
  quatro: {
    role: "The geometric collection: sharp, linear, bold, and suited to spaces with strong rectangular architecture.",
    bestFor: ["restaurants", "commercial washrooms", "modern villas", "powder rooms", "linear tile layouts"],
    caution: "Quatro brushed-nickel assets exist in the asset set, but the Egypt 2026 price list does not list brushed nickel as an active Quatro finish.",
    signatureFinishes: ["brushed-gold", "matte-black", "chrome"],
  },
};

export const egyptWarrantyRules = {
  countryScope: "Egypt only",
  manufacturingDefectsOnly: true,
  sedalCartridge: "Lifetime warranty according to the official Egypt catalogue.",
  chromeAndBrushedNickel:
    "10-year warranty against qualifying finish defects, subject to proper use and catalogue terms.",
  neoperlAndBody: "5-year warranty on Neoperl aerators/body according to the official Egypt catalogue.",
  pvdFinishes:
    "3-year warranty on premium PVD finishes according to the official Egypt catalogue. Confirm Coffee Gold wording before making a specific Coffee Gold warranty promise.",
  safePublicWording:
    "Warranty terms apply in Egypt for manufacturing defects and proper use. Final eligibility must be confirmed by Steinheim Egypt.",
} as const;

export const egyptTechnicalTruths = {
  commonMixerSpecs: {
    body: "Brass body unless the product family states stainless steel.",
    cartridge: "35mm Sedal cartridge",
    aerator: "Neoperl aerator on basin/bath mixer products where specified.",
    inletPipe: "60cm SUS inlet hoses on basin mixer products where specified.",
    connectionSize: "1/2 inch",
    pressureRange: "0.5-5 bar recommended operating pressure",
    maxPressure: "16 bar",
    maxHotWaterTemperature: "90°C",
    recommendedOperatingTemperature: "45°C",
    mountingAperture: "DIA 35mm for deck-mounted basin mixers",
  },
  unsafeClaimsToAvoid: [
    "Do not claim 12 L/min unless a product-specific official flow rate is verified.",
    "Do not claim +/-0.5°C temperature precision unless Steinheim publishes it for that product.",
    "Do not claim 500,000-cycle cartridge testing unless Steinheim publishes it.",
    "Do not claim Made in Germany unless Karim confirms exact origin language.",
  ],
} as const;

export const egyptTradeRules = {
  publicEmailMode: "Project-board submissions are structured leads; do not imply automatic email delivery unless explicitly configured.",
  retailPriceRule:
    "Displayed prices are retail-reference prices. B2B prices, bulk discounts, stock, and lead times require Kareem/trade-team confirmation.",
  aiRecommendationRule:
    "The AI may recommend only active Egypt variants from the price list. It may mention global/inspiration products only if clearly labeled not confirmed for Egypt.",
  proposalRule:
    "Proposal/RFQ documents can be generated locally for review first. Do not send real emails automatically.",
} as const;

export const egyptProducts = productsData.products as EgyptProduct[];
export const egyptSeries = productsData.series;
export const egyptFinishes = finishesData;

export function formatEgyptPrice(price: number) {
  return `${price.toLocaleString("en-US")} LE`;
}

export function getEgyptProduct(slug: string) {
  return egyptProducts.find((product) => product.slug === slug) ?? null;
}

export function getEgyptProductsBySeries(series: EgyptSeriesId) {
  return egyptProducts.filter((product) => product.series === series);
}

export function getEgyptVariant(slug: string, finish: EgyptFinishId) {
  const product = getEgyptProduct(slug);
  if (!product) return null;
  return product.variants.find((variant) => variant.finish === finish) ?? null;
}

export function getEgyptProductImages(slug: string) {
  const product = getEgyptProduct(slug);
  if (!product) return [];

  return product.variants.map((variant) => ({
    finish: variant.finish,
    model: variant.model,
    image: getProductImage(slug, variant.finish),
    imageStatus: getProductImage(slug, variant.finish) ? "available" : "missing",
  }));
}

export function getAvailableEgyptFinishesForProduct(slug: string) {
  const product = getEgyptProduct(slug);
  if (!product) return [];
  return product.variants.map((variant) => variant.finish);
}

export function getAvailableEgyptFinishesForSeries(series: EgyptSeriesId) {
  const finishes = new Set<EgyptFinishId>();
  for (const product of getEgyptProductsBySeries(series)) {
    for (const variant of product.variants) finishes.add(variant.finish);
  }
  return Array.from(finishes);
}

export function getLowestEgyptPrice(slug: string) {
  const product = getEgyptProduct(slug);
  if (!product || product.variants.length === 0) return null;
  return Math.min(...product.variants.map((variant) => variant.price));
}

export function getEgyptCatalogAudit() {
  const productsBySeries = egyptCatalogMeta.activeCollectionIds.map((series) => ({
    series,
    productFamilies: getEgyptProductsBySeries(series).length,
    activeFinishes: getAvailableEgyptFinishesForSeries(series),
  }));

  const missingImages = egyptProducts.flatMap((product) =>
    getEgyptProductImages(product.slug)
      .filter((image) => image.imageStatus === "missing")
      .map((image) => ({
        slug: product.slug,
        name: product.name,
        series: product.series,
        finish: image.finish,
        model: image.model,
      }))
  );

  return {
    market: egyptCatalogMeta.market,
    products: egyptProducts.length,
    variants: egyptProducts.reduce((total, product) => total + product.variants.length, 0),
    productsBySeries,
    missingImages,
  };
}
