## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED isPageAdEligible as the exported name

The system SHALL export `isPageAdEligible` from `src/lib/ad-policy.ts` instead of `isAdEligible`.

#### Scenario: PageLayout.tsx uses renamed export

- **Given** `src/components/layout/PageLayout.tsx` imports from `src/lib/ad-policy`
- **When** the file is read
- **Then** the import uses `isPageAdEligible`, not `isAdEligible`

#### Scenario: ad-policy tests use renamed export

- **Given** `src/lib/__tests__/ad-policy.test.ts` imports from `src/lib/ad-policy`
- **When** the file is read
- **Then** the import and describe block reference `isPageAdEligible`

#### Scenario: contract test reflects renamed export

- **Given** `src/lib/__tests__/google-adsense-contract.test.ts` asserts on function name string
- **When** the test runs
- **Then** the assertion checks for `'isPageAdEligible(role, session)'`, not `'isAdEligible(role, session)'`

---

## MODIFIED Requirements

### Requirement: MODIFIED tier gate inside isPageAdEligible

The system SHALL implement the tier gate in `isPageAdEligible` by calling `showUserAds(tier)` from `tier-entitlements.ts` rather than an inline `hasAtLeastTier` check.

#### Scenario: behavior parity with old implementation

- **Given** `isPageAdEligible` is called with `('public-content', null)`
- **When** session is null (anonymous visitor)
- **Then** returns `true` (same as old `isAdEligible`)

#### Scenario: paid user still sees no ads

- **Given** `isPageAdEligible` is called with `('public-content', { user: { tier: 'prep-cook' } })`
- **When** called
- **Then** returns `false`

---

## REMOVED Requirements

### Requirement: REMOVED isAdEligible export name

Reason for removal: Renamed to `isPageAdEligible` for clarity. No external consumers — all callers are internal TypeScript files caught by `tsc`.

---

## Traceability

- Proposal: "Rename `isAdEligible` → `isPageAdEligible`" → ADDED isPageAdEligible export name
- Proposal: "Refactor `isPageAdEligible` to call `showUserAds`" → MODIFIED tier gate requirement
- Design Decision 3 → ADDED + REMOVED export name requirements
- Design Decision 2 → MODIFIED tier gate requirement
- All requirements → Task: refactor `src/lib/ad-policy.ts` and update callers

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: TypeScript compile confirms no missed callers

- **Given** the rename is applied
- **When** `tsc --noEmit` runs
- **Then** exits with code 0, no type errors
