## MODIFIED Requirements

### Requirement: Recipe detail page consumes marked from byId response

The recipe detail page (`src/routes/recipes/$recipeId.tsx`) SHALL derive the saved/marked state for the Save/Saved button from `recipe.marked` returned by the `recipes.byId` query. It SHALL NOT fire a separate `trpc.recipes.isMarked` query. After a successful `toggleMarked` mutation the page SHALL invalidate the `[['recipes', 'byId']]` query key so the detail re-fetches with the updated `marked` state.

#### Scenario: Detail page shows Save button when recipe is not marked

- **WHEN** an authenticated user visits a recipe detail page for a recipe they have not saved
- **THEN** the Save button is rendered (heart outline, label "Save")
- **AND** no separate `isMarked` network request is made

#### Scenario: Detail page shows Saved button when recipe is marked

- **WHEN** an authenticated user visits a recipe detail page for a recipe they have saved
- **THEN** the Saved button is rendered (heart filled, label "Saved")
- **AND** no separate `isMarked` network request is made

#### Scenario: Toggling marked refreshes state from byId

- **WHEN** an authenticated user clicks Save on the detail page
- **THEN** `toggleMarked` is called and on success the `byId` query is invalidated
- **AND** the button updates to reflect the new saved state
