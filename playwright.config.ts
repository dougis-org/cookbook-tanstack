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
    timeout: 60000,
    // Pipe stdout/stderr in CI for debugging server startup issues; 60s timeout fails fast if server doesn't respond
    stdout: process.env.CI ? 'pipe' : 'ignore',
    stderr: process.env.CI ? 'pipe' : 'ignore',
  },
});
