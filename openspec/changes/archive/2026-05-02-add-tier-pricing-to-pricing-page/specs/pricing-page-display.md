## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Tier Pricing Display

The system SHALL display pricing information for each tier on the pricing page.

#### Scenario: Anonymous user views pricing page

- **Given** a user who is not authenticated
- **When** the user navigates to `/pricing`
- **Then** the page displays four tier cards with pricing information:
  - Home Cook: "FREE" (no price)
  - Prep Cook: "$27.99/year" (primary), "$2.99/month" (secondary), "Save 2 months" badge
  - Sous Chef: "$59.99/year" (primary), "$5.99/month" (secondary), "Save 2 months" badge
  - Executive Chef: "$99.99/year" (primary), "$9.99/month" (secondary), "Save 2 months" badge

#### Scenario: Authenticated user views pricing page

- **Given** a user authenticated with a specific tier (e.g., Home Cook)
- **When** the user navigates to `/pricing`
- **Then** the page displays pricing information for all tiers as described above, with the user's current tier highlighted

#### Scenario: Pricing data is imported from tier entitlements

- **Given** the `TIER_PRICING` constant in `src/lib/tier-entitlements.ts`
- **When** the pricing page renders tier cards
- **Then** each card's pricing section reads from `TIER_PRICING[tier]`

### Requirement: ADDED Ad Status Display

The system SHALL display the ad impact for each tier on the pricing page.

#### Scenario: Home Cook tier shows "Ad Supported"

- **Given** a tier card for Home Cook
- **When** the card is rendered
- **Then** the ad status row displays "Ad Supported" using `showUserAds('home-cook') === true`

#### Scenario: Paid tiers show "No Ads"

- **Given** a tier card for any of: Prep Cook, Sous Chef, Executive Chef
- **When** the card is rendered
- **Then** the ad status row displays "No Ads" using `showUserAds(tier) === false`

#### Scenario: Ad status uses text labels (not icons)

- **Given** any tier card
- **When** the ad status is rendered
- **Then** it displays as plain text ("Ad Supported" or "No Ads"), not an icon or symbol

---

## MODIFIED Requirements

### Requirement: MODIFIED Import Entitlement Boundary

The system SHALL restrict recipe import functionality to Executive Chef tier only.

#### Scenario: Sous Chef user attempts import

- **Given** a user authenticated with Sous Chef tier
- **When** the user calls `canImport(session.user.tier)`
- **Then** the function returns `false`

#### Scenario: Executive Chef user attempts import

- **Given** a user authenticated with Executive Chef tier
- **When** the user calls `canImport(session.user.tier)`
- **Then** the function returns `true`

#### Scenario: Sous Chef tier description updated

- **Given** the `TIER_DESCRIPTIONS` constant in `src/lib/tier-entitlements.ts`
- **When** `TIER_DESCRIPTIONS['sous-chef']` is accessed
- **Then** it does not contain the phrase "import tools" or any reference to import capability

#### Scenario: Feature matrix documentation updated

- **Given** the document at `docs/user-tier-feature-sets.md`
- **When** the Import Policy section is read
- **Then** it states "Recipe import is available only to Executive Chef users" (not Sous Chef)

### Requirement: MODIFIED Per-Tier CTA Removal

The system SHALL NOT display individual CTA buttons on tier cards.

#### Scenario: Anonymous user views pricing page

- **Given** a user who is not authenticated
- **When** the user views the pricing page
- **Then** no tier card contains an Upgrade, Downgrade, or "Get started free" button

#### Scenario: Authenticated user views their current tier

- **Given** a user authenticated with a tier (e.g., Prep Cook)
- **When** the user views the pricing page
- **Then** the Prep Cook card shows "Current plan" badge with no CTA button; other tier cards have no CTA buttons

#### Scenario: Single CTA for anonymous users

- **Given** a user who is not authenticated
- **When** the user views the pricing page
- **Then** a single "Get Started for Free" button appears below the tier grid, linking to `/auth/register`

#### Scenario: Authenticated user does not see single CTA

- **Given** a user authenticated with any tier
- **When** the user views the pricing page
- **Then** no "Get Started for Free" button appears below the tier grid

---

## REMOVED Requirements

### Requirement: REMOVED Per-Tier Upgrade/Downgrade Buttons

Reason for removal: Issue #417 explicitly requests removal of "the call to action buttons from each tier and put a single 'Get Started for Free' button below the tier information."

---

## Traceability

| Proposal Element | Requirement |
|------------------|-------------|
| Add pricing display | Tier Pricing Display (ADDED) |
| "No Ads" / "Ad Supported" indicator | Ad Status Display (ADDED) |
| Sous Chef no longer gets import | Import Entitlement Boundary (MODIFIED) |
| Remove per-tier CTA buttons | Per-Tier CTA Removal (MODIFIED) + REMOVED |
| Single "Get Started for Free" CTA | Per-Tier CTA Removal (MODIFIED) |

| Design Decision | Requirement |
|-----------------|-------------|
| TIER_PRICING constant | Tier Pricing Display |
| showUserAds() → text | Ad Status Display |
| canImport() requires executive-chef | Import Entitlement Boundary |
| renderCTA() removed from cards | Per-Tier CTA Removal |
| Single CTA for isAnon | Per-Tier CTA Removal |

| Requirement | Task(s) |
|-------------|---------|
| Tier Pricing Display | Update tier-entitlements.ts with TIER_PRICING; Update TierCard in pricing.tsx |
| Ad Status Display | Update TierCard in pricing.tsx to show ad status |
| Import Entitlement Boundary | Update canImport() in tier-entitlements.ts; Update TIER_DESCRIPTIONS; Update docs/user-tier-feature-sets.md |
| Per-Tier CTA Removal | Remove renderCTA() from TierCard; Add single CTA below grid |

---

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Pricing page load performance unchanged

- **Given** a user navigating to `/pricing`
- **When** the page loads
- **Then** no new network requests are made (pricing is static constant data)
- **And** page load time is within 200ms of baseline (no significant regression)

### Requirement: Security

#### Scenario: No new attack surface introduced

- **Given** this change is limited to display-only modifications
- **When** the pricing page renders
- **Then** no user input is captured; no new API endpoints are exposed; no new dependencies are loaded

### Requirement: Maintainability

#### Scenario: Pricing update path is clear

- **Given** pricing needs to change in the future
- **When** a developer updates `TIER_PRICING` in `src/lib/tier-entitlements.ts`
- **Then** the pricing page automatically reflects the new values (single source of truth)