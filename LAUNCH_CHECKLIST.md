# Steinheim Egypt — Go-Live Checklist

**Target: site fully live before 1 Aug 2026 (1 Aug at the very latest).**
**Deploy target: Vercel · Framework: Next.js 16 · Store: Shopify (hosted checkout).**

Legend: `[R]` required to launch · `[Rec]` strongly recommended · `[Opt]` optional / can follow after launch.

---

## 0. How money actually flows (read first)

The Next app does **not** process payments. When a shopper checks out, `POST /api/shopify/checkout`
maps each cart line to a Shopify **variant ID** and returns a Shopify **cart permalink**
(`https://<store-domain>/cart/<variantId>:<qty>,…`). The browser opens that URL and the shopper
pays on **Shopify's own hosted checkout**. There is also a **WhatsApp order** button that needs no
Shopify checkout at all (it opens a pre-filled WhatsApp message).

Consequences:
- Real card payments require a **live Shopify plan with a payment provider activated** and the
  **store password page turned OFF**.
- Every product a shopper can buy must exist in Shopify with a **handle + finish option** that match
  `lib/shopify-product-map.ts` (see §4). A mismatch = "item could not be mapped" at checkout.
- If a card gateway isn't ready by launch, the **WhatsApp order path still works** — the store can go
  live taking orders over WhatsApp while the gateway is finalised.

---

## 1. Merge the open PRs `[R]`

- [ ] Merge **#58** (SEO / performance / sitemap)
- [ ] Merge **#59** (hardening, sanitizer tests, API safety guards)
- [ ] Merge **#60** (cart/wishlist drawer accessibility)
- [ ] Confirm `main` is green afterwards: `npm run lint && npm run typecheck && npm test && npm run build`

They touch disjoint files, so merge order doesn't matter.

---

## 2. External accounts to provision

### A. Shopify — the critical path `[R]`
- [ ] Shopify store on a plan that includes **online checkout** (Basic or higher).
- [ ] **Custom app** created in Shopify admin (Settings → Apps → Develop apps) with **Admin API**
      access. Grant scopes: `read_products`, `read_inventory`, `read_orders` (orders used by the
      admin dashboard + channel attribution). Install it and copy the **client ID / secret**.
- [ ] **Payment provider** activated in Shopify. *Shopify Payments is not available in Egypt* — pick a
      Shopify-supported gateway (e.g. Paymob / PayTabs / Fawry) or COD, and confirm it's live in a
      real test transaction. (This is a business/payments decision — verify availability with the
      provider; the site just hands off to whatever Shopify has enabled.)
