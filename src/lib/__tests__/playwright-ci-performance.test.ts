import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const workflowPath = resolve(repoRoot, ".github/workflows/build-and-test.yml");
const configPath = resolve(repoRoot, "playwright.config.ts");
const docsPath = resolve(repoRoot, "docs/testing/playwright-ci.md");

function read(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

function countLines(relativePath: string) {
  return read(relativePath).trimEnd().split("\n").length;
}

describe("Playwright CI performance safeguards", () => {
  it("keeps CI observability lightweight by summarizing the existing Playwright run", () => {
    const workflow = readFileSync(workflowPath, "utf8");
    const config = readFileSync(configPath, "utf8");

    expect(config).toMatch(/\[\s*"json"/);
    expect(workflow).toMatch(/Run Playwright runtime summary/);
    expect(workflow).toMatch(/scripts\/ci\/report-playwright-runtime\.mjs/);
    expect(workflow.match(/npm run test:e2e/g) ?? []).toHaveLength(1);
  });

  it("uses a CI worker setting above the serialized baseline without narrowing suite coverage", () => {
    const workflow = readFileSync(workflowPath, "utf8");
    const config = readFileSync(configPath, "utf8");

    expect(config).toMatch(/PLAYWRIGHT_CI_WORKERS/);
    expect(workflow).toMatch(/PLAYWRIGHT_CI_WORKERS:\s*[2-9]/);
    expect(config).not.toMatch(/workers:\s*process\.env\.CI\s*\?\s*1\b/);
    expect(workflow).toMatch(/run:\s+npm run test:e2e/);
    expect(workflow).not.toMatch(/--grep|--shard/);
    expect(config).toMatch(/resultDir:\s*join\(__dirname,\s*"e2e-coverage"\)/);
  });

  it("keeps cookbook E2E specs balanced enough for deterministic parallel execution", () => {
    expect(countLines("src/e2e/cookbooks-auth.spec.ts")).toBeLessThanOrEqual(320);
    expect(countLines("src/e2e/cookbooks-print.spec.ts")).toBeLessThanOrEqual(320);
  });

  it("documents the rollback path for reverting to serialized CI execution", () => {
    const docs = readFileSync(docsPath, "utf8");

    expect(docs).toContain("PLAYWRIGHT_CI_WORKERS=1");
    expect(docs).toContain("baseline");
    expect(docs).toContain("runtime summary");
    expect(docs).toContain("#277");
  });
});
