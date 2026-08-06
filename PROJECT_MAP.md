# PROJECT_MAP — Steinheim Egypt Storefront

> Live document. Updated every delivery wave. Last verified: 2026-08-06, `main` @ `948ea19` (PRs #97-#101).

## [TECH_STACK]

| Layer | Choice | Version (pinned) | Latest stable (2026-08-06) | Status |
|---|---|---|---|---|
| Framework | Next.js (App Router) | 16.3.0 | 16.3.0 | Current |
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
| Tests | Vitest (249 unit), Playwright (e2e), k6 (load) | ^4.1 / ^1.62 | — | Current |

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

> Innovation track — Waves #97/#98/#99 shipped 2026-08-06, then #100/#101 on the
> same day closed every remaining open item below. The innovation track is now
> fully closed: nothing under this heading remains open.

### Closed by the innovation track
- ~~PWA/installability absent~~ — DONE (PR #98): `app/manifest.ts`, `public/sw.js`, brand icons via `scripts/generate-icons.mjs`, verified by `e2e/pwa.spec.ts`.
- ~~WhatsApp concierge absent at the page level~~ — DONE (PR #97): `components/ui/DesignerConcierge.tsx` + `lib/concierge.ts` (context-aware wa.me deep links, unit tested).
- ~~Delivery promise absent~~ — DONE (PR #97): `lib/delivery.ts` 27-governorate ETA matrix (AR/EN names) + `DeliveryPromise` UI + `OfferShippingDetails` in product schema.
- ~~Seasonal merchandising absent~~ — DONE (PR #99): `lib/campaigns.ts` date engine + `CampaignBanner` + `campaigns` i18n.
- ~~Performance budget CI gate absent~~ — DONE (PR #99): `e2e/perf-budget.spec.ts` LCP budgets + `npm run perf:budget`.
- ~~`sentry-example-page` / `sentry-example-api` leftover framework examples~~ — DONE (PR #100): removed both routes + `robots.txt` disallows; Sentry capture via `instrumentation.ts`/`instrumentation-client.ts` stays.
- ~~Next.js `16.2.12` pinned vs `16.3.0`~~ — DONE (PR #100): adopted `next`/`eslint-config-next`/`@next/bundle-analyzer` 16.3.0; TS7 + ESLint10 still blocked by the preset (UPGRADES.md §3).
- ~~Assistant has no price/inventory-aware retrieval~~ — DONE (PR #101): `answerSteinheimQuestion` accepts a `LiveLookup` wired to `getAllLiveData()` (5-min Redis cache); live price/stock override the catalogue reference, AI path gets a live snapshot, honest fallbacks otherwise. No-code campaign manager shipped in the same PR: `lib/server/campaign-store.ts` + `/admin/campaigns` + `/api/campaigns/active`.
