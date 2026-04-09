## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED FR1 — Meta grid is hidden on print

The system SHALL apply `print:hidden` to the recipe meta grid container in `RecipeDetail`.

#### Scenario: Grid hidden on print

- **Given** a `RecipeDetail` component rendered with any recipe
- **When** the component mounts
- **Then** the element with the meta grid (`grid grid-cols-2 md:grid-cols-4`) has the class `print:hidden`

### Requirement: ADDED FR2 — Compact print meta line is present and print-only

The system SHALL render a sibling element with classes `hidden` and `print:block` containing the compact meta summary.

#### Scenario: Compact line present with correct visibility classes

- **Given** a `RecipeDetail` component rendered with any recipe
- **When** the component mounts
- **Then** an element with `data-testid="print-meta-line"` exists and has both `hidden` and `print:block` classes

### Requirement: ADDED FR3 — Compact line shows all non-null fields

The system SHALL include each non-null field (prepTime, cookTime, servings, difficulty) in the compact line, joined by ` · `.

#### Scenario: All fields present

- **Given** a recipe with `prepTime: 15`, `cookTime: 30`, `servings: 4`, `difficulty: "medium"`
- **When** `RecipeDetail` renders
- **Then** the `print-meta-line` element contains `Prep: 15m`, `Cook: 30m`, `Serves: 4`, and `Medium` separated by ` · `

#### Scenario: Partial fields — only some non-null

- **Given** a recipe with `prepTime: 20`, `cookTime: null`, `servings: null`, `difficulty: "easy"`
- **When** `RecipeDetail` renders
- **Then** the `print-meta-line` contains `Prep: 20m` and `Easy`, does not contain `Cook:` or `Serves:`

### Requirement: ADDED FR4 — Null fields are omitted from compact line

The system SHALL omit null or undefined meta fields from the compact print line (no "N/A" or empty labels).

#### Scenario: All fields null

- **Given** a recipe with `prepTime: null`, `cookTime: null`, `servings: null`, `difficulty: null`
- **When** `RecipeDetail` renders
- **Then** the `print-meta-line` element renders without any of the labels (`Prep:`, `Cook:`, `Serves:`) and without "N/A"

#### Scenario: Single field present

- **Given** a recipe with `prepTime: null`, `cookTime: 45`, `servings: null`, `difficulty: null`
- **When** `RecipeDetail` renders
- **Then** the `print-meta-line` contains `Cook: 45m` and no ` · ` separator

## MODIFIED Requirements

### Requirement: MODIFIED NFR1 — Screen layout unchanged

The system SHALL NOT change the visible screen layout of the recipe meta block.

#### Scenario: Existing meta grid still renders on screen

- **Given** a `RecipeDetail` component rendered with `prepTime: 15`, `cookTime: 30`, `servings: 4`, `difficulty: "medium"`
- **When** the component mounts (non-print context)
- **Then** the labels "Prep Time", "Cook Time", "Servings", and "Difficulty" are all present in the DOM (existing tests pass without modification)

## REMOVED Requirements

No requirements are removed by this change.

## Traceability

- Proposal: "Add `print:hidden` to the existing meta grid" → FR1
- Proposal: "Add a `hidden print:block` compact single-line summary" → FR2, FR3
- Proposal: "Omit null fields rather than showing N/A" → FR4
- Design Decision 1 (hide grid, show inline line) → FR1, FR2
- Design Decision 2 (compact line format with ` · ` delimiter) → FR3
- Design Decision 3 (null field omission) → FR4
- FR1 → Task: Add `print:hidden` to meta grid div
- FR2, FR3, FR4 → Task: Add `hidden print:block` compact print meta line
- FR1–FR4 → Task: Write unit tests for print meta line

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No regression on existing tests

- **Given** the existing `RecipeDetail.test.tsx` test suite
- **When** the change is applied
- **Then** all pre-existing tests continue to pass without modification
