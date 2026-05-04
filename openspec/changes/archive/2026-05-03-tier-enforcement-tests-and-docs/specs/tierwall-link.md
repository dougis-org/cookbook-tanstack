## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED TierWall renders a link to /pricing in inline display mode

The system SHALL render an "Upgrade" link pointing to `/pricing` within the inline TierWall component visible on the recipes page when the user is at their recipe limit.

#### Scenario: Inline TierWall shows Upgrade link to /pricing

- **Given** a logged-in home-cook user who is at their recipe limit (10 recipes)
- **When** the recipes list page renders
- **Then** an element with the accessible name matching `/upgrade/i` is present in the DOM
- **And** that element has `href="/pricing"`

## MODIFIED Requirements

No existing requirements are modified by this spec.

## REMOVED Requirements

None.

## Traceability

- Proposal element "TierWall `/pricing` link unasserted" → Requirement above
- Design mapping (straightforward assertion addition) → Requirement above
- Requirement → Task: Add link assertion to `-recipes.test.tsx`

## Non-Functional Acceptance Criteria

### Requirement: Accessibility

#### Scenario: Upgrade link is accessible by role

- **Given** the TierWall inline component is rendered
- **When** an assistive technology queries for links
- **Then** the Upgrade link is discoverable via `getByRole('link', { name: /upgrade/i })`
