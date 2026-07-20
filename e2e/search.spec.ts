import { test, expect } from "@playwright/test";

// The Cmd/Ctrl+K command palette is client-side (indexes static catalogue
// data) — no backend needed.
test("Cmd+K search finds a product and navigates to it", async ({ page }) => {
  await page.goto("/en");

  await page.keyboard.press("Control+k");

  const input = page.getByPlaceholder(/search products/i);
  await expect(input).toBeVisible();

  await input.fill("joy basin");

  const firstResult = page.getByRole("button", { name: /basin mixer/i }).first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Selecting a result navigates and closes the overlay (no stuck backdrop).
  await expect(page).toHaveURL(/\/en\/products\//);
  await expect(input).toBeHidden();
});
