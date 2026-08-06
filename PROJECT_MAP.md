# PROJECT_MAP — Steinheim Egypt Storefront

> Live document. Updated every delivery wave. Last verified: 2026-08-06, `main` @ `579a26d`.

## [TECH_STACK]

| Layer | Choice | Version (pinned) | Latest stable (2026-08-06) | Status |
|---|---|---|---|---|
| Framework | Next.js (App Router) | 16.2.12 | 16.3.0 | Pinned; upgrade candidate → [ORPHANS & PENDING] |
| UI | React / react-dom | 19.2.8 | 19.2.8 | Current |
| Styling | Tailwind CSS v4 (+ `@tailwindcss/postcss`) | ^4 | 4.3.3 | Current |
| Motion | framer-motion | ^12.43.0 | 13.0.0 | Minor upgrade available |
| i18n | next-intl | ^4.13.4 | 4.13.5 | Current; `en` + `ar`, RTL-aware (`i18n/routing.ts`) |
| State/animation util | lenis (smooth scroll) | ^1.3.23 | — | Current |
| Icons | lucide-react + react-icons | ^1.28 / ^5.7 | — | Current |
| Charts | recharts (admin analytics) | ^3.10.1 | — | Current |
| AI assistant | @anthropic-ai/sdk (Claude) + rules engine | ^0.115.0 | — | Current |
| PDF catalogue | pdf-lib + react-pageflip | ^1.17 / ^2.0 | — | Current |
| 3D lab | WebGL (components/three) | — | — | Current |
| Email | Resend (`resend`) | ^6.18.1 | — | Current |
| Analytics | GA4 (@google-analytics/data) + @vercel/speed-insights | ^6.1 / ^2.0 | — | Current |
| Errors | @sentry/nextjs | ^10.69.0 | 10.69.0 | Current |
| Cache/data | Redis (Vercel KV) + Shopify Storefront API | — | — | Current |
| Language | TypeScript | ^5 | — | Current |
| Tests | Vitest (218 unit), Playwright (e2e), k6 (load) | ^4.1 / ^1.62 | — | Current |

Gates: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` (all green on `main`).

## [SYSTEM_FLOW]

```
Visitor (ar/en)
  └─ Storefront pages: /, /collections/[series], /products/[slug], /finishes,
     /projects, /search, /shop-by-need, /shop-the-look, /3d-showcase, /about,
     /contact, /trade, /best-sellers, /wishlist, static pages (warranty/shipping/returns/privacy)
        ├─ SSG/ISR: static pages + series pages (grid paints instantly; live prices
        │   fetched client-side from /api/shopify/prices → CollectionPageClient)
        ├─ Commerce: CartDrawer → /api/shopify/checkout (Shopify card) OR
        │   WhatsApp order (wa.me deep link, channel-attributed via GA4)
        ├─ Engagement: wishlist/comparison/recently-viewed (localStorage-backed libs)
        ├─ Search: /api/… client modal + server-rendered /search (buildSearchIndex)
        ├─ Assistant: /assistant + /api/assistant → rules engine (catalog-rules-v1)
        │   or Claude (claude-assistant.ts); eval harness scripts/evaluate-assistant.mjs
        ├─ Trade: /trade + TradeProjectDrawer → /api/trade/rfq + /api/trade/leads
        │   (Resend emails, Redis stores, intelligence in trade-lead-intelligence.ts)
        └─ Reviews: /api/reviews + review-store (Redis)
Shopify (source of truth for product/price/inventory)
  └─ /api/shopify/prices (live), /api/webhooks/shopify, admin inventory/locations
Admin (app/admin/(dashboard))
  └─ orders / products / customers / reviews / contact / trade / analytics(+marketing)
     / content / policies / settings; session-auth (lib/server/admin-session.ts)
Operations
  └─ Cron: /api/cron/daily-digest (Resend), /api/cron/restock-check
Infra
  └─ Redis (redis-json-store), GA4, Sentry, Speed Insights, Resend, Vercel
```

## [ARCHITECTURE]

```
app/
  [locale]/        storefront routes (localized, createLocalizedMetadata, OG images)
  api/             shopify | trade | reviews | restock-alerts | contact | assistant |
                   admin/* | cron/* | webhooks/shopify
  admin/           (dashboard) + login — authenticated admin surface
components/        feature-first: collections, product, cart, search, assistant,
                   catalogue (flipbook), three (3D lab), trade, wishlist, comparison,
                   home, layout, ui, analytics, admin, about
lib/               feature modules w/ colocated unit tests (*.test.ts):
                   cart, wishlist, comparison, recently-viewed, reviews, restock-alerts,
                   live-prices, search-index, best-sellers, starter-package, trade-*,
                   analytics (+ channel/checkout attribution), seo
lib/server/        server-only: redis, redis-json-store, admin-session, rate-limit,
                   *-store, *-email, ga4-client, diagnostics-gate, digest-email
lib/assistant/     steinheim-assistant (deterministic) + claude-assistant (AI)
data/              egypt-master-catalog (products/series/finishes/prices/trade rules),
                   finishes.json, products.json, brand-knowledge, project-references, images
i18n/              routing (ar/en), request, navigation (localized Link/useRouter)
messages/          ar.json + en.json (next-intl)
scripts/           evaluate-assistant.mjs, crawl-site.mjs, verify-shopify-map.mjs
docs/              DEVLOG.md, UPGRADES.md
```

Principles: brand-locked (cream `#ece9e2`, charcoal `#0a0a0a`, italic serif headings, logo — never changed), RTL-correct (`text-start`/inline-start), WCAG (focus rings, aria-live, reduced-motion), DRY via feature libs with tests, surgical edits.

## [ORPHANS & PENDING]

- `app/[locale]/sentry-example-page/` + `app/api/sentry-example-api/` — leftover framework examples (UI dead-ends). Candidate for removal or conversion to a real status page.
- Next.js `16.2.12` pinned vs `16.3.0` stable — deliberate hold until 16.3.0 is exercised; check UPGRADES.md before bumping.
- **PWA/installability absent** — no `manifest.json`, no service worker, no apple-touch-icon. Gap for a mobile-first Egyptian market.
- **WhatsApp concierge absent at the page level** — WhatsApp is used for cart/contact, but there is no global floating "talk to a designer" entry with product/trade context deep-links.
- **Delivery promise absent** — no governorate→ETA estimator; shipping copy is static text only (no `deliveryLeadTime` structured data).
- **Seasonal merchandising absent** — no date-driven campaigns (Ramadan/Eid/Mother's Day) that auto-swap banners/heroes.
- **Performance budget CI gate absent** — no automated LCP/TTI thresholds enforced per page.
- Assistant `brain: "catalog-rules-v1"` is deterministic; no price/inventory-aware retrieval path when live data changes outside the master catalog.
