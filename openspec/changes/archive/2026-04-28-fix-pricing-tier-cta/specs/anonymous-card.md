## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Anonymous tier card is not rendered on the pricing page

The system SHALL NOT render a tier card for the `anonymous` tier on the pricing page.

#### Scenario: Anonymous visitor does not see an anonymous tier card

- **Given** the user is not authenticated
- **When** the pricing page is rendered
- **Then** `screen.queryByTestId('tier-card-anonymous')` returns null

#### Scenario: Authenticated user does not see an anonymous tier card

- **Given** a user is authenticated with any tier
- **When** the pricing page is rendered
- **Then** `screen.queryByTestId('tier-card-anonymous')` returns null

## MODIFIED Requirements

### Requirement: MODIFIED Pricing page renders 4 tier cards (not 5)

The system SHALL render exactly 4 tier cards: home-cook, prep-cook, sous-chef, executive-chef.

#### Scenario: Correct number of tier cards displayed

- **Given** any session state (authenticated or anonymous)
- **When** the pricing page is rendered
- **Then** exactly 4 elements with `data-testid` matching `tier-card-*` are present in the DOM

## REMOVED Requirements

### Requirement: REMOVED Anonymous tier card rendered and highlighted for anonymous sessions

Reason for removal: `anonymous` is not a real subscription tier. Anonymous visitors browsing the pricing page should see the 4 paid/free tiers only. No card is highlighted for anonymous visitors.

## Traceability

- Proposal element (anonymous tier removed from display) → ADDED Anonymous tier not rendered, MODIFIED 4 cards
- Design decision 3 (filter at render time) → ADDED Anonymous tier not rendered
- All requirements → Task: remove-anonymous-card in tasks.md

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Removing anonymous card does not break tier comparison logic

- **Given** a user is not authenticated (`currentTier` resolves to `"anonymous"` internally)
- **When** the pricing page is rendered
- **Then** all 4 visible tier cards show "Get started free" links and no JavaScript error is thrown
