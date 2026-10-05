#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const API_VERSION = "2026-04";
const OUTPUT_PATH = join(ROOT, "data", "shopify-catalog.generated.json");
const WRITE = process.argv.includes("--write");

const FINISH_ALIASES = {
  chrome: "Chrome",
  "brushed-nickel": "Brushed Nickel",
  "matte-black": "Matte Black",
  "brushed-gold": "Brushed Gold",
  "coffee-gold": "Coffee Gold",
  "metal-gun": "Gun Metal Grey",
};
const FINISH_PRIORITY = new Map(Object.keys(FINISH_ALIASES).map((finish, index) => [finish, index]));

const TYPE_ALIASES = new Map([
  ["kitchen mixer", "kitchen-mixer"],
  ["shower arm", "shower-arm"],
  ["bottle trap", "bottle-trap"],
]);

function loadEnvLocal() {
  const path = join(ROOT, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(match[1] in process.env)) process.env[match[1]] = value;
  }
}

function parseStringRecord(source, name) {
  const start = source.indexOf(`const ${name}`);
  if (start === -1) throw new Error(`Could not find ${name} in shopify-product-map.ts`);
  const open = source.indexOf("{", start);
  const close = source.indexOf("};", open);
  if (open === -1 || close === -1) throw new Error(`Could not parse ${name}`);
  const result = {};
  const matcher = /"([^"]+)"\s*:\s*"([^"]*)"/g;
  let match;
  while ((match = matcher.exec(source.slice(open + 1, close)))) result[match[1]] = match[2];
  return result;
}

function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeFinish(name) {
  const normalized = String(name ?? "").trim().toLowerCase();
  const known = Object.entries(FINISH_ALIASES).find(([, shopifyName]) => shopifyName.toLowerCase() === normalized);
  if (known) return known[0];
  if (["gun metal", "gunmetal", "gunmetal grey", "gunmetal gray", "gun metal gray"].includes(normalized)) {
    return "metal-gun";
  }
  return slugify(normalized);
}

function compareFinishes(a, b) {
  const aPriority = FINISH_PRIORITY.get(a) ?? Number.MAX_SAFE_INTEGER;
  const bPriority = FINISH_PRIORITY.get(b) ?? Number.MAX_SAFE_INTEGER;
  return aPriority - bPriority || a.localeCompare(b);
}

function inferFinish(variant, finishesByCode) {
  const option = String(variant.option1 ?? "").trim();
  if (option && option.toLowerCase() !== "default title") return normalizeFinish(option);
  const skuCode = String(variant.sku ?? "").match(/-(\d{3})$/)?.[1];
  return (skuCode && finishesByCode.get(skuCode)) || "chrome";
}

function inferSeries(product) {
  const searchable = `${product.tags ?? ""},${product.title ?? ""}`.toLowerCase();
  return ["joy", "up", "art", "quatro"].find((series) => new RegExp(`(^|[^a-z])${series}([^a-z]|$)`).test(searchable));
}

function inferType(product) {
  const raw = String(product.product_type ?? "").trim();
  const normalized = raw.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  return TYPE_ALIASES.get(normalized) ?? slugify(raw || product.title || "product");
}

function cleanProductName(title, series) {
  const withoutSeries = String(title ?? "")
    .replace(new RegExp(`^${series}\\s+series\\s+`, "i"), "")
    .trim();
  return withoutSeries
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/W\/O/gi, "without")
    .replace(/Puw/gi, "PUW");
}

function safeImageUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (url.hostname !== "cdn.shopify.com" && url.hostname !== "steinheim-eg.com") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function imageForVariant(product, variant) {
  const byId = new Map((product.images ?? []).map((image) => [image.id, safeImageUrl(image.src)]));
  return safeImageUrl(variant.featured_image?.src)
    ?? byId.get(variant.image_id)
    ?? safeImageUrl(product.image?.src)
    ?? safeImageUrl(product.images?.[0]?.src);
}

function sortObject(record) {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
}

function localImageIfPresent(slug, series, finish) {
  const productFolder = slug.startsWith(`${series}-`) ? slug.slice(series.length + 1) : slug;
  const publicPath = `/images/products/${series}/${productFolder}/${finish}.png`;
  return existsSync(join(ROOT, "public", ...publicPath.split("/").filter(Boolean))) ? publicPath : null;
}

