# Spec: Recipe Creation Tier Limit Enforcement

## ADDED Requirements

### Requirement: ADDED Recipe creation limit enforced by tier

The system SHALL reject `recipes.create` with a `FORBIDDEN` error when the authenticated user's active recipe count is at or above their tier limit.

#### Scenario: At-limit rejection

- **Given** an authenticated user with tier `home-cook` (limit: 10) who owns exactly 10 active recipes (not deleted, not `hiddenByTier: true`)
- **When** the user calls `recipes.create`
- **Then** the mutation throws `TRPCError` with code `FORBIDDEN`

#### Scenario: Under-limit success

- **Given** an authenticated user with tier `home-cook` (limit: 10) who owns 9 active recipes
- **When** the user calls `recipes.create` with a valid name
- **Then** the mutation succeeds and returns the new recipe document

#### Scenario: Admin bypass

- **Given** an authenticated user with `isAdmin: true` who owns 10 active recipes (at `home-cook` limit)
- **When** the user calls `recipes.create`
- **Then** the mutation succeeds regardless of count

#### Scenario: `hiddenByTier` docs excluded from count

- **Given** an authenticated user with tier `home-cook` (limit: 10) who owns 10 recipes, of which 1 has `hiddenByTier: true`
- **When** the user calls `recipes.create`
- **Then** the mutation succeeds (active count is 9, under limit)

#### Scenario: Missing tier defaults to `home-cook`

- **Given** an authenticated user with `tier: undefined` who owns 10 active recipes
- **When** the user calls `recipes.create`
- **Then** the mutation throws `FORBIDDEN` (defaulted to `home-cook` limit of 10)

## MODIFIED Requirements

### Requirement: MODIFIED `recipes.create` response shape

The system SHALL include `hiddenByTier` (boolean) in the `recipes.create` response.

#### Scenario: New recipe has `hiddenByTier: false`

- **Given** an authenticated user under their recipe limit
- **When** the user calls `recipes.create`
- **Then** the response includes `hiddenByTier: false`

## REMOVED Requirements

None. No existing requirements removed by this change.

## Traceability

- Proposal element "enforce limit in recipes.create" → Requirement: ADDED Recipe creation limit enforced by tier
- Design decision 1 (shared helper) → Requirement: ADDED Recipe creation limit enforced by tier
- Design decision 3 (tier default) → Scenario: Missing tier defaults to `home-cook`
- Design decision 6 (hiddenByTier in responses) → Requirement: MODIFIED response shape
- Requirements → Tasks: task "Add enforceContentLimit to _helpers.ts", task "Wire enforceContentLimit into recipes.create"

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Limit not bypassable by non-admin authenticated user

- **Given** an authenticated user with `isAdmin: false` at their recipe limit
- **When** the user calls `recipes.create`
- **Then** the mutation returns `FORBIDDEN`; the user cannot influence the isAdmin flag through request input

### Requirement: Reliability

#### Scenario: Race condition tolerance

- **Given** two concurrent `recipes.create` calls for a user at `limit - 1`
- **When** both calls pass the count check simultaneously
- **Then** at most one over-limit document is created; no error is thrown during the race (accepted tolerance per spec)
