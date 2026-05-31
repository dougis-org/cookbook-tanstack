---
name: tests
description: Tests for the parallel-ci-pipeline change
---

# Tests

## Overview

This document outlines the tests for the `parallel-ci-pipeline` change. All work follows a strict BDD/TDD process where behaviors are defined and validated.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test / run failing validation**: Before completing any implementation code, run the verification command or write a check that fails because the behavior is missing.
2.  **Write code to pass the test / validation**: Implement the minimal changes to make the validation/test pass.
3.  **Refactor**: Clean up the YAML structure, package.json format, or other implementation files while ensuring all tests continue to pass.

## Test Cases

### Task 1: Add isolated test scripts in `package.json`

- [x] **Test Case 1: Run unit tests only**
  - **Task Link**: Task 1 (Add isolated test scripts)
  - **Spec Scenario Link**: `specs/ci-parallelism.md` -> Scenario: Running unit tests only
  - **Validation Steps**:
    1. Run `npm run test:unit`.
    2. Verify it only runs unit test files (118 files) and excludes `**/*.integration.test.ts` or `**/*.integration.spec.ts`.
- [x] **Test Case 2: Run integration tests only**
  - **Task Link**: Task 1 (Add isolated test scripts)
  - **Spec Scenario Link**: `specs/ci-parallelism.md` -> Scenario: Running integration tests only
  - **Validation Steps**:
    1. Run `npm run test:integration`.
    2. Verify it only runs integration test files (3 files: `pipeline.integration.test.ts`, `admin-tier-integration.test.ts`, `integration.test.ts`) and excludes other tests.

### Task 2: Deconstruct `.github/workflows/build-and-test.yml` into parallel jobs

- [x] **Test Case 1: Build-and-unit job syntax and dependencies**
  - **Task Link**: Task 2 (Deconstruct build-and-test.yml)
  - **Spec Scenario Link**: `specs/ci-parallelism.md` -> Scenario: Pull request build succeeds and triggers downstream parallel suites
  - **Validation Steps**:
    1. Validate GitHub Actions workflow YAML structure using local parser or linters: `npx ajv-cli` or online GHA validators.
    2. Verify the `build-and-unit` job has no dependencies, compiles, runs unit tests, and uploads the `.output/` artifact.
- [x] **Test Case 2: Parallel jobs and dependency mapping**
  - **Task Link**: Task 2 (Deconstruct build-and-test.yml)
  - **Spec Scenario Link**: `specs/ci-parallelism.md` -> Scenario: Pull request build succeeds and triggers downstream parallel suites
  - **Validation Steps**:
    1. Verify `integration` job has `needs: [build-and-unit]`.
    2. Verify `e2e` job has `needs: [build-and-unit]`.
    3. Verify they have no mutual dependency, permitting parallel allocation.
- [x] **Test Case 3: Fail-fast flow**
  - **Task Link**: Task 2 (Deconstruct build-and-test.yml)
  - **Spec Scenario Link**: `specs/ci-parallelism.md` -> Scenario: Pull request build fails and skips downstream suites
  - **Validation Steps**:
    1. Verify that if `build-and-unit` fails, downstream jobs are skipped and the pipeline immediately fails.
- [x] **Test Case 4: Combined coverage report finalization**
  - **Task Link**: Task 2 (Deconstruct build-and-test.yml)
  - **Spec Scenario Link**: `specs/ci-parallelism.md` -> Scenario: Merging of parallel coverage runs
  - **Validation Steps**:
    1. Verify `finalize-coverage` job has `needs: [build-and-unit, integration, e2e]` and executes `if: always()`.
    2. Verify it triggers the `./codacy-coverage-reporter.sh final` hook successfully.
