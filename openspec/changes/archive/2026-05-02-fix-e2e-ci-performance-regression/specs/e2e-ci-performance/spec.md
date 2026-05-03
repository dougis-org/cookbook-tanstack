This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

## MODIFIED Requirements

### Requirement: MODIFIED E2E test suite completes within CI budget

The system SHALL execute all 155 Playwright E2E tests to completion within the 10-minute `Run E2E tests` step budget on every CI run, including main-branch pushes.

#### Scenario: all tests complete on a main-branch push

- **Given** a push to the `main` branch triggers the `build-and-test` workflow
- **When** the `Run E2E tests` step executes
- **Then** the step completes (does not time out), the `playwright-report` artifact is uploaded, and the step exits with status `success`

#### Scenario: auth-related tests pass without retries

- **Given** the CI E2E run is underway with 2 workers
- **When** tests from `admin/admin-users.spec.ts`, `auth-session.spec.ts`, and `cookbooks-auth.spec.ts` execute
- **Then** all 14 tests that previously failed complete successfully on their first attempt (retry count for these tests is 0)

#### Scenario: pre-heating state does not block test navigation

- **Given** the production server is running and Playwright has confirmed the health check URL is responsive
- **When** any test calls `gotoAndWaitForHydration(page, "/")` as its first step
- **Then** `#app-shell` becomes visible within 10 seconds, and the test proceeds without hitting the 30-second test timeout

### Requirement: MODIFIED `continue-on-error` is not required as a permanent workaround

The system SHALL NOT rely on `continue-on-error: true` to mask E2E failures on pull request builds once the fix is applied.

#### Scenario: E2E failure is visible and blocking on PRs after fix

- **Given** the fix has been applied and merged to main
- **When** a pull request CI run encounters an E2E failure
- **Then** the `Run E2E tests` step reports failure and the PR check fails (the `continue-on-error` workaround comment is removed from the workflow)

## ADDED Requirements

### Requirement: ADDED Root cause documented and reproducible locally

The system SHALL have a documented root cause for the regression that can be reproduced in a local environment without CI.

#### Scenario: local reproduction of the failure

- **Given** `@tanstack/react-start` at the identified breaking version is installed
- **When** `npm run build` is run and `PORT=3000 node .output/server/index.mjs` is started, then Playwright E2E tests are run locally
- **Then** the same auth-related test failures (pre-heating state, `#app-shell` not visible) are observed

#### Scenario: local verification of the fix

- **Given** the fix is applied locally
- **When** `npm run build` is run and `PORT=3000 node .output/server/index.mjs` is started, then Playwright E2E tests are run locally
- **Then** all 155 tests pass

## REMOVED Requirements

### Requirement: REMOVED Permanent `continue-on-error` on E2E step for PR builds

Reason for removal: The `continue-on-error` workaround was added in PR #415 as a temporary measure due to the E2E regression. Once the regression is fixed, the workaround must be removed so E2E failures are visible and blocking on PRs.

## Traceability

- Proposal element "14 auth tests fail with 30s timeout" -> Requirement: MODIFIED E2E test suite completes within CI budget
- Proposal element "Fix without reverting versions" -> Requirement: ADDED Root cause documented and reproducible locally
- Proposal element "Remove continue-on-error workaround" -> Requirement: REMOVED Permanent `continue-on-error` on E2E step for PR builds
- Design decision 2 (server-side vs. CI warmup) -> Requirement: MODIFIED pre-heating state does not block test navigation
- Requirement MODIFIED "all tests complete" -> Tasks: bisect version, implement fix, verify CI
- Requirement ADDED "root cause documented" -> Tasks: bisect version, document findings

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: E2E wall-clock time at or near pre-upgrade baseline

- **Given** the fix is applied and CI runs the E2E segment with 2 workers
- **When** the `Run Playwright runtime summary` step reports the total duration from `playwright-report/results.json`
- **Then** the sum of all test durations divided by 2 workers is ≤ 250 seconds (wall-clock ≤ ~4 minutes), consistent with the pre-upgrade baseline of 398.5s total / 2 workers ≈ 200s

### Requirement: Reliability

#### Scenario: no retries on previously-failing tests

- **Given** the fix is applied
- **When** the `playwright-report/results.json` artifact is inspected after a CI run
- **Then** tests from `admin/admin-users.spec.ts`, `auth-session.spec.ts`, and `cookbooks-auth.spec.ts` show `retry: 0` for all results
