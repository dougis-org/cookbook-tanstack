## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED canUsePrivateRecipeNotes entitlement helper

The system SHALL export a `canUsePrivateRecipeNotes(tier: string | null | undefined): boolean` function from `src/lib/tier-entitlements.ts` that returns `true` if and only if the tier is `sous-chef` or `executive-chef`.

#### Scenario: Returns false for tiers below sous-chef

- **Given** a caller passes a tier string of `'anonymous'`, `'home-cook'`, or `'prep-cook'`
- **When** `canUsePrivateRecipeNotes(tier)` is called
- **Then** it returns `false`

#### Scenario: Returns true for sous-chef

- **Given** a caller passes `'sous-chef'`
- **When** `canUsePrivateRecipeNotes('sous-chef')` is called
- **Then** it returns `true`

#### Scenario: Returns true for executive-chef

- **Given** a caller passes `'executive-chef'`
- **When** `canUsePrivateRecipeNotes('executive-chef')` is called
- **Then** it returns `true`

#### Scenario: Returns false for null tier

- **Given** a caller passes `null` (e.g., unauthenticated user with no tier set)
- **When** `canUsePrivateRecipeNotes(null)` is called
- **Then** it returns `false`

#### Scenario: Returns false for undefined tier

- **Given** a caller passes `undefined`
- **When** `canUsePrivateRecipeNotes(undefined)` is called
- **Then** it returns `false`

## MODIFIED Requirements

None. No existing entitlement helpers are changed.

## REMOVED Requirements

None.

## Traceability

- Proposal element "add canUsePrivateRecipeNotes at sous-chef+" -> Requirement: ADDED canUsePrivateRecipeNotes entitlement helper
- Design decision 1 (use hasAtLeastTier) -> Requirement: ADDED canUsePrivateRecipeNotes entitlement helper
- Design decision 2+3 (it.each in existing test file) -> Requirement: ADDED canUsePrivateRecipeNotes entitlement helper
- Requirement -> Task: "Add canUsePrivateRecipeNotes to tier-entitlements.ts"
- Requirement -> Task: "Add unit tests for canUsePrivateRecipeNotes"

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Latency budget

- **Given** the function is called in a hot request path
- **When** `canUsePrivateRecipeNotes` is invoked
- **Then** it completes synchronously with no I/O and negligible CPU overhead (single array lookup)

### Requirement: Security

See functional scenarios: "Returns false for tiers below sous-chef", "Returns false for null tier", "Returns false for undefined tier". All access-control boundaries are fully expressed there. No additional NFAC scenario is needed.

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** the function receives an unrecognised tier string (e.g., a future tier not yet in TIER_RANK)
- **When** `canUsePrivateRecipeNotes(unknownTier)` is called
- **Then** `hasAtLeastTier` defaults the unknown value to `home-cook` rank, so the function returns `false` (safe default — deny rather than grant)
