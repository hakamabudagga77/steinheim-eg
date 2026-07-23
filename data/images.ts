type ImageMap = Record<string, Record<string, string>>;

function localProduct(series: string, product: string, finish: string) {
  return `/images/products/${series}/${product}/${finish}.png`;
}

function buildFinishMap(series: string, product: string, finishes: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const f of finishes) map[f] = localProduct(series, product, f);
  return map;
}

const JOY_5 = ["chrome", "brushed-nickel", "matte-black", "brushed-gold", "coffee-gold"];
const UP_5 = ["chrome", "brushed-nickel", "matte-black", "brushed-gold", "metal-gun"];
const ART_3 = ["chrome", "brushed-nickel", "matte-black"];
const QUATRO_3 = ["chrome", "matte-black", "brushed-gold"];

const productImages: ImageMap = {
  // JOY SERIES
  "joy-basin-mixer": buildFinishMap("joy", "basin-mixer", JOY_5),
  "joy-tall-basin-mixer": buildFinishMap("joy", "tall-basin-mixer", JOY_5),
  "joy-wall-mounted-basin-mixer": buildFinishMap("joy", "wall-mounted-basin-mixer", JOY_5),
  "joy-concealed-shower": buildFinishMap("joy", "concealed-shower", JOY_5),
  "joy-shower-column": buildFinishMap("joy", "shower-column", JOY_5),
  "joy-free-standing-bath-mixer": buildFinishMap("joy", "free-standing-bath-mixer", JOY_5),
  "joy-accessories-set": buildFinishMap("joy", "accessories-set", JOY_5),
  "joy-bidet-spray": buildFinishMap("joy", "bidet-spray", JOY_5),
  "joy-click-clack-waste": buildFinishMap("joy", "click-clack-waste", JOY_5),
  "joy-angle-valve": buildFinishMap("joy", "click-clack-waste", JOY_5),
  "joy-bottle-trap": buildFinishMap("joy", "click-clack-waste", JOY_5),

  // UP SERIES
  "up-basin-mixer": buildFinishMap("up", "basin-mixer", UP_5),
  "up-tall-basin-mixer": buildFinishMap("up", "tall-basin-mixer", UP_5),
  "up-wall-mounted-basin-mixer": buildFinishMap("up", "wall-mounted-basin-mixer", UP_5),
  "up-concealed-shower": buildFinishMap("up", "concealed-shower", UP_5),
  "up-shower-column": buildFinishMap("up", "shower-column", UP_5),
  "up-free-standing-bath-mixer": buildFinishMap("up", "free-standing-bath-mixer", UP_5),
  "up-accessories-set": buildFinishMap("up", "accessories-set", ["chrome", "brushed-nickel", "matte-black", "brushed-gold"]),

  // ART SERIES
  "art-basin-mixer": buildFinishMap("art", "basin-mixer", ART_3),
  "art-tall-basin-mixer": buildFinishMap("art", "tall-basin-mixer", ART_3),
  "art-wall-mounted-basin-mixer": buildFinishMap("art", "wall-mounted-basin-mixer", ART_3),
  "art-concealed-shower": buildFinishMap("art", "concealed-shower", ART_3),
  "art-free-standing-bath-mixer": buildFinishMap("art", "free-standing-bath-mixer", ["chrome", "brushed-nickel", "matte-black", "brushed-gold"]),

  // QUATRO SERIES
  "quatro-basin-mixer": buildFinishMap("quatro", "basin-mixer", QUATRO_3),
  "quatro-tall-basin-mixer": buildFinishMap("quatro", "tall-basin-mixer", QUATRO_3),
  "quatro-wall-mounted-basin-mixer": buildFinishMap("quatro", "wall-mounted-basin-mixer", ["chrome", "brushed-nickel", "matte-black", "brushed-gold"]),
  "quatro-concealed-shower": buildFinishMap("quatro", "concealed-shower", ["chrome", "brushed-nickel", "matte-black", "brushed-gold"]),
};

export const heroImage = "/images/lifestyle/wall-mounted-hero.png";

export const collectionBanners: Record<string, string> = {
  joy: "/images/steinheim/karim-2026/banner-joy.webp",
  up: "/images/steinheim/karim-2026/banner-up.webp",
  art: "/images/steinheim/karim-2026/banner-art.webp",
  quatro: "/images/steinheim/karim-2026/banner-quatro.webp",
};

export const collectionMoodImages: Record<string, string> = {
  joy: "/images/collections/home/joy-card-v3.jpeg",
  up: "/images/collections/home/up-card-v3.png",
  art: "/images/collections/home/art-card-v3.png",
  quatro: "/images/collections/home/quatro-card-v3.png",
};

export const collectionLandingImages: Record<string, string> = {
  joy: "/images/steinheim/karim-2026/banner-joy-card.webp",
  up: "/images/steinheim/karim-2026/landing-up.webp",
  art: "/images/steinheim/karim-2026/landing-art.webp",
  quatro: "/images/steinheim/karim-2026/landing-quatro.webp",
};

export const lifestyleImages = {
  hero: "/images/lifestyle/wall-mounted-hero.png",
  shower: "/images/lifestyle/20.png",
  wallMounted: "/images/lifestyle/14.png",
  gemini: "/images/lifestyle/gemini-lifestyle-upscaled.png",
};

export const finishDiscImages: Record<string, string> = {
  chrome: "/images/finishes/chrome.png",
  "brushed-nickel": "/images/finishes/brushed-nickel.png",
  "matte-black": "/images/finishes/matte-black.png",
  "brushed-gold": "/images/finishes/brushed-gold.png",
  "coffee-gold": "/images/finishes/coffee-gold.png",
  "metal-gun": "/images/finishes/metal-gun.png",
};

export const showcaseImages = {
  finishes1: "/images/finishes/brushed-gold.png",
  finishes2: "/images/finishes/matte-black.png",
};

export const collectionContextImages: Record<string, string> = {
  joy: "/images/steinheim/karim-2026/detail-joy-basin.webp",
  up: "/images/steinheim/karim-2026/detail-up-shower.webp",
  art: "/images/steinheim/karim-2026/detail-art-bath.webp",
  quatro: "/images/steinheim/karim-2026/detail-quatro-wall.webp",
};

export function getProductImage(slug: string, finish: string): string | null {
  return productImages[slug]?.[finish] ?? null;
}

export function getProductDefaultImage(slug: string): string | null {
  const images = productImages[slug];
  if (!images) return null;
  const firstFinish = Object.keys(images)[0];
  return images[firstFinish] ?? null;
}

export function getFinishDiscImage(finish: string): string | null {
  return finishDiscImages[finish] ?? null;
}

export function getCollectionContextImage(series: string): string | null {
  return collectionContextImages[series] ?? null;
}