- [ ] Store **password protection OFF** (Online Store → Preferences) so the cart permalink checkout is reachable.
- [ ] Taxes + shipping zones configured in Shopify (they show on Shopify's checkout, not our site).

### B. Redis — required for all forms/leads `[R]`
- [ ] Provision **Upstash Redis** (or Vercel KV). Without it, `POST` to contact / reviews /
      restock-alerts / trade-leads returns **503** and no lead is stored, and rate-limiting +
      webhook de-dupe are disabled.
- [ ] Copy the REST URL + token (either `UPSTASH_REDIS_REST_*` or `KV_REST_API_*` — the code accepts both).

### C. Resend — lead + confirmation emails `[Rec]`
- [ ] Resend account + **verified sending domain** (SPF/DKIM). The `TRADE_LEAD_NOTIFY_FROM` address
      must be on that verified domain or emails silently fail.
- [ ] Without this, leads are still saved to Redis, but you won't get an email when one arrives.

### D. Domain + DNS `[R]`
- [ ] Point the production domain at Vercel; confirm HTTPS/SSL issued.
- [ ] Decide the canonical host (with or without `www`) — it must match `NEXT_PUBLIC_SITE_URL`.

### E. Analytics + monitoring `[Rec]`
- [ ] GA4 property + Measurement ID (`NEXT_PUBLIC_GA4_ID`). (Analytics only fires on the production hostname.)
- [ ] Sentry project + DSN for error monitoring.

---

## 3. Environment variables (Vercel → Project → Settings → Environment Variables → **Production**)

| Variable | Status | Notes |
|---|---|---|
| `SHOPIFY_STORE_DOMAIN` | `[R]` | e.g. `steinheim.myshopify.com` (used for API **and** the checkout permalink host) |
| `SHOPIFY_CLIENT_ID` | `[R]` | Shopify custom app |
| `SHOPIFY_CLIENT_SECRET` | `[R]` | Shopify custom app |
| `SHOPIFY_WEBHOOK_SECRET` | `[Rec]` | Enables near-real-time price/stock refresh (see §4) |
| `UPSTASH_REDIS_REST_URL` / `KV_REST_API_URL` | `[R]` | Redis endpoint |
| `UPSTASH_REDIS_REST_TOKEN` / `KV_REST_API_TOKEN` | `[R]` | Redis token |
| `ADMIN_EMAIL` | `[R]` | Admin panel login |
| `ADMIN_PASSWORD` | `[R]` | Use a strong password |
| `SESSION_SECRET` | `[R]` | Random, **32+ chars** (cookie signing; secure cookie enforced in prod) |
| `NEXT_PUBLIC_SITE_URL` | `[R]` | Real prod URL, no trailing slash — drives canonical/hreflang/sitemap/OG/emails |
| `RESEND_API_KEY` | `[Rec]` | Lead + confirmation + restock + digest emails |
| `TRADE_LEAD_NOTIFY_EMAIL` | `[Rec]` | Where new-lead alerts go |
| `TRADE_LEAD_NOTIFY_FROM` | `[Rec]` | Must be on the Resend-verified domain |
| `DIGEST_NOTIFY_EMAIL` | `[Opt]` | Daily digest recipient (defaults to notify email) |
| `NEXT_PUBLIC_GA4_ID` | `[Rec]` | Client-side GA4 |
| `GA4_PROPERTY_ID` + `GA4_SERVICE_ACCOUNT_EMAIL` + `GA4_SERVICE_ACCOUNT_PRIVATE_KEY` | `[Opt]` | Only for the admin analytics dashboard |
| `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_DSN` | `[Rec]` | Error monitoring |
| `SENTRY_ORG` + `SENTRY_PROJECT` + `SENTRY_AUTH_TOKEN` | `[Opt]` | Only for build-time source-map upload |
| `ANTHROPIC_API_KEY` (+ `ANTHROPIC_MODEL`) | `[Opt]` | Only if the AI concierge page is kept enabled |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `[Rec]` | WhatsApp ordering / enquiries |
| `NEXT_PUBLIC_TRADE_SCHEDULING_URL` | `[Opt]` | "Schedule a call" link |
| `CRON_SECRET` | `[Opt]` | Only if enabling the digest/restock crons (see §6) |

- [ ] Set all `[R]` vars in Production (and Preview, if you want previews fully functional).
- [ ] Double-check no secret is in `NEXT_PUBLIC_*` by mistake (those ship to the browser).

---

## 4. Shopify wiring — make checkout actually resolve `[R]`

- [ ] Run **`npm run verify:shopify-map`** against the live store (needs the three `SHOPIFY_*` vars).
      It flags every mapped product whose handle is missing from the store, and any variant finish the
      map won't recognise — catching checkout breakage before a customer hits it. Must exit `0`.
- [ ] Confirm the live Shopify product **handles** match the map in `lib/shopify-product-map.ts`
      (`SLUG_TO_HANDLE`). Note `joy-bottle-trap` is intentionally unmapped (`""`) — it won't be purchasable
      until a handle is added.
- [ ] Confirm each variant's **option1** matches a finish name in `FINISH_ALIASES`
      (Chrome, Brushed Nickel, Matte Black, Brushed Gold, Coffee Gold, Gun Metal Grey).
- [ ] Products are **Active** and available on the sales channel used by checkout.
- [ ] End-to-end test: add to cart on the live site → **Checkout** → lands on Shopify checkout with the
      right items/prices → complete one **real low-value order** with the live gateway, then refund it.
- [ ] Register the **webhook**: Shopify admin → Settings → Notifications → Webhooks →
      `https://<domain>/api/webhooks/shopify`, signed with `SHOPIFY_WEBHOOK_SECRET`, for topics:
      `products/update|create|delete`, `inventory_levels/update|connect`,
      `orders/create|cancelled|fulfilled`. (Without it, prices/stock still refresh on a ~5-min cache.)
- [ ] Verify the **WhatsApp order** button opens a correct pre-filled message to the right number.

---

## 5. Pre-launch verification (on a Vercel Preview deploy, before pointing the domain)

- [ ] Log into `/admin` → **Status** page shows Shopify + Redis (+ GA4) **configured / green**
      (`GET /api/admin/status`).
- [ ] **Smoke-test every flow:**
  - [ ] Browse collections / product pages (EN **and** AR — check RTL layout)
  - [ ] Add to cart → drawer opens → **Checkout** redirects to Shopify
  - [ ] Wishlist add/remove/share; Compare (max 3)
  - [ ] Contact form → success → lead appears in `/admin` → notification email received
  - [ ] Review submit → appears as *pending* in admin → approve → shows on product
  - [ ] Restock alert on an out-of-stock variant → stored
  - [ ] Trade RFQ → lead created + confirmation email
  - [ ] AI concierge (if enabled)
  - [ ] Admin login works; wrong password rejected
- [ ] **SEO:** `/<sitemap.xml>` lists the right URLs, `/robots.txt` correct, product pages have absolute
      canonical + hreflang, `/manifest.webmanifest` serves, `wishlist` is `noindex`.
- [ ] **Performance/UX:** Lighthouse pass on mobile; hero video/LCP acceptable; no console errors;
      test on a real phone.
- [ ] Rate limiting works (repeated form submits get 429).

---

## 6. Cron jobs `[Rec]`

Already wired: `vercel.json` schedules `/api/cron/daily-digest` (06:00 UTC) and
`/api/cron/restock-check` (12:00 UTC). Both routes authorise via `Authorization: Bearer <CRON_SECRET>`,
which Vercel attaches automatically when the env var is set.
- [ ] Set `CRON_SECRET` in Vercel Production (otherwise the scheduled runs get 401).
- [ ] Note: Vercel **Hobby** allows only once-daily crons (current schedules comply). On **Pro** you can
      raise `restock-check` to e.g. `0 */6 * * *` for faster restock/price-drop emails.

---

## 7. Go-live

- [ ] All `[R]` env vars set in Production.
- [ ] Point the domain → Production deploy from `main`.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the final domain and redeploy so SEO URLs are absolute + correct.
- [ ] Turn the **Shopify store password OFF** (final gate for public checkout).
- [ ] Re-run the §5 smoke tests on the **production** URL.

---

## 8. First 48 hours after launch

- [ ] Watch Sentry for runtime errors.
- [ ] Watch GA4 for real traffic; confirm it only counts production.
- [ ] Confirm at least one real order flows through Shopify and the webhook fires (prices/stock refresh).
- [ ] Confirm lead emails are arriving (not in spam — Resend domain reputation).

---

## 9. Suggested timeline (today = Sun 27 Jul → target 1 Aug)

| Day | Focus |
|---|---|
| **Sun 27 Jul** | Merge #58/#59/#60. Create Shopify custom app + Upstash Redis + Resend domain. |
| **Mon 28 Jul** | Set all env vars in Vercel. Activate the Shopify payment gateway. Verify handle/finish map (§4). |
| **Tue 29 Jul** | Preview deploy. Full §5 smoke test incl. one real test order + refund. Register webhook. |
| **Wed 30 Jul** | Fix anything found. AR/RTL + mobile + Lighthouse pass. SEO checks. |
| **Thu 31 Jul** | Point domain, production deploy, password OFF, production smoke test. **Soft launch.** |
| **Fri 1 Aug** | Buffer / monitoring day. Public announcement once the first 48h watch looks clean. |
