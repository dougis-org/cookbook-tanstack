## Context

- Relevant architecture: TanStack Start full-stack app. `@tanstack/react-start` drives SSR/build via Nitro/Vinxi; `@tanstack/react-router` handles client + server routing; `@tanstack/router-plugin` generates the route tree at build time (`src/routeTree.gen.ts`). These three packages are tightly coupled — `react-start` ships with an exact internal pin to a specific `react-router` version.
- Dependencies: `vite.config.ts` (router-plugin and start-plugin configuration), `src/routeTree.gen.ts` (auto-generated, must be regenerated after upgrade), `package.json` / `package-lock.json`.
- Interfaces/contracts touched: Route definitions in `src/routes/`, server functions via `createServerFn`, router devtools, SSR query integration (`@tanstack/react-router-ssr-query`).

## Goals / Non-Goals

### Goals

- Reproduce and document the E2E failure mode on upgraded package versions
- Upgrade `react-router`, `react-start`, `router-plugin` to latest coherent versions
- Ensure all E2E and unit tests pass after upgrade
- Keep `react-router-devtools` and `react-router-ssr-query` at compatible versions

### Non-Goals

- Adopting new TanStack APIs or features
- Refactoring routing code beyond breaking-change compatibility fixes
- Upgrading unrelated packages

## Decisions

### Decision 1: Upgrade target — go straight to latest, not to the previously-tested 1.168.26 set

- Chosen: Target the current latest coherent set (`react-router@1.169.1`, `react-start` latest that pins 1.169.x, `router-plugin@1.167.31`) rather than the previously-tested failing set.
- Alternatives considered: Re-test the 1.168.26 set first to reproduce the known failure, then upgrade further.
- Rationale: The 1.168.26 set is not the goal — latest is. Going to latest directly avoids doing the investigation work twice. If the latest set has different failures, we capture those instead.
- Trade-offs: If latest has new regressions that 1.168.26 didn't, we may be chasing a moving target. Mitigation: check TanStack GitHub issues for known regressions before upgrading.

### Decision 2: Confirm exact target versions from package internals, not from npm dist-tags

- Chosen: Before upgrading, check what version of `react-router` the target `react-start` version internally pins (via `npm view @tanstack/react-start@<version> dependencies`). Use that as the authoritative `react-router` target.
- Alternatives considered: Just use `@latest` for all three and let npm resolve.
- Rationale: Mismatched versions are the root cause of the class of bugs we're preventing. Using npm's resolution without checking could install a newer `react-router` than `react-start` was tested against.
- Trade-offs: One extra lookup step before upgrade, but eliminates a whole class of version mismatch issues.

### Decision 3: Diagnose before fixing

- Chosen: Run E2E after upgrade, capture full failure output, categorize failure type (type error / runtime / test infra), then fix.
- Alternatives considered: Apply speculative fixes based on changelogs before seeing failures.
- Rationale: We don't know what broke. Speculative fixes waste time and may mask the real issue.
- Trade-offs: Requires a working test run to produce output; if the build itself breaks, diagnosis starts at the build step.

### Decision 4: Regenerate routeTree.gen.ts after upgrade

- Chosen: After installing upgraded packages, run `npm run dev` briefly (or `tsc --noEmit`) to trigger route tree regeneration before running tests.
- Alternatives considered: Skip regeneration and let tests catch issues.
- Rationale: `router-plugin` generates `routeTree.gen.ts` at build time. If the generator format changed between versions, stale generated code would produce misleading test failures.
- Trade-offs: None — always safe to regenerate.

## Proposal to Design Mapping

- Proposal element: Upgrade `react-router`, `react-start`, `router-plugin` to latest coherent versions
  - Design decision: Decision 1 (go to latest), Decision 2 (confirm via internal pins)
  - Validation approach: E2E test suite passes; unit tests pass; build succeeds
