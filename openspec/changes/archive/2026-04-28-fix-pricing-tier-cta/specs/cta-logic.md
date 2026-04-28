## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Downgrade CTA for lower tiers

The system SHALL display a "Downgrade" link to `/change-tier` on any tier card whose position in `TIER_ORDER` is lower than the user's current tier.

#### Scenario: Logged-in sous-chef sees Downgrade on lower tiers

- **Given** a user is authenticated with tier `sous-chef`
- **When** the pricing page is rendered
- **Then** the `home-cook` and `prep-cook` tier cards each contain a link with text "Downgrade" and href `/change-tier`

#### Scenario: Logged-in home-cook sees no Downgrade (is lowest paid tier)

- **Given** a user is authenticated with tier `home-cook`
- **When** the pricing page is rendered
- **Then** no tier card contains a link with text "Downgrade"

### Requirement: ADDED No CTA on current tier card

The system SHALL display no action link or button on the card matching the user's current tier.

#### Scenario: Current tier card has no CTA

- **Given** a user is authenticated with tier `prep-cook`
- **When** the pricing page is rendered
- **Then** the `tier-card-prep-cook` element contains no `<a>` element

#### Scenario: Top-tier user has no CTA on executive-chef card

- **Given** a user is authenticated with tier `executive-chef`
- **When** the pricing page is rendered
- **Then** the `tier-card-executive-chef` element contains no `<a>` element and shows "Maximum plan" text

## MODIFIED Requirements

### Requirement: MODIFIED Upgrade CTA only appears on higher tiers

The system SHALL display an "Upgrade" link to `/change-tier` (previously `/upgrade`) only on tier cards whose position in `TIER_ORDER` is higher than the user's current tier.

#### Scenario: Logged-in home-cook sees Upgrade on higher tiers

- **Given** a user is authenticated with tier `home-cook`
- **When** the pricing page is rendered
- **Then** the `prep-cook`, `sous-chef`, and `executive-chef` cards each contain a link with text "Upgrade" and href `/change-tier`
- **And** the `home-cook` card contains no CTA link

#### Scenario: Anonymous visitor sees Get Started on all non-anonymous tiers

- **Given** the user is not authenticated
- **When** the pricing page is rendered
- **Then** all visible tier cards (home-cook, prep-cook, sous-chef, executive-chef) contain a "Get started free" link to `/auth/register`
- **And** executive-chef shows "Maximum plan" text with no link

## REMOVED Requirements

### Requirement: REMOVED All non-current, non-top tiers show "Upgrade"

Reason for removal: This was the buggy behavior reported in issue #401. Lower tiers must now show "Downgrade" instead of "Upgrade".

## Traceability

- Proposal element (Upgrade vs Downgrade based on tier position) → Requirements: ADDED Downgrade CTA, MODIFIED Upgrade CTA only on higher tiers
- Proposal element (No CTA on current tier) → Requirement: ADDED No CTA on current tier card
- Design decision 1 (index comparison) → ADDED Downgrade CTA, MODIFIED Upgrade CTA
- Design decision 2 (currentTier prop replaces isCurrent) → ADDED No CTA on current tier card
- All requirements → Task: fix-cta-logic in tasks.md

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Pricing page renders without error for all tier sessions

- **Given** any valid `EntitlementTier` value (including `home-cook` fallback for missing tier)
- **When** the pricing page is rendered
- **Then** no React error is thrown and all tier cards are present except `anonymous`
