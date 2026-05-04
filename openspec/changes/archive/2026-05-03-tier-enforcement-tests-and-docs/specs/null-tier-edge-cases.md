## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Null-tier enforcement defaults to home-cook for recipes.create

The system SHALL treat an authenticated user with `tier: undefined` or `tier: null` identically to a home-cook user when enforcing the recipe creation limit.

#### Scenario: User with undefined tier is blocked at home-cook recipe limit

- **Given** an authenticated user whose session has `tier: undefined`
- **And** the user already owns 10 non-hidden recipes
- **When** the user calls `recipes.create`
- **Then** the mutation throws `PAYMENT_REQUIRED` with a `tier-wall/count-limit` cause

#### Scenario: enforceContentLimit with undefined tier applies home-cook limit

- **Given** a call to `enforceContentLimit(userId, undefined, false, 'recipes')`
- **And** the user owns 10 non-hidden recipes
- **When** the function executes
- **Then** it throws `PAYMENT_REQUIRED`

### Requirement: ADDED Null-tier enforcement defaults to home-cook for cookbooks.create

The system SHALL treat an authenticated user with `tier: undefined` when enforcing the cookbook creation limit identically to a home-cook user.

#### Scenario: User with undefined tier is blocked at home-cook cookbook limit

- **Given** an authenticated user whose session has `tier: undefined`
- **And** the user already owns 1 non-hidden cookbook
- **When** the user calls `cookbooks.create`
- **Then** the mutation throws `PAYMENT_REQUIRED` with a `tier-wall/count-limit` cause

## MODIFIED Requirements

No existing requirements are modified by this spec.

## REMOVED Requirements

None.

## Traceability

- Proposal element "Null-tier edge cases untested" → Requirements above
- Design decision 2 (null-tier test placement) → Requirements above
- Requirements → Task: Add null-tier tests to recipes.test.ts, cookbooks.test.ts, helpers.test.ts

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Null-tier never causes an unhandled exception

- **Given** any enforcement entry point receives `tier: null` or `tier: undefined`
- **When** it evaluates the tier
- **Then** it produces the same result as `tier: 'home-cook'` with no thrown TypeError or unhandled promise rejection
