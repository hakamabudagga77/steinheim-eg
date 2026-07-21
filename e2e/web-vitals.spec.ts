import { test, expect } from "@playwright/test";

// The WebVitals component reports Core Web Vitals to GA4 via window.gtag.
// GA isn't configured in this environment, so stub gtag before the page loads
// (the reporter silently no-ops when gtag is absent) and assert real metric
// events flow through with the GA4-required shape.
test("web vitals are reported through gtag", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __vitalsEvents: unknown[][]; gtag: (...args: unknown[]) => void };
    w.__vitalsEvents = [];
    w.gtag = (...args: unknown[]) => w.__vitalsEvents.push(args);
  });

  await page.goto("/en");
  await page.waitForLoadState("networkidle");

  // TTFB/FCP report shortly after hydration; nudge the page so INP/CLS have
  // something to observe too.
  await page.mouse.click(200, 200);

  await expect
    .poll(
      () =>
        page.evaluate(() => (window as unknown as { __vitalsEvents: unknown[][] }).__vitalsEvents.length),
      { timeout: 20_000 }
    )
    .toBeGreaterThan(0);

  const events = await page.evaluate(
    () => (window as unknown as { __vitalsEvents: [string, string, Record<string, unknown>][] }).__vitalsEvents
  );
  const names = events.map(([, name]) => name);
  // Every event is a known vital with the GA4-required integer value + id label.
  for (const [command, name, params] of events) {
    expect(command).toBe("event");
    expect(["TTFB", "FCP", "LCP", "CLS", "INP", "FID"]).toContain(name);
    expect(Number.isInteger(params.value)).toBe(true);
    expect(typeof params.event_label).toBe("string");
  }
  expect(names.length).toBeGreaterThan(0);
});
