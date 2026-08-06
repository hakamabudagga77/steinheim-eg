import { test, expect, type Page } from "@playwright/test";

// Performance budget gate. Each key route must paint its LCP inside a budget
// after a warm-up pass (so `next dev` route compilation is not measured).
// Generous bounds keep the gate CI-stable, but they still fail loudly on a
// real regression — a heavy blocking script, a re-enlarged hero asset, or a
// lost `preload` all blow past these numbers.
const ROUTES: Array<{ path: string; budgetMs: number }> = [
  { path: "/en", budgetMs: 4500 },
  { path: "/en/collections", budgetMs: 5000 },
  { path: "/en/products/joy-basin-mixer", budgetMs: 5000 },
];

async function measureLargestContentfulPaint(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let best = 0;
        try {
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as PerformanceEntry[]) {
              if (entry.startTime > best) best = entry.startTime;
            }
            resolve(best);
          }).observe({ type: "largest-contentful-paint", buffered: true });
        } catch {
          // A browser without LCP support fails the budget below via best === 0.
        }
        // Guard so the assertion never hangs; resolving with 0 fails the gate.
        window.setTimeout(() => resolve(best), 15_000);
      })
  );
}

for (const route of ROUTES) {
  test(`perf budget: ${route.path} LCP < ${route.budgetMs}ms`, async ({ page }) => {
    // Warm pass: first hit compiles the route under `next dev`.
    const warm = await page.goto(route.path, { waitUntil: "domcontentloaded" });
    expect(warm?.status(), `${route.path} should return 200`).toBe(200);
    await page.waitForLoadState("load");

    // Measured pass on a reload, so compile latency is outside the budget.
    await page.goto(route.path, { waitUntil: "domcontentloaded" });
    const lcpMs = await measureLargestContentfulPaint(page);

    expect(lcpMs, `LCP for ${route.path}`).toBeGreaterThan(0);
    expect(lcpMs, `LCP budget for ${route.path}`).toBeLessThan(route.budgetMs);
  });
}
