import { test, expect } from "@playwright/test";

// Cart is fully client-side (localStorage-backed) — no Shopify needed for the
// add/persist/remove flow; checkout only hands off to a Shopify URL, which we
// don't follow here.
test.describe("cart", () => {
  test("add a product, see it in the drawer, and it persists across reload", async ({ page }) => {
    await page.goto("/en/collections/joy");

    // Quick-add the first product on the collection grid.
    const quickAdd = page.getByRole("button", { name: /quick add/i }).first();
    await expect(quickAdd).toBeVisible();
    await quickAdd.click();

    // The cart drawer opens with one item.
    const drawer = page.locator("aside").filter({ hasText: /your cart/i });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText(/1 item/i)).toBeVisible();

    // The cart is written to localStorage by a deferred effect — wait for that
    // before reloading so the reload can't race the write.
    await expect
      .poll(() =>
        page.evaluate(() => {
          try {
            return JSON.parse(localStorage.getItem("steinheim-cart-v1") || '{"items":[]}').items.length;
          } catch {
            return 0;
          }
        })
      )
      .toBeGreaterThan(0);

    // It survives a reload (localStorage persistence).
    await page.reload();
    await page.getByRole("button", { name: "Cart" }).click();
    const drawerAfter = page.locator("aside").filter({ hasText: /your cart/i });
    await expect(drawerAfter).toBeVisible();
    await expect(drawerAfter.getByText(/1 item/i)).toBeVisible();
  });

  test("removing the only item empties the cart", async ({ page }) => {
    await page.goto("/en/collections/joy");
    await page.getByRole("button", { name: /quick add/i }).first().click();

    const drawer = page.locator("aside").filter({ hasText: /your cart/i });
    await expect(drawer).toBeVisible();

    // Remove the line item (the small X control on the row).
    await drawer.getByRole("button", { name: /remove/i }).first().click();

    await expect(drawer.getByRole("heading", { name: /your cart is empty/i })).toBeVisible();
  });
});
