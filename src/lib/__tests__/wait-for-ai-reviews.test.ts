import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const workflowPath = resolve(repoRoot, ".github/workflows/wait-for-ai-reviews.yml");

describe("Wait for AI reviews workflow", () => {
  it("delegates to the shared cicd-tooling reusable workflow", () => {
    const workflow = readFileSync(workflowPath, "utf8");

    expect(workflow).toMatch(/uses:\s*dougis-org\/cicd-tooling\/\.github\/workflows\/wait-for-ai-reviews\.yml@main/);
  });

  it("declares the permissions required by the called workflow", () => {
    const workflow = readFileSync(workflowPath, "utf8");

    expect(workflow).toMatch(/checks:\s*read/);
    expect(workflow).toMatch(/pull-requests:\s*read/);
  });
});
