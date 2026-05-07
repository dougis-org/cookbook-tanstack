## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED EntitlementTier type

The system SHALL export an `EntitlementTier` type from `src/lib/tier-entitlements.ts` that is `UserTier | 'anonymous'`.

#### Scenario: anonymous is a valid entitlement tier

- **Given** `EntitlementTier` is imported from `src/lib/tier-entitlements.ts`
- **When** the value `'anonymous'` is used as an `EntitlementTier`
- **Then** TypeScript accepts the value without error

#### Scenario: invalid tier string is rejected

- **Given** `EntitlementTier` is imported from `src/lib/tier-entitlements.ts`
- **When** the value `'super-admin'` is used as an `EntitlementTier`
- **Then** TypeScript rejects the value at compile time

---

### Requirement: ADDED TIER_LIMITS constant

The system SHALL export `TIER_LIMITS` keyed on `EntitlementTier` with `recipes` and `cookbooks` counts matching `docs/user-tier-feature-sets.md`.

#### Scenario: all tier limits match the feature matrix

- **Given** `TIER_LIMITS` is imported
- **When** each tier key is accessed
- **Then** `TIER_LIMITS['anonymous']` is `{ recipes: 0, cookbooks: 0 }`, `TIER_LIMITS['home-cook']` is `{ recipes: 10, cookbooks: 1 }`, `TIER_LIMITS['prep-cook']` is `{ recipes: 100, cookbooks: 10 }`, `TIER_LIMITS['sous-chef']` is `{ recipes: 500, cookbooks: 25 }`, `TIER_LIMITS['executive-chef']` is `{ recipes: 2500, cookbooks: 200 }`

---

### Requirement: ADDED getRecipeLimit helper

The system SHALL export `getRecipeLimit(tier: EntitlementTier): number` returning the recipe count for that tier.

#### Scenario: returns correct limit per tier

- **Given** `getRecipeLimit` is imported
- **When** called with each valid `EntitlementTier` value
- **Then** returns the same value as `TIER_LIMITS[tier].recipes`

---

### Requirement: ADDED getCookbookLimit helper

The system SHALL export `getCookbookLimit(tier: EntitlementTier): number` returning the cookbook count for that tier.

#### Scenario: returns correct limit per tier

- **Given** `getCookbookLimit` is imported
- **When** called with each valid `EntitlementTier` value
- **Then** returns the same value as `TIER_LIMITS[tier].cookbooks`

---

### Requirement: ADDED showUserAds helper

The system SHALL export `showUserAds(tier: EntitlementTier): boolean` returning `true` only for `anonymous` and `home-cook`.

#### Scenario: anonymous sees ads

- **Given** `showUserAds` is imported
- **When** called with `'anonymous'`
- **Then** returns `true`

#### Scenario: home-cook sees ads

- **Given** `showUserAds` is imported
- **When** called with `'home-cook'`
- **Then** returns `true`

#### Scenario: paid tiers do not see ads

- **Given** `showUserAds` is imported
- **When** called with `'prep-cook'`, `'sous-chef'`, or `'executive-chef'`
- **Then** returns `false` for each

---

### Requirement: ADDED canCreatePrivate helper

The system SHALL export `canCreatePrivate(tier: EntitlementTier): boolean` returning `true` for `sous-chef` and above.

#### Scenario: sous-chef can create private content

- **Given** `canCreatePrivate` is imported
- **When** called with `'sous-chef'`
- **Then** returns `true`

#### Scenario: executive-chef can create private content

- **Given** `canCreatePrivate` is imported
- **When** called with `'executive-chef'`
- **Then** returns `true`

#### Scenario: tiers below sous-chef cannot create private content

- **Given** `canCreatePrivate` is imported
- **When** called with `'anonymous'`, `'home-cook'`, or `'prep-cook'`
- **Then** returns `false` for each

---

### Requirement: ADDED canImport helper

The system SHALL export `canImport(tier: EntitlementTier): boolean` returning `true` for `executive-chef` only.

#### Scenario: executive-chef can import recipes

- **Given** `canImport` is imported
- **When** called with `'executive-chef'`
- **Then** returns `true`

#### Scenario: tiers below executive-chef cannot import

- **Given** `canImport` is imported
- **When** called with `'anonymous'`, `'home-cook'`, `'prep-cook'`, or `'sous-chef'`
- **Then** returns `false` for each

---

## MODIFIED Requirements

### Requirement: MODIFIED ad-policy exports

The system SHALL export `isPageAdEligible` (renamed from `isAdEligible`) from `src/lib/ad-policy.ts` with identical behavior.

#### Scenario: isPageAdEligible replicates old isAdEligible behavior

- **Given** `isPageAdEligible` is imported from `src/lib/ad-policy.ts`
- **When** called with any previously-tested `(role, session)` combination
- **Then** returns the same boolean as the old `isAdEligible` did for the same inputs

#### Scenario: isPageAdEligible delegates tier check to showUserAds

- **Given** `isPageAdEligible` is called with a `public-content` page role
- **When** session has a `home-cook` user
- **Then** `showUserAds('home-cook')` is the mechanism that returns `true` for the tier gate

---

## REMOVED Requirements

### Requirement: REMOVED inline tier check in ad-policy.ts

Reason for removal: The `!hasAtLeastTier(session.user, 'prep-cook')` inline check in `isAdEligible` is replaced by a call to `showUserAds`. No behavior changes — implementation consolidates to the new module.

---

## Traceability

- Proposal: "Single source of truth for all numeric and boolean entitlement values" → Requirements: TIER_LIMITS, getRecipeLimit, getCookbookLimit, showUserAds, canCreatePrivate, canImport
- Proposal: "`anonymous` uses wider `EntitlementTier` union" → Requirement: ADDED EntitlementTier type
- Proposal: "Rename `isAdEligible` → `isPageAdEligible`" → Requirement: MODIFIED ad-policy exports
- Design Decision 1 → EntitlementTier type requirement
- Design Decision 2 → showUserAds requirement
- Design Decision 3 → MODIFIED ad-policy exports requirement
- Design Decision 4 → canCreatePrivate, canImport requirements
- Design Decision 5 → getRecipeLimit, getCookbookLimit requirements
- All ADDED requirements → Task: create `src/lib/tier-entitlements.ts`
- MODIFIED requirement → Task: refactor `src/lib/ad-policy.ts`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: pure functions, no side effects

- **Given** any helper in `tier-entitlements.ts` is called
- **When** called with a valid `EntitlementTier`
- **Then** returns a deterministic value with no I/O, no async, no mutation of external state

### Requirement: Operability

#### Scenario: source of truth comment present

- **Given** `src/lib/tier-entitlements.ts` is read
- **When** reviewing the file header
- **Then** a comment references `docs/user-tier-feature-sets.md` as the authoritative source
