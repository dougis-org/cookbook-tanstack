# Spec: Serving Controls Location

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

## ADDED Requirements

### Requirement: ADDED Serving controls render in the meta grid Servings cell

The system SHALL render `[-]`, `[+]`, and conditional `[Reset]` buttons inside the Servings meta cell of the Recipe Meta grid, not in the Ingredients section.

#### Scenario: Controls appear in meta grid at default state

- **Given** a recipe with `servings: 4` is displayed in `RecipeDetail`
- **When** the page renders
- **Then** `[-]` (aria-label "Decrease servings") and `[+]` (aria-label "Increase servings") buttons are present
- **And** the displayed servings count is `4`
- **And** no serving adjuster widget appears in or above the Ingredients section

#### Scenario: Reset button absent at default

- **Given** a recipe with `servings: 4` is displayed
- **When** `currentServings` equals `recipe.servings` (default state)
- **Then** no `Reset` button is rendered

#### Scenario: Reset button appears after adjustment

- **Given** a recipe with `servings: 4` is displayed
- **When** the user clicks `[+]` (Increase servings)
- **Then** a `Reset` button becomes visible in the Servings meta cell

#### Scenario: Reset button disappears after reset

- **Given** a recipe with `servings: 4` and `currentServings: 5`
- **When** the user clicks `Reset`
- **Then** `currentServings` returns to `4`
- **And** the `Reset` button is no longer rendered

#### Scenario: No controls when recipe has no servings

- **Given** a recipe with `servings: null` or `servings: undefined`
- **When** the page renders
- **Then** the Servings meta cell displays "N/A" with no `[-]`, `[+]`, or `Reset` buttons

## MODIFIED Requirements

### Requirement: MODIFIED Ingredient display uses scaled quantities

The system SHALL display scaled ingredient quantities based on `currentServings` managed in `RecipeDetail` (previously managed in `ServingSizeAdjuster`).

#### Scenario: Ingredient scaling still works after relocation

- **Given** a recipe with `servings: 2` and ingredient `"2 cups flour"`
- **When** the user clicks `[+]` (Increase servings) once
- **Then** the ingredient list displays `"3 cups flour"`

#### Scenario: Ingredients display at original scale at default

- **Given** a recipe with `servings: 2` and ingredient `"2 cups flour"`
- **When** `currentServings` equals `recipe.servings` (default)
- **Then** the ingredient list displays `"2 cups flour"`

## REMOVED Requirements

### Requirement: REMOVED ServingSizeAdjuster rendered in Ingredients section

Reason for removal: The `ServingSizeAdjuster` component is deleted. Its state and UI are absorbed into `RecipeDetail`. No separate serving adjuster block renders in or above the Ingredients section.

### Requirement: REMOVED `hideServingAdjuster` prop on `RecipeDetail`

Reason for removal: Print suppression is now handled via `print:hidden` CSS classes on the buttons, making the prop unnecessary.

## Traceability

- Proposal element (move controls to meta cell) → Requirement: ADDED Serving controls render in meta grid
- Proposal element (remove ServingSizeAdjuster from Ingredients) → Requirement: REMOVED ServingSizeAdjuster rendered in Ingredients section
- Proposal element (remove hideServingAdjuster prop) → Requirement: REMOVED `hideServingAdjuster` prop
- Design decision 1 (lift state to RecipeDetail) → Requirement: MODIFIED Ingredient display uses scaled quantities
- Design decision 3 (conditional Reset) → Scenario: Reset button absent at default / Reset button appears after adjustment
- Design decision 4 (inline Servings cell) → Requirement: ADDED Serving controls render in meta grid
- Requirement (ADDED controls in meta) → Task: Update RecipeDetail — inline controls in Servings meta cell
- Requirement (REMOVED ServingSizeAdjuster) → Task: Delete ServingSizeAdjuster.tsx and its tests
- Requirement (REMOVED prop) → Task: Remove hideServingAdjuster from RecipeDetailProps and call sites

## Non-Functional Acceptance Criteria

### Requirement: Reliability — reset on recipe navigation

#### Scenario: currentServings resets when recipe prop changes

- **Given** `RecipeDetail` is rendered with recipe A (`servings: 2`) and user has set `currentServings` to `5`
- **When** the component re-renders with recipe B (`servings: 4`)
- **Then** `currentServings` resets to `4` (recipe B's default)
- **And** ingredients display at recipe B's default scale
