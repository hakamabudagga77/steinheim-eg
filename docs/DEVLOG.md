# Steinheim Egypt — Development Log

A running log of shipped work, audit findings, and the forward roadmap. Every
entry is fact-based: merged PRs, quality-gate results, and deliberate
non-changes. Dates are local (Cairo); PR numbers link into GitHub.

## 2026-08-04 — Bilingual assistant + maintenance delivery wave

Four pull requests merged to `main`, each green on lint, typecheck, the full
unit suite, the production build, Playwright E2E, and Vercel:

- **PR #83 — Security hardening.** Tighter rate limiting across the public
  endpoints, stronger admin authentication/session handling, checkout input
  validation, and email-template escaping. Closes the highest-cost attack
  surfaces (the AI path is metered; admin is the store's back door).
- **PR #84 — Assistant Arabic i18n.** The `/ar` concierge answered in Arabic
  but every piece of UI copy was hardcoded English and the model was steered
  by an English-only system prompt. All assistant copy now lives in the
  message files (`assistant` namespace), and the model receives an Arabic
  directive on `/ar` while series/finish names and model numbers stay in
  their Latin catalogue form. The Anthropic call keeps the large catalogue
  system block cached and appends the locale as a separate uncached block.
- **PR #85 — RTL directionality + storage hardening + dead code.**
  Navigation hover motion, card arrows, breadcrumb separators, the filter
  toggle, corner-pinned controls (mute, video pause, back-to-top, room
  progress) and spec-table padding now mirror correctly under `dir="rtl"`.
  `localStorage` writes in the trade workspace were wrapped so a blocked or
  sandboxed tab can no longer hard-fail a page. Removed the unreferenced
  `lib/assistant/claude-layer.ts` and a dead `next: { revalidate }` option on
  the Shopify GraphQL POST.
- **PR #86 — Eval script rate-limit handling.** `npm run eval:assistant`
  fired 30 scenarios against the endpoint's 20-requests-per-10-minutes
  limit, so everything past request 20 failed spuriously and exited `1`.
  429s are now reported as `SKIP` rather than failures, over-limit runs warn
  up front, and `--delay-ms` paces a full evaluation.

### Audit outcomes (why some things did NOT change)

A full-site audit ran alongside this wave. These items were checked and
deliberately left alone:

- **Dates** — every date render already pins `en-GB` explicitly; no
  `Intl.DateTimeFormat` calls. No change needed.
- **Cache keys** — locale-blind cache keys checked; no collision between
  `en` and `ar` on shared keys.
- **Dead i18n** — `common` namespace confirmed unreferenced and added to the
  coverage suite's unused-namespace list.

### Metrics at the time of writing

- 218 unit tests passing across 22 files (trade, admin, cart, wishlist,
  i18n coverage, rate limiting, analytics, prices, search, SEO, and more).
- Production build renders all 73 routes, including every `en`/`ar` pair.

---

## 2026-08-04 — Accessibility, performance & SEO delivery waves

Three pull requests merged to `main`, each green on lint, typecheck, the full
unit suite, and the production build:

- **PR #88 — Accessibility foundation.** A global `:focus-visible` ring
  (WCAG 2.4.7) that follows each element's text colour so it stays on-brand on
  light and dark surfaces; a skip-to-content link (EN/AR) wired to
  `<main id="main">`; the shell wrapped in `MotionConfig reducedMotion="user"`
  so framer-motion honours the OS reduce-motion setting. Restock alert became
  a real `<form>` (Enter submits, native email validation, `autoComplete`);
  all six contact fields got proper `htmlFor`/`id` label associations; the
  assistant and site-search inputs got `aria-label`s. Live regions were added
  so async results announce themselves: screen-reader-only results count for
  site search (with correct Arabic plural forms), `role="status"` on restock
  and review success, `role="alert"` on form/review errors.
- **PR #89 — Image loading performance.** The mega-menu's world hero and
  first-two product tiles dropped their `priority` preloads — they live in the
  global shell and were competing with every page's real LCP image while only
  rendering once the menu opens (same for the admin sidebar logo). The four
  home collection "lifestyle" hover frames now fetch only on first hover (a
  transparent 1×1 keeps the element mounted so the 1800 ms crossfade still
  plays); touch users download none of them. Flipbook page tiles got
  `loading="lazy"` + `decoding="async"`. The five genuine above-the-fold
  heroes (product gallery, projects index/detail, warranty, collection
  banners) keep `priority`.
- **PR #90 — SEO & structured data.** A `WebSite` JSON-LD node (name, url,
  `inLanguage` per locale, publisher) now sits beside the existing
  `Organization` node in the locale layout. Collection detail pages gained an
  `ItemList` of their products and a `BreadcrumbList`, plus per-collection
  OG/Twitter images (the site's own banners) so shared links preview
  correctly on WhatsApp. The collections index gained an `ItemList` of the
  four collections. Structured data now spans Organization, WebSite, Product
  (live-price offers + aggregate ratings from approved reviews), breadcrumbs,
  and collection item lists.

---

## 2026-08-04 — Resilience & RTL completeness delivery wave

Two pull requests merged to `main`, each green on lint, typecheck, the full
unit suite, and the production build:

- **PR #91 — Error paths in the brand system + admin resilience.** A
  localized `not-found.tsx` and route-level `error.tsx` in the brand palette
  (cream/charcoal, italic serif headings) with EN/AR copy, replacing the
  default Next 404 and the unstyled series fallback. `global-error.tsx` was
  recolored from an off-brand gold `#c9a961` to the cream/charcoal system and
  made bilingual (Arabic detected from the pathname on hydration). The admin
  dashboard's five data fetches previously failed silently; they now share a
  `loadData()` with per-fetch `.catch()` that surfaces a red banner with a
  Retry button instead of an eternal "…". New `notFoundPage`/`errorPage`
  namespaces in both message files.
- **PR #92 — RTL logical utilities.** `text-left`/`text-right` and
  `border-l`/`border-r` are physical — they don't mirror under `dir="rtl"`.
  Converted every occurrence in public components (assistant prompts, 3D lab,
  collections landing + series accordion, trade drawer tabs/board/room
  calculator/setup overlay, product cards + detail rows, trade admin board) to
  `text-start`/`text-end` and `border-s`/`border-e`. Already-correct spots
  (explicit `rtl:text-right` overrides) were left alone.

---

## 2026-08-04 - UX depth & contrast delivery wave

One pull request merged to `main`, green on lint, typecheck, the full unit
suite, and the production build:

- **PR #93 - UX depth & contrast.** The product page now shows a small
  "Reference price - final price is confirmed at checkout" note (EN/AR)
  whenever live pricing is unavailable, instead of silently falling back to
  the catalogue price. Meaningful small labels were raised from `/25`-`/35`
  to `/45` opacity for legibility (WCAG): the series eyebrows on the
  quick-view and compare modals, site-search group headers and footer hints,
  the trade "preview" labels, unmet-room milestone counts, and the 3D model
  lab section labels. Decorative glyphs (chevrons, arrows) and the admin UI
  were deliberately left at their original opacity.

## 2026-08-04 - SEO depth, performance finishing & UX empty-state waves

Three pull requests merged to `main`, each green on lint, typecheck, the full
unit suite, and the production build:

- **PR #94 - Instant collection grid + flipbook intrinsic dimensions.** The
  series page no longer awaits the Redis/Shopify live-data fetch before
  rendering: the grid (images, names, catalogue prices) paints instantly, and
  CollectionPageClient fetches `/api/shopify/prices` client-side, swapping in
  live prices with a price-line skeleton while it loads. The flipbook's
  per-page tiles now carry explicit width/height from the catalogue manifest
  (the tiles were already downscaled WebP), eliminating layout shift inside
  the book.
- **PR #95 - SEO depth.** FAQPage JSON-LD on the finishes page (one localized
  question/answer set per finish: what it is, which collections carry it, and
  how to care for it). A new server-rendered `/{locale}/search` page mirrors
  the client modal's index with branded empty/no-results states, and the
  WebSite schema now declares a SearchAction so Google's sitelink search box
  is eligible. The projects index and project detail pages share the
  project's own hero image as the OG/Twitter image.
