# recipe-edit-quick-access Specification

## Purpose
Adds a quick-access Edit button to the recipe detail page title row so the recipe owner can navigate to the edit form without scrolling to a separate action area.

## Requirements

### Requirement: Edit button in recipe detail title row
The system SHALL render an Edit button in the top-right of the recipe detail card, inline with the recipe title, when the current user is the recipe owner.

#### Scenario: Owner sees Edit button at top of detail card
- **WHEN** a logged-in user who owns the recipe views the recipe detail page
- **THEN** an Edit button (or link) is visible in the title row at the top of the detail card

#### Scenario: Non-owner does not see Edit button in title row
- **WHEN** a user who does not own the recipe views the recipe detail page
- **THEN** no Edit button appears in the title row

#### Scenario: Unauthenticated user does not see Edit button in title row
- **WHEN** an unauthenticated user views the recipe detail page
- **THEN** no Edit button appears in the title row

#### Scenario: Edit button navigates to edit form
- **WHEN** the owner clicks the Edit button in the title row
- **THEN** the browser navigates to the recipe edit route (`/recipes/:recipeId/edit`)

### Requirement: RecipeDetail accepts an actions slot
The system SHALL accept an optional `actions` prop of type `React.ReactNode` rendered top-right alongside the recipe title, allowing the parent route to inject context-specific controls.

#### Scenario: Actions prop is rendered in title row
- **WHEN** `RecipeDetail` is rendered with an `actions` prop
- **THEN** the provided content appears in the top-right of the title row

#### Scenario: No actions prop — layout is unaffected
- **WHEN** `RecipeDetail` is rendered without an `actions` prop
- **THEN** the title row renders normally with no extra element
