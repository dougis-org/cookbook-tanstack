<!-- markdownlint-disable MD013 -->

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED valid private cookbook print fixture

The system SHALL ensure the private cookbook print-route E2E scenario creates or seeds a cookbook that is actually private under the current tier entitlement rules.

#### Scenario: fixture creates private cookbook through allowed setup

- **Given** public-only creation enforcement is active for `home-cook` and `prep-cook` users
- **When** the private cookbook print-route E2E prepares its test cookbook
- **Then** the setup uses a tier/admin/direct fixture path capable of producing `isPublic: false`
- **And** the cookbook used by the anonymous print-route assertion is private

#### Scenario: fixture does not depend on restricted-tier private creation

- **Given** a default registered user has `tier: 'home-cook'`
- **When** the private cookbook print-route E2E needs a private cookbook fixture
- **Then** the test does not rely on that default user creating a private cookbook through `cookbooks.create`

## MODIFIED Requirements

### Requirement: MODIFIED private cookbook print-route validation

The system SHALL continue to verify that anonymous users cannot view private cookbook print routes, using fixture setup that remains valid after public-only creation enforcement.

#### Scenario: anonymous user sees not-found state for private cookbook print route

- **Given** a cookbook exists with `isPublic: false`
- **And** the browser has no authenticated user session
- **When** the browser navigates to `/cookbooks/:cookbookId/print?displayonly=1`
- **Then** the page shows `Cookbook not found`
- **And** private cookbook content is not visible

## REMOVED Requirements

### Requirement: REMOVED lower-tier UI fixture may create private cookbook

Reason for removal: Restricted tiers are intentionally public-only for cookbook creation. E2E fixtures must not assume a default `home-cook` user can create a private cookbook through the UI.

#### Scenario: default registered user private creation assumption is invalid

- **Given** a default registered user has `tier: 'home-cook'`
- **When** the user submits cookbook creation with `isPublic: false`
- **Then** the resulting cookbook is expected to be public under public-only creation enforcement
- **And** this setup path is not valid for testing anonymous denial of a private cookbook print route

## Traceability

- Proposal element: E2E fixture creates a private cookbook through an invalid lower-tier path -> Requirement: ADDED valid private cookbook print fixture
- Proposal element: Preserve anonymous denial for private cookbook print routes -> Requirement: MODIFIED private cookbook print-route validation
- Proposal element: Preserve public-only creation enforcement -> Requirement: REMOVED lower-tier UI fixture may create private cookbook
- Design decision: Decision 1: Treat The E2E As Access-Control Coverage -> Requirement: MODIFIED private cookbook print-route validation
- Design decision: Decision 2: Prefer Minimal Valid Fixture Setup -> Requirement: ADDED valid private cookbook print fixture
- Design decision: Decision 3: Validate The Previously Failed Gate -> Non-Functional Acceptance Criteria: Reliability
- Requirement -> Task(s): valid private cookbook print fixture -> Task 1, Task 2
- Requirement -> Task(s): private cookbook print-route validation -> Task 2, Task 3
- Requirement -> Task(s): lower-tier UI fixture assumption removal -> Task 1

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: affected E2E remains focused

- **Given** the fix targets one private cookbook print-route scenario
- **When** the affected Playwright spec is run
- **Then** the fixture setup does not add unnecessary cross-suite setup or new long-running global dependencies

### Requirement: Security

#### Scenario: anonymous private print-route access denied

- **Given** an unauthenticated browser context
- **When** the browser requests a private cookbook print route
- **Then** the route does not expose private cookbook metadata, recipe entries, or print content

### Requirement: Reliability

#### Scenario: CI validates corrected fixture

- **Given** the corrected fixture setup is committed
- **When** `src/e2e/cookbooks-print.spec.ts` runs in CI or locally with the configured test environment
- **Then** the private cookbook print-route scenario passes without relying on retry success

### Requirement: Operability

#### Scenario: validation evidence is available before merge

- **Given** the follow-up PR is ready for review
- **When** validation is reported
- **Then** the results include the affected E2E command and standard local quality gates relevant to the files changed
