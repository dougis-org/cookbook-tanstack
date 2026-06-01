## ADDED Requirements

This document details *changes* to requirements and is additive to the [design.md](../changes/archive/2026-05-31-parallel-ci-pipeline/design.md) document, not a replacement.

### Requirement: ADDED Separated CI test suite filters

The system SHALL provide distinct script targets in `package.json` to filter and execute the unit and integration suites separately.

#### Scenario: Running unit tests only
- **Given** the repository contains both unit and integration test files
- **When** executing the `npm run test:unit` script
- **Then** only fast unit tests are executed and files matching `**/*.integration.test.ts`, `**/*.integration.spec.ts`, or bare `integration.test.ts`/`integration.spec.ts` (e.g., `**/integration.test.ts`) are excluded

#### Scenario: Running integration tests only
- **Given** the repository contains both unit and integration test files
- **When** executing the `npm run test:integration` script
- **Then** only integration test files matching `**/*.integration.{test,spec}.ts` or matching the positional substring filter `integration` (e.g. `src/server/trpc/__tests__/integration.test.ts`) are executed

---

## MODIFIED Requirements

### Requirement: MODIFIED CI Workflow Execution Order

The CI system SHALL execute the build and unit testing in an initial phase, and run integration and E2E testing in parallel downstream.

#### Scenario: Pull request build succeeds and triggers downstream parallel suites
- **Given** a pull request triggers the `Build and Test` GitHub Actions workflow
- **When** the `build-and-unit` job successfully compiles the code and all unit tests pass
- **Then** the `integration` job and the `e2e` job execute concurrently on separate runner instances

#### Scenario: Pull request build fails and skips downstream suites
- **Given** a pull request triggers the `Build and Test` GitHub Actions workflow
- **When** the `build-and-unit` job fails during compilation or unit testing
- **Then** downstream jobs (`integration`, `e2e`, and `finalize-coverage`) are not executed, failing the CI run immediately

---

## REMOVED Requirements

### Requirement: REMOVED Sequential execution of E2E and integration suites in a single runner job

- **Reason for removal**: Running E2E and integration tests sequentially inside a single job runner makes overall CI execution slow and mixes distinct log streams together.

---

## Traceability

- **Proposal element**: Custom npm scripts to isolate unit and integration tests.
  - -> **Requirement**: ADDED Separated CI test suite filters
- **Proposal element**: Fail-fast compilation and unit test job.
  - -> **Requirement**: MODIFIED CI Workflow Execution Order
- **Proposal element**: Parallel execution of integration and E2E suites.
  - -> **Requirement**: MODIFIED CI Workflow Execution Order
- **Design decision**: Decision 1 (Split test suites via package.json scripts)
  - -> **Requirement**: ADDED Separated CI test suite filters
- **Design decision**: Decision 2 (Reuse build output via GHA Artifacts)
  - -> **Requirement**: MODIFIED CI Workflow Execution Order
- **Design decision**: Decision 3 (Partial coverage uploads)
  - -> **Requirement**: MODIFIED CI Workflow Execution Order
- **Requirement** -> **Task(s)**:
  - ADDED Separated CI test suite filters -> `package.json`
  - MODIFIED CI Workflow Execution Order -> `.github/workflows/build-and-test.yml`

---

## Non-Functional Acceptance Criteria

### Requirement: Performance (CI Throughput)

#### Scenario: Re-use of built artifacts
- **Given** the `build-and-unit` job successfully runs `npm run build`
- **When** the `e2e` job downloads the resulting artifact
- **Then** E2E server warmup begins using the downloaded `.output/` bundle without performing another compilation step

### Requirement: Reliability (Codacy Coverage Sync)

#### Scenario: Merging of parallel coverage runs
- **Given** multiple runners upload partial test coverages concurrently using `--partial`
- **When** the `finalize-coverage` job executes the `final` hook
- **Then** Codacy aggregates the partial reports into a single, unified codebase coverage report
