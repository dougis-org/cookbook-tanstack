## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED TanStack package version alignment

The system SHALL pin all `@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/react-router-ssr-query`, `@tanstack/react-router-devtools`, and `@tanstack/router-plugin` packages to a consistent, mutually-compatible minor version.

#### Scenario: No peer dependency warnings on install

- **Given** the updated `package.json` with aligned TanStack versions
- **When** `npm install` is run on Node 24
- **Then** the output contains zero peer dependency warnings for `@tanstack/*` packages

#### Scenario: TanStack packages resolve from a single version

- **Given** the regenerated `package-lock.json`
- **When** `npm ls @tanstack/react-router` is run
- **Then** a single version of `@tanstack/react-router` is listed (no deduplication failures or version conflicts)

### Requirement: ADDED tRPC exact version pinning

The system SHALL pin `@trpc/client`, `@trpc/server`, and `@trpc/tanstack-react-query` to exact versions in `package.json` (no `^` range prefix).

#### Scenario: tRPC packages are exact-pinned in package.json

- **Given** the updated `package.json`
- **When** `grep '@trpc' package.json` is run
- **Then** all `@trpc/*` entries show an exact version string (e.g., `"11.17.0"`) with no leading `^` or `~`

#### Scenario: npm install does not advance tRPC versions

- **Given** exact-pinned tRPC versions in `package.json`
- **When** `npm install` is run after a new tRPC release is published
- **Then** the lockfile retains the pinned exact version; no auto-upgrade occurs

## MODIFIED Requirements

### Requirement: MODIFIED @tanstack/react-query version

The system SHALL use `@tanstack/react-query@5.100.6` (upgraded from `5.96.2`), which brings `@tanstack/query-core@5.100.6` as its direct dependency.

#### Scenario: Application renders without react-query errors

- **Given** `@tanstack/react-query` upgraded to `5.100.6`
- **When** the application is built and all Vitest unit/integration tests run
- **Then** all tests pass with zero failures related to query hooks or query client APIs

#### Scenario: E2E flows using data fetching continue to work

- **Given** `@tanstack/react-query` upgraded to `5.100.6`
- **When** Playwright E2E tests run against the full application
- **Then** all E2E tests pass with no regressions in recipe loading, authentication, or data-fetching flows

## REMOVED Requirements

### Requirement: REMOVED ^ range specifiers on @trpc/* packages

The `^` (caret) range prefix on `@trpc/client`, `@trpc/server`, and `@trpc/tanstack-react-query` is removed from `package.json`.

Reason for removal: Range specifiers allow `npm install` to silently advance tRPC versions, generating lockfiles that may require newer peer dependencies and causing future deploy failures analogous to this issue.

## Traceability

- Proposal element "align TanStack packages to matching minor versions" → Requirement: ADDED TanStack package version alignment
- Proposal element "pin @trpc/* to exact versions" → Requirement: ADDED tRPC exact version pinning
- Proposal element "upgrade @tanstack/react-query to 5.100.6" → Requirement: MODIFIED @tanstack/react-query version
- Design decision 3 (align TanStack router/start family) → ADDED: TanStack package version alignment
- Design decision 4 (exact-pin tRPC) → ADDED: tRPC exact version pinning
- Design decision 2 (upgrade react-query to 5.100.6) → MODIFIED: @tanstack/react-query version
- ADDED TanStack package version alignment → Task: update package.json TanStack versions
- ADDED tRPC exact version pinning → Task: exact-pin tRPC in package.json
- MODIFIED @tanstack/react-query version → Task: upgrade @tanstack/react-query to 5.100.6

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Build output is deterministic after upgrade

- **Given** the aligned dependency versions in `package.json` and regenerated `package-lock.json`
- **When** `npm run build` is run twice in sequence
- **Then** both builds succeed and produce identical `.output/` artifacts (no non-determinism introduced by the version changes)

### Requirement: Security

#### Scenario: No new high/critical vulnerabilities introduced

- **Given** the upgraded dependency versions
- **When** `npm audit` is run after `npm install`
- **Then** no new high or critical severity vulnerabilities are reported that were not present before the upgrade
