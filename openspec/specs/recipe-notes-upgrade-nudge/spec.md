## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-07-02-recipe-notes-upgrade-nudge/design.md) document, not a replacement.

### Requirement: ADDED `RecipeNotesUpgradeNudge` component

The system SHALL render an inline upgrade nudge in the recipe notes slot when the caller is not entitled to read or write private recipe notes, with copy and CTA varying by the caller's entitlement state.

#### Scenario: Anonymous user sees login nudge

- **Given** the component is rendered with `state="anonymous"`
- **When** the component mounts
- **Then** the text "Login or register to save private notes on any recipe." is visible
- **And** a link labelled "Login" is rendered with `href="/auth/login"`
- **And** no note body content is rendered

#### Scenario: Below-tier user sees upgrade nudge

- **Given** the component is rendered with `state="below-tier"`
- **When** the component mounts
- **Then** the text "Private notes are part of Sous Chef. Upgrade to add notes to any recipe you can view." is visible
- **And** a link labelled "Upgrade" is rendered with `href="/pricing"`
- **And** no note body content is rendered

#### Scenario: Downgraded user sees note-saved nudge

- **Given** the component is rendered with `state="hidden-by-downgrade"`
- **When** the component mounts
- **Then** the text "Your notes are saved. Upgrade to Sous Chef to see and edit them again." is visible
- **And** a link labelled "Upgrade" is rendered with `href="/pricing"`
- **And** no note body content is rendered

#### Scenario: Component structure uses adblock-safe classnames

- **Given** the component renders in any state
- **When** the DOM is inspected
- **Then** the container carries class `up-card`
- **And** the copy text element carries class `up-body`
- **And** the CTA link carries class `up-cta`
- **And** no classname matches `.ad-*`, `.promo-*`, `.sponsor-*`, or `.banner-*` patterns

#### Scenario: CTA is an accessible link

- **Given** the component renders in any state
- **When** the DOM is inspected
- **Then** the CTA is rendered as an `<a>` element (via `<Link>` from `@tanstack/react-router`)
- **And** the link has a descriptive accessible name ("Login" or "Upgrade")

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal: Three unentitled states → Requirement: ADDED `RecipeNotesUpgradeNudge` component (scenarios: anonymous, below-tier, hidden-by-downgrade)
- Design Decision 1 (prop-driven state) → All three state scenarios
- Design Decision 2 (inline strip, `.up-*` classnames) → Scenario: Component structure uses adblock-safe classnames
- Design Decision 3 (Lock icon) → Covered by visual inspection; no dedicated scenario needed
- Design Decision 4 (single CTA per state) → Scenarios: anonymous CTA, below-tier CTA, downgraded CTA
- Design Decision 5 (adblock-safe classnames) → Scenario: Component structure uses adblock-safe classnames
- Requirements → Tasks: all tasks in `tasks.md`

## Non-Functional Acceptance Criteria

### Requirement: Security

See functional scenarios: "Anonymous user sees login nudge", "Below-tier user sees upgrade nudge", "Downgraded user sees note-saved nudge" — each scenario asserts that no note body content is rendered. The `RecipeNotesUpgradeNudge` component accepts no `body` prop, providing a structural guarantee that note content cannot reach unentitled callers through this component.

### Requirement: Performance

No latency budget applies — component is purely static/presentational with no async operations.

### Requirement: Reliability

No recovery behavior applies — component has no async operations or external dependencies.
