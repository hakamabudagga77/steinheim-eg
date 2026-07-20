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

    // It survives a reload (localStorage persistence).
    await page.reload();
    const cartButton = page.getByRole("button", { name: "Cart" });
    await cartButton.click();
    await expect(page.locator("aside").filter({ hasText: /your cart/i })).toBeVisible();
    await expect(page.getByText(/1 item/i)).toBeVisible();
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
