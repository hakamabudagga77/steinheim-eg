import { test, expect } from "@playwright/test";

// Verifies the PWA surface (merged with the perf gate so one spec run covers
// both the installability contract and the delivery budgets).
test("PWA manifest and service worker are served", async ({ page, request }) => {
  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok(), "manifest should be reachable").toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest.name).toContain("Steinheim");
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

  const swResponse = await request.get("/sw.js");
  expect(swResponse.ok(), "service worker should be served").toBe(true);
  expect(swResponse.headers()["content-type"] ?? "").toContain("javascript");

  // The document must link the manifest for browsers to offer installation.
  await page.goto("/en");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", /manifest/);
});
