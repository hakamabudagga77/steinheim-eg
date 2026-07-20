import { test, expect } from "@playwright/test";

// These match the credentials injected by playwright.config.ts's webServer.env.
const EMAIL = "e2e-admin@steinheim.test";
const PASSWORD = "e2e-secret-password-123";

// Each test uses a distinct x-forwarded-for so the IP-keyed login rate limiter
// gives it its own bucket (no cross-test bleed).
test.describe("admin login", () => {
  test("rejects wrong credentials with an error message", async ({ browser }) => {
    const context = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": "10.10.0.1" } });
    const page = await context.newPage();
    await page.goto("/admin/login");

    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill("definitely-wrong");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/incorrect email or password/i)).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login/);
    await context.close();
  });

  test("rate-limits repeated failed attempts with a 429", async ({ browser }) => {
    const context = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": "10.10.0.2" } });
    let lastStatus = 200;
    for (let i = 0; i < 12; i++) {
      const res = await context.request.post("/api/admin/login", {
        data: { email: EMAIL, password: "wrong" },
      });
      lastStatus = res.status();
    }
    expect(lastStatus).toBe(429);
    await context.close();
  });

  test("accepts correct credentials and lands on the dashboard", async ({ browser }) => {
    const context = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": "10.10.0.3" } });
    const page = await context.newPage();
    await page.goto("/admin/login");

    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await context.close();
  });
});