- **PR #96 - UX empty states.** The site-search modal's "no results" is now a
  full empty state (icon, explanation, and a "Browse collections" link that
  closes the modal), and the catalogue flipbook shows a book-shaped loading
  skeleton while the manifest loads instead of a bare text line.

This closes the remaining roadmap sections: #2 Performance and #4 SEO are
fully shipped, and #6 UX depth is shipped.

## 2026-08-06 - Innovation track: concierge, delivery promise, PWA, campaigns & perf gate

Three pull requests merged to `main`, each green on lint, typecheck, the full
unit suite, and the production build. All work stays inside the brand system
(cream `#ece9e2`, charcoal `#0a0a0a`, italic serif headings) and the identity
was not touched.

- **PR #97 - Designer concierge + delivery promise.** A persistent floating
  WhatsApp button whose deep link is pre-shaped by the page (product pages
  name the product, series, and reference price; /trade and /contact get
  their own intents). A 27-governorate delivery ETA matrix (accepts English
  or Arabic names, default fallback) renders on the product page and cart,
  and the product schema now carries `OfferShippingDetails`. Pure logic in
  `lib/concierge.ts` / `lib/delivery.ts`, both unit tested. Also ships the
  new `PROJECT_MAP.md` (TECH_STACK / SYSTEM_FLOW / ARCHITECTURE /
  ORPHANS & PENDING).
