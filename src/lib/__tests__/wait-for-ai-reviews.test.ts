import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const workflowPath = resolve(repoRoot, ".github/workflows/wait-for-ai-reviews.yml");

describe("Wait for AI reviews workflow", () => {
  it("recognizes AI reviewer completion from PR reviews on the current head commit", () => {
    const workflow = readFileSync(workflowPath, "utf8");

    expect(workflow).toMatch(/pull-requests:\s*read/);
    expect(workflow).toMatch(/listPullRequestsAssociatedWithCommit/);
    expect(workflow).toMatch(/github\.paginate\(github\.rest\.pulls\.listReviews/);
    expect(workflow).toContain("copilot-pull-request-reviewer[bot]");
    expect(workflow).toContain("gemini-code-assist[bot]");
    expect(workflow).toMatch(
      /Boolean\(review\.submitted_at\)[\s\S]*review\.commit_id === ref[\s\S]*reviewer\.reviewAuthors\.includes\(login\)[\s\S]*state !== 'PENDING'[\s\S]*state !== 'DISMISSED'/,
    );
    expect(workflow).toMatch(/completedChecks\.length > 0 \|\| currentReviews\.length > 0/);
  });
});
