## ADDED Requirements

### Requirement: Related recipes section appears on recipe detail page
The system SHALL render a "Related Recipes" section at the bottom of the recipe detail page when the current recipe has a `classificationId` set and at least one other recipe shares that classification (subject to visibility rules).

#### Scenario: Section renders with related recipes
- **WHEN** a recipe detail page is loaded for a recipe with a `classificationId`
- **AND** at least one other visible recipe shares that `classificationId`
- **THEN** a "Related Recipes" heading and between 1–6 recipe cards SHALL be displayed below the recipe detail content

#### Scenario: Section hidden when no related recipes exist
- **WHEN** a recipe detail page is loaded for a recipe with a `classificationId`
- **AND** no other visible recipe shares that `classificationId`
- **THEN** the related recipes section SHALL NOT be rendered

#### Scenario: Section hidden when classification is not set
- **WHEN** a recipe detail page is loaded for a recipe with no `classificationId`
- **THEN** the related recipes section SHALL NOT be rendered

### Requirement: Current recipe excluded from related results
The system SHALL NOT include the currently viewed recipe in the related recipes section.

#### Scenario: Current recipe absent from related list
- **WHEN** the related recipes section is displayed
- **THEN** the recipe card for the currently viewed recipe SHALL NOT appear in the section

### Requirement: Related recipes are limited to 3–6 results
The system SHALL display at most 6 related recipe cards. No minimum count is enforced — the section renders with any non-zero count.

#### Scenario: Result count capped at 6
- **WHEN** more than 6 recipes share the same `classificationId` as the current recipe
- **THEN** at most 6 related recipe cards SHALL be displayed

### Requirement: Each related recipe is a clickable card linking to its detail page
The system SHALL render each related recipe as a `RecipeCard` wrapped in a link to `/recipes/$recipeId`.

#### Scenario: Clicking a related recipe card navigates to its detail page
- **WHEN** the user clicks a related recipe card
- **THEN** the browser SHALL navigate to that recipe's detail page (`/recipes/<recipeId>`)

### Requirement: Related recipes section excluded from print output
The system SHALL hide the related recipes section when the page is printed.

#### Scenario: Section absent in print view
- **WHEN** the user prints the recipe detail page
- **THEN** the related recipes section SHALL NOT appear in the print output
