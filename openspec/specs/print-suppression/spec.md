## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Chiclets hidden in print media

The system SHALL hide all taxonomy and classification chiclets when `RecipeDetail` is rendered in a print media context.

#### Scenario: Chiclets suppressed in cookbook print view

- **Given** a cookbook print page (`/cookbooks/:id/print`) with recipes
  that have meal, course, preparation, and category badges
- **When** the page is rendered in print media (e.g., browser print preview or `@media print`)
- **Then** the chiclet wrapper element is not visible (has `display: none`)

#### Scenario: Chiclets suppressed when printing a recipe detail page

- **Given** a recipe detail page (`/recipes/:id`) with taxonomy chiclets
- **When** the page is rendered in print media
- **Then** the chiclet wrapper element is not visible

#### Scenario: Recipe with no chiclets is unaffected

- **Given** a recipe with no classification, meal, course, or preparation data
- **When** rendered in print media
- **Then** no errors occur and the layout is unchanged

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

### Requirement: MODIFIED Screen display of chiclets is unchanged

The system SHALL continue to display chiclets normally in all non-print (screen) contexts.

#### Scenario: Chiclets visible on screen

- **Given** a recipe detail page with taxonomy chiclets
- **When** viewed in a browser (screen media, not print)
- **Then** the chiclet wrapper and all badge children are visible and styled as before

### Requirement: MODIFIED Screen display of the recipe card is unchanged

The system SHALL continue to display `RecipeDetail`'s card background fill,
rounded corners, and drop shadow normally in all non-print (screen)
contexts.

#### Scenario: Card chrome visible on screen

- **Given** a recipe detail page
- **When** viewed in a browser (screen media, not print)
- **Then** the card wrapper's background fill, rounded corners, and drop
  shadow are visible and styled as before

## REMOVED Requirements

### Requirement: REMOVED Print styling for `.classification-badge`

The `.classification-badge` CSS block in `print.css` (transparent background, black text/border override) is removed.

**Reason for removal:** The wrapper div is now hidden in print, making
these rules dead code. Removing them prevents confusion about intent
and keeps the stylesheet clean.

## Traceability

- Proposal element "suppress chiclets in print" → Requirement: ADDED Chiclets hidden in print media
- Proposal element "remove dead `.classification-badge` CSS" → Requirement: REMOVED Print styling for `.classification-badge`
- Design Decision 1 (`print:hidden` on wrapper) → Requirement: ADDED Chiclets hidden in print media
- Design Decision 2 (remove dead CSS) → Requirement: REMOVED Print styling for `.classification-badge`
- Requirement ADDED → Task: Add `print:hidden` to wrapper div in `RecipeDetail.tsx`
- Requirement REMOVED → Task: Delete `.classification-badge` block from `print.css`
- Requirement MODIFIED → Task: Verify existing `RecipeDetail` screen tests pass
- Proposal element "print-only suppression of RecipeDetail's card
  background/rounding/shadow" ([`remove-print-parchment-wrapper`](../../changes/archive/2026-07-15-remove-print-parchment-wrapper/design.md)) →
  Requirement: ADDED Recipe card chrome hidden in print media
- Requirement ADDED ([`remove-print-parchment-wrapper`](../../changes/archive/2026-07-15-remove-print-parchment-wrapper/design.md)) → Task: Add
  print-scoped chrome-suppression classes to `RecipeDetail.tsx`'s outer
  wrapper
- Requirement MODIFIED ([`remove-print-parchment-wrapper`](../../changes/archive/2026-07-15-remove-print-parchment-wrapper/design.md)) → Task: Verify
  existing `RecipeDetail` screen-mode tests pass unmodified

## Non-Functional Acceptance Criteria

### Requirement: Performance

No performance impact — this is a CSS utility class addition. No metrics needed.

### Requirement: Reliability

#### Scenario: No layout regression in screen view

- **Given** the existing `RecipeDetail` unit tests
- **When** the `print:hidden` class is added to the wrapper div
- **Then** all existing screen-mode tests continue to pass without modification

#### Scenario: No layout regression in screen view (card chrome)

- **Given** the existing `RecipeDetail` unit and e2e tests
- **When** print-scoped chrome-suppression classes are added to the
  wrapper div
- **Then** all existing screen-mode tests continue to pass without
  modification
