# Steinheim Egypt — Dependency Upgrade Notes

This file records **intentionally deferred** dependency upgrades: what we tried, why
it is on hold, and the exact condition + commands to revisit it. If you open a
Dependabot PR for one of these and it fails CI, read the matching section first —
the failure is expected and upstream, not a regression in our code.

Legend: `[BLOCKED]` cannot adopt yet (upstream) · `[READY]` our code is compatible, only tooling lags.

---

## Deferred majors — snapshot (as of 2026-08-01)

| Package      | Current (works) | Target | Status              | Blocked by (upstream)                                  |
| ------------ | --------------- | ------ | ------------------- | ------------------------------------------------------ |
| `typescript` | `^5` (5.9.3)    | `7.0.x`| `[BLOCKED]` `[READY]`| `typescript-eslint` peer `typescript "<6.1.0"`         |
| `eslint`     | `^9`            | `10.x` | `[BLOCKED]`         | `eslint-plugin-react` peer `eslint "^9.7"` (no v10)     |

Both blockers live **inside `eslint-config-next`** (Next.js's own official lint preset,
pinned to the Next version — currently `16.3.0`). They are **not** in our source code.
Related Dependabot PRs, closed for this reason: **#40** (TypeScript 7) and **#63** (ESLint 10).

---

## 1. TypeScript 5 → 7  `[BLOCKED]` `[READY]`

**Our code is already TS-7-clean.** Verified directly:

```bash
npm install -D typescript@7.0.2
npm run typecheck          # tsc --noEmit  →  0 errors
```

The new native (Go) `tsc` compiles the whole project with **zero type errors** and no
source changes. The upgrade is a pure version bump waiting on tooling.

**The blocker is the lint step, not the compiler.** With TS 7 installed, `npm run lint` fails:

```
typescript-eslint does not support TS 7.0
```

`eslint-config-next@16.2.12` bundles `typescript-eslint ^8.46.0`. The latest
`typescript-eslint` (8.65.0) still declares:

```jsonc
"peerDependencies": { "typescript": ">=4.8.4 <6.1.0" }   // caps below TS 6.1 — nowhere near 7
```

So no released `typescript-eslint` accepts TS 7 yet.

**Links**
- typescript-eslint TS ≥7 support tracker: https://github.com/typescript-eslint/typescript-eslint/issues/10940
- TS 7 side-by-side guidance (what the error points to): https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0

**Unblock condition:** `typescript-eslint` ships a release whose `typescript` peer
allows `>=7`, **and** `eslint-config-next` bumps to it. Then: bump `typescript` to `^7`,
run the full check suite (below), open the PR. **No source changes are expected.**

---

## 2. ESLint 9 → 10  `[BLOCKED]`

With `eslint@10` installed (`eslint-config-next@16.2.12`, TypeScript back on `5`),
`npm run lint` crashes at rule load time:

```
TypeError: Error while loading rule 'react/display-name':
contextOrFilename.getFilename is not a function
  at .../eslint-config-next/node_modules/eslint-plugin-react/lib/util/version.js
```

ESLint 10 removed the legacy `context.getFilename()` API (now `context.filename`).
`eslint-config-next@16.2.12` bundles `eslint-plugin-react ^7.37.0`, and the latest
`eslint-plugin-react` (7.37.5) still declares:

```jsonc
"peerDependencies": { "eslint": "^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9.7" }   // caps at 9.7 — no v10
```

Note: `typescript-eslint` **already** lists `eslint "^10.0.0"` in its peer range, so
`eslint-plugin-react` is the **sole** remaining ESLint-10 blocker in the preset.

**Links**
- eslint-plugin-react: https://github.com/jsx-eslint/eslint-plugin-react
- ESLint 10 migration (removed `context.getFilename()` etc.): https://eslint.org/docs/latest/use/migrate-to-10.0.0

**Unblock condition:** `eslint-plugin-react` ships a release supporting ESLint 10,
**and** `eslint-config-next` bumps to it. Then: bump `eslint` to `^10`, run the full
check suite (below), open the PR.

---

## 3. Next.js `16.2.12` → `16.3.0`  `[DONE 2026-08-06]`

The deliberate hold on bumping Next past `16.2.12` is lifted. The stable
`16.3.0` train (Next, `eslint-config-next`, `@next/bundle-analyzer`) was
adopted on 2026-08-06 with lint / typecheck / 226 unit tests / production
build / e2e perf+PWA all green, after the two leftover framework example
routes (`sentry-example-page`, `sentry-example-api`) were removed.

This does **not** change the two blockers above: `eslint-config-next@16.3.0`
bundles the **identical** plugin versions (`typescript-eslint ^8.46.0`,
`eslint-plugin-react ^7.37.0`), so TypeScript 7 and ESLint 10 remain deferred
on upstream plugin releases — see sections 1 and 2.

---

## Why we don't force it now

Adopting either major today would mean either shipping a **red CI pipeline** (lint/build
fail) or **disabling the type-aware lint rules** that catch real bugs — both are a net
regression for a live production store. "Best possible" here is the honest call: keep the
stable, green stack (`eslint@9` + `typescript@5`, both pass) and adopt the majors the day
the Next.js preset supports them. Our diligence already proved the code side is ready.

The fix must land in the upstream plugins first, then flow into a stable
`eslint-config-next`.

---

## How to re-check (revisit procedure)

Run these read-only registry checks periodically (or when a new stable Next ships).
No install required:

```bash
# 1. Has eslint-plugin-react shipped ESLint 10 support?  (want: peer eslint includes ^10)
npm view eslint-plugin-react@latest peerDependencies

# 2. Has typescript-eslint shipped TS 7 support?  (want: peer typescript allows >=7)
npm view typescript-eslint@latest peerDependencies

# 3. Has eslint-config-next bumped its bundled plugins?  (compare to ^8.46.0 / ^7.37.0)
npm view eslint-config-next@latest dependencies

# 4. Is there a newer STABLE Next?  (16.3.0 adopted 2026-08-06 — see section 3)
npm view next dist-tags
```

When both (1) and (2) clear **and** a stable `eslint-config-next` carries the fixed
plugins, do the upgrade for real:

```bash
git switch -c agent/deps-major-eslint-ts    # commit under EslaM-X
npm install -D typescript@^7 eslint@^10      # + matching eslint-config-next if bumped
npm run lint && npm run typecheck && npm test && npm run build && npm run e2e
```

All five must pass before opening the PR. Do TypeScript and ESLint as **separate commits**
so each can be verified / reverted independently.

---

_Last verified: 2026-08-06 — Next 16.3.0 adopted (lint/typecheck/tests/build/e2e green).
TS 7.0.2 typecheck clean (0 errors), still blocked by `typescript-eslint`; ESLint 10.8.0
still blocked by `eslint-plugin-react`._
