import { defineConfig, devices } from "@playwright/test";

/**
 * Visual-QA Konfiguration fuer den Shop NetImpulsemarketing.
 *
 * Die myshopify-Adresse leitet auf netimpulsemarketing.de weiter; der
 * Parameter preview_theme_id bleibt dabei erhalten. Getestet wird also
 * immer das Test-Theme aus tests/fixtures.ts, nie das Live-Theme.
 */
export default defineConfig({
  testDir: "./tests",
  testIgnore: ["**/global-setup.ts", "**/fixtures.ts"],
  timeout: 30_000,
  retries: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./tests/global-setup.ts",
  use: {
    baseURL: "https://a50c23-ed.myshopify.com",
    storageState: "playwright/.auth/storefront.json",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile",  use: { ...devices["iPhone 13"] } },
  ],
});
