## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Ingredient 2-column layout in print

The system SHALL render the ingredient list as two balanced columns when printing.

#### Scenario: Ingredient list renders in 2 columns

- **Given** a recipe with multiple ingredients
- **When** the recipe is rendered in print context (cookbook print view or individual recipe print)
- **Then** the ingredient `<ul>` element has the `print:columns-2` and `print:gap-x-8` Tailwind classes applied

#### Scenario: Empty ingredient list does not break

- **Given** a recipe with no ingredients
- **When** the recipe is rendered in print context
- **Then** the fallback "No ingredients listed" text renders normally and the 2-column `<ul>` is not present in the DOM

### Requirement: ADDED Tighter ingredient spacing in print

The system SHALL use tighter per-item spacing for the ingredient list when printing.

#### Scenario: Ingredient list spacing is reduced in print

- **Given** a recipe with multiple ingredients
- **When** the recipe is rendered in print context
- **Then** the ingredient `<ul>` element includes the `print:space-y-1` class

## MODIFIED Requirements

### Requirement: MODIFIED Recipe title print size

The system SHALL render the recipe title at `print:text-xl` (down from `print:text-2xl`) when printing.

#### Scenario: Recipe title uses smaller print size

- **Given** a recipe detail page or cookbook print view
- **When** the page is rendered
- **Then** the recipe title `<h1>` element's className includes `print:text-xl` and does NOT include `print:text-2xl`

### Requirement: MODIFIED Section heading print size

The system SHALL render Ingredients, Instructions, Notes, and Nutrition headings at `print:text-lg` (down from `print:text-xl`) when printing.

#### Scenario: Section headings use smaller print size

- **Given** a recipe with ingredients, instructions, notes, and nutrition data
- **When** the recipe is rendered
- **Then** each section `<h2>` element's className includes `print:text-lg` and does NOT include `print:text-xl`

### Requirement: MODIFIED Section bottom margin in print

The system SHALL apply `print:mb-4` to all recipe `<section>` elements when printing (replacing the screen value of `mb-8`).

#### Scenario: All sections have tighter print margin

- **Given** a recipe with ingredients, instructions, notes, and nutrition sections
- **When** the recipe is rendered
- **Then** each `<section>` element's className includes `print:mb-4`

### Requirement: MODIFIED @page margin

The system SHALL apply a `1cm` page margin when printing (down from `1.5cm`).

#### Scenario: Print page margin is 1cm

- **Given** `src/styles/print.css` is loaded
- **When** a page is printed
- **Then** the `@page` rule specifies `margin: 1cm`

### Requirement: MODIFIED Screen layout is unchanged

The system SHALL NOT alter any screen (non-print) layout or visual appearance as a result of these changes.

#### Scenario: Screen rendering unaffected

- **Given** a recipe detail page viewed in a browser (not print preview)
- **When** the page is rendered normally
- **Then** all existing screen-mode tests pass without modification; no `columns-2` layout is applied on screen

## REMOVED Requirements

No requirements are removed by this change.

## Traceability

- Proposal: 2-column ingredient list → Requirement: ADDED Ingredient 2-column layout in print → Task: Update ingredient `<ul>` classes in RecipeDetail
- Proposal: Heading size one level smaller → Requirement: MODIFIED Recipe title print size, MODIFIED Section heading print size → Task: Update `printHeadingDensity.ts` constants
- Proposal: Tighter section margins → Requirement: MODIFIED Section bottom margin in print → Task: Add `print:mb-4` to section elements in RecipeDetail
- Proposal: Narrower `@page` margin → Requirement: MODIFIED @page margin → Task: Update `print.css`
- Design Decision 1 (CSS columns) → Requirement: ADDED Ingredient 2-column layout in print
- Design Decision 2 (heading constants) → Requirement: MODIFIED Recipe title print size, MODIFIED Section heading print size
- Design Decision 3 (section margins) → Requirement: MODIFIED Section bottom margin in print
- Design Decision 4 (@page margin) → Requirement: MODIFIED @page margin

## Non-Functional Acceptance Criteria

### Requirement: Operability — zero screen impact

#### Scenario: Existing unit tests pass unchanged

- **Given** all changes are scoped to `@media print` via Tailwind `print:` utilities or `print.css`
- **When** the full unit test suite (`npm run test`) is run
- **Then** all pre-existing passing tests continue to pass; no new failures are introduced by the styling changes alone

### Requirement: Reliability — graceful degradation for minimal content

#### Scenario: Recipe with no optional sections prints cleanly

- **Given** a recipe with no notes, no nutrition data, and an empty ingredient list
- **When** the recipe is rendered in print context
- **Then** the page renders without errors; no broken layout from empty 2-column `<ul>` or missing sections
