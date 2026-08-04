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

## Roadmap — the excellence track

All work respects the brand system: cream `#ece9e2`, charcoal `#0a0a0a`,
black/white, the italic serif headings, the logo. Nothing below changes the
identity — it makes the experience underneath it sharper.

### 1. Accessibility foundation (P0) — SHIPPED (PR #88)
- Skip-to-content link and `id="main"` targets. ✅
- `aria-live`/`role="status"` announcements for async UI (search, restock,
  reviews, forms). ✅
- `prefers-reduced-motion` honoured by framer-motion via `MotionConfig`. ✅
- A global `:focus-visible` ring on brand (cream ring on dark, charcoal on
  light) — WCAG 2.4.7, not a visual redesign. ✅
- Real labels (visually hidden) for placeholder-only fields. ✅

### 2. Performance (P1) — most shipped (PR #89)
- Hover-image double-fetch on the home cards: render the hover image only on
  hover instead of shipping both at first paint. ✅
- Migrate the deprecated `priority` prop to Next 16's `preload` (9 call
  sites). ⚠️ Done as demotion instead: the five true LCP heroes keep
  `priority`; the shell/menu/logo sites dropped it so they no longer
  preload on every page.
- Flipbook PDF-page tiles: intrinsic dimensions to kill layout shift, and
  downscaled WebP tiles instead of full-resolution page renders. 🔲
- Suspense skeleton around the Redis-backed live-data fetch on collection
  pages so the grid paints instantly. 🔲

### 3. Error handling & resilience (P1)
- Localized `not-found.tsx` and route-level `error.tsx` in the brand system
  (replaces the default English 404, incl. the unstyled series fallback).
- Localize `global-error.tsx`.
- Admin dashboard: `.catch()` on the orders/products/leads fetches so a
  network failure shows an error state + retry instead of an eternal "…".

### 4. SEO & structured data (P1) — partially shipped (PR #90)
- `CollectionPage` + `ItemList` schema on series pages; `FAQPage` on
  finishes; `WebSite` + `SearchAction` in the layout.
  ✅ ItemList + breadcrumbs on series pages; `WebSite` node shipped.
  🔲 `FAQPage` on finishes and `SearchAction` remain (site search has no
  server-side query URL yet).
- Per-page OG images for collections and projects instead of the generic
  logo card (accept `ogImage` in `createLocalizedMetadata`).
  ✅ Collections. 🔲 Projects.

### 5. RTL completeness (P1/P2)
- Physical borders → inline-start in the series accordion and 3D lab.
- `text-left` → `text-start` in assistant, 3D lab, product filter pills,
  collections landing, and the trade drawer header.

### 6. UX depth (P2)
- Restock alert as a real form (Enter submits, native email validation). ✅
- "Reference price" note when live prices are unavailable instead of a
  silent fallback.
- Loading skeletons for client-driven sections; richer empty states.

### 7. Contrast (P2, WCAG-driven)
- Raise meaningful small labels from `/25`–`/35` opacity to ≥ `/45`, keeping
  decorative text where it is.

_Last verified: 2026-08-04 — all checks green on `main` at
`5b9d456`._
