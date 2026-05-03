This document details *changes* to requirements and is additive to the
`design.md` document, not a replacement.

### Requirement: ADDED Measured Playwright CI runtime visibility

The system SHALL provide maintainers with enough observable runtime information
to identify whether Playwright CI minutes are dominated by worker
configuration, spec-file skew, or retry-driven instability.

#### Scenario: runtime visibility is available during optimization

- **Given** a pull request run of `.github/workflows/build-and-test.yml`
- **When** the Playwright segment completes
- **Then** maintainers can determine which parts of the E2E segment are the
  main runtime bottlenecks using workflow output, generated artifacts, or
  explicit documentation added by this change

#### Scenario: lightweight observability does not become the primary source of cost

- **Given** runtime visibility is added for the Playwright segment
- **When** the workflow is executed on pull requests
- **Then** the added observability remains lightweight enough that it does not
  negate the CI-minute savings targeted by this change

## MODIFIED Requirements

### Requirement: MODIFIED Full-suite pull request E2E execution efficiency

The system SHALL continue to run the full Playwright suite with E2E coverage on
every pull request while using a deterministic CI execution model that is more
efficient than the current serialized baseline.

#### Scenario: full-suite validation is preserved

- **Given** a pull request triggers `.github/workflows/build-and-test.yml`
- **When** the E2E stage runs
- **Then** the workflow executes the full Playwright suite rather than a
  filtered subset and still produces the expected E2E coverage output path when
  coverage generation succeeds

#### Scenario: worker configuration is no longer hard-pinned to serialized CI execution

- **Given** the repository is running Playwright in CI
- **When** the optimized configuration from this change is applied
- **Then** the CI path uses a validated worker configuration above the previous
  `workers: 1` baseline or documents and reverts to the baseline if higher
  concurrency proves unreliable

#### Scenario: heavy skew is addressed when it blocks concurrency gains

- **Given** one or more Playwright spec files dominate runtime or retries under increased concurrency
- **When** the change is implemented
- **Then** the high-skew specs or shared setup patterns are rebalanced, split,
  or isolated enough for the chosen worker configuration to remain
  deterministic

## REMOVED Requirements

### Requirement: REMOVED Serialized CI Playwright execution as the default operating mode

Reason for removal:

The repository should no longer treat single-worker CI execution as the default
long-term operating mode when a safe higher-concurrency configuration can
reduce CI minutes without reducing pull request coverage.

#### Scenario: serialized execution is not retained solely by inertia

- **Given** the current baseline uses `workers: 1` in CI
- **When** this change is evaluated for merge
- **Then** the resulting implementation either adopts a justified
  higher-concurrency configuration or explicitly documents why the serialized
  baseline must remain for now

## Traceability

- Proposal element -> Requirement:
  - keep full-suite PR validation -> MODIFIED Full-suite pull request E2E
    execution efficiency
  - add runtime understanding before broader optimization -> ADDED Measured
    Playwright CI runtime visibility
  - stop treating serialized CI as the default by assumption -> REMOVED
    Serialized CI Playwright execution as the default operating mode
- Design decision -> Requirement:
  - Decision 1 -> MODIFIED Full-suite pull request E2E execution efficiency
  - Decision 2 -> MODIFIED Full-suite pull request E2E execution efficiency
  - Decision 3 -> ADDED Measured Playwright CI runtime visibility
  - Decision 4 -> MODIFIED Full-suite pull request E2E execution efficiency
- Requirement -> Task(s):
  - ADDED Measured Playwright CI runtime visibility -> tasks 1, 2, 4
  - MODIFIED Full-suite pull request E2E execution efficiency -> tasks 1, 2, 3, 4
  - REMOVED Serialized CI Playwright execution as the default operating mode -> tasks 2, 4

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: CI-minute reduction is demonstrated against baseline

- **Given** a baseline measurement of the Playwright segment before this change
- **When** the optimized worker configuration and test-balance changes are applied
- **Then** maintainers can compare before-and-after CI-minute usage and verify
  that the new configuration yields a measurable reduction or is rejected

### Requirement: Security

#### Scenario: PR validation coverage is not weakened

- **Given** the change modifies Playwright and workflow behavior
- **When** the new CI path runs on a pull request
- **Then** it does not bypass required pull request validation by skipping the
  full E2E suite or suppressing failure signals

### Requirement: Reliability

#### Scenario: unstable concurrency changes are rejected or rolled back

- **Given** higher Playwright concurrency introduces repeated flaky failures, elevated retries, or shared-state contention
- **When** the implementation is validated
- **Then** the change either includes the fixes needed to restore deterministic
  behavior or reverts to a stable configuration before merge

### Requirement: Operability

#### Scenario: maintainers can revert quickly

- **Given** the optimized CI path proves unreliable after implementation
- **When** maintainers need to recover quickly
- **Then** the worker and workflow changes are isolated and documented well
  enough to restore the prior baseline without affecting unrelated CI
  capabilities

---

## Changes from fix-e2e-ci-performance-regression (2026-05-02)

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
- **When** any test calls `page.goto("/")` as its first step
- **Then** `#app-shell` becomes visible within 10 seconds, and the test proceeds without hitting the 30-second test timeout

### Requirement: MODIFIED `continue-on-error` is not required as a permanent workaround

The system SHALL NOT rely on `continue-on-error: true` to mask E2E failures on pull request builds.

#### Scenario: E2E failure is visible and blocking on PRs

- **Given** the fix has been applied and merged to main
- **When** a pull request CI run encounters an E2E failure
- **Then** the `Run E2E tests` step reports failure and the PR check fails

### Requirement: ADDED Root cause documented and reproducible locally

The system SHALL have a documented root cause for the regression that can be reproduced in a local environment without CI. Root cause: React 19 (TanStack Start ≥1.167.46) hoists `<link rel="stylesheet">` before inline `<style>` tags, inverting the CSS cascade so `#app-shell { display: none }` wins permanently. Fix: `markLoaded()` sets display values explicitly.
