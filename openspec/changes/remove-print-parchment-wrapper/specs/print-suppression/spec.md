## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Recipe card chrome hidden in print media

The system SHALL suppress `RecipeDetail`'s card background fill, rounded
corners, and drop shadow when rendered in a print media context, in both
the standalone recipe print path and the cookbook print path.

#### Scenario: Card chrome suppressed on standalone recipe print

- **Given** a recipe detail page (`/recipes/:id`)
- **When** the page is rendered in print media (e.g., browser print preview
  or `@media print`)
- **Then** the outer card wrapper renders with no background fill, no
  border-radius, and no box-shadow

#### Scenario: Card chrome suppressed in cookbook print view

- **Given** a cookbook print page (`/cookbooks/:id/print`) with one or more
  recipes
- **When** the page is rendered in print media
- **Then** each recipe's card wrapper renders with no background fill, no
  border-radius, and no box-shadow

#### Scenario: Recipe header image still renders correctly with chrome suppressed

- **Given** a recipe detail page for a recipe with an image
- **When** the page is rendered in print media
- **Then** the header image renders within its container with no visible
  overflow past the container's edges

## MODIFIED Requirements

### Requirement: MODIFIED Screen display of the recipe card is unchanged

The system SHALL continue to display `RecipeDetail`'s card background fill,
rounded corners, and drop shadow normally in all non-print (screen)
contexts.

#### Scenario: Card chrome visible on screen

- **Given** a recipe detail page
- **When** viewed in a browser (screen media, not print)
- **Then** the card wrapper's background fill, rounded corners, and drop
  shadow are visible and styled as before

## Traceability

- Proposal element "print-only suppression of RecipeDetail's card
  background/rounding/shadow" → Requirement: ADDED Recipe card chrome
  hidden in print media
- Design Decision 1 (`print:bg-transparent print:rounded-none
  print:shadow-none` on the card wrapper) → Requirement: ADDED Recipe card
  chrome hidden in print media
- Design Decision 3 (leave `overflow-hidden` in place) → Requirement: ADDED
  Recipe header image still renders correctly with chrome suppressed
- Requirement ADDED → Task: Add print-scoped chrome-suppression classes to
  `RecipeDetail.tsx`'s outer wrapper
- Requirement MODIFIED → Task: Verify existing `RecipeDetail` screen-mode
  tests pass unmodified

## Non-Functional Acceptance Criteria

### Requirement: Performance

No performance impact — this is a CSS utility class addition. No metrics
needed.

### Requirement: Reliability

#### Scenario: No layout regression in screen view

- **Given** the existing `RecipeDetail` unit and e2e tests
- **When** print-scoped chrome-suppression classes are added to the
  wrapper div
- **Then** all existing screen-mode tests continue to pass without
  modification
