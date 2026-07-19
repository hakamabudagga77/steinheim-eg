# Load testing

`storefront.js` is a [k6](https://k6.io) script that simulates shoppers browsing the
site: homepage → a collection → 1-2 product pages → occasionally a policy page and the
live Shopify pricing endpoint. It never calls a write endpoint (checkout, trade RFQ,
contact form, admin, webhooks), so it can't create real orders, leads, or emails.

## Install k6

- Windows: `winget install k6` or `choco install k6`
- macOS: `brew install k6`
- Linux / other: https://k6.io/docs/get-started/installation/

## Run it

Against a local dev/production build:

```bash
npm run build && npm run start &
BASE_URL=http://localhost:3000 npm run loadtest
```

Against a deployed environment (staging strongly preferred over production):

```bash
BASE_URL=https://steinheim-eg.vercel.app npm run loadtest
```

Heavier / longer soak:

```bash
PEAK_VUS=50 SOAK_DURATION=5m BASE_URL=https://steinheim-eg.vercel.app npm run loadtest
```

## Reading the result

k6 prints a summary at the end. The thresholds that matter most:

- `http_req_failed` rate should stay under 1%.
- `http_req_duration` p95 should stay under 800ms, p99 under 1.5s.

If either threshold fails, k6 exits non-zero and the failing metric is marked in the
summary output.

## Before pointing this at production

- Prefer a maintenance window or low-traffic time.
- The `shopify_prices_api` requests count against your Shopify Storefront API rate
  limit — keep `PEAK_VUS` modest (the default of 20) unless you've confirmed your
  Shopify plan's headroom.
- Vercel bills on bandwidth/function invocations; a large, sustained run has a real
  cost.