- **PR #98 - Installable PWA + offline shell.** `app/manifest.ts` emits a Web
  App Manifest (brand icons 192/512/maskable generated from an SVG monogram
  by `scripts/generate-icons.mjs` via sharp). `public/sw.js` is a conservative
  offline-first worker: same-origin GETs only, API and large media skipped,
  navigations network-first with a cached fallback. Registered in production
  only, after load, so first paint is untouched.
- **PR #99 - Seasonal campaigns engine + performance budget gate.** A pure
  date-driven campaign engine (`lib/campaigns.ts`, injectable for tests)
  drives a brand-styled `CampaignBanner` above the home hero only when a
  window is active; copy lives in the `campaigns` i18n namespace. A Playwright
  perf gate (`e2e/perf-budget.spec.ts`) warms and measures LCP on the key
  routes under budgets, plus `e2e/pwa.spec.ts` verifies the PWA contract.
  `npm run perf:budget` runs the gate alone.

The innovation track closed every gap logged in `PROJECT_MAP.md`'s
[ORPHANS & PENDING]: concierge, delivery promise, PWA, seasonal campaigns,
and the performance gate are all shipped.

---

## Roadmap - the excellence track

All work respects the brand system: cream `#ece9e2`, charcoal `#0a0a0a`,
black/white, the italic serif headings, the logo. Nothing below changes the
identity - it makes the experience underneath it sharper.

### 1. Accessibility foundation (P0) - SHIPPED (PR #88)
- Skip-to-content link and `id="main"` targets. Done.
- `aria-live`/`role="status"` announcements for async UI (search, restock,
  reviews, forms). Done.
- `prefers-reduced-motion` honoured by framer-motion via `MotionConfig`. Done.
- A global `:focus-visible` ring on brand (cream ring on dark, charcoal on
  light) - WCAG 2.4.7, not a visual redesign. Done.
- Real labels (visually hidden) for placeholder-only fields. Done.

### 2. Performance (P1) - SHIPPED (PRs #89, #94)
- Hover-image double-fetch on the home cards: render the hover image only on
  hover instead of shipping both at first paint. Done.
- Migrate the deprecated `priority` prop to Next 16's `preload` (9 call
  sites). Resolved as a demotion instead: the five true LCP heroes keep
  `priority`; the shell/menu/logo sites dropped it so they no longer preload
  on every page.
- Flipbook PDF-page tiles: intrinsic dimensions to kill layout shift, and
  downscaled WebP tiles instead of full-resolution page renders. Done
  (PR #94 added explicit width/height; the tiles were already WebP).
- Suspense skeleton around the Redis-backed live-data fetch on collection
  pages so the grid paints instantly. Done (PR #94: the grid now paints
  instantly with catalogue prices and live prices arrive client-side from
  `/api/shopify/prices` with a price-line skeleton).

### 3. Error handling & resilience (P1) - SHIPPED (PR #91)
- Localized `not-found.tsx` and route-level `error.tsx` in the brand system
  (replaces the default English 404, incl. the unstyled series fallback). Done.
- Localize `global-error.tsx`. Done.
- Admin dashboard: `.catch()` on the orders/products/leads fetches so a
  network failure shows an error state + retry instead of an eternal "...". Done.

### 4. SEO & structured data (P1) - SHIPPED (PRs #90, #95)
- `CollectionPage` + `ItemList` schema on series pages; `FAQPage` on
  finishes; `WebSite` + `SearchAction` in the layout. Done.
- Per-page OG images for collections and projects instead of the generic
  logo card. Done.

### 5. RTL completeness (P1/P2) - SHIPPED (PR #92)
- Physical borders to inline-start in the series accordion and 3D lab. Done.
- `text-left` to `text-start` in assistant, 3D lab, product filter pills,
  collections landing, and the trade drawer header. Done.

### 6. UX depth (P2) - SHIPPED (PRs #88, #93, #96)
- Restock alert as a real form (Enter submits, native email validation). Done.
- "Reference price" note when live prices are unavailable instead of a
  silent fallback. Done.
- Loading skeletons for client-driven sections; richer empty states. Done.

### 7. Contrast (P2, WCAG-driven) - SHIPPED (PR #93)
- Raise meaningful small labels from `/25`-`/35` opacity to at least `/45`,
  keeping decorative text where it is. Done.
_Last verified: 2026-08-06 - all checks green on `main` at `78e9793` (after the innovation track PRs #97-#99)._

