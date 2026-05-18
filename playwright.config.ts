import { defineConfig, devices, type ReporterDescription } from "@playwright/test";
import { defineCoverageReporterConfig } from "@bgotink/playwright-coverage";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultWorkerCount = 2;
const configuredWorkers = Number.parseInt(
  process.env.PLAYWRIGHT_WORKERS ??
    process.env.PLAYWRIGHT_CI_WORKERS ??
    `${defaultWorkerCount}`,
  10,
);
const workerCount =
  Number.isFinite(configuredWorkers) && configuredWorkers > 0
    ? configuredWorkers
    : defaultWorkerCount;
const appPort = process.env.APP_PORT ?? "3000";
const appUrl = `http://localhost:${appPort}`;
const runtimeReportOutput = join(
  __dirname,
  process.env.PLAYWRIGHT_RUNTIME_REPORT ?? "playwright-report/results.json",
);
const reporter: ReporterDescription[] = [
  ["html"],
  [
    "@bgotink/playwright-coverage",
    defineCoverageReporterConfig({
      sourceRoot: __dirname,
      resultDir: join(__dirname, "e2e-coverage"),
      reports: [["lcovonly", { file: "lcov.info" }]],
      }),
    ],
];

if (process.env.CI) {
  reporter.push(["json", { outputFile: runtimeReportOutput }]);
}

export default defineConfig({
  testDir: "./src/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: workerCount,
  reporter,
  use: {
    baseURL: appUrl,
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
      ? `PORT=${appPort} node .output/server/index.mjs`
      : `npm run dev -- --mode test --port ${appPort}`,
    url: appUrl,
    reuseExistingServer: true,
    // Nitro production server lazy-loads the SSR bundle (~2.5 MB mongoose+auth) on first
    // request. The health-check URL responds before that load completes, so Playwright can
    // start before the server is fully ready. 120 s provides headroom for cold CI runners;
    // passing runs typically reach readiness in ~10-15 s.
    timeout: 120000,
    // Pipe stdout/stderr in CI for debugging server startup issues
    stdout: process.env.CI ? 'pipe' : 'ignore',
    stderr: process.env.CI ? 'pipe' : 'ignore',
  },
});
