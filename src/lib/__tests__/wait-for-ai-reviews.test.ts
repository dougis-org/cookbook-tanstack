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
      /Boolean\(review\.submitted_at\)[\s\S]*reviewer\.reviewAuthors\.includes\(login\)[\s\S]*state !== 'PENDING'[\s\S]*state !== 'DISMISSED'/,
    );
    expect(workflow).toMatch(
      /const currentReviews = submittedReviews\.filter\([\s\S]*review\.commit_id === ref/,
    );
  });

  it("only requires Gemini on synchronize events when no earlier Gemini review exists", () => {
    const workflow = readFileSync(workflowPath, "utf8");
    const submittedReviewsSectionMatch = workflow.match(
      /const submittedReviews = reviews\.filter\([\s\S]*?(?=const currentReviews = submittedReviews\.filter\()/,
    );
    const currentReviewsSectionMatch = workflow.match(
      /const currentReviews = submittedReviews\.filter\([\s\S]*?(?=const hasHistoricalReview = submittedReviews\.length > 0)/,
    );

    expect(submittedReviewsSectionMatch).not.toBeNull();
    expect(currentReviewsSectionMatch).not.toBeNull();

    const submittedReviewsSection = submittedReviewsSectionMatch![0];
    const currentReviewsSection = currentReviewsSectionMatch![0];
    expect(workflow).toContain("const action = context.payload.action");
    expect(workflow).toContain("const isSynchronize = action === 'synchronize'");
    expect(workflow).toMatch(
      /label:\s*['"]Copilot['"][\s\S]*?requireCurrentHeadOnSynchronize:\s*true/,
    );
    expect(workflow).toMatch(
      /label:\s*['"]Gemini['"][\s\S]*?requireCurrentHeadOnSynchronize:\s*false/,
    );
    expect(workflow).toMatch(/const submittedReviews = reviews\.filter/);
    expect(submittedReviewsSection).not.toContain("review.commit_id === ref");
    expect(currentReviewsSection).toContain("review.commit_id === ref");
    expect(workflow).toMatch(/const hasHistoricalReview = submittedReviews\.length > 0/);
    expect(workflow).toMatch(
      /const requireCurrentHeadReview[\s\S]*!isSynchronize[\s\S]*\|\|[\s\S]*reviewer\.requireCurrentHeadOnSynchronize[\s\S]*\|\|[\s\S]*!hasHistoricalReview/,
    );
    expect(workflow).toMatch(
      /complete:[\s\S]*completedChecks\.length > 0[\s\S]*\([\s\S]*requireCurrentHeadReview[\s\S]*\? currentReviews\.length > 0[\s\S]*: hasHistoricalReview[\s\S]*\)/,
    );
  });
});