export function buildGeneratedCatalog(shopifyProducts, productsData, finishesData, curatedHandles) {
  const curatedProducts = productsData.products;
  const curatedBySlug = new Map(curatedProducts.map((product) => [product.slug, product]));
  const curatedSlugByHandle = new Map(
    Object.entries(curatedHandles).filter(([, handle]) => handle).map(([slug, handle]) => [handle, slug])
  );
  const curatedSlugBySku = new Map(
    curatedProducts.flatMap((product) => product.variants.map((variant) => [variant.model, product.slug]))
  );
  const finishById = new Map(finishesData.map((finish) => [finish.id, finish]));
  const finishesByCode = new Map(finishesData.map((finish) => [finish.code, finish.id]));

  const products = [];
  const variantAdditions = {};
  const handles = {};
  const images = {};
  const unknownFinishes = new Map();
  const skipped = [];

  for (const shopifyProduct of shopifyProducts.filter(
    (product) => !product.status || String(product.status).toLowerCase() === "active"
  )) {
    let curatedSlug = curatedSlugByHandle.get(shopifyProduct.handle);
    if (!curatedSlug) {
      curatedSlug = (shopifyProduct.variants ?? [])
        .map((variant) => curatedSlugBySku.get(variant.sku))
        .find(Boolean);
    }

    const curated = curatedSlug ? curatedBySlug.get(curatedSlug) : null;
    const series = curated?.series ?? inferSeries(shopifyProduct);
    if (!series) {
      skipped.push(`${shopifyProduct.handle} (missing JOY/UP/ART/QUATRO tag or title)`);
      continue;
    }

    const slug = curatedSlug || shopifyProduct.handle;
    const normalizedVariants = (shopifyProduct.variants ?? [])
      .map((variant) => {
        const finish = inferFinish(variant, finishesByCode);
        if (!finish) return null;
        if (!finishById.has(finish) && !unknownFinishes.has(finish)) {
          const finishName = String(variant.option1 ?? finish).trim();
          unknownFinishes.set(finish, {
            id: finish,
            name: finishName,
            code: String(variant.sku ?? "").match(/-(\d{3})$/)?.[1] ?? "",
            hex: "#9A9A9A",
            type: "standard",
            series: [series],
            careInstructions: "Clean with a soft damp cloth and avoid abrasive or acidic cleaners.",
          });
        } else if (unknownFinishes.has(finish)) {
          unknownFinishes.get(finish).series = [...new Set([...unknownFinishes.get(finish).series, series])];
        }
        const image = localImageIfPresent(slug, series, finish) ?? imageForVariant(shopifyProduct, variant);
        if (image) {
          images[slug] ??= {};
          images[slug][finish] = image;
        }
        const price = Number.parseFloat(variant.price) || 0;
        const compareAtPrice = Number.parseFloat(variant.compare_at_price);
        return {
          finish,
          model: String(variant.sku || `shopify-${variant.id}`),
          price,
          ...(Number.isFinite(compareAtPrice) && compareAtPrice > price ? { compareAtPrice } : {}),
        };
      })
      .filter(Boolean);

    if (normalizedVariants.length === 0) {
      skipped.push(`${shopifyProduct.handle} (no usable variants)`);
      continue;
    }

    if (curated) {
      const existingFinishes = new Set(curated.variants.map((variant) => variant.finish));
      const additions = normalizedVariants.filter((variant) => !existingFinishes.has(variant.finish));
      if (additions.length > 0) variantAdditions[slug] = additions.sort((a, b) => compareFinishes(a.finish, b.finish));
      if (curatedHandles[slug] !== shopifyProduct.handle) handles[slug] = shopifyProduct.handle;
      continue;
    }

    products.push({
      slug,
      series,
      name: cleanProductName(shopifyProduct.title, series),
      type: inferType(shopifyProduct),
      variants: normalizedVariants.sort((a, b) => compareFinishes(a.finish, b.finish)),
    });
    handles[slug] = shopifyProduct.handle;
  }

  const finishAdditions = [...unknownFinishes.values()]
    .map((finish) => ({ ...finish, series: [...finish.series].sort() }))
    .sort((a, b) => a.id.localeCompare(b.id));
  const finishAliases = Object.fromEntries(finishAdditions.map((finish) => [finish.id, finish.name]));

  return {
    catalog: {
      products: products.sort((a, b) => a.slug.localeCompare(b.slug)),
      variantAdditions: sortObject(variantAdditions),
      handles: sortObject(handles),
      images: sortObject(Object.fromEntries(Object.entries(images).map(([slug, value]) => [slug, sortObject(value)]))),
      finishAdditions,
      finishAliases: sortObject(finishAliases),
    },
    skipped,
  };
}

