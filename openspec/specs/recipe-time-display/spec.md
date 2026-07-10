## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-07-09-add-na-cook-prep-time/design.md) document, not a replacement.

### Requirement: ADDED N/A toggle for prep time and cook time in RecipeForm

The system SHALL provide independent "N/A" toggle controls for the Prep Time and Cook Time fields in `RecipeForm`. When a toggle is active, the corresponding number input SHALL be disabled and the field's value SHALL be submitted as `null`. When inactive, the field behaves as a normal number input.

#### Scenario: User marks Prep Time as N/A

- **Given** the user is editing a recipe with `prepTime: 30`
- **When** the user activates the "N/A" toggle for Prep Time
- **Then** the Prep Time number input becomes disabled
- **And** submitting the form sends `prepTime: null` to the `recipes.update` mutation

#### Scenario: User clears an N/A toggle to re-enter a value

- **Given** the user has the "N/A" toggle active for Cook Time (input disabled, no value)
- **When** the user deactivates the "N/A" toggle
- **Then** the Cook Time number input becomes enabled and empty
- **And** the user can type a new numeric value which is submitted normally

#### Scenario: Form loads with a legacy zero value

- **Given** a recipe has `cookTime: 0` in the database
- **When** the user opens the recipe in `RecipeForm` for editing
- **Then** the Cook Time "N/A" toggle is active by default
- **And** the Cook Time number input is disabled

#### Scenario: Autosave persists an N/A toggle the same way manual submit does

- **Given** the user is editing an existing recipe and activates the "N/A" toggle for Prep Time
- **When** the autosave debounce interval elapses
- **Then** the autosave mutation payload includes `prepTime: null`

### Requirement: ADDED Consistent "N/A" display for missing or zero prep/cook time

The system SHALL display the literal text "N/A" for `prepTime` or `cookTime` wherever it is rendered to a user, whenever the underlying value is `null`, `undefined`, or `0`. This applies uniformly across `RecipeDetail`, `RecipeCard`, `CookbookRecipeCard`, and `CookbookStandaloneLayout` (including any print rendering that reuses these components).

#### Scenario: Recipe detail page shows N/A for a null prep time

- **Given** a recipe has `prepTime: null`
- **When** the user views the recipe detail page
- **Then** the Prep Time field displays "N/A"

#### Scenario: Recipe card shows N/A instead of omitting the label

- **Given** a recipe has `cookTime: null` and `prepTime: 15`
- **When** the recipe is rendered in `RecipeCard`
- **Then** the card displays "Prep: 15 min" and "Cook: N/A" (both labels are present; neither is silently omitted)

#### Scenario: Cookbook recipe card and standalone/print layout show N/A for a zero value

- **Given** a recipe has `prepTime: 0`
- **When** the recipe is rendered inside a cookbook via `CookbookRecipeCard` or `CookbookStandaloneLayout` (including the print view)
- **Then** the rendered summary shows "N/A" for prep time rather than omitting it or showing "0m"

## MODIFIED Requirements

None — this is a new capability; no prior requirements exist to modify. (`RecipeDetail`'s existing ad hoc N/A ternary is superseded by the shared formatting requirement above but was never previously specified as a capability requirement.)

## REMOVED Requirements

None

## Traceability

- Proposal element -> Requirement: Explicit N/A toggle that disables the input (requester decision 2) -> ADDED N/A toggle for prep time and cook time in RecipeForm
- Proposal element -> Requirement: N/A shown consistently in display and printout (requester decision 3) -> ADDED Consistent "N/A" display for missing or zero prep/cook time
- Proposal element -> Requirement: 0 treated identically to N/A (requester decision 1) -> ADDED Consistent "N/A" display for missing or zero prep/cook time (zero scenarios); ADDED N/A toggle for prep time and cook time in RecipeForm (legacy zero default-toggle scenario)
- Design decision -> Requirement: Decision 3 (per-field toggle + shared `formatMinutesOrNA` helper) -> both ADDED requirements above
- Requirement -> Task(s): See [`tasks.md`](../../changes/archive/2026-07-09-add-na-cook-prep-time/tasks.md)

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

#### Scenario: Latency budget

- **Given** normal rendering load
- **When** `formatMinutesOrNA` is called for each recipe card in a list or grid view
- **Then** the formatting adds no measurable rendering overhead (pure synchronous string function, no I/O)

### Requirement: Security

See functional scenarios: N/A (this capability is a display/UI formatting and form-state change; it introduces no new access-control surface).

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** a recipe record is missing the `prepTime`/`cookTime` keys entirely (e.g., malformed legacy data)
- **When** any of the four display components render that recipe
- **Then** `formatMinutesOrNA` treats the missing keys the same as `undefined` and renders "N/A" without throwing
