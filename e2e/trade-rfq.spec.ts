import { test, expect } from "@playwright/test";

// The trade RFQ starts with the multi-step room-calculator wizard on the trade
// page: choose a persona, enter contact details, compose the property's rooms,
// then move on to assigning products. This drives that flow end to end.
test("trade RFQ wizard: persona -> contact -> rooms -> product assignment", async ({ page }) => {
  await page.goto("/en/trade");

  const calc = page.locator("#smart-room-calculator");
  await calc.scrollIntoViewIfNeeded();

  // Step 1 — pick a persona and fill the required contact fields.
  await calc.getByRole("button", { name: /villa \/ private project/i }).click();
  await calc.getByPlaceholder(/your name/i).fill("E2E Architect");
  await calc.getByPlaceholder(/email/i).fill("architect@example.com");
  await calc.getByPlaceholder(/business or project name/i).fill("E2E Villa Project");
  await calc.getByRole("button", { name: /^continue$/i }).click();

  // Step 2 — quick-fill a room preset, then advance to product assignment.
  await calc.getByRole("button", { name: /quick fill: villa/i }).click();
  const toAssign = calc.getByRole("button", { name: /continue.*assign products/i });
  await expect(toAssign).toBeVisible();
  await toAssign.click();

  // Step 3 — the "what's needed" / product-assignment step is reached.
  await expect(calc.getByText(/what's needed/i)).toBeVisible();
});
