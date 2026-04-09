import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

function flattenSuites(suite, parents = []) {
  if (suite === null || typeof suite !== "object" || Array.isArray(suite)) {
    return [];
  }

  const suiteTitle =
    typeof suite.title === "string" && suite.title.length > 0
      ? [...parents, suite.title]
      : parents;
  const specs = (Array.isArray(suite.specs) ? suite.specs : []).flatMap((spec) => {
    if (spec === null || typeof spec !== "object" || Array.isArray(spec)) {
      return [];
    }

    const tests = Array.isArray(spec.tests) ? spec.tests : [];
    const results = tests.flatMap((test) =>
      test !== null && typeof test === "object" && !Array.isArray(test) && Array.isArray(test.results)
        ? test.results
        : [],
    );
    const durationMs = results.reduce(
      (total, result) => total + (result.duration ?? 0),
      0,
    );
    const retries = tests.reduce((total, test) => {
      if (test === null || typeof test !== "object" || Array.isArray(test)) {
        return total;
      }
      const retryCount = Math.max(
        0,
        ...(Array.isArray(test.results) ? test.results : []).map((result) =>
          result !== null && typeof result === "object" && !Array.isArray(result)
            ? result.retry ?? 0
            : 0,
        ),
      );
      return total + retryCount;
    }, 0);
    const status =
      [...results].reverse().find((result) => result.status)?.status ??
      "unknown";
    const path = [...suiteTitle, typeof spec.title === "string" ? spec.title : ""]
      .filter(Boolean)
      .join(" > ");

    return [{
      path,
      durationMs,
      retries,
      status,
    }];
  });

  return [
    ...specs,
    ...(Array.isArray(suite.suites) ? suite.suites : []).flatMap((child) =>
      flattenSuites(child, suiteTitle),
    ),
  ];
}

export function summarizePlaywrightReport(report) {
  if (report === null || typeof report !== "object" || Array.isArray(report)) {
    return null;
  }

  const specs = (Array.isArray(report.suites) ? report.suites : []).flatMap((suite) =>
    flattenSuites(suite),
  );
  if (specs.length === 0) {
    return null;
  }

  const totalDurationMs = specs.reduce((total, spec) => total + spec.durationMs, 0);
  const totalRetries = specs.reduce((total, spec) => total + spec.retries, 0);
  const slowestSpecs = [...specs]
    .sort((left, right) => right.durationMs - left.durationMs)
    .slice(0, 5);
  const retryingSpecs = specs
    .filter((spec) => spec.retries > 0)
    .sort(
      (left, right) =>
        right.retries - left.retries || right.durationMs - left.durationMs,
    );

  return {
    specs,
    totalDurationMs,
    totalRetries,
    slowestSpecs,
    retryingSpecCount: retryingSpecs.length,
    retryingSpecs: retryingSpecs.slice(0, 5),
  };
}

export function renderPlaywrightRuntimeSummary(summary, workers) {
  const lines = [
    "Playwright runtime summary",
    `Workers: ${workers ?? "unknown"}`,
    `Specs: ${summary.specs.length}`,
    `Total measured spec time: ${(summary.totalDurationMs / 1000).toFixed(1)}s`,
    `Specs with retries: ${summary.retryingSpecCount}`,
    `Total retry attempts: ${summary.totalRetries}`,
    "Slowest specs:",
    ...summary.slowestSpecs.map(
      (spec) =>
        `- ${spec.path}: ${(spec.durationMs / 1000).toFixed(1)}s (${spec.status}, retries=${spec.retries})`,
    ),
  ];

  if (summary.retryingSpecs.length > 0) {
    lines.push("Specs with retries:");
    lines.push(
      ...summary.retryingSpecs.map(
        (spec) =>
          `- ${spec.path}: retries=${spec.retries}, duration ${(spec.durationMs / 1000).toFixed(1)}s`,
      ),
    );
  }

  return lines;
}

export function runPlaywrightRuntimeSummary({
  reportPath = resolve(
    process.cwd(),
    process.env.PLAYWRIGHT_RUNTIME_REPORT ?? "playwright-report/results.json",
  ),
  workers = process.env.PLAYWRIGHT_CI_WORKERS,
  log = console.log,
} = {}) {
  if (!existsSync(reportPath)) {
    const lines = [
      `Playwright runtime summary skipped: report not found at ${reportPath}.`,
    ];
    lines.forEach((line) => log(line));
    return { status: "skipped", lines };
  }

  let report;
  try {
    const reportContents = readFileSync(reportPath, "utf8");
    report = JSON.parse(reportContents);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const lines = [
      `Playwright runtime summary skipped: failed to read or parse report at ${reportPath}: ${message}`,
    ];
    lines.forEach((line) => log(line));
    return { status: "skipped", lines };
  }

  let summary;
  try {
    summary = summarizePlaywrightReport(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const lines = [
      `Playwright runtime summary skipped: failed to summarize report at ${reportPath}: ${message}`,
    ];
    lines.forEach((line) => log(line));
    return { status: "skipped", lines };
  }

  if (!summary) {
    const lines = [
      `Playwright runtime summary skipped: unexpected report format at ${reportPath}.`,
    ];
    lines.forEach((line) => log(line));
    return { status: "skipped", lines };
  }

  let lines;
  try {
    lines = renderPlaywrightRuntimeSummary(summary, workers);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const fallbackLines = [
      `Playwright runtime summary skipped: failed to render report at ${reportPath}: ${message}`,
    ];
    fallbackLines.forEach((line) => log(line));
    return { status: "skipped", lines: fallbackLines };
  }
  lines.forEach((line) => log(line));
  return { status: "ok", lines };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runPlaywrightRuntimeSummary();
}
