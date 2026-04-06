## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED better-auth pinned to 1.5.6

The system SHALL declare `better-auth` at exactly version `1.5.6` in `package.json` with no semver range operator.

#### Scenario: Exact version pin in package.json

- **Given** the `package.json` has been updated
- **When** `npm ls better-auth` is run
- **Then** the output shows `better-auth@1.5.6` with no version mismatch warnings

#### Scenario: Lockfile reflects exact pin

- **Given** `npm install` has been run after the version change
- **When** `package-lock.json` is inspected for the `better-auth` entry
- **Then** the resolved version is `1.5.6` exactly

### Requirement: ADDED TanStack DevTools upgraded to target versions

The system SHALL declare `@tanstack/devtools-vite` at `^0.5.5` and `@tanstack/react-devtools` at `^0.10.1`.

#### Scenario: Devtools packages at target versions

- **Given** `npm install` has been run
- **When** `npm ls @tanstack/devtools-vite @tanstack/react-devtools` is run
- **Then** resolved versions are `>=0.5.5` and `>=0.10.1` respectively

#### Scenario: Dev server starts with new devtools

- **Given** the devtools packages are installed at target versions
- **When** `npm run dev` is started and the app is opened in a browser
- **Then** the TanStack devtools panel renders without console errors

## MODIFIED Requirements

### Requirement: MODIFIED better-auth package version

The system SHALL use `better-auth@1.5.6` instead of `^1.4.18`.

#### Scenario: Old version no longer installed

- **Given** `npm install` has been run with updated `package.json`
- **When** `npm ls better-auth` is run
- **Then** no `1.4.x` version appears in the dependency tree

## REMOVED Requirements

No requirements are being removed in this change.

## Traceability

- Proposal element "Pin to 1.5.6, not 1.6.0" -> Requirement: ADDED better-auth pinned to 1.5.6
- Proposal element "Devtools upgrade" -> Requirement: ADDED TanStack DevTools upgraded
- Design decision 1 (exact pin) -> Requirement: ADDED better-auth pinned to 1.5.6
- Design decision 3 (caret for devtools) -> Requirement: ADDED TanStack DevTools upgraded
- Requirement "better-auth pinned to 1.5.6" -> Task: update package.json versions
- Requirement "DevTools upgraded" -> Task: update package.json versions

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Revoked session not restorable via DB fallback

- **Given** a user session has been revoked (sign-out)
- **When** a request is made with the revoked session cookie
- **Then** the server returns a 401/redirect to sign-in, not a restored session (behavior from better-auth 1.5.6 fix)

### Requirement: Reliability

#### Scenario: Dev server starts cleanly after upgrade

- **Given** packages installed at upgraded versions and auth collections cleared
- **When** `npm run dev` is run
- **Then** the server starts without module resolution errors or startup crashes
