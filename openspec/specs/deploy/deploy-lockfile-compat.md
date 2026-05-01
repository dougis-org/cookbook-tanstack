## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Docker npm ci lockfile compatibility

The system SHALL produce a `package-lock.json` that passes `npm ci` validation inside `node:24-alpine` (npm 11) without error.

#### Scenario: Clean Docker npm ci succeeds

- **Given** the committed `package-lock.json` on the main branch
- **When** `npm ci` is executed inside `node:24-alpine` with no pre-existing `node_modules`
- **Then** `npm ci` exits with code 0 and installs all dependencies without error

#### Scenario: Lockfile drift is caught at PR time, not deploy time

- **Given** a PR branch where a developer added a dependency and ran `npm install` locally on Node 22
- **When** the `build-and-test.yml` CI pipeline runs `npm install` on Node 24 and detects a lockfile change
- **Then** CI auto-commits the corrected lockfile to the PR branch, and the subsequent `npm ci` in Docker succeeds

### Requirement: ADDED @tanstack/query-core top-level hoisting

The system SHALL include `@tanstack/query-core` as a top-level entry in `package-lock.json`, not only nested under `@tanstack/react-query`.

#### Scenario: query-core is resolvable at top level

- **Given** the regenerated `package-lock.json`
- **When** `npm ls @tanstack/query-core` is run with Node 24 / npm 11
- **Then** the output shows `@tanstack/query-core@5.100.6` at the top level of the dependency tree (not nested-only)

#### Scenario: peer dep resolution is satisfied

- **Given** `@tanstack/react-router-ssr-query` with `peerDependencies: {"@tanstack/query-core": ">=5.90.0"}`
- **When** `npm ci` resolves the peer dep
- **Then** it finds `@tanstack/query-core@5.100.6` at top level and does not attempt to install a conflicting version

## MODIFIED Requirements

### Requirement: MODIFIED CI lockfile auto-update uses Node 24

The system SHALL use Node 24 (npm 11) in the `build-and-test.yml` CI pipeline for all `npm` operations, replacing the previous Node 22 (npm 10).

#### Scenario: Auto-committed lockfile is Docker-compatible

- **Given** a PR with an out-of-sync lockfile (e.g., a new dependency was added)
- **When** CI runs `npm install` on Node 24 and auto-commits the updated lockfile
- **Then** the resulting `package-lock.json` passes `npm ci` in `node:24-alpine` Docker without error

## REMOVED Requirements

### Requirement: REMOVED Node 22 in CI

The `build-and-test.yml` pipeline no longer uses Node 22.

Reason for removal: Node 22 ships with npm 10, which generates lockfiles incompatible with Docker's npm 11 peer dependency hoisting rules. Replaced by Node 24.

## Traceability

- Proposal element "CI uses Node 22, Docker uses Node 24" → Requirement: MODIFIED CI lockfile auto-update uses Node 24
- Proposal element "query-core missing from lockfile top level" → Requirement: ADDED @tanstack/query-core top-level hoisting
- Design decision 1 (align CI to Node 24) → MODIFIED: CI lockfile auto-update uses Node 24
- Design decision 2 (upgrade react-query to 5.100.6) → ADDED: @tanstack/query-core top-level hoisting
- Design decision 5 (regenerate lockfile locally with Node 24) → ADDED: Docker npm ci lockfile compatibility
- ADDED Docker npm ci lockfile compatibility → Task: regenerate package-lock.json; Task: update build-and-test.yml node version
- ADDED @tanstack/query-core top-level hoisting → Task: upgrade @tanstack/react-query to 5.100.6
- MODIFIED CI lockfile auto-update uses Node 24 → Task: update build-and-test.yml node version

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Consecutive deploys produce identical installs

- **Given** the same `package-lock.json` committed to main
- **When** two sequential Docker builds run `npm ci` on different days
- **Then** both builds install identical package versions (lockfile is the single source of truth, no range resolution)

#### Scenario: Lockfile drift does not reach production

- **Given** a PR where `package.json` has a new range dependency that resolves differently on npm 10 vs npm 11
- **When** CI (Node 24 / npm 11) runs `npm install` and detects the drift
- **Then** CI auto-commits the npm-11-generated lockfile before the PR can merge, ensuring Docker `npm ci` will pass on deploy

### Requirement: Operability

#### Scenario: Build failure is visible before merge

- **Given** a PR branch with a lockfile that would fail `npm ci` in Docker
- **When** the `build-and-test.yml` pipeline runs
- **Then** the pipeline either auto-fixes and commits the lockfile, or fails with a clear error — the failure is surfaced on the PR, not silently at deploy time
