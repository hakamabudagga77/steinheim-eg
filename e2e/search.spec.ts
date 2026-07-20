import { test, expect } from "@playwright/test";

// The Cmd/Ctrl+K command palette is client-side (indexes static catalogue
// data) — no backend needed.
test("Cmd+K search finds a product and navigates to it", async ({ page }) => {
  await page.goto("/en");
  await page.waitForLoadState("networkidle");

  const input = page.getByPlaceholder(/search products/i);

  // The global Cmd/Ctrl+K listener attaches on hydration; on a cold CI runner
  // the first keypress can land just before that. Retry the shortcut until the
  // palette actually opens (a no-op keypress is simply ignored, not buffered).
  await expect(async () => {
    await page.keyboard.press("Control+k");
    await expect(input).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 20000 });

  await input.fill("joy basin");

  const firstResult = page.getByRole("button", { name: /basin mixer/i }).first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Selecting a result navigates and closes the overlay (no stuck backdrop).
  await expect(page).toHaveURL(/\/en\/products\//);
  await expect(input).toBeHidden();
});
