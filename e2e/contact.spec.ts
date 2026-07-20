import { test, expect } from "@playwright/test";

// Lead submission end to end. Against `next dev` the contact store uses its
// local-file fallback (no Redis), so this exercises the real submit path.
test("contact form submits and shows the confirmation", async ({ page }) => {
  await page.goto("/en/contact");

  await page.locator('input[name="name"]').fill("E2E Tester");
  await page.locator('input[name="email"]').fill("e2e@example.com");
  await page
    .locator('textarea[name="message"]')
    .fill("Automated end-to-end test enquiry — please ignore.");

  await page.getByRole("button", { name: /send message/i }).click();

  await expect(page.getByText(/message received/i)).toBeVisible();
});
