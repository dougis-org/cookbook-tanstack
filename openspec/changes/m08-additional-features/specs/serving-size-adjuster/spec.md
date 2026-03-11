## ADDED Requirements

### Requirement: Serving size adjuster is displayed on the recipe detail page
The system SHALL render a `ServingSizeAdjuster` component near the ingredient list on the recipe detail page, showing the current serving count with increment and decrement controls.

#### Scenario: Adjuster renders with recipe's default servings
- **WHEN** the user opens a recipe detail page
- **THEN** the adjuster shows the recipe's original serving count as the current value, with + and − buttons

#### Scenario: Decrement button is disabled at minimum serving (1)
- **WHEN** the current serving count is 1
- **THEN** the − button is disabled and cannot be clicked

---

### Requirement: Ingredient quantities scale proportionally with serving adjustments
The system SHALL recalculate and display ingredient quantities as a proportional multiple of the original amounts whenever the serving count changes. Changes SHALL be reflected immediately without a network request.

#### Scenario: Increase servings
- **WHEN** the user clicks the + button to increase servings from N to N+1
- **THEN** all ingredient quantities update immediately to reflect the new ratio (e.g. 2 cups → 3 cups when going from 4 to 6 servings)

#### Scenario: Decrease servings
- **WHEN** the user clicks the − button to decrease servings
- **THEN** all ingredient quantities update immediately to reflect the reduced ratio

#### Scenario: Quantities are rounded to 2 decimal places
- **WHEN** scaling produces irrational decimal values
- **THEN** the displayed quantity is rounded to at most 2 decimal places (e.g. 0.33 not 0.3333...)

#### Scenario: Non-numeric ingredient quantities are unchanged
- **WHEN** an ingredient quantity is a non-numeric string (e.g. "to taste", "a pinch")
- **THEN** the quantity is displayed unchanged regardless of the serving count

---

### Requirement: User can reset to original serving size
The system SHALL provide a Reset button or link that returns the serving count and all ingredient quantities to the recipe's original values.

#### Scenario: Reset restores original values
- **WHEN** the user has adjusted servings and then clicks Reset
- **THEN** the serving count returns to the recipe's default and all ingredient quantities return to their original values

#### Scenario: Reset button is hidden when at original serving size
- **WHEN** the current serving count equals the recipe's original serving count
- **THEN** the Reset button is not visible (or is disabled)

---

### Requirement: Serving adjustment is session-only and not persisted
The system SHALL not save serving size adjustments to the database. On page reload, the adjuster SHALL return to the recipe's default serving count.

#### Scenario: Reload resets to original
- **WHEN** the user adjusts servings and reloads the page
- **THEN** the adjuster shows the original serving count again
