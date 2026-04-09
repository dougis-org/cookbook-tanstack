## Context

- Relevant architecture: Playwright end-to-end tests live in `src/e2e/` and run through `playwright.config.ts`. CI executes them in `.github/workflows/build-and-test.yml` after build, Vitest coverage, Playwright browser installation, and MongoDB seed/setup.
- Dependencies: `@playwright/test`, `@bgotink/playwright-coverage`, GitHub Actions runner behavior, local Nitro production server boot from `.output/server/index.mjs`, MongoDB replica set startup, and existing E2E helper utilities in `src/e2e/helpers/`.
- Interfaces/contracts touched: Playwright worker configuration, CI workflow step ordering and reporting, any helper or spec-file structure that assumes serialized execution, and any diagnostics emitted for CI runtime visibility.

## Goals / Non-Goals

### Goals

- Preserve full-suite Playwright execution and E2E coverage on every pull request.
- Reduce CI minutes used by the Playwright segment without trading away determinism.
- Prefer low-complexity single-runner optimizations before introducing multi-job sharding.
- Make suite skew and concurrency risks observable enough to support future tuning.
- Keep changes rollbackable if worker increases expose flaky shared-state behavior.

### Non-Goals

- Implement selective or impacted-test execution in CI.
- Remove E2E coverage from pull requests.
- Redesign the entire build-and-test workflow beyond what Playwright optimization requires.
- Commit to matrix sharding in the first pass if single-runner concurrency produces acceptable savings.

## Decisions

### Decision 1: Optimize single-runner concurrency before adding shard matrices

- Chosen: Increase Playwright worker count in CI incrementally from the current serialized baseline and validate stability before considering multi-runner sharding.
- Alternatives considered: add GitHub Actions shard matrix immediately; keep workers at `1` and optimize only test code; pursue selective test execution first.
- Rationale: Single-runner concurrency is the lowest-complexity path to reducing CI minutes because it reuses one checkout, one dependency install, one browser install, one seeded database, and one server boot.
- Trade-offs: Gains may plateau if a few heavy spec files dominate runtime, and worker increases may expose hidden data contention.

### Decision 2: Treat suite balancing as part of the implementation path, not optional cleanup

- Chosen: Profile or inspect spec-level skew and refactor high-cost files or repeated setup flows where needed to support deterministic parallel execution.
- Alternatives considered: rely entirely on worker-count increases; defer all spec balancing to a later change; jump straight to duration-based sharding.
- Rationale: Existing large spec files with repeated `beforeAll` setup are likely to dominate job tails and reduce the value of parallel workers.
- Trade-offs: Refactoring tests increases implementation scope, but it addresses the actual source of skew and reduces future flake risk.

### Decision 3: Keep runtime diagnostics lightweight and directly actionable

- Chosen: Capture only enough CI runtime signal to identify slow specs, retry behavior, and whether worker increases reduce total minutes; avoid heavyweight long-term instrumentation unless needed.
- Alternatives considered: add broad custom telemetry; rely solely on anecdotal CI timing; defer measurement until after code changes land.
- Rationale: The change needs measurable outcomes, but additional instrumentation should not itself become a significant runtime cost or maintenance burden.
- Trade-offs: Lightweight measurement may be less granular than full telemetry, but it is easier to keep and easier to remove if unnecessary.

### Decision 4: Defer deterministic impacted-test selection to issue #277

- Chosen: Keep selective E2E execution out of this implementation and document it as separate spike work.
- Alternatives considered: combine concurrency optimization with impacted-test routing; use heuristic filtering as a temporary step.
- Rationale: Test-selection correctness is a separate research problem with broader false-negative risk than the immediate concurrency work.
- Trade-offs: The first pass may leave additional savings on the table, but it avoids coupling a pragmatic performance fix to speculative routing logic.

## Proposal to Design Mapping

- Proposal element: keep the full E2E suite on every PR
  - Design decision: Decision 1 and Decision 4
  - Validation approach: CI continues invoking the full Playwright suite in the main workflow, with no selective filtering logic added.
- Proposal element: reduce CI minutes with a deterministic execution model
  - Design decision: Decision 1 and Decision 3
  - Validation approach: compare CI runtime and retry behavior before and after worker-count and workflow adjustments.
- Proposal element: rebalance heavy specs or setup patterns when needed
  - Design decision: Decision 2
  - Validation approach: identify outlier spec files and verify balanced execution through test/runtime results.
- Proposal element: keep selective execution as separate research
  - Design decision: Decision 4
  - Validation approach: proposal/tasks/specs for this change exclude test-selection routing work and reference issue `#277` separately.

## Functional Requirements Mapping

