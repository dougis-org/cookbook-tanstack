# Spec: User Tier Model

Capability: `src/types/user.ts` — `UserTier`, `TIER_RANK`, `hasAtLeastTier`

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED UserTier string union type

The system SHALL define `UserTier` as `'home-cook' | 'prep-cook' | 'sous-chef' | 'executive-chef'`.

#### Scenario: All four tier values are valid

- **Given** the `UserTier` type is defined
- **When** a value of `'home-cook'`, `'prep-cook'`, `'sous-chef'`, or `'executive-chef'` is assigned
- **Then** TypeScript accepts the assignment without error

#### Scenario: Invalid tier value is rejected

- **Given** the `UserTier` type is defined
- **When** a value of `'admin'` or any other string is assigned
- **Then** TypeScript produces a compile-time type error

---

### Requirement: ADDED TIER_RANK ordinal map

The system SHALL define `TIER_RANK` mapping each `UserTier` to a unique integer: `home-cook → 0`, `prep-cook → 1`, `sous-chef → 2`, `executive-chef → 3`.

#### Scenario: Rank ordering is consistent

- **Given** `TIER_RANK` is defined
- **When** ranks are compared
- **Then** `TIER_RANK['home-cook'] < TIER_RANK['prep-cook'] < TIER_RANK['sous-chef'] < TIER_RANK['executive-chef']`

---

### Requirement: ADDED hasAtLeastTier helper

The system SHALL provide `hasAtLeastTier(user, requiredTier)` that returns `true` when the user's tier rank is greater than or equal to the required tier rank, or when `user.isAdmin` is `true`.

#### Scenario: User with exact matching tier passes

- **Given** a user with `tier: 'sous-chef'` and `isAdmin: false`
- **When** `hasAtLeastTier(user, 'sous-chef')` is called
- **Then** it returns `true`

#### Scenario: User with higher tier passes

- **Given** a user with `tier: 'executive-chef'` and `isAdmin: false`
- **When** `hasAtLeastTier(user, 'prep-cook')` is called
- **Then** it returns `true`

#### Scenario: User with lower tier fails

- **Given** a user with `tier: 'home-cook'` and `isAdmin: false`
- **When** `hasAtLeastTier(user, 'sous-chef')` is called
- **Then** it returns `false`

#### Scenario: Admin bypasses tier check

- **Given** a user with `tier: 'home-cook'` and `isAdmin: true`
- **When** `hasAtLeastTier(user, 'executive-chef')` is called
- **Then** it returns `true`

#### Scenario: Undefined tier is treated as home-cook

- **Given** a user with no `tier` field (pre-migration document) and `isAdmin: false`
- **When** `hasAtLeastTier(user, 'home-cook')` is called
- **Then** it returns `true` (home-cook passes home-cook requirement)

#### Scenario: Undefined tier fails elevated requirement

- **Given** a user with no `tier` field and `isAdmin: false`
- **When** `hasAtLeastTier(user, 'prep-cook')` is called
- **Then** it returns `false`

## MODIFIED Requirements

None. This is an entirely new capability.

## REMOVED Requirements

None.

## Traceability

- Proposal element "UserTier type + TIER_RANK map" → Requirement: ADDED UserTier string union type, ADDED TIER_RANK ordinal map
- Design Decision 1 (string enum + rank map) → Requirement: ADDED TIER_RANK ordinal map
- Design Decision 3 (admin bypass) → Requirement: ADDED hasAtLeastTier helper
- Requirement "undefined tier fallback" → Task: implement hasAtLeastTier with `?? 'home-cook'` fallback

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Runtime safety for undefined tier

- **Given** a MongoDB user document that pre-dates the migration and has no `tier` field
- **When** `hasAtLeastTier` is called with any required tier
- **Then** it does not throw; it returns `false` for any required tier above `'home-cook'`, and `true` for `'home-cook'`
