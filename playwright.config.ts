import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

// E2E runs against `next dev` so the lead stores use their local-file fallback
// (no Redis needed) and the admin login works against the test credentials
// injected below — covering the commerce-critical flows end to end without any
// external service (Shopify, GA4, Redis, Resend all degrade gracefully).
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  // Generous timeouts: the suite runs against `next dev`, where the first hit
  // to a route compiles it on demand (cold routes can take 20s+ on a CI
  // runner). These absorb that so tests gate on behaviour, not compile latency.
  timeout: 90_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: `${BASE_URL}/en`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ADMIN_EMAIL: "e2e-admin@steinheim.test",
      ADMIN_PASSWORD: "e2e-secret-password-123",
      SESSION_SECRET: "e2e-session-secret-e2e-session-secret-32",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
