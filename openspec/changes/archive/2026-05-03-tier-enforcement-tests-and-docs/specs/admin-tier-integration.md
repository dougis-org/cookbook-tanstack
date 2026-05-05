## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Full admin→setTier→reconcile→list path produces correct visible recipe count

The system SHALL, after an admin changes a user's tier via `admin.users.setTier`, produce a correct `recipes.list` response that reflects the reconciled visibility state.

#### Scenario: Downgrade from sous-chef to home-cook hides over-limit recipes

- **Given** a user with 15 recipes (created with staggered timestamps, oldest first)
- **When** an admin calls `admin.users.setTier({ userId, tier: 'home-cook' })`
- **And** the user calls `recipes.list`
- **Then** the list returns exactly 10 recipes (the 10 oldest)
- **And** 5 recipes have `hiddenByTier: true` in the database (the 5 newest)

#### Scenario: Upgrade from home-cook to executive-chef restores all hidden recipes

- **Given** a user who was downgraded to home-cook and has 5 hidden recipes
- **When** an admin calls `admin.users.setTier({ userId, tier: 'executive-chef' })`
- **And** the user calls `recipes.list`
- **Then** the list returns all 15 recipes
- **And** no recipe has `hiddenByTier: true` in the database

#### Scenario: Oldest recipes are preserved on downgrade (not newest)

- **Given** a user with 15 recipes, each created 1 second apart (recipe-0 oldest, recipe-14 newest)
- **When** an admin calls `admin.users.setTier({ userId, tier: 'home-cook' })`
- **Then** recipes 0–9 (oldest 10) are visible in `recipes.list`
- **And** recipes 10–14 (newest 5) have `hiddenByTier: true`

## MODIFIED Requirements

No existing requirements are modified by this spec.

## REMOVED Requirements

None.

## Traceability

- Proposal element "admin→reconcile→list full path untested" → Requirements above
- Design decision 1 (integration test location and pattern) → Requirements above
- Requirements → Task: Create `src/server/trpc/routers/__tests__/admin-tier-integration.test.ts`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Integration test uses real DB — not mocked

- **Given** the integration test file imports `withCleanDb` and does NOT mock `@/db`
- **When** the test suite runs
- **Then** all DB operations execute against a real MongoDB instance (Docker-provided)
- **And** `withCleanDb` ensures isolation between test cases

### Requirement: Reliability

#### Scenario: Test is idempotent across runs

- **Given** the integration test runs twice in sequence
- **When** `withCleanDb` resets state between runs
- **Then** both runs produce the same results with no data leakage between runs
