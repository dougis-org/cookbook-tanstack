## GitHub Issues

- #244
- #277

## Why

- Problem statement: Pull requests run the full Playwright suite, which preserves confidence but contributes materially to CI usage. The current CI configuration serializes Playwright execution in a single worker, so the repository is not yet using the simplest available runtime optimization.
- Why now: E2E coverage and CI reporting are already in place, which means the next bottleneck is execution efficiency rather than missing observability. Reducing avoidable Playwright cost will improve CI usage without weakening validation.
- Business/user impact: Lower CI minutes reduce infrastructure cost and shorten feedback loops without removing full-suite PR protection.

## Problem Space

- Current behavior: `.github/workflows/build-and-test.yml` runs the entire E2E suite on every PR after build, unit/integration tests, browser install, database seed, and server startup. `playwright.config.ts` sets `workers: process.env.CI ? 1 : undefined`, which serializes CI execution even though the suite is configured as `fullyParallel`.
- Desired behavior: CI continues to run the full Playwright suite on every PR, but does so with a more efficient and measurable execution model that reduces CI minutes while keeping results deterministic and reliable.
- Constraints: The suite must remain reliable in GitHub Actions, E2E coverage must continue to run on every PR, and any concurrency increase must avoid introducing data races or flaky shared-state behavior. The initial change should prefer low-complexity optimizations over speculative test-selection logic.
- Assumptions: `workers: 1` was chosen conservatively rather than in response to a known blocking flake pattern; the suite can likely support at least modest intra-run parallelism if shared-state hotspots are addressed; large spec files and repeated setup work are meaningful contributors to total runtime.
- Edge cases considered: slow outlier spec files dominating runtime; retries masking new flakiness after worker increases; concurrent tests contending on shared database state; E2E coverage overhead reducing gains from parallelism; changes that require a full-suite fallback even if selective execution is researched later.

## Scope

### In Scope

- Measure current Playwright runtime characteristics in CI, including per-spec skew and retry behavior.
- Increase CI efficiency while keeping the full E2E suite on every PR.
- Prefer single-runner optimizations first, including calibrated Playwright worker increases and suite balancing.
- Refactor disproportionately heavy E2E specs or setup patterns when needed to make parallel execution reliable.
- Preserve existing E2E coverage collection and reporting on pull requests.
- Capture selective or impacted-test execution only as research context, not as part of the first implementation pass.

### Out of Scope

- Skipping the full E2E suite on pull requests.
- Merging a deterministic impacted-test routing system into CI as part of this change.
- Removing E2E coverage from pull requests.
- Broad CI workflow redesign unrelated to the Playwright segment.
- Reducing validation depth by deleting coverage-bearing tests to gain speed.

## What Changes

- Add instrumentation or reporting needed to understand which Playwright specs and setup phases dominate CI minutes.
- Adjust Playwright CI execution to test and adopt safe worker counts above the current serialized baseline.
- Restructure high-skew E2E specs or shared setup flows where required to support deterministic parallel execution.
- Update CI workflow steps, documentation, and tests so the optimized Playwright path remains observable and maintainable.
- Reference GitHub issue `#277` as a separate spike for researching deterministic impacted-test selection after the initial optimization work.

## Risks

- Risk: Increasing Playwright workers exposes hidden shared-state or timing dependencies and causes flaky CI.
  - Impact: CI reliability drops, retries increase, and any runtime savings may be erased by reruns.
  - Mitigation: Introduce worker-count changes incrementally, measure retries/failures, and rebalance or isolate the worst offending specs before raising concurrency further.
- Risk: Heavy spec-file skew causes parallel execution to underperform because one long-running file dominates the job tail.
  - Impact: CI minutes remain high despite worker changes.
  - Mitigation: Identify outlier spec files and split or refactor them so workload distribution becomes more even.
- Risk: Additional measurement or artifact collection adds overhead that offsets runtime gains.
  - Impact: The change increases complexity without materially lowering CI minutes.
  - Mitigation: Keep diagnostics lightweight, validate net CI-minute reduction against baseline runs, and remove temporary instrumentation that does not justify its cost.
- Risk: Scope expands from pragmatic CI tuning into a broader selective-test system.
  - Impact: Delivery slows and the initial optimization becomes blocked on unresolved research.
  - Mitigation: Keep selective execution explicitly out of scope for this change and track it separately in issue `#277`.

## Open Questions

- Question: What CI-minute reduction threshold is sufficient to consider the first pass successful?
  - Needed from: requester/human approver
  - Blocker for apply: no
- Question: Should the implementation stop after reaching a stable higher worker count, or should it also include mandatory spec-file rebalancing in the same change if skew remains high?
  - Needed from: requester/human approver
  - Blocker for apply: no
- Question: Are there any known historically flaky Playwright areas that should be treated as concurrency-sensitive from the start?
  - Needed from: maintainers with CI history
  - Blocker for apply: no

## Non-Goals

- Building or deploying a deterministic impacted-test selector in CI.
- Replacing Playwright with a different E2E framework.
- Changing unrelated unit-test, build, or deployment workflows beyond what the Playwright optimization requires.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
