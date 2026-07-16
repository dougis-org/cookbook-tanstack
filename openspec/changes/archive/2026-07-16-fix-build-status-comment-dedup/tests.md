---
name: tests
description: Tests for the fix-build-status-comment-dedup change
---

# Tests

## Overview

This document outlines the tests for the `fix-build-status-comment-dedup` change. The repo has Vitest coverage (`src/lib/__tests__/cicd-workflows.test.ts`) that asserts static invariants of the workflow YAML, but there is no harness for actually *executing* a workflow run or testing `actions/github-script` step behavior (Vitest/Playwright cover application code, not live GitHub Actions execution — see `design.md`, Functional Requirements Mapping). Verification of this change's runtime behavior is therefore performed as a scripted manual TDD-style process against a real throwaway PR: write down the expected outcome first (red), implement, then observe the actual outcome (green), matching the spirit of TDD even without an automated runner.

## Testing Steps

For each task in `tasks.md`:

1. **Define expected outcome first:** Before implementing the `notify-status` job logic for a given branch (create/update/delete), write down the exact expected comment state (below) — this is the "failing test" in spirit, since the current workflow has no such behavior yet.
2. **Implement the job/step:** Write the `actions/github-script` logic to satisfy that expected outcome.
3. **Observe on a real PR:** Push the triggering commit to a throwaway branch/PR, let the workflow run, and confirm the actual comment state matches the expected outcome exactly (same as "run the test and see it pass").
4. **Refactor:** Clean up the script (naming, comments only where non-obvious) while re-running the same throwaway-PR scenario to confirm behavior is unchanged.

## Test Cases

- [ ] **TC1 — Delete comment on success, prior comment exists** (task: "Implement the `github-script` body" success branch; spec: "PR build-status comment is deleted when all required jobs succeed", scenario "All jobs succeed with a prior failure comment present")
  - Setup: PR with an existing marker comment (from a prior failing run)
  - Action: push a commit that makes `build-and-unit`, `integration`, and `e2e` all succeed
  - Expected: marker comment is deleted; zero bot comments remain on the PR

- [ ] **TC2 — No-op on success, no prior comment** (task: same success branch; spec scenario "All jobs succeed with no prior comment present")
  - Setup: PR with no marker comment
  - Action: push a commit that makes all three jobs succeed
  - Expected: no comment is created or deleted; PR comment list unchanged

- [ ] **TC3 — Create comment on first failure** (task: "Implement the `github-script` body" failure-branch-no-existing-comment; spec: "PR build-status comment is created on first failure")
  - Setup: PR with no marker comment
  - Action: push a commit that fails `e2e` (or any required job)
  - Expected: a new comment is created starting with `<!-- build-and-test-status -->`, containing exactly one `<!-- entry:{run_id} -->` block with a timestamp and a link to the triggering run

- [ ] **TC4 — Update comment in place on second failure** (task: "Implement the `github-script` body" failure-branch-existing-comment; spec: "PR build-status comment is updated in place on repeat failure")
  - Setup: PR with an existing marker comment containing 1 entry (from TC3)
  - Action: push another commit that fails a required job
  - Expected: same comment ID is updated (no second comment created); comment now contains 2 entries, newest first

- [ ] **TC5 — History capped at 5 entries on 6th failure** (task: "Implement the `github-script` body" truncation logic; spec: "PR build-status comment failure history is capped at 5 entries")
  - Setup: PR with an existing marker comment containing 5 entries
  - Action: push a 6th failing commit
  - Expected: comment still contains exactly 5 entries; new entry is first; the previously-oldest (5th) entry is no longer present

- [ ] **TC6 — Comment-management failure does not affect required check** (task: "Set the step's `continue-on-error: true`"; spec NFAC: "Comment-management step failure does not affect required check status")
  - Setup: on a throwaway branch, temporarily introduce a deliberate bug into the `github-script` body (e.g., reference an undefined variable)
  - Action: push a commit that triggers the buggy step
  - Expected: the `notify-status` job step shows as failed internally but the step is marked `continue-on-error: true`; overall workflow/job conclusion and the PR's required build/test check status are unaffected by this failure. Revert the deliberate bug afterward — do not merge it.

- [ ] **TC7 — Marker lookup paginates across all PR comments** (task: "Look up existing marker comment" pagination; spec NFAC: "Comment lookup finds the marker comment regardless of PR comment volume")
  - Setup: PR with more comments than the default single-page size (e.g., >30), including one marker comment near the start of the thread
  - Action: push a commit that fails a required job
  - Expected: the existing marker comment is found and updated (not duplicated), confirming the lookup paginates rather than only checking the first page

- [ ] **TC8 — Workflow YAML is syntactically valid** (task: "Validate workflow YAML syntax")
  - Setup: none
  - Action: run `actionlint .github/workflows/build-and-test.yml` (or `yq eval . .github/workflows/build-and-test.yml > /dev/null` if `actionlint` is unavailable)
  - Expected: no syntax errors reported

- [ ] **TC9 — Existing suites unaffected** (task: "Run unit/integration tests", "Run E2E tests", "Run build" in Validation)
  - Setup: none
  - Action: run `npm run test`, `npm run test:e2e`, `npm run build`
  - Expected: all pass, confirming this workflow-only change has no impact on application code, build, or existing test suites
