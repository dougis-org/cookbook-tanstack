## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Source precedes chiclet wrapper in DOM

The system SHALL render the source attribution element before the chiclet wrapper in the DOM when a recipe has a source.

#### Scenario: Recipe with source and taxonomy tags

- **Given** a recipe has `sourceName` set and at least one taxonomy classification
- **When** `RecipeDetail` renders
- **Then** the source element appears before the chiclet wrapper (`data-testid="chiclet-wrapper"`) in the DOM

#### Scenario: Recipe with source but no taxonomy tags

- **Given** a recipe has `sourceName` set but no taxonomy classifications
- **When** `RecipeDetail` renders
- **Then** the source element is present and no chiclet wrapper is rendered; source appears directly below the title

### Requirement: ADDED Inner wrapper has print flex-row classes

The system SHALL wrap the recipe title `<h1>` and source attribution in a shared div that switches to `flex-row` on print.

#### Scenario: Inner wrapper class list

- **Given** any recipe rendered with `RecipeDetail`
- **When** the component mounts
- **Then** the div wrapping `<h1>` and source contains the classes `print:flex-row`, `print:items-baseline`, and `print:justify-between`

#### Scenario: No source — inner wrapper renders without source child

- **Given** a recipe with no `sourceName`
- **When** `RecipeDetail` renders
- **Then** the inner wrapper contains only the `<h1>` and no source element; the print flex-row layout degrades gracefully (title fills the full width)

## MODIFIED Requirements

### Requirement: MODIFIED Source text size remains text-sm

The system SHALL continue rendering source attribution text at `text-sm` regardless of its new DOM position.

#### Scenario: Source element class list

- **Given** a recipe with `sourceName` set
- **When** `RecipeDetail` renders
- **Then** the source `<p>` element retains the `text-sm` class (verified by class assertion in test)

### Requirement: MODIFIED Actions wrapper is hidden on print

The system SHALL apply `print:hidden` to the actions wrapper div so action buttons do not appear on printed output.

#### Scenario: Actions wrapper print class

- **Given** actions are provided to `RecipeDetail`
- **When** the component renders
- **Then** the div wrapping actions has the class `print:hidden`

#### Scenario: No actions provided

- **Given** no actions are passed to `RecipeDetail`
- **When** the component renders
- **Then** no actions wrapper div is rendered (conditional rendering unchanged)

## REMOVED Requirements

No requirements are removed by this change. Source attribution continues to be conditionally rendered when `sourceName` is present.

## Traceability

- Proposal element "source directly below title on screen" → Requirement: Source precedes chiclet wrapper in DOM
- Proposal element "source to right of title on print" → Requirement: Inner wrapper has print flex-row classes
- Proposal element "same text size" → Requirement: Source text size remains text-sm
- Proposal element "action buttons hidden on print" → Requirement: Actions wrapper is hidden on print
- Design Decision 1 (DOM move) → Requirement: Source precedes chiclet wrapper
- Design Decision 2 (inner wrapper flex) → Requirement: Inner wrapper has print flex-row classes
- Design Decision 3 (print:hidden on actions) → Requirement: Actions wrapper is hidden on print
- Design Decision 4 (source element unchanged) → Requirement: Source text size remains text-sm
- All requirements → Task: Update RecipeDetail.tsx header section
- DOM order requirement → Task: Update RecipeDetail.test.tsx assertions

## Non-Functional Acceptance Criteria

### Requirement: Operability — No custom CSS

#### Scenario: Styles are Tailwind-only

- **Given** the change is implemented
- **When** `src/styles.css` is inspected
- **Then** no `@media print` blocks have been added; all print layout is handled via `print:` Tailwind utilities in the component

### Requirement: Reliability — Existing tests continue to pass

#### Scenario: Full test suite after change

- **Given** the component change is applied
- **When** `npm run test` is executed
- **Then** all existing tests pass (zero regressions); updated DOM-order assertions in `RecipeDetail.test.tsx` also pass
