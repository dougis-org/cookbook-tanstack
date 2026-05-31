## GitHub Issues

- #473

## Why

- **Problem statement**: The current CI workflow (`build-and-test.yml`) executes all build and test suites sequentially inside a single runner job. This results in longer CI execution times and packs all logs (unit tests, database seeding, server warmup, Playwright output) into a single monolithic stream. This makes debugging failures hard and increases overall CI turnaround time.
- **Why now**: As the codebase grows and more E2E tests are added, sequential runner times will degrade significantly. Implementing parallelism now will prevent bottlenecking pull request review throughput.
- **Business/user impact**: Improved developer feedback loop, faster CI checks on Pull Requests, and instant visibility into which phase (build, unit, integration, or E2E) failed, accelerating troubleshooting.

## Problem Space

- **Current behavior**: A single runner executes the setup, builds the production server, runs unit and integration tests sequentially, installs Playwright, runs E2E tests, and uploads coverage/runtime reports sequentially.
- **Desired behavior**:
  - A fast fail-fast phase: Build and run unit tests first.
  - If successful, trigger parallel, independent jobs: one for Vitest integration tests and one for Playwright E2E tests.
  - Independent, dedicated logs for each phase.
  - Shared build output (`.output/`) to prevent duplicate compilation.
  - Coordinated finalization of coverage results on Codacy.
- **Constraints**:
  - Keep using standard GitHub Actions runners (`ubuntu-latest`).
  - Playwright E2E tests must have a real MongoDB instance.
  - Vitest unit/integration tests must use isolated databases (already solved via `mongodb-memory-server` + isolated DB names per worker).
- **Assumptions**:
  - GitHub Actions runners spin up fast enough that parallel job overhead is outweighed by concurrent execution times.
  - Caching (`setup-node` node_modules cache) will keep runner initialization fast.
- **Edge cases considered**:
  - Lockfile auto-updates: The check to commit and push updated lockfiles must only run in the initial `build-and-unit` job.
  - Codacy Coverage: Since there are multiple parallel test runs contributing to coverage, they must all upload partial reports, and a final downstream job must run the `final` merge request.

## Scope

### In Scope

- Adding custom npm scripts in `package.json` to execute unit and integration test suites separately (`npm run test:unit`, `npm run test:integration`).
- Refactoring `.github/workflows/build-and-test.yml` to split the monolithic job into:
  - `build-and-unit` (Initial, uploads build output `.output/` and runs unit tests)
  - `integration` (Downstream, depends on `build-and-unit`, runs integration tests in parallel)
  - `e2e` (Downstream, depends on `build-and-unit`, downloads build output `.output/`, boots Docker MongoDB, runs Playwright)
  - `finalize-coverage` (Downstream, depends on all, runs `always()`, calls final Codacy upload)
  - `notify-failure` (Downstream, comments on PR if any job fails)
- Leveraging GitHub Actions build artifact uploads and downloads for `.output/`.

### Out of Scope

- Upgrading Vitest or Playwright versions.
- Altering any application logic or React components.
- Changing test assertions or database setup files.

## What Changes

- `package.json`: Add scripts `test:unit` and `test:integration`.
- `.github/workflows/build-and-test.yml`: Split into `build-and-unit`, `integration`, `e2e`, `finalize-coverage`, and `notify-failure` jobs.

## Risks

- **Risk**: Increased GitHub Actions billing minutes due to separate runners downloading dependencies.
  - **Impact**: Minor cost increase.
  - **Mitigation**: Standard node caching ensures that `npm install` runs in seconds. The developer turnaround time savings far outweigh runner startup overhead.
- **Risk**: Flaky E2E test failures caused by server warmup issues on cold VM startup.
  - **Impact**: False negative CI failures.
  - **Mitigation**: Preserve the robust warmup checks and server PID monitoring currently implemented in the warmup step.

## Open Questions

- **Question**: Do we have unresolved ambiguity?
  - **Needed from**: Developer
  - **Blocker for apply**: No. All specifications have been verified against local test runtimes and dependencies.

## Non-Goals

- Eliminating `mongodb-memory-server` from Vitest tests.
- Re-writing the database seed script.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`, `specs/**/*.md`, and `tasks.md` before implementation starts.
