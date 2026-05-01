## GitHub Issues

- #414

## Why

- Problem statement: Three TanStack packages (`@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/router-plugin`) are pinned to older versions that were frozen during the Fly.io npm mismatch fix (PR #408). Prior testing confirmed that upgrading these packages caused E2E test failures, but the root cause was never diagnosed.
- Why now: Pre-launch technical debt window — cleaning up dependencies now prevents unknown-unknown bugs in production and ensures we're on supported, maintained versions.
- Business/user impact: Staying on older versions means missing bug fixes, performance improvements, and security patches. Misaligned TanStack versions can cause subtle SSR/hydration issues, type incompatibilities, and transitive dependency conflicts.

## Problem Space

- Current behavior: `react-router@1.168.10`, `react-start@1.167.16`, `router-plugin@1.167.12` are pinned. `react-query@5.100.6` is already at latest (no action needed). Upgrading to `react-router@1.168.26` + `react-start@1.167.52` + `router-plugin@1.167.52` caused E2E failures with no captured failure logs.
- Desired behavior: All three packages upgraded to a coherent latest set (`react-router@1.169.1`, `react-start` latest that pins `1.169.x`, `router-plugin@1.167.31`). E2E tests pass. App functionality is unchanged.
- Constraints: TanStack does not use lockstep versioning — `react-start` ships with an exact internal pin to a specific `react-router` version. The correct upgrade path is: pick target `react-start` version → its internal pin dictates `react-router` version → find `router-plugin` whose peer dep accepts that `react-router` version.
- Assumptions: The E2E failures from prior testing reflect either (a) a breaking API change in the app's usage of the router, (b) a test infrastructure issue, or (c) a transitive dependency conflict (e.g., h3, nitro, vinxi). Not assumed to be a fundamental framework incompatibility.
- Edge cases considered: Intermediate version ranges may be broken even if the latest is fine; we will test latest directly and bisect only if needed.

## Scope

### In Scope

- Investigate and document the exact E2E failure mode when upgrading to coherent latest TanStack versions
- Fix app code, test infrastructure, or configuration as needed to pass tests on upgraded versions
- Upgrade `@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/router-plugin` to latest coherent versions
- Update `@tanstack/react-router-devtools` and `@tanstack/react-router-ssr-query` to compatible versions if needed

### Out of Scope

- Upgrading `@tanstack/react-query` (already at 5.100.6, done)
- Upgrading unrelated dependencies
- Addressing any new features introduced in the upgraded versions

## What Changes

- `package.json`: Version bumps for `react-router`, `react-start`, `router-plugin` (and potentially `react-router-devtools`, `react-router-ssr-query`)
- `package-lock.json`: Regenerated after version bump
- App code or test files: Modified as needed to resolve any breaking changes found during investigation
- Possibly `vite.config.ts` or other build config if the router-plugin or start plugin API changed

## Risks

- Risk: Breaking API changes in `react-router` 1.168.10 → 1.169.1 require non-trivial app code changes
  - Impact: Medium — delays the upgrade, requires deeper refactoring
  - Mitigation: Investigate failure logs first; scope fixes before committing to upgrade
- Risk: E2E test failures are a framework bug, not an app code issue
  - Impact: Medium — may need to wait for an upstream fix or pin to the last known-good version
  - Mitigation: Check TanStack GitHub issues for known regressions in the target versions
- Risk: `react-router-devtools` and `react-router-ssr-query` (currently at 1.166.x) have peer dep conflicts with upgraded router
  - Impact: Low — devtools are non-critical; ssr-query may require attention
  - Mitigation: Check peer deps and upgrade alongside main packages

## Open Questions

- Question: What is the exact failure mode from prior E2E testing (react-router 1.168.26 + react-start 1.167.52)?
  - Needed from: Investigation (reproduce on new branch)
  - Blocker for apply: yes — determines scope of fixes needed

## Non-Goals

- Adopting any new TanStack APIs or features introduced in upgraded versions
- Refactoring routing code beyond what is required for compatibility
- Upgrading to TanStack v2 or any major version

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
