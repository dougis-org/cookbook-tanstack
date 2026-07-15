## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

(No new requirements — see MODIFIED Requirements below.)

## MODIFIED Requirements

### Requirement: MODIFIED Print route renders recipe position labels

The system SHALL render a `#N` cookbook position label for each printed
recipe as trailing content inside that recipe's own print flow (rendered
via `RecipeDetail`'s `printFooter` slot), rather than as a separate element
positioned outside and below the recipe's card, so no independent
border/padding block is required solely to hold the label. The label
SHALL use the same display-ordered page map as the TOC and alphabetical
index so the cross-references remain consistent, including when chapters
reorder the cookbook display.

#### Scenario: Each recipe section shows a `#N` label inside its own content flow

- **Given** the print route loads for a cookbook with recipes
- **When** a `.cookbook-recipe-section` is rendered
- **Then** the `#N` position label for that recipe is a descendant of the
  recipe's own content container (rendered via `RecipeDetail`'s `printFooter`
  prop), not a sibling element positioned after `RecipeDetail`

#### Scenario: Recipe section labels match TOC and index references

- **Given** the print route is rendered for a chaptered or unchaptered
  cookbook
- **When** the document is inspected
- **Then** a recipe's `#N` label inside its content flow matches the same
  recipe's reference in the TOC and alphabetical index

#### Scenario: Recipe section label is visible in displayonly mode

- **Given** a user opens `/cookbooks/:cookbookId/print?displayonly=1`
- **When** the page renders
- **Then** the `#N` recipe section labels are visible on screen in muted
  gray, inside each recipe's content flow, without triggering the browser
  print dialog

## REMOVED Requirements

(No requirements removed — the position-label requirement is modified in
place, not replaced.)

## Traceability

- Proposal element "reposition per-recipe page number inside the recipe's
  print flow, removing the standalone bordered footer block" → Requirement:
  MODIFIED Print route renders recipe position labels
- Design Decision 2 (`printFooter` prop on `RecipeDetail`) → Requirement:
  MODIFIED Print route renders recipe position labels
- Requirement MODIFIED → Task: Add `printFooter` prop to `RecipeDetailProps`
  and render it inside the content container
- Requirement MODIFIED → Task: Update `cookbooks.$cookbookId_.print.tsx`
  to pass the position-label markup via `printFooter` instead of rendering it
  as a sibling
- Requirement MODIFIED → Task: Update
  `cookbooks.$cookbookId_.print.test.tsx` DOM-position assertions

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Page-break behavior unaffected

- **Given** a cookbook print document with multiple recipes
- **When** the document is printed
- **Then** `.cookbook-recipe-section` page-break-before behavior is
  unchanged, and each recipe (including its now-internal `#N` label)
  still renders on its own page
