## GitHub Issues

- #416

## Why

- **Problem statement:** E2E CI build time doubled from ~6–7 minutes to 13+ minutes after merging PR #415 (TanStack package upgrades). The `Run E2E tests` step now times out at 10 minutes on every run, causing main-branch pushes to fail and PR builds to rely on `continue-on-error`. The root cause is 14 specific tests — all from `admin/admin-users.spec.ts`, `auth-session.spec.ts`, and `cookbooks-auth.spec.ts` — failing with 30-second timeouts and retrying twice each (14 × 90s / 2 workers ≈ 630s), consuming the entire 10-minute budget.
- **Why now:** Main-branch CI is broken (the push that merged PR #415 failed). Every subsequent build either fails or silently masks E2E failures via `continue-on-error`. The regression needs to be fixed before it accumulates further.
- **Business/user impact:** Broken main-branch CI blocks confident deployment, undermines PR quality gates, and increases feedback loop time for all future development.

## Problem Space

- **Current behavior:** All 14 failing tests show an identical failure: the app is stuck in the boot loader "Pre-heating" state — `#app-shell` is hidden and the external stylesheet's `load` event never fires. Each test calls `gotoAndWaitForHydration(page, "/")` as its first step; this navigation to the homepage fails because `#app-shell` never becomes visible. The tests then retry twice (CI is configured with `retries: 2`) before failing permanently. These 14 tests are from the three test files that use `registerAndLogin()` or interact with Better-Auth API endpoints.
- **Desired behavior:** All 155 E2E tests complete within the 10-minute budget, matching the pre-upgrade baseline of ~3.5 minutes for the E2E segment.
- **Constraints:**
  - Reverting TanStack packages is explicitly out of scope — the goal is to understand and fix the breaking change, not roll back.
  - `@tanstack/start-server-core` internally pins `h3-v2` at `npm:h3@2.0.1-rc.20`. The `h3` npm `latest` dist-tag is `2.0.1-rc.21`. The project's package overrides were conservatively downgraded to rc.20 in PR #415; this should be restored to rc.21.
  - The production server uses a lazy-loaded SSR bundle (`lazyService` in `.output/server/index.mjs`). The Playwright `webServer` health check hits `http://localhost:3000`, which triggers the lazy SSR load — so the health check should not complete before SSR is initialized.
  - The Playwright `webServer` startup timeout was reduced from 120s to 60s in PR #415.
- **Assumptions:**
  - The regression was introduced by `@tanstack/react-start` 1.167.16 → 1.167.58. Prior isolation experiments on the upgrade branch confirmed that 1.167.52 already caused failures; the specific breaking version is between 1.167.17 and 1.167.52.
  - The "Pre-heating" failure is caused by a behavior change in the server or its request handling, not by a change in the boot loader mechanism itself (the boot loader code in `__root.tsx` was not modified in PR #415).
  - h3 rc.21 vs rc.20 is not the root cause — the changes in rc.21 are limited to error handling, cookie serialization, and stream fixes, none of which affect server startup or CSS serving.
- **Edge cases considered:**
  - The failing tests are the *first* to run (admin-users at t=0, auth-session at t=10s in the pre-upgrade execution order), not tests that fail under load. This rules out server degradation from accumulated requests.
  - Non-auth tests that also navigate to `"/"` pass. The common thread in failing tests is Better-Auth API interaction, not the route visited.
  - The production server's SSR bundle lazy-loads all dependencies (including mongoose + mongodb = ~2.5MB) on the first request. This was true pre-upgrade; the timing of when this load occurs relative to Playwright test startup needs investigation.

## Scope

### In Scope

- Identify the exact `@tanstack/react-start` version (between 1.167.17 and 1.167.52) where the E2E regression was introduced.
- Determine the behavioral change in that version that causes auth-related page navigations to get stuck in the pre-heating state.
- Fix the root cause — either via configuration, a code change in the app, or a CI workflow adjustment — without reverting TanStack package versions.
- Restore h3 override to `2.0.1-rc.21` (npm latest) and verify it does not cause regressions.
- Restore the `webServer` startup timeout to a value that reliably accommodates server initialization in CI (currently 60s; may need to be higher).
- Ensure all 155 E2E tests pass and the total E2E segment returns to approximately the pre-upgrade baseline (~3.5 minutes wall clock with 2 workers).

### Out of Scope

- Reverting any TanStack package versions.
- Changes to the E2E test suite structure or test count.
- Broader CI optimization (separate from issue #416 scope — the prior `improve-e2e-ci-performance` change already addressed worker count).
- Changes to the boot loader mechanism in `src/routes/__root.tsx` unless the investigation directly implicates it.

## What Changes

- **Investigation:** Binary-search `@tanstack/react-start` versions to isolate the regression, then inspect the relevant changelog/commits to understand the behavioral change.
- **Fix (exact form TBD by investigation):** One or more of:
  - A configuration change to the TanStack Start server (e.g., disabling RSC CSS auto-injection if that is the cause, or a server plugin option that changed defaults).
  - A CI workflow change (e.g., adding a server warmup step between `webServer` startup and test execution, or adjusting the health check URL to a deeper readiness endpoint).
  - A code change in the app's server entry or `__root.tsx` to accommodate new TanStack Start behavior.
- **h3 override:** Restore `h3` and `h3-v2` overrides from `2.0.1-rc.20` to `2.0.1-rc.21`.
- **`webServer` timeout:** Evaluate and potentially restore to 120s or set to a value justified by measured CI server startup time.

## Risks

- Risk: The behavioral change in TanStack Start is intentional and requires a non-trivial code change to the app's SSR setup.
  - Impact: Fix takes longer than expected; CI remains broken in the interim.
  - Mitigation: The `continue-on-error` workaround on PR builds provides a safety valve. Investigate and fix on a branch before merging to main.
- Risk: Restoring h3 to rc.21 introduces an incompatibility with `@tanstack/start-server-core`'s internal rc.20 pin.
  - Impact: Server runtime errors or unexpected behavior.
  - Mitigation: The `h3-v2` alias in `@tanstack/start-server-core` is separate from the top-level `h3` resolution. Verify with a local build and CI run after the change.
- Risk: The fix addresses the symptom (tests failing) but not the underlying performance issue (why those tests specifically are affected).
  - Impact: Fragile fix that recurs if TanStack Start is upgraded again.
  - Mitigation: Require the investigation to identify the root cause mechanism, not just the fix.

## Open Questions

- Question: Is there a TanStack Start configuration option introduced between 1.167.17 and 1.167.58 that controls the CSS injection or server component rendering behavior that changed?
  - Needed from: TanStack Start changelog / GitHub commits for `@tanstack/react-start` in that range.
  - Blocker for apply: yes
- Question: Does the Playwright `webServer` health check at `http://localhost:3000` complete before or after the lazy SSR bundle finishes loading in the post-upgrade server?
  - Needed from: Local measurement (add timing logs to the server startup or use `--reporter=list` in a local E2E run).
  - Blocker for apply: yes
- Question: What is the actual server startup time in CI for the post-upgrade build? (The 60s timeout was set as a guess; the pre-upgrade build had 120s.)
  - Needed from: CI log analysis or local measurement.
  - Blocker for apply: no (can proceed with a conservative timeout restore)

## Non-Goals

- Reducing E2E test count or removing coverage to gain speed.
- Caching the production build between CI steps (separate optimization).
- Moving to a selective/impacted-test execution model (tracked separately in issue #277).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
