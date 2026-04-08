import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

function flattenSuites(suite, parents = []) {
  const suiteTitle = suite.title ? [...parents, suite.title] : parents;
  const specs = (suite.specs ?? []).map((spec) => {
    const tests = spec.tests ?? [];
    const results = tests.flatMap((test) => test.results ?? []);
    const durationMs = results.reduce(
      (total, result) => total + (result.duration ?? 0),
      0,
    );
    const retries = tests.reduce((total, test) => {
      const retryCount = Math.max(
        0,
        ...(test.results ?? []).map((result) => result.retry ?? 0),
      );
      return total + retryCount;
    }, 0);
    const status =
      [...results].reverse().find((result) => result.status)?.status ??
      "unknown";
    const path = [...suiteTitle, spec.title].filter(Boolean).join(" > ");

    return {
      path,
      durationMs,
      retries,
      status,
    };
  });

  return [
    ...specs,
    ...(suite.suites ?? []).flatMap((child) => flattenSuites(child, suiteTitle)),
  ];
}

export function summarizePlaywrightReport(report) {
  if (report === null || typeof report !== "object" || Array.isArray(report)) {
    return null;
  }

  const specs = (report.suites ?? []).flatMap((suite) => flattenSuites(suite));
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
    )
    .slice(0, 5);

  return {
    specs,
    totalDurationMs,
    totalRetries,
    slowestSpecs,
    retryingSpecs,
  };
}

export function renderPlaywrightRuntimeSummary(summary, workers) {
  const lines = [
    "Playwright runtime summary",
    `Workers: ${workers ?? "unknown"}`,
    `Specs: ${summary.specs.length}`,
    `Total measured spec time: ${(summary.totalDurationMs / 1000).toFixed(1)}s`,
    `Specs with retries: ${summary.retryingSpecs.length}`,
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

  const summary = summarizePlaywrightReport(report);
  if (!summary) {
    const lines = [
      `Playwright runtime summary skipped: unexpected report format at ${reportPath}.`,
    ];
    lines.forEach((line) => log(line));
    return { status: "skipped", lines };
  }

  const lines = renderPlaywrightRuntimeSummary(summary, workers);
  lines.forEach((line) => log(line));
  return { status: "ok", lines };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runPlaywrightRuntimeSummary();
}
