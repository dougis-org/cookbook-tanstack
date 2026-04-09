---
name: tests
description: Tests for the improve-e2e-ci-performance change
---

# Tests

## Overview

This document outlines the tests for the `improve-e2e-ci-performance`
change. All work should follow a strict TDD
(Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write
   a test that captures the requirements of the task. Run the test and
   ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to
   make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the
   test still passes.

## Test Cases

### Task 1 — Baseline and runtime visibility

- [ ] **Workflow/config test: Playwright CI runtime path is explicitly observable**
  - Files: `.github/workflows/build-and-test.yml`, `playwright.config.ts`
  - Add a focused test or validation check that fails if the
    workflow/config no longer exposes the runtime information required to
    diagnose skew, retries, or worker behavior
  - Implementation path:
    `src/lib/__tests__/playwright-ci-performance.test.ts` should assert a
    CI-only JSON Playwright report is generated and summarized without
    re-running the suite
  - This test should start failing before the observability change is implemented
  - Spec:
    `openspec/changes/improve-e2e-ci-performance/specs/e2e-ci-performance/spec.md`
    -> `ADDED Measured Playwright CI runtime visibility` ->
    `Scenario: runtime visibility is available during optimization`

- [ ] **Regression test: observability remains lightweight**
  - Validate that any new reporting or logging does not become a
    heavyweight extra step that undermines the intended CI-minute
    reduction
  - Implementation path: assert the workflow still runs a single
    `npm run test:e2e` invocation and any summary step reuses the
    generated Playwright JSON output
  - Prefer an automated assertion if feasible; otherwise define a
    measurable manual validation against baseline runtime
  - Spec:
    `openspec/changes/improve-e2e-ci-performance/specs/e2e-ci-performance/spec.md`
    -> `ADDED Measured Playwright CI runtime visibility` ->
    `Scenario: lightweight observability does not become the primary source of cost`

### Task 2 — Worker-count increase above serialized baseline

- [ ] **Config test: CI worker count is no longer hard-pinned to serialized execution**
  - Files: `playwright.config.ts` and/or `.github/workflows/build-and-test.yml`
  - Add or update a test that fails while the CI path remains pinned to
    `workers: 1`
  - Implementation path: assert CI reads an explicit worker env var above
    `1` and preserves the local non-CI default
  - After implementation, the test should pass only when the validated
    higher-concurrency configuration is in place or an explicit
    documented fallback is exercised
  - Spec:
    `openspec/changes/improve-e2e-ci-performance/specs/e2e-ci-performance/spec.md`
    -> `MODIFIED Full-suite pull request E2E execution efficiency` ->
    `Scenario: worker configuration is no longer hard-pinned to serialized CI execution`

- [ ] **Regression test: full-suite PR coverage remains intact**
  - Verify the pull request workflow still invokes the full Playwright
    suite and continues to produce the expected E2E coverage output path
    when coverage is generated
  - This should fail if selective execution or coverage removal is introduced
  - Spec:
    `openspec/changes/improve-e2e-ci-performance/specs/e2e-ci-performance/spec.md`
    -> `MODIFIED Full-suite pull request E2E execution efficiency` ->
    `Scenario: full-suite validation is preserved`

### Task 3 — Spec skew reduction and deterministic parallelism

- [ ] **E2E suite regression: heavy specs remain stable under the chosen worker configuration**
  - Files: affected files in `src/e2e/`
  - Add or update tests around any refactored heavy spec files or shared
    helpers before refactoring them
  - Implementation path: assert no cookbook-focused E2E spec remains
    above the agreed skew threshold after the refactor and that shared
    cookbook setup helpers are extracted instead of duplicated
  - Re-run the affected E2E specs under the new worker configuration and
    confirm deterministic results
  - Spec:
    `openspec/changes/improve-e2e-ci-performance/specs/e2e-ci-performance/spec.md`
    -> `MODIFIED Full-suite pull request E2E execution efficiency` ->
    `Scenario: heavy skew is addressed when it blocks concurrency gains`

- [ ] **Fallback test: unstable concurrency is rejected or rolled back**
  - Define a validation path that proves the implementation does not
    merge an unstable worker increase without either fixing the test
    isolation issue or reverting to a stable baseline
  - This can be a documented CI validation gate if a pure automated test is not feasible
  - Spec:
    `openspec/changes/improve-e2e-ci-performance/specs/e2e-ci-performance/spec.md`
    -> `Reliability` ->
    `Scenario: unstable concurrency changes are rejected or rolled back`

### Task 4 — Documentation, rollback, and maintainability

- [ ] **Documentation check: rollback path is explicit**
  - Files: updated docs and workflow notes created by this change
  - Implementation path: `docs/testing/playwright-ci.md` should capture
    the baseline, chosen worker count, runtime summary output, and the
    rollback switch to `PLAYWRIGHT_CI_WORKERS=1`
  - Verify maintainers can identify how to restore the prior serialized
    baseline quickly if the optimized path becomes unreliable
  - Spec:
    `openspec/changes/improve-e2e-ci-performance/specs/e2e-ci-performance/spec.md`
    -> `Operability` -> `Scenario: maintainers can revert quickly`

- [ ] **Performance verification: before/after comparison is captured**
  - Record and compare baseline versus post-change Playwright CI-minute usage
  - This validation should fail the task if no measurable reduction is
    demonstrated and no justified fallback decision is documented
  - Spec:
    `openspec/changes/improve-e2e-ci-performance/specs/e2e-ci-performance/spec.md`
    -> `Performance` ->
    `Scenario: CI-minute reduction is demonstrated against baseline`

### Cross-cutting validation

- [ ] **Security/regression check: required PR validation is not weakened**
  - Confirm the implementation does not bypass pull request validation by
    skipping the full E2E suite or suppressing failure signals
  - Run this validation after all workflow edits are complete
  - Spec:
    `openspec/changes/improve-e2e-ci-performance/specs/e2e-ci-performance/spec.md`
    -> `Security` -> `Scenario: PR validation coverage is not weakened`
