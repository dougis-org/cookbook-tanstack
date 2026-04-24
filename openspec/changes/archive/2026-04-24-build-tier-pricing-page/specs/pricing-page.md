# Spec: /pricing Route

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Pricing page renders tier comparison table from entitlement module

The system SHALL render a tier comparison table at `/pricing` whose values are derived from `TIER_LIMITS`, `canCreatePrivate`, `canImport`, and `showUserAds` in `src/lib/tier-entitlements.ts`.

#### Scenario: All tiers visible with correct limits

- **Given** a visitor navigates to `/pricing`
- **When** the page renders
- **Then** five tier columns are visible (Anonymous, Home Cook, Prep Cook, Sous Chef, Executive Chef) each showing the correct recipe limit, cookbook limit, private content eligibility, import eligibility, and ad status sourced from `TIER_LIMITS` and capability helpers

#### Scenario: No hardcoded limit values in component

- **Given** the `/pricing` component source code
- **When** reviewed
- **Then** no numeric recipe/cookbook limit values appear as literals; all values reference `TIER_LIMITS[tier]` or a helper function

---

### Requirement: ADDED Current tier highlighted for authenticated users

The system SHALL apply a visual highlight to the tier card matching `session.user.tier` when the user is logged in.

#### Scenario: Logged-in user sees their tier highlighted

- **Given** a user is logged in with tier `sous-chef`
- **When** they visit `/pricing`
- **Then** the Sous Chef tier card has a distinct highlight (e.g., border, background, or "Current plan" badge); no other card is highlighted

#### Scenario: Unauthenticated visitor sees no highlight

- **Given** no active session
- **When** `/pricing` renders
- **Then** no tier card shows a "Current plan" indicator

#### Scenario: Unknown or missing tier defaults gracefully

- **Given** a logged-in session where `user.tier` is `undefined`
- **When** `/pricing` renders
- **Then** no tier card is highlighted and the page does not throw an error

---

### Requirement: ADDED Ad slots shown above and below tier cards for eligible visitors

The system SHALL render `AdSlot` components above and below the tier card group when `isPageAdEligible` returns true for the visitor's session.

#### Scenario: Anonymous visitor sees ad slots

- **Given** no active session
- **When** `/pricing` renders
- **Then** an `AdSlot` is rendered above the tier card group and another below it

#### Scenario: Home Cook user sees ad slots

- **Given** a session with `user.tier = 'home-cook'`
- **When** `/pricing` renders
- **Then** both `AdSlot` components are rendered

#### Scenario: Sous Chef user sees no ad slots

- **Given** a session with `user.tier = 'sous-chef'`
- **When** `/pricing` renders
- **Then** neither `AdSlot` component is rendered

---

### Requirement: ADDED Per-tier CTAs linking to appropriate destinations

The system SHALL render a CTA button on each tier card with a destination appropriate to the visitor's status.

#### Scenario: Anonymous visitor sees sign-up CTA

- **Given** no active session
- **When** `/pricing` renders
- **Then** each non-anonymous tier card shows a "Get started free" or equivalent CTA linking to `/auth/sign-up`

#### Scenario: Paid tier card shows upgrade CTA to `/upgrade`

- **Given** any session (or no session)
- **When** `/pricing` renders
- **Then** Home Cook, Prep Cook, Sous Chef tier cards each show an upgrade CTA linking to `/upgrade`

#### Scenario: Executive Chef card shows top-tier message

- **Given** any session
- **When** `/pricing` renders
- **Then** the Executive Chef card shows no upgrade CTA; instead renders a message indicating it is the highest tier (e.g., "You're at the top tier" or "Maximum plan")

---

### Requirement: ADDED Tier description copy displayed per tier

The system SHALL display a 1–2 sentence description for each tier sourced from `TIER_DESCRIPTIONS` in `src/lib/tier-entitlements.ts`.

#### Scenario: Descriptions appear on tier cards

- **Given** `/pricing` renders
- **When** the tier cards are visible
- **Then** each card shows a non-empty description string

#### Scenario: `TIER_DESCRIPTIONS` covers all tiers

- **Given** the `TIER_DESCRIPTIONS` export from `tier-entitlements.ts`
- **When** iterated over all `EntitlementTier` values
- **Then** every tier key has a non-empty string value

## MODIFIED Requirements

No existing requirements are modified by this change.

## REMOVED Requirements

No requirements are removed.

## Traceability

- Proposal: `/pricing` static data → Requirement: tier table from entitlement module
- Proposal: session-based highlight → Requirement: current tier highlighted
- Proposal: ad slots above/below cards → Requirement: ad slots for eligible visitors
- Proposal: CTAs with `/upgrade` stub → Requirement: per-tier CTAs
- Proposal: tier description copy → Requirement: descriptions in `TIER_DESCRIPTIONS`
- Design Decision 1 → tier table + highlight requirements
- Design Decision 4 → ad slot requirement
- Design Decision 5 → CTA requirement
- Design Decision 6 → tier description requirement
- Requirements → Tasks: `src/routes/pricing.tsx`, `TIER_DESCRIPTIONS` in `tier-entitlements.ts`

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Pricing page loads without server tRPC call for table data

- **Given** a visitor navigates to `/pricing`
- **When** the page renders
- **Then** no tRPC query is fired for tier table content; only the session (already hydrated) is consumed

### Requirement: Security

#### Scenario: Pricing page accessible without authentication

- **Given** no active session
- **When** a GET request is made to `/pricing`
- **Then** the page renders successfully (HTTP 200); no redirect to login

### Requirement: Reliability

#### Scenario: Render without crashing when session tier is null

- **Given** an authenticated session where `user.tier` is null or undefined
- **When** `/pricing` renders
- **Then** no JavaScript error is thrown; page renders with no tier highlighted
