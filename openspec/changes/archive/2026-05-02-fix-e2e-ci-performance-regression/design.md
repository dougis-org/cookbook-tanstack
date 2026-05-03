## Context

- **Relevant architecture:**
  - `.github/workflows/build-and-test.yml` — CI pipeline; `Run E2E tests` step has `timeout-minutes: 10` and `continue-on-error: ${{ github.event_name == 'pull_request' }}`.
  - `playwright.config.ts` — `webServer.timeout: 60000`, `webServer.url: "http://localhost:3000"`, `retries: 2` in CI, `workers: 2` in CI (via `PLAYWRIGHT_CI_WORKERS`).
  - `.output/server/index.mjs` — Nitro production server. All `/**` routes go through `defineLazyEventHandler` that lazy-loads `_chunks/ssr-renderer.mjs`, which in turn calls `lazyService(() => import("./_ssr/ssr.mjs"))`. Static assets (`/assets/**`) are served by the eagerly-loaded `static_default` middleware.
  - `src/routes/__root.tsx` — Boot loader mechanism: inline CSS sets `#app-shell { display: none }`, external stylesheet sets `#app-shell { display: block }`. Inline boot loader script listens for the CSS link element's `load` event to hide the boot loader and reveal the app.
  - `package.json` overrides — `h3: "2.0.1-rc.20"`, `h3-v2: "npm:h3@2.0.1-rc.20"`. npm `latest` is `2.0.1-rc.21`.
- **Dependencies:** `@tanstack/react-start@1.167.58`, `@tanstack/start-server-core` (pins `h3-v2` at rc.20 internally), `nitro` (requires `h3: ^2.0.1-rc.20`).
- **Interfaces/contracts touched:** CI workflow YAML, `playwright.config.ts`, `package.json` overrides.

## Goals / Non-Goals

### Goals

- Identify the exact TanStack Start version where the regression landed.
- Understand the behavioral change and implement a targeted fix.
- Restore E2E segment to ~3.5 minutes wall-clock (155 tests, 2 workers).
- Restore h3 override to rc.21.
- Ensure `webServer.timeout` is set to a value justified by measured CI startup time.

### Non-Goals

- Reverting TanStack package versions.
- Refactoring the boot loader mechanism.
- Broader CI performance optimization beyond restoring the pre-upgrade baseline.

## Decisions

### Decision 1: Version bisection approach

- **Chosen:** Binary-search `@tanstack/react-start` versions between 1.167.17 and 1.167.52 in a local or CI environment to isolate the exact breaking version. Once isolated, inspect that version's changelog and diff to understand the behavioral change.
- **Alternatives considered:** Trust the research finding (RSC CSS auto-injection in ~1.167.46) and target that version directly without bisecting. Rejected because the research is based on LLM-synthesized changelog analysis and needs empirical confirmation.
- **Rationale:** The bisect gives a ground-truth answer and is fast (7 versions to test in 3 rounds). It also guards against the fix being incomplete if multiple versions contributed changes.
- **Trade-offs:** Requires CI runs or local E2E runs per version being tested, adding investigation time. A local run without the CI MongoDB replica set may not reproduce the issue exactly.

### Decision 2: Fix target — server-side vs. CI warmup

- **Chosen:** Investigate whether the issue is (a) a server behavior change requiring a code/config fix, or (b) a timing issue between `webServer` health check and full server readiness requiring a CI warmup step. Implement whichever the investigation confirms; if both apply, implement both.
- **Alternatives considered:**
  - CI warmup only (add a `curl` or `wget` step between server start and Playwright): simple but treats the symptom without understanding the cause.
  - Server code change only: appropriate if the root cause is in TanStack Start's new behavior.
- **Rationale:** The investigation must lead the fix. A CI warmup is the lowest-risk mitigation if the root cause is server startup timing. A server config change is required if TanStack Start changed default behavior (e.g., enabled a new CSS pipeline that needs disabling or configuring).
- **Trade-offs:** Investigation-first approach delays the fix slightly but produces a durable solution.

### Decision 3: h3 override restoration

- **Chosen:** Restore `h3` and `h3-v2` overrides to `2.0.1-rc.21` (npm `latest`). Verify with `npm install`, `npm run build`, and a full CI run.
- **Alternatives considered:** Leave at rc.20. Rejected because rc.20 was a conservative downgrade to match `@tanstack/start-server-core`'s internal `h3-v2` pin — but that pin is a separate npm alias and does not conflict with the top-level `h3` resolution being rc.21.
- **Rationale:** npm `latest` is rc.21. The Codacy inconsistency that triggered the downgrade was a false positive: `h3` and `h3-v2` can legitimately resolve to different RC versions since they serve different consumers.
- **Trade-offs:** Small risk that rc.21 introduces a runtime difference. Mitigated by the fact that rc.21's changes are minor and unrelated to request handling or server startup.

### Decision 4: webServer timeout