- Requirement: CI must continue running the full Playwright suite and coverage collection on every pull request.
  - Design element: Decision 1, Decision 4
  - Acceptance criteria reference: `specs/e2e-ci-performance/spec.md` requirement 1
  - Testability notes: validate workflow invocation path and ensure no spec selection or coverage removal is introduced.
- Requirement: CI must support a safe worker count above the current serialized baseline when the suite is stable enough.
  - Design element: Decision 1
  - Acceptance criteria reference: `specs/e2e-ci-performance/spec.md` requirement 2
  - Testability notes: validate Playwright config/workflow changes and confirm successful repeated runs without new flaky failures.
- Requirement: Heavy test skew must be identified and addressed when it prevents concurrency gains.
  - Design element: Decision 2
  - Acceptance criteria reference: `specs/e2e-ci-performance/spec.md` requirement 3
  - Testability notes: inspect changed spec structure and compare runtime distribution or execution bottlenecks before and after.
- Requirement: The change must leave a clear path to revert if CI becomes unstable.
  - Design element: Decision 3, rollback section
  - Acceptance criteria reference: `specs/e2e-ci-performance/spec.md` requirement 4
  - Testability notes: ensure rollback steps are documented and configuration changes are isolated.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Reduce Playwright-related CI minutes without multiplying fixed setup overhead through premature sharding.
  - Design element: Decision 1
  - Acceptance criteria reference: `specs/e2e-ci-performance/spec.md` requirement 2
  - Testability notes: compare GitHub Actions runtime before and after the change.
- Requirement category: reliability
  - Requirement: Concurrency changes must not introduce unacceptable flakiness or hidden shared-state failures.
  - Design element: Decision 1, Decision 2
  - Acceptance criteria reference: `specs/e2e-ci-performance/spec.md` requirements 2 and 3
  - Testability notes: repeated CI runs, retry inspection, and targeted local/CI validation around refactored specs.
- Requirement category: operability
  - Requirement: Maintainers must be able to see whether savings came from worker tuning or spec balancing and revert quickly if needed.
  - Design element: Decision 3
  - Acceptance criteria reference: `specs/e2e-ci-performance/spec.md` requirement 4
  - Testability notes: verify documentation or workflow output is sufficient to explain behavior and reversal steps.
- Requirement category: security
  - Requirement: CI changes must preserve the existing security/review posture and not bypass required checks.
  - Design element: operational blocking policy
  - Acceptance criteria reference: `specs/e2e-ci-performance/spec.md` requirement 4
  - Testability notes: verify workflow still runs through standard PR checks and does not suppress failure signals.

## Risks / Trade-offs

- Risk/trade-off: Raising workers may reveal test isolation gaps that were previously hidden by serialized execution.
  - Impact: CI instability, retries, or nondeterministic failures.
  - Mitigation: raise worker count incrementally, isolate shared-state assumptions, and rebalance problematic specs before increasing further.
- Risk/trade-off: Profiling data may show that a few large files dominate runtime, forcing additional refactor work.
  - Impact: more implementation effort than a config-only change.
  - Mitigation: keep the scope focused on the highest-impact files and helpers rather than broad test rewrites.
- Risk/trade-off: If savings from single-runner concurrency are modest, the team may still need sharding later.
  - Impact: this change may be only the first performance step rather than the final solution.
  - Mitigation: preserve diagnostics and suite structure improvements so future sharding decisions are better informed.

## Rollback / Mitigation

- Rollback trigger: repeated CI flakes, materially worse retry rates, or no meaningful CI-minute improvement after enabling higher worker counts.
- Rollback steps: restore the prior Playwright CI worker configuration; revert any workflow/runtime tuning that increased concurrency; keep only harmless observability changes if they provide value independently.
- Data migration considerations: none; this change affects CI behavior and test structure only.
- Verification after rollback: confirm CI returns to the previous serialized Playwright behavior and passes consistently with the baseline workflow.

## Operational Blocking Policy

- If CI checks fail: stop raising concurrency, inspect whether failures are caused by test isolation or workflow sequencing, and either fix the blocking issue within this change or revert to the last stable worker setting before merging.
- If security checks fail: treat the change as blocked until the failing check is understood and resolved; do not merge by suppressing or bypassing repository security controls.
- If required reviews are blocked/stale: update the proposal/design/specs/tasks if scope drift occurred during remediation, then re-request review with the revised artifact set.
- Escalation path and timeout: if reliable worker increases cannot be achieved within the scoped change, ship only the stable diagnostic/spec-balancing improvements or pause the implementation and follow up with a narrower change rather than forcing a flaky optimization through review.

## Open Questions

- What CI-minute reduction threshold should be used to declare the first pass successful?
- Should runtime diagnostics remain in the workflow permanently if they add minor overhead but continue to help with later tuning?
- If skew remains high after the first refactor pass, should follow-up sharding work be proposed immediately or only after additional CI history is gathered?
