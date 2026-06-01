## Context

- **Relevant architecture**: GitHub Actions workflows defined in `.github/workflows/build-and-test.yml`. Test executions managed via `vitest` (unit/integration) and `playwright` (E2E).
- **Dependencies**: 
  - `@bgotink/playwright-coverage` and `playwright-report` artifacts.
  - Codacy Coverage Reporter CLI.
- **Interfaces/contracts touched**:
  - `package.json` scripts interface.
  - GitHub Actions artifacts upload/download contracts.
  - Codacy reporting pipeline.

## Goals / Non-Goals

### Goals

- Split build and unit testing from integration and E2E testing into a fail-fast structure.
- Run integration tests and E2E tests concurrently on separate runners.
- Separate log outputs in the GitHub Actions UI.
- Share build outputs (.output) from the compilation job to the E2E job to avoid rebuilding.
- Maintain full, combined test coverage upload on Codacy.

### Non-Goals

- Refactoring Vitest configuration files (`vitest.config.ts`, `vite.config.test.ts`).
- Modifying E2E test files or logic under `src/e2e/`.

## Decisions

### Decision 1: Split test suites via package.json scripts

- **Chosen**: Define distinct commands for unit and integration suites inside `package.json`:
  ```json
  "test:unit": "vitest run --exclude \"**/e2e/**\" --exclude \"**/*.integration.test.ts\" --exclude \"**/*.integration.spec.ts\"",
  "test:integration": "vitest run \"**/*.integration.test.ts\" \"**/*.integration.spec.ts\""
  ```
- **Alternatives considered**: Directly passing flags in the GitHub Actions workflow steps.
- **Rationale**: Keeping the scripts inside `package.json` allows developers to run unit and integration tests locally with the exact same filters used in CI, promoting consistency and ease of use.
- **Trade-offs**: Slightly longer `package.json` file.

### Decision 2: Reuse build output via GHA Artifacts

- **Chosen**: The `build-and-unit` job compiles the project (`npm run build`) and uploads the compiled folder (`.output/`) using `actions/upload-artifact@v6`. The downstream `e2e` job downloads this artifact using `actions/download-artifact@v6` before starting the E2E tests.
- **Alternatives considered**: Rebuilding the app from scratch in the E2E job.
- **Rationale**: Building the app compiles the entire Nitro/Vite production package (~2.5 MB of code, TS compiling, etc.), taking ~15-20 seconds. Compiling twice consumes extra runner minutes and slows down CI. Uploading and downloading takes less than 3 seconds.
- **Trade-offs**: Consumes GitHub Actions artifact storage space (retained for 1 day).

### Decision 3: Partial coverage uploads with dedicated downstream finalization

- **Chosen**: Run tests with `--coverage` in both `build-and-unit` and `integration` jobs. Each job uploads its coverage report (`coverage/lcov.info`) using the Codacy reporter CLI with the `--partial` flag. Playwright E2E coverage is also uploaded as a partial. A lightweight job `finalize-coverage` depends on all of them, executes `if: always()`, and triggers `./codacy-coverage-reporter.sh final`.
- **Alternatives considered**: Merging reports manually using `nyc` or upload without the final hook.
- **Rationale**: Codacy natively supports partial uploads and handles combining coverage internally once `final` is called, ensuring perfect accuracy without complex manual merge script maintenance.
- **Trade-offs**: Requires a short downstream finalization job.

## Proposal to Design Mapping

- **Proposal element**: Custom npm scripts to isolate unit and integration tests.
  - **Design decision**: Decision 1.
  - **Validation approach**: Local execution of `npm run test:unit` and `npm run test:integration` to verify they run correct subsets.
- **Proposal element**: Fail-fast compilation and unit test job.
  - **Design decision**: Refactored `build-and-unit` job structure in `build-and-test.yml` running first.
  - **Validation approach**: Inspecting GHA run diagrams to confirm it executes before downstream jobs.
- **Proposal element**: Parallel execution of integration and E2E suites.
  - **Design decision**: `integration` and `e2e` jobs depend on `build-and-unit` via `needs: [build-and-unit]`.
  - **Validation approach**: GHA logs showing concurrent VM allocations.
- **Proposal element**: Shared build artifacts to optimize runtime.
  - **Design decision**: Decision 2 (upload/download artifact).
  - **Validation approach**: E2E server warmup succeeds using the downloaded `.output/` directory.

## Functional Requirements Mapping

- **Requirement**: CI pipeline must fail-fast on build or unit test failures.
  - **Design element**: `build-and-unit` is root. Downstream jobs only execute if it passes.
  - **Acceptance criteria reference**: `specs/ci-parallelism/spec.md` -> AC-1.
  - **Testability notes**: Verified by forcing a unit test failure locally or in CI and confirming no integration or E2E VM boots up.
- **Requirement**: Integration and E2E tests must execute concurrently.
  - **Design element**: Separate GHA jobs defined in parallel block.
  - **Acceptance criteria reference**: `specs/ci-parallelism/spec.md` -> AC-2.
  - **Testability notes**: GHA workflow graph validation.

## Non-Functional Requirements Mapping

- **Requirement category**: Operability / Visibility
  - **Requirement**: CI failure logs must be easily isolated per suite.
  - **Design element**: Separate GHA jobs ensure independent log screens.
  - **Acceptance criteria reference**: `specs/ci-parallelism/spec.md` -> AC-3.
  - **Testability notes**: Inspect GHA execution output after a run.
- **Requirement category**: Reliability
  - **Requirement**: Codacy combined coverage statistics must remain accurate.
  - **Design element**: Decision 3 (partial upload + finalization job).
  - **Acceptance criteria reference**: `specs/ci-parallelism/spec.md` -> AC-4.
  - **Testability notes**: Check Codacy project dashboard on next pull request build.

## Risks / Trade-offs

- **Risk/trade-off**: Downstream jobs must wait for `npm install` on their respective runners, introducing slight setup overhead.
  - **Impact**: Dynamic VM startup latency.
  - **Mitigation**: We utilize the official `actions/setup-node@v6` action with its built-in `cache: 'npm'` option, restoring cached node modules instantly.

## Rollback / Mitigation

- **Rollback trigger**: Parallel jobs experience persistent VM startup timeouts or Codacy fails to receive complete coverage reports.
- **Rollback steps**: Revert `.github/workflows/build-and-test.yml` and `package.json` to their pre-change state in Git.
- **Data migration considerations**: None (stateless CI infrastructure).
- **Verification after rollback**: Verify a pull request run executes successfully in a single sequential sequence as before.

## Operational Blocking Policy

- **If CI checks fail**: Under repository standards, merge is strictly blocked. No force merge is permitted.
- **If security checks fail**: Snyk/Codacy alerts must be remediated or officially dismissed by repository administrators.
- **If required reviews are blocked/stale**: Direct pinging on Slack/Teams or comment thread resolutions to allow auto-merge.
- **Escalation path and timeout**: Stale comments must be explicitly addressed and marked resolved.

## Open Questions

- **Question**: None. The design is completely validated.
