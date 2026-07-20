// k6 load test for the read-only storefront (both /en and /ar).
//
// Deliberately GET-only: it never touches /api/shopify/checkout,
// /api/trade/rfq, /api/contact, or any admin/webhook route, so it can't
// create real orders, leads, or emails while it runs.
//
// Usage:
//   BASE_URL=http://localhost:3000 k6 run load-tests/storefront.js
//   BASE_URL=https://steinheim-eg.vercel.app k6 run load-tests/storefront.js
//
// Tune the ramp via env vars, e.g. a heavier soak:
//   PEAK_VUS=50 SOAK_DURATION=5m BASE_URL=... k6 run load-tests/storefront.js
//
// Note: don't name custom vars K6_* — k6 reserves that prefix for its own
// config and will silently override the scenario below (learned the hard
// way: K6_DURATION here made k6 collapse the whole ramping-vus scenario
// into a flat 1-VU run).
//
// Get k6: https://k6.io/docs/get-started/installation/
//
// Only point this at the production URL during a maintenance window or
// with the Vercel/Shopify teams aware — a real load test against a live
// storefront can trip rate limits, inflate hosting/CDN costs, or (for the
// pricing endpoint) draw down Shopify Storefront API quota.

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const PEAK_VUS = Number(__ENV.PEAK_VUS || 20);
const DURATION = __ENV.SOAK_DURATION || "2m";

const errorRate = new Rate("steinheim_errors");
const pageLoad = new Trend("steinheim_page_duration", true);

const LOCALES = ["en", "ar"];
const SERIES = ["joy", "up", "art", "quatro"];
const SAMPLE_PRODUCTS = [
  "joy-basin-mixer",
  "joy-tall-basin-mixer",
  "up-basin-mixer",
  "up-tall-basin-mixer",
  "art-basin-mixer",
  "art-tall-basin-mixer",
  "quatro-basin-mixer",
  "quatro-tall-basin-mixer",
];
const STATIC_PAGES = ["about", "contact", "trade", "warranty", "shipping", "returns", "privacy", "collections"];

export const options = {
  scenarios: {
    browse: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: Math.ceil(PEAK_VUS * 0.25) },
        { duration: "30s", target: PEAK_VUS },
        { duration: DURATION, target: PEAK_VUS },
        { duration: "30s", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800", "p(99)<1500"],
    steinheim_errors: ["rate<0.01"],
  },
};

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function get(path, tag) {
  const res = http.get(`${BASE_URL}${path}`, { tags: { name: tag } });
  const ok = check(res, { [`${tag}: status is 200`]: (r) => r.status === 200 });
  errorRate.add(!ok);
  pageLoad.add(res.timings.duration, { tag });
  return res;
}

// One simulated shopper: lands on the homepage, browses a collection,
// opens a couple of products, checks a policy page, and (about a third
// of the time) fetches live Shopify pricing the way a collection/product
// page does client-side.
export default function shopperSession() {
  const locale = pick(LOCALES);

  get(`/${locale}`, "home");
  sleep(1 + Math.random() * 2);

  const series = pick(SERIES);
  get(`/${locale}/collections/${series}`, "collection");
  sleep(1 + Math.random() * 2);

  const product = pick(SAMPLE_PRODUCTS);
  get(`/${locale}/products/${product}`, "product");
  sleep(1 + Math.random() * 3);

  if (Math.random() < 0.5) {
    const product2 = pick(SAMPLE_PRODUCTS);
    get(`/${locale}/products/${product2}`, "product");
    sleep(1 + Math.random() * 2);
  }

  if (Math.random() < 0.3) {
    get(`/${locale}/${pick(STATIC_PAGES)}`, "static_page");
    sleep(1);
  }

  if (Math.random() < 0.35) {
    get("/api/shopify/prices", "shopify_prices_api");
  }
}