async function getAccessToken(domain, clientId, clientSecret) {
  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" }),
  });
  if (!response.ok) throw new Error(`Shopify token exchange failed (${response.status})`);
  const payload = await response.json();
  if (!payload.access_token) throw new Error("Shopify returned no access token");
  return payload.access_token;
}

async function fetchProducts(domain, token) {
  const fields = "id,title,handle,tags,product_type,status,image,images,variants";
  let url = `https://${domain}/admin/api/${API_VERSION}/products.json?status=active&limit=250&fields=${fields}`;
  const products = [];
  while (url) {
    const response = await fetch(url, { headers: { "X-Shopify-Access-Token": token } });
    if (!response.ok) throw new Error(`Shopify products fetch failed (${response.status})`);
    const payload = await response.json();
    products.push(...(payload.products ?? []));
    const link = response.headers.get("link") ?? "";
    url = link.split(",").map((part) => part.trim()).find((part) => part.endsWith('rel="next"'))?.match(/<([^>]+)>/)?.[1] ?? "";
  }
  return products;
}

async function fetchPublishedProducts(domain) {
  const products = [];
  for (let page = 1; ; page += 1) {
    const response = await fetch(`https://${domain}/products.json?limit=250&page=${page}`);
    if (!response.ok) throw new Error(`Shopify public products fetch failed (${response.status})`);
    const payload = await response.json();
    const batch = payload.products ?? [];
    products.push(...batch.map((product) => ({ ...product, status: "active" })));
    if (batch.length < 250) break;
  }
  return products;
}

async function main() {
  loadEnvLocal();
  const domain = process.env.SHOPIFY_STORE_DOMAIN || "steinheim.myshopify.com";
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  const productsData = JSON.parse(readFileSync(join(ROOT, "data", "products.json"), "utf8"));
  const finishesData = JSON.parse(readFileSync(join(ROOT, "data", "finishes.json"), "utf8"));
  const mapSource = readFileSync(join(ROOT, "lib", "shopify-product-map.ts"), "utf8");
  const curatedHandles = parseStringRecord(mapSource, "CURATED_SLUG_TO_HANDLE");
  const hasAdminCredentials = Boolean(clientId && clientSecret);
  const shopifyProducts = hasAdminCredentials
    ? await fetchProducts(domain, await getAccessToken(domain, clientId, clientSecret))
    : await fetchPublishedProducts(domain);
  const { catalog, skipped } = buildGeneratedCatalog(shopifyProducts, productsData, finishesData, curatedHandles);
  const next = `${JSON.stringify(catalog, null, 2)}\n`;
  const current = existsSync(OUTPUT_PATH) ? readFileSync(OUTPUT_PATH, "utf8") : "";

  console.log(`Shopify catalog: ${shopifyProducts.length} published products checked (${hasAdminCredentials ? "Admin API" : "public feed"})`);
  console.log(`Generated: ${catalog.products.length} products, ${Object.values(catalog.variantAdditions).flat().length} added variants`);
  for (const item of skipped) console.warn(`Skipped: ${item}`);

  if (next === current) {
    console.log("Generated catalog is already up to date.");
    return;
  }
  if (!WRITE) {
    console.error("Generated catalog is out of date. Run npm run sync:shopify-catalog.");
    process.exitCode = 1;
    return;
  }
  writeFileSync(OUTPUT_PATH, next, "utf8");
  console.log("Updated data/shopify-catalog.generated.json");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Shopify catalog sync failed: ${error.message}`);
    process.exitCode = 1;
  });
}
