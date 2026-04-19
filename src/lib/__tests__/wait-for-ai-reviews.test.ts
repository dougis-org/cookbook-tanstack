import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const workflowPath = resolve(repoRoot, ".github/workflows/wait-for-ai-reviews.yml");

describe("Wait for AI reviews workflow", () => {
  it("recognizes AI reviewer completion from any submitted PR review", () => {
    const workflow = readFileSync(workflowPath, "utf8");

    expect(workflow).toMatch(/pull-requests:\s*read/);
    expect(workflow).toMatch(/listPullRequestsAssociatedWithCommit/);
    expect(workflow).toMatch(/github\.paginate\(github\.rest\.pulls\.listReviews/);
    expect(workflow).toContain("copilot-pull-request-reviewer[bot]");
    expect(workflow).toContain("gemini-code-assist[bot]");
    expect(workflow).toMatch(
      /Boolean\(review\.submitted_at\)[\s\S]*reviewer\.reviewAuthors\.includes\(login\)[\s\S]*state !== 'PENDING'[\s\S]*state !== 'DISMISSED'/,
    );
    expect(workflow).toMatch(/const hasHistoricalReview = submittedReviews\.length > 0/);
    expect(workflow).toMatch(/complete:\s*completedChecks\.length > 0 \|\| hasHistoricalReview/);
  });

  it("does not require current-head reviews after any AI review has been submitted", () => {
    const workflow = readFileSync(workflowPath, "utf8");
    expect(workflow).toMatch(/const submittedReviews = reviews\.filter/);
    expect(workflow).toMatch(/const hasHistoricalReview = submittedReviews\.length > 0/);
    expect(workflow).not.toContain("const action = context.payload.action");
    expect(workflow).not.toContain("const isSynchronize = action === 'synchronize'");
    expect(workflow).not.toContain("requireCurrentHeadOnSynchronize");
    expect(workflow).not.toContain("const requireCurrentHeadReview");
  });

  it("uses the staged polling cadence requested for the 10 minute timeout window", () => {
    const workflow = readFileSync(workflowPath, "utf8");

    expect(workflow).toContain("const initialSleepMs = 3 * 60_000");
    expect(workflow).toContain("const followUpPollIntervalMs = 90_000");
    expect(workflow).toContain("const followUpPollIterations = 4");
    expect(workflow).toContain("const finalPollIntervalMs = 45_000");
    expect(workflow).toContain("await wait(initialSleepMs)");
    expect(workflow).toMatch(
      /const getNextPollIntervalMs = \(elapsedMs, completedPolls\) => \{[\s\S]*completedPolls < followUpPollIterations[\s\S]*followUpPollIntervalMs[\s\S]*finalPollIntervalMs/,
    );
    expect(workflow).not.toMatch(/completedPolls <= followUpPollIterations/);
    expect(workflow).toMatch(/pollCount \+= 1/);
    expect(workflow).toMatch(/const sleepMs = getNextPollIntervalMs\(elapsedMs, pollCount\)/);
  });
});
