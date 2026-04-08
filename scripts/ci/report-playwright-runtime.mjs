import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const reportPath = resolve(
  process.cwd(),
  process.env.PLAYWRIGHT_RUNTIME_REPORT ?? "playwright-report/results.json",
);

if (!existsSync(reportPath)) {
  console.log(
    `Playwright runtime summary skipped: report not found at ${reportPath}.`,
  );
  process.exit(0);
}

const report = JSON.parse(readFileSync(reportPath, "utf8"));

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

const specs = (report.suites ?? []).flatMap((suite) => flattenSuites(suite));

if (specs.length === 0) {
  console.log("Playwright runtime summary skipped: no specs found in report.");
  process.exit(0);
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
const retryingSpecsToPrint = retryingSpecs
  .slice(0, 5);

console.log("Playwright runtime summary");
console.log(`Workers: ${process.env.PLAYWRIGHT_CI_WORKERS ?? "unknown"}`);
console.log(`Specs: ${specs.length}`);
console.log(`Total measured spec time: ${(totalDurationMs / 1000).toFixed(1)}s`);
console.log(`Specs with retries: ${retryingSpecs.length}`);
console.log(`Total retry attempts: ${totalRetries}`);
console.log("Slowest specs:");

for (const spec of slowestSpecs) {
  console.log(
    `- ${spec.path}: ${(spec.durationMs / 1000).toFixed(1)}s (${spec.status}, retries=${spec.retries})`,
  );
}

if (retryingSpecsToPrint.length > 0) {
  console.log("Specs with retries:");
  for (const spec of retryingSpecsToPrint) {
    console.log(
      `- ${spec.path}: retries=${spec.retries}, duration ${(spec.durationMs / 1000).toFixed(1)}s`,
    );
  }
}
