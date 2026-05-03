---
name: tests
description: Tests for fix-e2e-ci-performance-regression
---

# Tests

## Overview

This change is primarily an investigation-then-fix. Most verification is done via existing Playwright E2E tests (the 14 previously-failing tests become the regression suite) and CI observation. New unit/integration tests are not required; the existing test suite IS the test.

All work follows TDD: confirm the failure first, then implement and confirm the fix.

## Testing Steps

For each execution task in `tasks.md`:

1. **Write a failing test (observe the failure):** Before implementing any fix, confirm the failure is reproducible locally. The "test" here is the existing Playwright suite.
2. **Write code to pass the test:** Implement the fix.
3. **Refactor:** Clean up any temporary instrumentation (e.g., timing logs).

## Test Cases

### Phase 1 — Bisection and root cause

- [ ] **TC-1.1 — Local failure reproduction**
  - Task: 1.1
  - Spec: `specs/e2e-ci-performance/spec.md` → "local reproduction of the failure"
  - Method: Run `npx playwright test auth-session admin/admin-users cookbooks-auth --reporter=list` with current packages
  - Pass condition: All 14 tests fail with "Test timeout of 30000ms exceeded" and page snapshot shows "Pre-heating" state
  - Fail condition: Tests pass (regression not locally reproducible — needs CI-only investigation)

- [ ] **TC-1.2 — Bisect identifies breaking version**
  - Task: 1.2
  - Spec: `specs/e2e-ci-performance/spec.md` → "local reproduction of the failure"
  - Method: For each candidate version, run `npx playwright test auth-session admin/admin-users --reporter=list` after `npm install && npm run build`
  - Pass condition: A specific version N is identified where tests pass on N-1 and fail on N
  - Fail condition: Failure appears on all tested versions (bisect range needs widening)

- [ ] **TC-1.3 — Root cause documented**
  - Task: 1.3
  - Spec: `specs/e2e-ci-performance/spec.md` → "root cause documented"
  - Method: `design.md` contains a "Root Cause" section with the breaking version number and a description of what changed
  - Pass condition: Section exists and is non-empty after investigation

### Phase 2 — Fix implementation

- [ ] **TC-2.1 — h3 resolves at rc.21**
  - Task: 2.2
  - Spec: `specs/ci-config/spec.md` → "h3 resolves at rc.21 after install"
  - Method: `npm ls h3`
  - Pass condition: Output shows `h3@2.0.1-rc.21`; no peer dependency warnings for h3

- [ ] **TC-2.2 — Build succeeds with rc.21**
  - Task: 2.2
  - Spec: `specs/ci-config/spec.md` → "build succeeds with rc.21"
  - Method: `npm run build`
  - Pass condition: Build completes with exit code 0, `.output/server/index.mjs` exists

- [ ] **TC-2.3 — webServer timeout has inline comment**
  - Task: 2.3
  - Spec: `specs/ci-config/spec.md` → "timeout value is documented in code"
  - Method: Read `playwright.config.ts`, inspect `webServer.timeout` line
  - Pass condition: An inline comment on or adjacent to `timeout:` explains the chosen value

- [ ] **TC-2.4 — continue-on-error removed from CI workflow**
  - Task: 2.4
  - Spec: `specs/e2e-ci-performance/spec.md` → "E2E failure is visible and blocking on PRs after fix"
  - Method: `grep "continue-on-error" .github/workflows/build-and-test.yml`
  - Pass condition: The `continue-on-error` line is absent from the `Run E2E tests` step (may still exist on other steps if any)

### Phase 3 — Full validation

- [ ] **TC-3.1 — All 155 E2E tests pass locally**
  - Task: 3.1
  - Spec: `specs/e2e-ci-performance/spec.md` → "all tests complete on a main-branch push"
  - Method: `npx playwright test --reporter=list`
  - Pass condition: 155 passed, 0 failed, 0 retries on auth/admin tests

- [ ] **TC-3.2 — 0 retries on previously-failing tests**
  - Task: 3.1
  - Spec: `specs/e2e-ci-performance/spec.md` → "auth-related tests pass without retries"
  - Method: Inspect `playwright-report/results.json` after local run; filter tests from `admin-users.spec.ts`, `auth-session.spec.ts`, `cookbooks-auth.spec.ts`
  - Pass condition: All 14 tests show `retry: 0`

- [ ] **TC-3.3 — E2E wall-clock time at or near baseline**
  - Task: 3.1
  - Spec: `specs/e2e-ci-performance/spec.md` → "E2E wall-clock time at or near pre-upgrade baseline"
  - Method: `node scripts/ci/report-playwright-runtime.mjs` after local run
  - Pass condition: Sum of all test durations ÷ 2 workers ≤ 250 seconds

- [ ] **TC-3.4 — Unit tests pass**
  - Task: 3.2
  - Method: `npm run test`
  - Pass condition: All unit/integration tests pass

- [ ] **TC-3.5 — TypeScript strict mode passes**
  - Task: 3.2
  - Method: `npx tsc --noEmit`
  - Pass condition: Exit code 0, no errors

- [ ] **TC-3.6 — CI E2E step completes without timeout**
  - CI-only validation (post-PR)
  - Spec: `specs/e2e-ci-performance/spec.md` → "all tests complete on a main-branch push"
  - Method: Observe the `Run E2E tests` step in the CI run for the fix PR
  - Pass condition: Step completes (not timed out), `playwright-report` artifact is uploaded
