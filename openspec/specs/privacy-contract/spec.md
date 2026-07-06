## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-07-05-personal-source-privacy-e2e/design.md) document, not a replacement.

### Requirement: ADDED E2E coverage — owner view of personalSourceName

The system SHALL verify that a recipe owner sees the personal source name in the UI after saving.

#### Scenario: Owner happy path

- **Given** User A is authenticated and has created a recipe with source=Personal and personalSourceName="Aunt Mary" (public recipe)
- **When** User A reloads the recipe detail page
- **Then** The page displays text matching `/Personal.*·.*Aunt Mary/` in the source line

---

### Requirement: ADDED E2E coverage — cross-user privacy at the network level

The system SHALL verify that a non-owner user does not receive `personalSourceName` in the tRPC API response.

#### Scenario: User B DOM check

- **Given** User A owns a public Personal recipe with personalSourceName="Aunt Mary"
- **When** User B (a different authenticated user) navigates to that recipe's detail page
- **Then** The page shows "Personal" as the source, with no "Aunt Mary" text visible in the DOM

#### Scenario: User B network-level check

- **Given** User A owns a public Personal recipe with personalSourceName="Aunt Mary"
- **When** User B makes a GET request to `/api/trpc/recipes.byId?batch=1&input=<encoded-id>` with their session cookie
- **Then** The raw HTTP response body does not contain the string "Aunt Mary"

---

### Requirement: ADDED E2E coverage — unauthenticated privacy at the network level

The system SHALL verify that an unauthenticated viewer does not receive `personalSourceName` in the tRPC API response.

#### Scenario: Unauthenticated DOM check

- **Given** User A owns a public Personal recipe with personalSourceName="Aunt Mary"
- **When** An unauthenticated visitor (no session cookie) navigates to that recipe's detail page
- **Then** The page shows "Personal" as the source, with no "Aunt Mary" text visible in the DOM

#### Scenario: Unauthenticated network-level check

- **Given** User A owns a public Personal recipe with personalSourceName="Aunt Mary"
- **When** An unauthenticated request is made to `/api/trpc/recipes.byId?batch=1&input=<encoded-id>` (no session cookie)
- **Then** The raw HTTP response body does not contain the string "Aunt Mary"

## MODIFIED Requirements

None. No existing requirements are modified; this change adds test coverage only.

## REMOVED Requirements

None.

## Traceability

- Proposal element "Owner happy path" → Requirement "E2E coverage — owner view"
- Proposal element "Cross-user privacy" → Requirement "E2E coverage — cross-user privacy at network level"
- Proposal element "Unauthenticated privacy" → Requirement "E2E coverage — unauthenticated privacy at network level"
- Design Decision 1 (direct tRPC GET) → network-level scenarios
- Design Decision 3 (beforeEach setup) → all scenarios
- Requirement "owner view" → Task: write owner happy path test
- Requirement "cross-user privacy" → Task: write cross-user test with tRPC GET assertion
- Requirement "unauthenticated privacy" → Task: write unauthenticated test with tRPC GET assertion

## Non-Functional Acceptance Criteria

### Requirement: Security

The privacy enforcement is fully specified by the functional scenarios above (User B network-level check and Unauthenticated network-level check). Both assert that `personalSourceName` is absent from the wire-level response, not merely hidden in the UI.

See functional scenarios: "User B network-level check", "Unauthenticated network-level check"

### Requirement: Reliability

#### Scenario: Stable in CI across runs

- **Given** The E2E test suite runs against a live dev server with a seeded "Personal" source
- **When** The personal-source-privacy spec executes
- **Then** All scenarios pass without flaky failures; timing is guarded by `waitForResponse` rather than fixed timeouts
