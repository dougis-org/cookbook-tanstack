import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    // In CI the production build is already available (built in a prior step).
    // Using the Nitro production server eliminates Vite's lazy module compilation,
    // which can take >30 s per route on a cold cache and causes test timeouts.
    command: process.env.CI
      ? "PORT=3000 node .output/server/index.mjs"
      : "npm run dev -- --mode test",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
