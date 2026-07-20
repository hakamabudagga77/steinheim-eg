import { test, expect } from "@playwright/test";

// Regression guard for the language-switcher bug that produced /en/ar 404s:
// switching must land on the sibling locale path (/ar), render RTL, and show
// real content — never a nested-locale 404.
test("language switcher toggles EN <-> AR with correct RTL and no 404", async ({ page }) => {
  await page.goto("/en");

  const toEnAr = page.getByRole("link", { name: /egypt \/ en/i });
  await expect(toEnAr).toBeVisible();
  await toEnAr.click();

  await expect(page).toHaveURL(/\/ar(\/|$)/);
  await expect(page).not.toHaveURL(/\/en\/ar/); // the exact bug shape
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("link", { name: "Steinheim home" })).toBeVisible();

  // And back to English.
  const toArEn = page.getByRole("link", { name: /egypt \/ ar/i });
  await expect(toArEn).toBeVisible();
  await toArEn.click();

  await expect(page).toHaveURL(/\/en(\/|$)/);
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
});
