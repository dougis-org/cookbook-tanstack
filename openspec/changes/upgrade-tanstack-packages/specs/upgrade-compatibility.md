## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Package version upgrade to latest coherent TanStack set

The system SHALL install `@tanstack/react-router`, `@tanstack/react-start`, and `@tanstack/router-plugin` at the latest coherent version set (where `react-start`'s internal pin defines the required `react-router` version).

#### Scenario: Coherent versions installed

- **Given** the project has `react-router@1.168.10`, `react-start@1.167.16`, and `router-plugin@1.167.12` pinned in `package.json`
- **When** the upgrade task runs `npm install` with the new target versions
- **Then** `package.json` reflects the upgraded versions, `npm install` exits 0, and there are no peer dependency warnings for these packages

#### Scenario: Version coherence confirmed before upgrade

- **Given** the implementer is selecting target versions
- **When** they run `npm view @tanstack/react-start@<target> dependencies` to check internal pins
- **Then** the `react-router` version in the output is used as the authoritative target for `@tanstack/react-router` in `package.json`

### Requirement: ADDED Route tree regenerated after upgrade

The system SHALL regenerate `src/routeTree.gen.ts` using the upgraded `router-plugin` without errors.

#### Scenario: Successful route tree regeneration

- **Given** the upgraded packages are installed
- **When** the dev server starts or `npm run build` is invoked
- **Then** `src/routeTree.gen.ts` is regenerated without TypeScript errors and matches the current route file structure

#### Scenario: TypeScript compilation passes

- **Given** the route tree has been regenerated
- **When** `npx tsc --noEmit` is run
- **Then** it exits 0 with no new type errors introduced by the upgrade

### Requirement: ADDED E2E test failure root cause documented

The system SHALL have a documented root cause for any E2E failures encountered during upgrade, before fixes are applied.

#### Scenario: Failure mode captured

- **Given** the upgraded packages are installed and the route tree is regenerated
- **When** `npm run test:e2e` is executed
- **Then** any failures produce captured output that is categorized as one of: type error, runtime error, test infrastructure issue, or transitive dependency conflict

## MODIFIED Requirements

### Requirement: MODIFIED All E2E tests pass

The system SHALL pass all E2E tests against the upgraded TanStack package versions (previously passed against 1.168.10 / 1.167.16 / 1.167.12).

#### Scenario: Full E2E suite green

- **Given** all upgraded packages are installed, the route tree is regenerated, and any breaking changes are fixed
- **When** `npm run test:e2e` is run
- **Then** all tests pass and the suite exits 0

#### Scenario: No regression in existing test coverage

- **Given** the E2E baseline on the old package versions
- **When** the same tests run on upgraded versions
- **Then** no previously-passing test now fails

### Requirement: MODIFIED Unit and integration tests pass

The system SHALL pass all Vitest unit and integration tests against the upgraded packages.

#### Scenario: Full unit test suite green

- **Given** upgraded packages installed and any breaking changes fixed
- **When** `npm run test` is run
- **Then** all tests pass and the suite exits 0

### Requirement: MODIFIED Production build succeeds

The system SHALL produce a successful production build with the upgraded TanStack packages.

#### Scenario: Build succeeds

- **Given** upgraded packages installed and route tree regenerated
- **When** `npm run build` is run
- **Then** it exits 0 with no errors

## REMOVED Requirements

### Requirement: REMOVED Pinned older TanStack versions

The pinned constraint on `react-router@1.168.10`, `react-start@1.167.16`, and `router-plugin@1.167.12` is removed.

Reason for removal: These pins were a temporary stabilization measure from the Fly.io npm mismatch fix (PR #408). The goal of this change is to lift those pins and move to current versions.

## Traceability

- Proposal: Upgrade react-router, react-start, router-plugin → Requirement: Package version upgrade to latest coherent set
- Proposal: Investigate root cause of prior E2E failures → Requirement: E2E test failure root cause documented
- Design Decision 1 (go to latest) → Requirement: Package version upgrade to latest coherent set
- Design Decision 2 (confirm via internal pins) → Requirement: Version coherence confirmed before upgrade
- Design Decision 3 (diagnose before fixing) → Requirement: E2E test failure root cause documented
- Design Decision 4 (regenerate route tree) → Requirement: Route tree regenerated after upgrade
- Requirements → Tasks: version-bump task, investigation task, fix task, verification task

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No peer dependency conflicts after upgrade

- **Given** the upgraded packages are installed
- **When** `npm install` completes
- **Then** stdout/stderr contains no `WARN peer` or `ERR_PEER_DEPENDENCY` messages for the upgraded TanStack packages

### Requirement: Operability

#### Scenario: CI pipeline passes

- **Given** the upgrade branch is pushed and a PR is opened
- **When** GitHub Actions runs the CI checks
- **Then** all required checks pass (build, test, lint, type-check)

### Requirement: Performance

#### Scenario: E2E test suite runtime within acceptable range

- **Given** the E2E baseline runtime of ~212 seconds (established during react-query upgrade testing)
- **When** the full E2E suite runs on upgraded TanStack versions
- **Then** suite runtime does not exceed 300 seconds (40% buffer over baseline)
