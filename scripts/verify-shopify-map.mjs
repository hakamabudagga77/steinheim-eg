#!/usr/bin/env node
// Pre-launch safety check: does every product in lib/shopify-product-map.ts
// resolve to a real product/variant in the live Shopify store? Checkout maps
// each cart line to a Shopify variant via this map, so a stale handle or a
// renamed finish silently becomes an "item could not be mapped" error at the
// most expensive possible moment — the customer trying to pay.
//
// Run it against the live store before go-live:
//
//     npm run verify:shopify-map
//
// It reads SHOPIFY_STORE_DOMAIN / SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET
// from the environment (or from .env.local, if present). It is strictly
// READ-ONLY: it calls the Shopify Admin products endpoint and nothing else.
// Exit code is 1 if any hard problem is found (missing creds, a mapped handle
// that does not exist in the store), 0 otherwise.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const API_VERSION = "2026-04"; // keep in sync with lib/shopify-client.ts

const ok = (s) => `\x1b[32m${s}\x1b[0m`;
const bad = (s) => `\x1b[31m${s}\x1b[0m`;
const warn = (s) => `\x1b[33m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

// Minimal .env.local loader so `npm run verify:shopify-map` works locally with
// no extra dependency. Real environment variables always win.
function loadEnvLocal() {
  const p = join(ROOT, ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}

// Pull a `const NAME ... = { ... }` string-to-string record straight out of the
// TS source, so this check always reflects the real map (never a copy that can
// drift from it).
function parseRecord(source, name) {
  const start = source.indexOf(`const ${name}`);
  if (start === -1) throw new Error(`Could not find ${name} in shopify-product-map.ts`);
  const open = source.indexOf("{", start);
  const close = source.indexOf("};", open);
  if (open === -1 || close === -1) throw new Error(`Could not parse ${name}`);
  const block = source.slice(open + 1, close);
  const out = {};
  const re = /"([^"]+)"\s*:\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(block))) out[m[1]] = m[2];
  return out;
}

async function getAccessToken(domain, id, secret) {
  const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: id, client_secret: secret, grant_type: "client_credentials" }),
  });
  if (!res.ok) throw new Error(`Shopify token exchange failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function fetchProducts(domain, token) {
  const url = `https://${domain}/admin/api/${API_VERSION}/products.json?limit=250&fields=id,title,handle,variants`;
  const res = await fetch(url, { headers: { "X-Shopify-Access-Token": token } });
  if (!res.ok) throw new Error(`Shopify products fetch failed: ${res.status}`);
  return (await res.json()).products ?? [];
}

async function main() {
  loadEnvLocal();

  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const id = process.env.SHOPIFY_CLIENT_ID;
  const secret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!domain || !id || !secret) {
    console.error(bad("\n✗ Shopify credentials are not set.\n"));
    console.error("  Set these in your environment or .env.local, then re-run:");
    console.error("    SHOPIFY_STORE_DOMAIN   (e.g. steinheim.myshopify.com)");
    console.error("    SHOPIFY_CLIENT_ID");
    console.error("    SHOPIFY_CLIENT_SECRET\n");
    process.exit(1);
  }

  const src = readFileSync(join(ROOT, "lib", "shopify-product-map.ts"), "utf8");
  const slugToHandle = parseRecord(src, "SLUG_TO_HANDLE");
  const finishAliases = parseRecord(src, "FINISH_ALIASES");
  const finishNames = new Set(Object.values(finishAliases).map((v) => v.toLowerCase()));

  console.log(dim(`\nStore: ${domain} · API ${API_VERSION}\n`));

  const products = await fetchProducts(domain, token(await getAccessToken(domain, id, secret)));
  if (products.length === 250) {
    console.log(warn("⚠ Exactly 250 products returned — the store may have more (this check, like the app, fetches the first 250).\n"));
  }
  const byHandle = new Map(products.map((p) => [p.handle, p]));

  let hardErrors = 0;
  let warnings = 0;
  const unmapped = [];

  for (const [slug, handle] of Object.entries(slugToHandle)) {
    if (handle === "") {
      unmapped.push(slug);
      continue;
    }
    const product = byHandle.get(handle);
    if (!product) {
      hardErrors += 1;
      console.log(`${bad("✗")} ${slug} → ${bad(`handle "${handle}" not found in store`)}`);
      continue;
    }
    // Flag variant finishes the map won't recognise (checkout resolves a finish
    // via FINISH_ALIASES → the variant's option1, so an unrecognised option1
    // means that finish can't be bought).
    const unknown = (product.variants ?? [])
      .map((v) => v.option1)
      .filter((o) => o && !finishNames.has(String(o).toLowerCase()));
    if (unknown.length) {
      warnings += 1;
      console.log(`${warn("⚠")} ${slug} → ${ok(handle)} ${dim(`(unrecognised finish option: ${[...new Set(unknown)].join(", ")})`)}`);
    } else {
      console.log(`${ok("✓")} ${slug} → ${ok(handle)} ${dim(`(${(product.variants ?? []).length} variants)`)}`);
    }
  }

  if (unmapped.length) {
    console.log(dim(`\nℹ Intentionally unmapped (not purchasable until a handle is added): ${unmapped.join(", ")}`));
  }

  console.log(
    `\n${hardErrors ? bad(`${hardErrors} missing handle(s)`) : ok("0 missing handles")}` +
      ` · ${warnings ? warn(`${warnings} finish warning(s)`) : ok("0 finish warnings")}` +
      ` · ${Object.keys(slugToHandle).length} mapped slugs checked\n`
  );

  process.exit(hardErrors ? 1 : 0);
}

// Small helper kept separate so the token value never lands in a log line.
function token(t) {
  if (!t) throw new Error("Shopify returned no access token");
  return t;
}

main().catch((err) => {
  console.error(bad(`\n✗ ${err.message}\n`));
  process.exit(1);
});
