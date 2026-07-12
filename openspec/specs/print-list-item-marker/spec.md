## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-07-12-unify-print-list-item-styling/design.md) document, not a replacement.

### Requirement: ADDED Shared print marker class drives both ingredient and instruction list items

The system SHALL apply a single shared CSS class, `.print-list-item`, to both the recipe ingredient `<li>` and the recipe instruction `<li>` elements, and that class SHALL be the sole source of print-time marker appearance and item-level left-alignment for both sections.

#### Scenario: Ingredient list item carries the shared class

- **Given** a recipe with at least one ingredient line is rendered
- **When** the page markup is inspected
- **Then** each non-spacer ingredient `<li>` (`.recipe-ingredient-item`) carries the `.print-list-item` class

#### Scenario: Instruction list item carries the shared class

- **Given** a recipe with at least one instruction step is rendered
- **When** the page markup is inspected
- **Then** each non-spacer instruction `<li>` (`.recipe-instruction-step`) carries the `.print-list-item` class

#### Scenario: Spacer items do not carry the shared class

- **Given** a recipe's ingredients or instructions contain a blank-line spacer row
- **When** the page markup is inspected
- **Then** the spacer `<li>` (`.recipe-ingredient-spacer` or `.recipe-instruction-spacer`) does not carry `.print-list-item` and renders no marker

### Requirement: ADDED Print marker is smaller than the current ingredient dot and left-aligned

The system SHALL render, in print only, a marker for each `.print-list-item` that is visually smaller than today's ingredient dot (8px, 12px margin) and positioned close enough to the left edge that the item text reads as left-aligned with the section heading above it.

#### Scenario: Ingredient marker footprint shrinks in print

- **Given** a recipe detail page with ingredients is rendered
- **When** the user opens print preview or prints the page
- **Then** the combined marker width and gap before ingredient text is visibly smaller than the current ~20px offset (8px dot + 12px margin)
- **And** the ingredient text begins close enough to the page margin to read as left-aligned with the "Ingredients" heading

#### Scenario: Existing literal ingredient dot span is not double-rendered in print

- **Given** the ingredient `<li>` markup includes both the pre-existing dot `<span>` and the new `.print-list-item` marker
- **When** the user opens print preview or prints the page
- **Then** exactly one marker per ingredient line is visible (the pre-existing dot `<span>` is hidden in print via `print:hidden`, and the `.print-list-item` marker is the only one rendered)

### Requirement: ADDED Instruction steps render a print-only delimiter marker

The system SHALL render a small marker before each instruction step's text in print, using the same shared marker treatment as the ingredient list, so that consecutive steps are visually delimited.

#### Scenario: Instruction step shows a marker in print where none existed before

- **Given** a recipe detail page with two or more instruction steps is rendered
- **When** the user opens print preview or prints the page
- **Then** each instruction step displays a small marker immediately before its step text
- **And** the on-screen numbered circle badge remains hidden in print (unchanged from the existing `print-instruction-numbering` capability)

#### Scenario: Instruction marker does not increase vertical spacing between steps

- **Given** a recipe detail page with three or more instruction steps is rendered
- **When** the user opens print preview or prints the page
- **Then** the vertical space between consecutive instruction steps is unchanged from the existing print spacing (`print:space-y-1`)

### Requirement: ADDED Container-level print layout is unaffected by the shared item class

The system SHALL NOT change the ingredient list's two-column print layout or the instruction list's single-column print layout as a result of introducing the shared `.print-list-item` class.

#### Scenario: Ingredients remain two-column in print

- **Given** a recipe detail page with a long ingredient list is rendered
- **When** the user opens print preview or prints the page
- **Then** the ingredient list still renders in two columns (`print:columns-2`), unchanged by this change

#### Scenario: Instructions remain single-column in print

- **Given** a recipe detail page with a long instruction list is rendered
- **When** the user opens print preview or prints the page
- **Then** the instruction list still renders in a single column, unchanged by this change

### Requirement: ADDED No on-screen visual change to either section

The system SHALL NOT alter the on-screen (non-print) appearance of the ingredient list's dot marker or the instruction list's numbered circle badge.

#### Scenario: Ingredient dot unchanged on screen

- **Given** a recipe detail page with ingredients is rendered in a normal (non-print) browser view
- **When** the page is viewed on screen
- **Then** each ingredient still displays its existing accent-colored dot exactly as before this change

#### Scenario: Instruction numbered badge unchanged on screen

- **Given** a recipe detail page with instructions is rendered in a normal (non-print) browser view
- **When** the page is viewed on screen
- **Then** each instruction step still displays its numbered circle badge exactly as before this change

## Traceability

- Proposal element: "Shrink the oversized ingredient bullet-dot indent (#594)" -> Requirement: "ADDED Print marker is smaller than the current ingredient dot and left-aligned"
- Proposal element: "Add a matching small dot marker to instruction steps in print (#595)" -> Requirement: "ADDED Instruction steps render a print-only delimiter marker"
- Proposal element: "Single shared CSS class for both sections" -> Requirement: "ADDED Shared print marker class drives both ingredient and instruction list items"
- Proposal element: "Ingredients stay 2-column, instructions stay 1-column" -> Requirement: "ADDED Container-level print layout is unaffected by the shared item class"
- Proposal element: "On-screen rendering of both sections must be visually unchanged" -> Requirement: "ADDED No on-screen visual change to either section"
- Design decision 1 (`.print-list-item::before` shared marker, `print:hidden` on old ingredient span) -> Requirement: "ADDED Shared print marker class drives both ingredient and instruction list items"; "ADDED Print marker is smaller than the current ingredient dot and left-aligned"
- Design decision 2 (5px dot, 0.35rem gap) -> Requirement: "ADDED Print marker is smaller than the current ingredient dot and left-aligned"
- Design decision 3 (container layout untouched) -> Requirement: "ADDED Container-level print layout is unaffected by the shared item class"
- Requirement -> Task(s): see [`tasks.md`](../../changes/archive/2026-07-12-unify-print-list-item-styling/tasks.md)

## Non-Functional Acceptance Criteria

> NFAC scenarios below do not duplicate the functional scenarios above; they cover distinct non-functional properties (maintainability of the shared class, and reliability of print pagination).

### Requirement: Operability

#### Scenario: Print marker styling is defined in exactly one place

- **Given** the change is implemented across `src/components/recipes/RecipeDetail.tsx` and `src/styles/print.css`
- **When** the diff is reviewed
- **Then** `.print-list-item` marker/gap/alignment styling exists in exactly one CSS rule set in `src/styles/print.css`, referenced by class name from both the ingredient and instruction `<li>` elements
- **And** no duplicate, section-specific marker CSS is introduced for either section

### Requirement: Reliability

#### Scenario: Print pagination behavior unaffected

- **Given** a printed recipe or cookbook spans multiple pages
- **When** the user prints the page
- **Then** `break-inside: avoid` / `page-break-inside: avoid` on `.recipe-ingredient-item` and `.recipe-instruction-step` continues to prevent a list item from splitting across a page boundary, unchanged by the new marker