- Proposal element: Investigate root cause of prior E2E failures
  - Design decision: Decision 3 (diagnose before fixing)
  - Validation approach: Failure logs captured and categorized before any fix is written
- Proposal element: `react-router-devtools` and `react-router-ssr-query` peer dep compatibility
  - Design decision: Checked as part of Decision 2 lookup; upgraded alongside if needed
  - Validation approach: No peer dep warnings in `npm install` output; devtools render in browser
- Proposal element: `routeTree.gen.ts` compatibility
  - Design decision: Decision 4 (regenerate after upgrade)
  - Validation approach: File regenerates without error; TypeScript compiles

## Functional Requirements Mapping

- Requirement: All E2E tests pass on upgraded versions
  - Design element: Decision 3 (diagnose then fix) + Decision 4 (regenerate route tree)
  - Acceptance criteria reference: specs/upgrade-compatibility.md
  - Testability notes: `npm run test:e2e` must exit 0
- Requirement: All unit/integration tests pass
  - Design element: Fix any broken imports or API usage found during diagnosis
  - Acceptance criteria reference: specs/upgrade-compatibility.md
  - Testability notes: `npm run test` must exit 0
- Requirement: TypeScript compilation succeeds with no new errors
  - Design element: Decision 4 (regenerate route tree); fix any type-level breaking changes
  - Acceptance criteria reference: specs/upgrade-compatibility.md
  - Testability notes: `npx tsc --noEmit` must exit 0
- Requirement: Production build succeeds
  - Design element: Decision 2 (coherent version set prevents build-time conflicts)
  - Acceptance criteria reference: specs/upgrade-compatibility.md
  - Testability notes: `npm run build` must exit 0

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No version mismatch warnings in npm install output
  - Design element: Decision 2 (authoritative version selection from internal pins)
  - Acceptance criteria reference: specs/upgrade-compatibility.md
  - Testability notes: `npm install` output checked for peer dep warnings
- Requirement category: operability
  - Requirement: CI pipeline passes on upgraded branch
  - Design element: All decisions — upgrade is not complete until CI is green
  - Acceptance criteria reference: specs/upgrade-compatibility.md
  - Testability notes: GitHub Actions checks on the PR must be green

## Risks / Trade-offs

- Risk/trade-off: Latest `react-start` may have introduced a new SSR or hydration API that requires app changes
  - Impact: Medium — could require routing or server function refactoring
  - Mitigation: Check TanStack changelog and GitHub issues for the target version range before upgrading
- Risk/trade-off: `react-router-ssr-query` (currently 1.166.10) may not have a compatible release for react-router 1.169.x
  - Impact: Low-medium — SSR query functionality could break
  - Mitigation: Check peer deps on all installed versions; upgrade or remove if incompatible
- Risk/trade-off: Going straight to latest means we skip the 1.168.26 failure investigation
  - Impact: Low — if latest is clean, we don't need to know what 1.168.26 broke

## Rollback / Mitigation

- Rollback trigger: E2E or unit tests still failing after two investigation/fix iterations, or a framework bug is confirmed upstream.
- Rollback steps: Revert `package.json` to pinned versions from `fix/fly-deploy-npm-mismatch` branch; run `npm install`; verify tests pass.
- Data migration considerations: None — this is a build dependency change only.
- Verification after rollback: `npm run test` and `npm run test:e2e` pass; `npm run build` succeeds.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Investigate and fix the failing check before requesting review.
- If security checks fail: Do not merge. Resolve or document accepted risk before merging.
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to self-review with documented rationale after 48 hours.
- Escalation path and timeout: If upgrade cannot be completed within 3 investigation cycles, open a tracking issue, document findings, and return packages to last known-good versions until upstream fixes are available.

## Open Questions

- What exact failure output does the latest coherent version set produce? (Answered by Phase 1 of implementation.)
- Is `@tanstack/react-router-ssr-query` compatible with react-router 1.169.x? (Checked during upgrade step.)
