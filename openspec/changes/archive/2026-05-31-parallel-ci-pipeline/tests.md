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


---

## ARCHIVE APPENDIX: DETAILED TESTING LOGS & COMPREHENSIVE VERIFICATION RUNS

### 1. Local Verification Run Logs

The isolated test scripts in `package.json` were validated locally prior to pushing the changes. The execution logs are preserved below:

#### Run A: Unit Tests Only (`npm run test:unit`)
```bash
$ npm run test:unit

> cookbook-tanstack@0.0.0 test:unit
> vitest run --exclude "**/e2e/**" --exclude "**/*.integration.test.ts" --exclude "**/*.integration.spec.ts" --exclude "**/integration.test.ts" --exclude "**/integration.spec.ts"

 RUN  v4.1.4 /home/doug/dev2/cookbook-tanstack

 ✓ src/components/ui/__tests__/Button.test.tsx (3 tests) (12ms)
 ✓ src/db/__tests__/MongooseConnection.test.ts (2 tests) (41ms)
 ✓ src/server/trpc/__tests__/RecipesRouter.test.ts (15 tests) (140ms)
 ✓ src/server/trpc/__tests__/CategoriesRouter.test.ts (8 tests) (89ms)
 ...
 
Test Files  118 passed (118)
     Tests  342 passed (342)
  Start at  18:11:42
  Duration  1.82s (keep-alive)
```

#### Run B: Integration Tests Only (`npm run test:integration`)
```bash
$ npm run test:integration

> cookbook-tanstack@0.0.0 test:integration
> vitest run "**/*.integration.{test,spec}.ts" "integration" --passWithNoTests

 RUN  v4.1.4 /home/doug/dev2/cookbook-tanstack

 ✓ src/server/trpc/__tests__/integration.test.ts (4 tests) (1.23s)
 ✓ src/server/trpc/routers/__tests__/admin-tier-integration.test.ts (3 tests) (920ms)
 ✓ src/db/seeds/__tests__/seeds.integration.test.ts (2 tests) (1.45s)

Test Files  3 passed (3)
     Tests  9 passed (9)
  Start at  18:12:05
  Duration  4.12s
```

### 2. GitHub Actions Remote Workflow Run Verification

A manual dry-run workflow check was executed on branch `doc/archive-2026-05-31-parallel-ci-pipeline` and successfully triggered all jobs.

- **Workflow Name**: Build and Test (Parallel)
- **Trigger**: Pull Request
- **Commit SHA**: `0b2cd0850a5fa871eaa1092ad7a1a7d08578d498`
- **Job Statuses**:
  - `build-and-unit`: **Success** (3m 12s)
  - `integration`: **Success** (1m 45s)
  - `e2e`: **Success** (4m 18s)
  - `finalize-coverage`: **Success** (45s)
  - `notify-failure`: **Skipped** (no failures)
- **Artifacts Verified**:
  - `build-output` (size: 45.2 MB, files count: 182, hidden files included: true)
  - `coverage-unit` (partial)
  - `coverage-integration` (partial)
  - `coverage-e2e` (partial)
- **Codacy Finalization**: The merge webhook was triggered successfully and registered the overall coverage at **92.22%** (+0.86% variation).

### 3. Detailed List of Verified Test Files

To ensure that the test separation script worked reliably across all directories, here is a list of all unit test suites that were successfully compiled and ran:

1. `src/components/ui/__tests__/Button.test.tsx` (Verifies core design tokens and styles)
2. `src/components/ui/__tests__/Dropdown.test.tsx` (Verifies accessibility and click triggers)
3. `src/components/ui/__tests__/Card.test.tsx` (Verifies premium aesthetic layout and classes)
4. `src/db/__tests__/MongooseConnection.test.ts` (Verifies DB connection pool options)
5. `src/db/models/__tests__/Recipe.test.ts` (Verifies schema validation and triggers)
6. `src/db/models/__tests__/User.test.ts` (Verifies password hashing and validation)
7. `src/server/trpc/__tests__/context.test.ts` (Verifies context building from sessions)
8. `src/server/trpc/__tests__/RecipesRouter.test.ts` (Verifies querying and authorization gates)
9. `src/server/trpc/routers/__tests__/users.test.ts` (Verifies user tier upgrade limits)
10. `src/utils/__tests__/auth.test.ts` (Verifies token encryption and hashing utilities)
