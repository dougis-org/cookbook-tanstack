## Purpose

Define the behavior of the heart (marked) indicator on recipe cards.

## Requirements

### Requirement: RecipeCard renders a heart indicator for authenticated users

The `RecipeCard` component SHALL accept an optional `marked?: boolean` prop. When rendered for an authenticated user, it SHALL display a Lucide `Heart` icon. The icon SHALL be filled and red (`fill-red-500 text-red-500`) when `marked` is `true`, and outline (unfilled) otherwise. The indicator SHALL NOT be rendered when `marked` is `undefined` (i.e. when the viewer is anonymous).

#### Scenario: Authenticated user views a saved recipe card

- **WHEN** `RecipeCard` is rendered with `marked={true}`
- **THEN** a filled red heart icon is visible on the card

#### Scenario: Authenticated user views an unsaved recipe card

- **WHEN** `RecipeCard` is rendered with `marked={false}`
- **THEN** an outline heart icon is visible on the card

#### Scenario: Anonymous user views a recipe card

- **WHEN** `RecipeCard` is rendered without the `marked` prop (or `marked={undefined}`)
- **THEN** no heart icon is rendered on the card

### Requirement: Recipe list page passes marked through to RecipeCard

The recipe list page SHALL pass the `marked` field from each `recipes.list` response item into the corresponding `RecipeCard`. For authenticated callers this reflects the per-user saved state. For anonymous callers `marked` is `false` and SHALL be passed as `undefined` (or omitted) so the card renders without the indicator.

#### Scenario: Authenticated user sees correct heart state on list

- **WHEN** an authenticated user loads the recipe list and has saved some recipes
- **THEN** cards for saved recipes show a filled heart and cards for unsaved recipes show an outline heart
