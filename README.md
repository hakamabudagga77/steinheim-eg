<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/images/brand/steinheim-logo-white.png">
  <img src="public/images/brand/steinheim-logo-black.png" alt="Steinheim" width="420">
</picture>

### A premium bilingual e-commerce platform for German bathroom design, built for Egypt.

<sub>Designed, engineered, and delivered to the standard of a dedicated product studio —<br>full-stack architecture, commerce, AI, and security, shipped as one cohesive system.</sub>

**Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Full EN / AR (RTL) · Shopify-backed commerce**

<br>

[![Next.js](https://img.shields.io/badge/Next.js-16.2-1A1A1A?style=for-the-badge&logo=next.js&logoColor=00DC82)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-1A1A1A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-1A1A1A?style=for-the-badge&logo=typescript&logoColor=3178C6)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-1A1A1A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-1A1A1A?style=for-the-badge&logo=vercel&logoColor=FFFFFF)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-C9A96E?style=for-the-badge&labelColor=1A1A1A)](LICENSE)

[![CI](https://img.shields.io/github/actions/workflow/status/hakamabudagga77/steinheim-eg/ci.yml?branch=main&style=for-the-badge&label=CI&labelColor=1A1A1A&color=2ECC71)](https://github.com/hakamabudagga77/steinheim-eg/actions/workflows/ci.yml)
[![Sentry](https://img.shields.io/badge/monitoring-Sentry-1A1A1A?style=for-the-badge&logo=sentry&logoColor=9B6BFF&labelColor=1A1A1A)](https://sentry.io)
[![Vitest](https://img.shields.io/badge/tested%20with-Vitest-1A1A1A?style=for-the-badge&logo=vitest&logoColor=A8FF60)](https://vitest.dev)
[![k6](https://img.shields.io/badge/load--tested-k6-1A1A1A?style=for-the-badge&logo=k6&logoColor=B19CFF)](load-tests/README.md)
[![ESLint](https://img.shields.io/badge/lint-ESLint%209-1A1A1A?style=for-the-badge&logo=eslint&logoColor=9B8CFF)](eslint.config.mjs)
[![Shopify](https://img.shields.io/badge/commerce-Shopify-1A1A1A?style=for-the-badge&logo=shopify&logoColor=95BF47)](https://www.shopify.com)
[![Claude](https://img.shields.io/badge/AI%20concierge-Claude-1A1A1A?style=for-the-badge&logo=anthropic&logoColor=FF9269)](https://www.anthropic.com)
[![Redis](https://img.shields.io/badge/cache-Upstash%20Redis-1A1A1A?style=for-the-badge&logo=redis&logoColor=FF6B6B)](https://upstash.com)
[![i18n](https://img.shields.io/badge/i18n-EN%20%2F%20AR%20(RTL)-1A1A1A?style=for-the-badge&color=F472B6&labelColor=1A1A1A)](#-internationalization)
[![Node](https://img.shields.io/badge/node-%3E%3D20-1A1A1A?style=for-the-badge&logo=node.js&logoColor=68CC58)](package.json)
[![OSI Approved](https://img.shields.io/badge/OSI%20Approved-License-1A1A1A?style=for-the-badge&color=FFC857&labelColor=1A1A1A)](https://opensource.org/licenses/MIT)
[![Maintained](https://img.shields.io/badge/maintained-yes-1A1A1A?style=for-the-badge&color=34D399&labelColor=1A1A1A)](https://github.com/hakamabudagga77/steinheim-eg/commits/main)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-1A1A1A?style=for-the-badge&color=22D3EE&labelColor=1A1A1A)](#-contributing)

</div>

<br>

<div align="center">
<table>
<tr>
<td width="50%"><img src="public/images/lifestyle/hero.png" alt="Steinheim freestanding bath, brushed nickel floor-mount mixer"></td>
<td width="50%"><img src="public/images/steinheim/final/about-hero.jpg" alt="Steinheim brushed-gold bath filler against black marble"></td>
</tr>
<tr>
<td width="50%"><img src="public/images/steinheim/karim-2026/landing-joy.webp" alt="Joy collection matte-black wall-mounted basin mixer"></td>
<td width="50%"><img src="public/images/steinheim/karim-2026/banner-quatro.webp" alt="Quatro collection brushed-gold shower system, skylight bathroom"></td>
</tr>
</table>
</div>

<br>

## ✨ What is this

**Steinheim Egypt** is the production storefront for a premium European bathroom-fixtures
brand's Egyptian market — four design collections (**Joy · Up · Art · Quatro**), full
Shopify-backed commerce, a dedicated **B2B trade studio** for architects, developers, and
hospitality projects, and an **AI concierge** that walks customers through specification
decisions in natural language.

It's a full-stack, security-hardened, fully bilingual (English / Arabic, true RTL — not a
mirrored stylesheet) commerce platform, built end-to-end with the App Router, Server
Components, and every modern Next.js 16 convention — not the patterns most tutorials still
teach.

<br>

## 📚 Table of contents

- [Feature highlights](#-feature-highlights)
- [Tech stack](#-tech-stack)
- [Architecture map](#-architecture-map)
- [Getting started](#-getting-started)
- [Testing & quality gates](#-testing--quality-gates)
- [Load testing](#-load-testing)
- [Security](#-security)
- [Internationalization](#-internationalization)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Open source & licensing](#-open-source--licensing)
- [Credits](#-credits)

<br>

## 🚀 Feature highlights

<table>
<tr><td width="33%" valign="top">

### 🛍️ Commerce
- Full Shopify Storefront API integration — live pricing, inventory, checkout handoff
- HMAC-verified Shopify webhooks with cache invalidation
- Cart, wishlist (with shareable links), and quick-add flows
- Finish-aware product variants across 6 premium finishes

</td><td width="33%" valign="top">

### 🏗️ Trade Studio (B2B)
- Room-by-room specification builder for architects & developers
- PDF quote/invoice generation (`pdf-lib`)
- Lead intelligence pipeline with email digests
- Sample requests, scope tracking, project messaging

</td><td width="33%" valign="top">

### 🤖 AI Concierge
- Claude-powered specification assistant (`@anthropic-ai/sdk`)
- Deterministic catalogue/rule brain first, LLM rewrite second — never fails open into
  hallucinated product facts
- Voice input (Web Speech API) + ElevenLabs voice output, with automatic browser-voice
  fallback

</td></tr>
<tr><td width="33%" valign="top">

### 🌍 True bilingual, not translated
- Complete English / Arabic parity via `next-intl`, including RTL layout, RTL-aware
  animations, and locale-aware routing
- Every page, drawer, toast, and error state — not just the marketing copy

</td><td width="33%" valign="top">

### 🔐 Security-hardened
- CSP, HSTS, and full security header suite
- Redis-backed rate limiting on public endpoints
- HMAC-verified webhooks, session-based admin auth
- Sentry error monitoring wired into both client and server request paths

</td><td width="33%" valign="top">

### ⚡ Performance & quality
- Server Components by default, `next/dynamic` code-splitting on every overlay
- Cmd/Ctrl+K global command-palette search
- Vitest unit suite + k6 load-test harness, both gating CI
- Full admin dashboard for orders, customers, analytics, content

</td></tr>
</table>

<br>

## 🧰 Tech stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Server Components, Turbopack, native `instrumentation-client`/`instrumentation` conventions) |
| **UI** | [React 19](https://react.dev), [TypeScript 5](https://www.typescriptlang.org) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) |
| **Motion** | [Framer Motion](https://www.framer.com/motion/), [Lenis](https://lenis.darkroom.engineering/) smooth scroll |
| **i18n** | [next-intl](https://next-intl.dev) — locale-prefixed routing, RTL, ICU message formatting |
| **Commerce** | Shopify Storefront API, HMAC-verified webhooks |
| **AI** | [Anthropic Claude](https://www.anthropic.com) (`@anthropic-ai/sdk`), ElevenLabs / `msedge-tts` voice |
| **Data & docs** | `pdf-lib` (quotes/invoices), `recharts` (admin analytics) |
| **Email** | [Resend](https://resend.com) |
| **Cache / rate limiting** | Upstash Redis (REST API) |
| **Observability** | [Sentry](https://sentry.io) (`@sentry/nextjs`) — client + server + edge |
| **Analytics** | Google Analytics 4 Data API |
| **Testing** | [Vitest](https://vitest.dev) (unit), [k6](https://k6.io) (load testing) |
| **CI/CD** | GitHub Actions (lint → typecheck → test → build, required on every PR) |
| **Hosting** | [Vercel](https://vercel.com) — Edge/Node runtimes, Cron Jobs |
| **Tooling** | ESLint 9, GitHub CLI-driven PR workflow |

<br>

## 🗺️ Architecture map

```
steinheim-eg/
├── app/
│   ├── [locale]/                # every customer-facing route, locale-prefixed (/en, /ar)
│   │   ├── page.tsx              # homepage
│   │   ├── collections/[series]/ # Joy · Up · Art · Quatro collection pages
│   │   ├── products/[slug]/      # product detail (variants, finishes, 3D viewer)
│   │   ├── trade/                # B2B trade studio entry
│   │   ├── trade/restore/[id]/   # resumable trade project links
│   │   ├── wishlist/             # shared-wishlist landing (?items=... deep link)
│   │   ├── assistant/            # AI concierge full-page experience
│   │   ├── 3d-lab/ · 3d-showcase/# interactive product model viewers
│   │   ├── shop-by-need/         # room-driven product discovery
│   │   ├── trade-admin/          # trade lead management (authenticated)
│   │   └── about · projects · contact · warranty · shipping · returns · privacy
│   ├── admin/                    # full back-office: orders, customers, analytics, content
│   ├── api/
│   │   ├── shopify/               # checkout, live pricing
│   │   ├── webhooks/shopify/      # HMAC-verified inventory sync
│   │   ├── trade/                 # RFQ, leads, quotes, documents, messaging
│   │   ├── admin/                 # authenticated back-office endpoints
│   │   ├── assistant/             # Claude proxy (keys never touch the browser)
│   │   └── cron/daily-digest/     # scheduled trade-lead summary email
│   ├── sitemap.ts · robots.ts     # SEO
│   └── layout.tsx
│
├── components/
│   ├── layout/                   # Navigation, SiteShell (provider composition root), PageTransition
│   ├── product/ · collections/   # ProductCard, collection landing, finish selectors
│   ├── cart/ · wishlist/         # CartContext/Drawer, WishlistContext/Drawer (shareable)
│   ├── catalogue/ · trade/       # trade project board, room calculator, quote flow
│   ├── search/                   # SiteSearch — Cmd/Ctrl+K command palette
│   ├── assistant/                # AI concierge UI
│   ├── three/                    # WebGL/3D product model viewer
│   ├── admin/                    # back-office UI (command palette, tables, charts)
│   └── ui/                       # shared primitives (ScrollReveal, BackToTop, AutoplayVideo…)
│
├── lib/
│   ├── utils.ts · search-index.ts · wishlist.ts   # pure domain logic — unit tested
│   ├── shopify-client.ts · shopify-live-data.ts   # Shopify Storefront API layer
│   ├── trade-project.ts · trade-leads.ts · trade-schedule.ts
│   ├── assistant/                # Claude prompt/rule engine (catalogue-grounded)
│   └── server/                   # Redis client, rate limiting, admin sessions, transactional email
│
├── data/                         # product catalogue, finishes, brand knowledge (source of truth)
├── i18n/                         # next-intl routing, navigation, request config
├── messages/                     # en.json / ar.json — full UI translation trees
├── load-tests/                   # k6 storefront load-test scenario + docs
├── instrumentation.ts            # Sentry server/edge init + onRequestError
├── instrumentation-client.ts     # Sentry browser init
├── vitest.config.ts / *.test.ts  # unit test suite
└── .github/workflows/ci.yml      # lint → typecheck → test → build, required on every PR
```

<br>

## 🏁 Getting started

**Requirements:** Node 20+, npm.

```bash
git clone https://github.com/hakamabudagga77/steinheim-eg.git
cd steinheim-eg
npm install
cp .env.example .env.local   # fill in the keys you need — see below
npm run dev
```

Open [localhost:3000](http://localhost:3000) — you'll land on `/en` (or `/ar`, both fully
supported from the first paint).

### Environment variables

Every integration degrades gracefully without its key — the site runs and demos fine with
an empty `.env.local`. Fill in what you're actually testing:

```bash
# AI concierge (app/[locale]/assistant)
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=

# Error monitoring
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=
SENTRY_ORG=            # optional — only needed for source-map upload
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=

# Shopify commerce
# ...see lib/shopify-client.ts for the full set

# Redis (rate limiting / caching)
# Upstash KV_REST_API_URL / KV_REST_API_TOKEN
```

<br>

## 🧪 Testing & quality gates

Every pull request runs the same four checks CI enforces before anything reaches `main`:

```bash
npm run lint        # ESLint 9, flat config
npm run typecheck    # tsc --noEmit, zero tolerance
npm run test         # Vitest — pure domain logic (wishlist, search, catalogue lookups)
npm run build         # production build must succeed
```

<br>

## 📈 Load testing

A [k6](https://k6.io) scenario simulates real shopper journeys — homepage → collection →
product pages → live pricing — against a running build. Fully read-only; it can't create
real orders, leads, or emails.

```bash
npm run build && npm run start &
BASE_URL=http://localhost:3000 npm run loadtest
```

See [`load-tests/README.md`](load-tests/README.md) for tuning the ramp and pointing it at a
deployed environment safely.

<br>

## 🔐 Security

- **Headers:** CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Permissions-Policy` — see `next.config.ts`.
- **Rate limiting:** Redis-backed, applied to public write endpoints.
- **Webhooks:** Shopify webhooks are HMAC-signature verified before any cache mutation.
- **Admin:** session-based auth, isolated route group, never shares state with the public
  storefront.
- **Observability:** Sentry captures both client exceptions and server request errors —
  wired through Next.js's native `instrumentation.ts` / `instrumentation-client.ts`, not a
  bolted-on script tag.

<br>

## 🌍 Internationalization

English and Arabic are first-class throughout — not a machine-translated afterthought:

- Locale-prefixed routing (`/en/...`, `/ar/...`) via `next-intl`, with a locale-aware
  `Link`/`useRouter` that never produces the classic "stuck on the wrong locale" 404.
- True RTL layout (mirrored flex/grid direction, RTL-aware icons and animation offsets),
  not a CSS `direction` hack.
- ICU plural/format rules in every translation key that needs them.
- Product names, finish names, and shared admin/status labels are deliberately **not**
  translated — they're a shared data layer with the English-only back office, and
  translating them would fork product identity between locales.

<br>

## ☁️ Deployment

Deployed on [Vercel](https://vercel.com) with GitHub Actions as the merge gate:

```
PR opened → lint → typecheck → test → build → Vercel preview deploy → review → merge → production
```

A Vercel Cron Job (`vercel.json`) triggers `/api/cron/daily-digest` every morning to summarize
new trade leads.

<br>

## 🤝 Contributing

Issues and pull requests are welcome. The workflow this project actually follows:

1. Branch off `main`: `feat/…`, `fix/…`, or `chore/…`
2. `npm run lint && npm run typecheck && npm run test && npm run build` — all four, locally,
   before opening a PR
3. Open a PR against `main` — CI runs the same four checks and must pass
4. Squash-friendly, descriptive commit messages (why, not just what)

<br>

## 📜 Open source & licensing

<div align="center">

[![License](https://img.shields.io/badge/Project%20License-MIT-3DA639?style=for-the-badge&labelColor=1A1A1A)](LICENSE)
[![OSI Approved](https://img.shields.io/badge/OSI%20Approved-yes-1A1A1A?style=for-the-badge&color=FFC857&labelColor=1A1A1A)](https://opensource.org/licenses/MIT)
[![FSF Free/Libre](https://img.shields.io/badge/FSF%20Free%2FLibre-yes-1A1A1A?style=for-the-badge&color=22D3EE&labelColor=1A1A1A)](https://www.gnu.org/licenses/license-list.html#Expat)
[![SPDX](https://img.shields.io/badge/SPDX-MIT-1A1A1A?style=for-the-badge&color=F472B6&labelColor=1A1A1A)](https://spdx.org/licenses/MIT.html)

</div>

This project itself is released under the **[MIT License](LICENSE)** — permissive, OSI-approved,
and recognized by the FSF as a free/libre license. See [`LICENSE`](LICENSE) for the full text.

It's also built entirely on trusted, industry-standard open-source licenses. Every core
dependency's license below was verified directly from its published `package.json` — not
assumed:

<div align="center">

[![MIT](https://img.shields.io/badge/MIT-1A1A1A?style=for-the-badge&color=3DA639&labelColor=1A1A1A)](https://opensource.org/licenses/MIT)
[![Apache 2.0](https://img.shields.io/badge/Apache%202.0-1A1A1A?style=for-the-badge&color=D22128&labelColor=1A1A1A)](https://www.apache.org/licenses/LICENSE-2.0)
[![ISC](https://img.shields.io/badge/ISC-1A1A1A?style=for-the-badge&color=339AF0&labelColor=1A1A1A)](https://opensource.org/licenses/ISC)
[![AGPL 3.0](https://img.shields.io/badge/AGPL%203.0-1A1A1A?style=for-the-badge&color=FF8C42&labelColor=1A1A1A)](https://www.gnu.org/licenses/agpl-3.0.en.html)

</div>

| License | Used by | Type |
|---|---|---|
| **MIT** | Next.js, React, Tailwind CSS, Framer Motion, next-intl, Vitest, ESLint, `@sentry/nextjs`, `@anthropic-ai/sdk`, Lenis, `pdf-lib`, Resend, Recharts, `msedge-tts` | Permissive |
| **Apache-2.0** | TypeScript, `@google-analytics/data` | Permissive, patent grant |
| **ISC** | `lucide-react` | Permissive |
| **AGPL-3.0** | [k6](https://k6.io) — external load-testing CLI used in [`load-tests/`](load-tests/), not bundled with the app | Copyleft |

Four distinct license families, all OSI-recognized, none of them viral into this codebase
(the one copyleft tool here — k6 — is invoked as an external CLI against a running build,
never imported into the application).

<br>

## 🙌 Credits & Technical Ownership

<div align="center">

**Engineered End-to-End by [EslaM-X](https://github.com/EslaM-X)**  
**Lead Technical Architect · Top-Tier Cybersecurity & Smart Contract Auditor · Full-Stack Engineer · Web3 / Web5 Architect**

• **Core Architect & Core Team Member** — Pi Network Ecosystem  
• **Core Protocol & Blockchain Engineer** — Stellar Network  
• **Core Ecosystem & Network Developer** — TAU Network  
• **Core Ecosystem Contributor** — Ethereum Protocol & Smart Contracts  

<br>

> **Complete Engineering Ownership:**  
> Architectural design, frontend & backend infrastructure, smart contract security auditing, zero-trust cyber defense, enterprise commerce integration, AI core systems, CI/CD pipelines, and every production line committed to this repository.

<br>

**In collaboration with [hakamabudagga77](https://github.com/hakamabudagga77)**, who directed the product vision, brand design, and creative direction, and worked alongside Claude (Anthropic) throughout via prompt-driven pair programming to help shape this project.

</div>
<br>

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/images/brand/steinheim-logo-white.png">
  <img src="public/images/brand/steinheim-logo-black.png" alt="Steinheim" width="200">
</picture>

<sub>Steinheim Egypt · Premium German Bathroom Fixtures</sub>

<br><br>

<a href="https://github.com/EslaM-X">
  <img src="public/images/brand/eslamx-logo.jpeg" alt="EslaM-X" width="160">
</a>

<sub>**BY [EslaM-X](https://github.com/EslaM-X)**</sub>

</div>
