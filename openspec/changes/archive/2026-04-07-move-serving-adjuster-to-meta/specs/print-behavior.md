# Spec: Print Behavior

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

## ADDED Requirements

### Requirement: ADDED Serving controls suppressed in print via CSS

The system SHALL apply `print:hidden` to the `[-]`, `[+]`, and `Reset` buttons so they are invisible when the page is printed.

#### Scenario: Controls hidden at print time

- **Given** a recipe is displayed in `RecipeDetail`
- **When** the browser's print stylesheet is active (e.g., `@media print`)
- **Then** the `[-]`, `[+]`, and `Reset` buttons are not visible in the printed output

#### Scenario: Servings count is visible in print

- **Given** a recipe with `servings: 4` rendered in `RecipeDetail`
- **When** the browser's print stylesheet is active
- **Then** the number `4` (the servings count) is visible in the Servings meta cell

## MODIFIED Requirements

### Requirement: MODIFIED Print route does not require `hideServingAdjuster` prop

The system SHALL suppress serving controls in the cookbook print route via CSS alone, without requiring a `hideServingAdjuster` prop on `RecipeDetail`.

#### Scenario: Print route renders RecipeDetail without hideServingAdjuster

- **Given** the cookbook print route (`/cookbooks/:id/print`)
- **When** it renders `RecipeDetail` for each recipe
- **Then** no `hideServingAdjuster` prop is passed (the prop no longer exists)
- **And** controls are suppressed by `print:hidden` CSS when the page prints

#### Scenario: Ingredients print at default scale

- **Given** the cookbook print route renders a recipe with `servings: 4` and ingredient `"2 cups flour"`
- **When** the page loads fresh (no user interaction)
- **Then** `currentServings` equals `4` (the recipe default)
- **And** ingredients are displayed at their original unscaled quantities

## REMOVED Requirements

### Requirement: REMOVED `hideServingAdjuster` prop suppresses print controls

Reason for removal: The prop is deleted. Print suppression is handled by `print:hidden` CSS classes on the buttons in the Servings meta cell.

## Traceability

- Proposal element (print: controls suppressed, defaults shown) → Requirement: ADDED Serving controls suppressed in print via CSS
- Proposal element (remove hideServingAdjuster) → Requirement: MODIFIED Print route does not require prop
- Design decision 2 (print:hidden CSS) → Requirement: ADDED Serving controls suppressed in print via CSS
- Requirement (controls suppressed) → Task: Apply print:hidden to [-], [+], Reset buttons
- Requirement (remove prop) → Task: Remove hideServingAdjuster from RecipeDetailProps and cookbooks.$cookbookId_.print.tsx

## Non-Functional Acceptance Criteria

### Requirement: Operability — TypeScript build passes

#### Scenario: No TypeScript errors after prop removal

- **Given** `hideServingAdjuster` is removed from `RecipeDetailProps`
- **When** `npm run build` is executed
- **Then** the build completes with zero TypeScript errors (strict mode: `noUnusedLocals`, `noUnusedParameters`)
