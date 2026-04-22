# Spec: Cookbook Creation Tier Limit Enforcement

## ADDED Requirements

### Requirement: ADDED Cookbook creation limit enforced by tier

The system SHALL reject `cookbooks.create` with a `FORBIDDEN` error when the authenticated user's active cookbook count is at or above their tier limit.

#### Scenario: At-limit rejection

- **Given** an authenticated user with tier `home-cook` (limit: 1) who owns exactly 1 active cookbook (not `hiddenByTier: true`)
- **When** the user calls `cookbooks.create`
- **Then** the mutation throws `TRPCError` with code `FORBIDDEN`

#### Scenario: Under-limit success

- **Given** an authenticated user with tier `prep-cook` (limit: 10) who owns 9 active cookbooks
- **When** the user calls `cookbooks.create` with a valid name
- **Then** the mutation succeeds and returns the new cookbook document

#### Scenario: Admin bypass

- **Given** an authenticated user with `isAdmin: true` who owns 1 active cookbook (at `home-cook` limit)
- **When** the user calls `cookbooks.create`
- **Then** the mutation succeeds regardless of count

#### Scenario: `hiddenByTier` docs excluded from count

- **Given** an authenticated user with tier `home-cook` (limit: 1) who owns 1 cookbook with `hiddenByTier: true`
- **When** the user calls `cookbooks.create`
- **Then** the mutation succeeds (active count is 0, under limit)

#### Scenario: Missing tier defaults to `home-cook`

- **Given** an authenticated user with `tier: undefined` who owns 1 active cookbook
- **When** the user calls `cookbooks.create`
- **Then** the mutation throws `FORBIDDEN` (defaulted to `home-cook` limit of 1)

## MODIFIED Requirements

### Requirement: MODIFIED `cookbooks.create` response shape

The system SHALL include `hiddenByTier` (boolean) in the `cookbooks.create` response.

#### Scenario: New cookbook has `hiddenByTier: false`

- **Given** an authenticated user under their cookbook limit
- **When** the user calls `cookbooks.create`
- **Then** the response includes `hiddenByTier: false`

## REMOVED Requirements

None. No existing requirements removed by this change.

## Traceability

- Proposal element "enforce limit in cookbooks.create" → Requirement: ADDED Cookbook creation limit enforced by tier
- Design decision 1 (shared helper) → Requirement: ADDED Cookbook creation limit enforced by tier
- Design decision 3 (tier default) → Scenario: Missing tier defaults to `home-cook`
- Design decision 6 (hiddenByTier in responses) → Requirement: MODIFIED response shape
- Requirements → Tasks: task "Add enforceContentLimit to _helpers.ts", task "Wire enforceContentLimit into cookbooks.create"

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Limit not bypassable by non-admin authenticated user

- **Given** an authenticated user with `isAdmin: false` at their cookbook limit
- **When** the user calls `cookbooks.create`
- **Then** the mutation returns `FORBIDDEN`; the user cannot influence the isAdmin flag through request input
