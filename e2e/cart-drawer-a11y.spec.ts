import { test, expect } from "@playwright/test";

// The cart and wishlist drawers share the same Modal primitive
// (components/ui/Modal.tsx), so exercising the cart drawer's dialog contract
// covers the mechanism both drawers rely on: a labelled dialog role, focus
// moving into the panel on open, and Escape closing it.
test.describe("cart drawer accessibility", () => {
  async function openCartDrawer(page: import("@playwright/test").Page) {
    await page.goto("/en/collections/joy");
    await page.getByRole("button", { name: /quick add/i }).first().click();
    const dialog = page.getByRole("dialog", { name: /your cart/i });
    await expect(dialog).toBeVisible();
    return dialog;
  }

  test("exposes a labelled dialog and moves focus into it on open", async ({ page }) => {
    await openCartDrawer(page);

    // aria-modal is set on the same element that carries the dialog role.
    const dialog = page.getByRole("dialog", { name: /your cart/i });
    await expect(dialog).toHaveAttribute("aria-modal", "true");

    // Focus is moved inside the drawer (the Modal focuses the first control),
    // rather than being left on the trigger behind the backdrop.
    await expect
      .poll(() =>
        page.evaluate(() => {
          const dlg = document.querySelector('[role="dialog"]');
          return !!dlg && dlg.contains(document.activeElement);
        })
      )
      .toBe(true);
  });

  test("closes when Escape is pressed", async ({ page }) => {
    const dialog = await openCartDrawer(page);

    await page.keyboard.press("Escape");

    await expect(dialog).toBeHidden();
  });

  test("closes when the backdrop is clicked", async ({ page }) => {
    const dialog = await openCartDrawer(page);

    // Click the top-left corner — always backdrop, never the right-aligned panel.
    await page.mouse.click(8, 8);

    await expect(dialog).toBeHidden();
  });
});
