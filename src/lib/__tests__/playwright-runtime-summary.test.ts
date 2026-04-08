import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, vi } from "vitest";

async function loadRuntimeSummaryModule() {
  const modulePath = "../../../scripts/ci/report-playwright-runtime.mjs";
  return import(modulePath) as Promise<{
    renderPlaywrightRuntimeSummary: (
      summary: {
        specs: unknown[];
        totalDurationMs: number;
        totalRetries: number;
        slowestSpecs: Array<{
          path: string;
          durationMs: number;
          retries: number;
          status: string;
        }>;
        retryingSpecs: Array<{
          path: string;
          durationMs: number;
          retries: number;
          status: string;
        }>;
      },
      workers: string,
    ) => string[];
    runPlaywrightRuntimeSummary: (args: {
      reportPath: string;
      log: (line: string) => void;
    }) => { status: string; lines: string[] };
    summarizePlaywrightReport: (report: unknown) => {
      specs: unknown[];
      totalDurationMs: number;
      totalRetries: number;
      slowestSpecs: Array<{
        path: string;
        durationMs: number;
        retries: number;
        status: string;
      }>;
      retryingSpecs: Array<{
        path: string;
        durationMs: number;
        retries: number;
        status: string;
      }>;
    } | null;
  }>;
}

describe("playwright runtime summary", () => {
  it("summarizes a valid Playwright JSON report", async () => {
    const { renderPlaywrightRuntimeSummary, summarizePlaywrightReport } =
      await loadRuntimeSummaryModule();
    const summary = summarizePlaywrightReport({
      suites: [
        {
          title: "chromium",
          specs: [
            {
              title: "dark theme",
              tests: [
                {
                  results: [
                    { status: "passed", duration: 1200, retry: 0 },
                    { status: "passed", duration: 300, retry: 1 },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    expect(summary).not.toBeNull();
    expect(summary?.specs).toHaveLength(1);

    if (!summary) {
      throw new Error("Expected a valid runtime summary");
    }

    const lines = renderPlaywrightRuntimeSummary(summary, "2");
    expect(lines).toContain("Playwright runtime summary");
    expect(lines).toContain("Workers: 2");
    expect(lines).toContain("Specs: 1");
    expect(lines).toContain("Total retry attempts: 1");
    expect(lines.some((line: string) => line.includes("chromium > dark theme"))).toBe(
      true,
    );
  });

  it("skips invalid JSON reports without throwing", async () => {
    const { runPlaywrightRuntimeSummary } = await loadRuntimeSummaryModule();
    const tempDir = mkdtempSync(join(tmpdir(), "playwright-runtime-summary-"));
    const reportPath = join(tempDir, "invalid.json");
    writeFileSync(reportPath, "{not-json");

    const log = vi.fn();
    const result = runPlaywrightRuntimeSummary({ reportPath, log });

    expect(result.status).toBe("skipped");
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("failed to read or parse report"),
    );
  });

  it("skips unexpected report shapes", async () => {
    const { summarizePlaywrightReport } = await loadRuntimeSummaryModule();
    expect(summarizePlaywrightReport({ suites: [] })).toBeNull();
  });
});
