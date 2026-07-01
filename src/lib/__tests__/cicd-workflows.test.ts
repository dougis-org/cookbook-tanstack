import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

describe("CI/CD Centralized Workflows", () => {
  it("Build-and-test workflow provides 'codacy-username' and 'codacy-project-name' to coverage steps", () => {
    const path = resolve(repoRoot, ".github/workflows/build-and-test.yml");
    const workflow = readFileSync(path, "utf8");

    // Verify all occurrences of the codacy-reporter action include the project name and username
    const reporterSteps = workflow.split("uses: dougis-org/cicd-tooling/.github/actions/codacy-reporter");
    // The first segment doesn't contain step parameters, subsequent ones do
    expect(reporterSteps.length).toBeGreaterThan(1);
    
    for (let i = 1; i < reporterSteps.length; i++) {
      // Split by newline and take the next 10 lines to be independent of double-newline formatting
      const stepConfig = reporterSteps[i].split("\n").slice(0, 10).join("\n");
      expect(stepConfig).toMatch(/^@main/);
      expect(stepConfig).toMatch(/codacy-username:\s*dougis-org/);
      expect(stepConfig).toMatch(/codacy-project-name:\s*cookbook-tanstack/);
    }
  });

  it("Resolve-outdated-comments workflow maintains required write permissions and delegates to @main", () => {
    const path = resolve(repoRoot, ".github/workflows/resolve-outdated-comments.yml");
    const workflow = readFileSync(path, "utf8");

    expect(workflow).toMatch(/uses:\s*dougis-org\/cicd-tooling\/\.github\/workflows\/resolve-outdated-comments\.yml@main/);
    expect(workflow).toMatch(/permissions:\s*([\s\S]*?)\n\s*uses:/);
    const permissionsBlock = workflow.match(/permissions:\s*([\s\S]*?)\n\s*uses:/)?.[1] || "";
    expect(permissionsBlock).toMatch(/contents:\s*write/);
    expect(permissionsBlock).toMatch(/pull-requests:\s*write/);
  });

  it("Sync-openspec-shared workflow maintains required contents: write permissions and delegates to @main", () => {
    const path = resolve(repoRoot, ".github/workflows/sync-openspec-shared.yml");
    const workflow = readFileSync(path, "utf8");

    expect(workflow).toMatch(/uses:\s*dougis-org\/cicd-tooling\/\.github\/workflows\/sync-openspec-shared\.yml@main/);
    expect(workflow).toMatch(/permissions:\s*([\s\S]*?)\n\s*uses:/);
    const permissionsBlock = workflow.match(/permissions:\s*([\s\S]*?)\n\s*uses:/)?.[1] || "";
    expect(permissionsBlock).toMatch(/contents:\s*write/);
  });
});