- **Chosen:** Restore `webServer.timeout` to `120000` (2 minutes) as a safe default, unless investigation reveals the server reliably starts within 60s in CI. Document the chosen value with a comment explaining the measured startup time.
- **Alternatives considered:** Leave at 60s. Risky if the post-upgrade server takes longer to initialize the lazy SSR bundle. The prior value of 120s was removed without justification in PR #415.
- **Rationale:** The `continue-on-error` comment in the CI workflow notes that the server sometimes hangs on MongoDB connection. A 120s timeout provides headroom for this without masking real failures (Playwright will still fail if the server never becomes ready).
- **Trade-offs:** Adds up to 60s to CI failure time if the server truly fails to start, but does not affect passing runs.

## Proposal to Design Mapping

- Proposal element: Identify exact breaking TanStack Start version
  - Design decision: Decision 1 (version bisection)
  - Validation approach: Local E2E run with isolated version confirms/denies the failure
- Proposal element: Fix without reverting versions
  - Design decision: Decision 2 (server-side vs. CI warmup investigation)
  - Validation approach: All 155 tests pass in CI within 10-minute budget
- Proposal element: Restore h3 to rc.21
  - Design decision: Decision 3
  - Validation approach: `npm install` clean, `npm run build` succeeds, CI green
- Proposal element: webServer timeout adjustment
  - Design decision: Decision 4
  - Validation approach: E2E step completes (not times out) on main branch CI

## Functional Requirements Mapping

- Requirement: All 155 E2E tests complete without timeout in CI
  - Design element: Decision 2 fix (server behavior or warmup)
  - Acceptance criteria reference: specs/e2e-ci-performance/spec.md
  - Testability notes: CI build-and-test run on main must show `Run E2E tests` step completing (not timed out), with playwright-report artifact uploaded
- Requirement: h3 resolved at rc.21 in installed node_modules
  - Design element: Decision 3
  - Acceptance criteria reference: specs/package-overrides/spec.md
  - Testability notes: `npm ls h3` shows `2.0.1-rc.21`; no peer dependency warnings
- Requirement: E2E wall-clock time returns to ~3.5 min baseline
  - Design element: Decision 2 fix
  - Acceptance criteria reference: specs/e2e-ci-performance/spec.md
  - Testability notes: `scripts/ci/report-playwright-runtime.mjs` output in CI; total duration reported in `playwright-report/results.json`

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: `continue-on-error` on PRs should not be needed as a permanent workaround
  - Design element: Decision 2 fix (the fix restores reliable E2E execution)
  - Acceptance criteria reference: specs/e2e-ci-performance/spec.md
  - Testability notes: After fix, the `continue-on-error` comment in `.github/workflows/build-and-test.yml` should be removed and CI should remain green
- Requirement category: operability
  - Requirement: `webServer.timeout` must be documented with a rationale
  - Design element: Decision 4
  - Acceptance criteria reference: specs/ci-config/spec.md
  - Testability notes: Code review — `playwright.config.ts` must have an inline comment explaining the timeout value

## Risks / Trade-offs

- Risk/trade-off: Bisection requires multiple CI runs or reliable local reproduction
  - Impact: Investigation takes 1–3 hours if CI-based, faster if local E2E can reproduce the issue
  - Mitigation: The failure mode (pre-heating stuck on `/`) should be locally reproducible using `npm run build && PORT=3000 node .output/server/index.mjs` with Playwright pointed at localhost
- Risk/trade-off: The fix addresses a TanStack Start internal behavior that may change again in future upgrades
  - Impact: Regression recurs on next TanStack Start upgrade
  - Mitigation: Document the root cause in `design.md` and `cerebrum.md`; add a note to the upgrade process

## Rollback / Mitigation

- **Rollback trigger:** If the fix causes new test failures or build errors on main.
- **Rollback steps:** Revert the specific files changed (likely `package.json`, `playwright.config.ts`, and/or `.github/workflows/build-and-test.yml`). The `continue-on-error` workaround from PR #415 remains as a fallback.
- **Data migration considerations:** None — this change touches only configuration and build tooling.
- **Verification after rollback:** `npm run build` succeeds; `npm run test` passes.

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Investigate the failure on the branch; the main-branch E2E failure is already present, so any new failure on this fix branch is a regression introduced by the fix itself.
- **If security checks fail:** Block merge; treat Codacy/Snyk findings as required-to-fix before merge.
- **If required reviews are blocked/stale:** Escalate after 24 hours; unblock by requesting re-review.
- **Escalation path and timeout:** If E2E remains broken after fix attempt, fall back to reverting `@tanstack/react-start` to 1.167.16 as a temporary measure and open a new issue to track the upgrade path.

## Open Questions

- Resolved: h3 rc.21 is not the root cause — its changes are minor and unrelated to server startup or CSS serving. Decision 3 restores rc.21 as a housekeeping fix independent of the main investigation.
- Open: Does the `webServer` health check at `http://localhost:3000` resolve before or after `_ssr/ssr.mjs` finishes its lazy initialization? This determines whether a CI warmup step is needed in addition to any server-side fix. Needs local measurement before finalizing the fix implementation.
