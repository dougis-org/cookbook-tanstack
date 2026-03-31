## Purpose

Embed per-user marked (liked) status directly in `recipes.list` and `recipes.byId` responses so clients can render heart/saved indicators without a separate lookup.

## Requirements

### Requirement: recipes.list returns marked status for authenticated callers

The `recipes.list` endpoint SHALL include a `marked: boolean` field on every item in the response. For authenticated callers, `marked` SHALL be `true` if and only if a RecipeLike document exists for that user and that recipe. For anonymous callers, `marked` SHALL always be `false`. The RecipeLike lookup SHALL be performed with a single query per call (not per item), and the result SHALL be reused for the `markedByMe` filter when that input is also present.

#### Scenario: Anonymous caller sees marked=false on all items

- **WHEN** an unauthenticated caller invokes `recipes.list`
- **THEN** every item in `result.items` has `marked: false`

#### Scenario: Authenticated caller with no likes sees marked=false on all items

- **WHEN** an authenticated caller who has not liked any recipe invokes `recipes.list`
- **THEN** every item in `result.items` has `marked: false`

#### Scenario: Authenticated caller sees marked=true only for their liked recipes

- **WHEN** an authenticated caller has liked recipe A but not recipe B and invokes `recipes.list`
- **THEN** the item for recipe A has `marked: true`
- **THEN** the item for recipe B has `marked: false`

#### Scenario: Authenticated caller using markedByMe filter sees marked=true on all returned items

- **WHEN** an authenticated caller who has liked at least one recipe invokes `recipes.list` with `markedByMe: true`
- **THEN** every item in `result.items` has `marked: true`

#### Scenario: Authenticated caller using markedByMe filter with no likes receives empty list

- **WHEN** an authenticated caller who has not liked any recipe invokes `recipes.list` with `markedByMe: true`
- **THEN** `result.items` is empty

### Requirement: recipes.byId returns marked status for authenticated callers

The `recipes.byId` endpoint SHALL include a `marked: boolean` field on the response. For authenticated callers, `marked` SHALL be `true` if and only if a RecipeLike document exists for that user and that recipe. For anonymous callers, `marked` SHALL always be `false`.

#### Scenario: Anonymous caller sees marked=false

- **WHEN** an unauthenticated caller invokes `recipes.byId` for an existing recipe
- **THEN** the response has `marked: false`

#### Scenario: Authenticated caller who has not liked the recipe sees marked=false

- **WHEN** an authenticated caller who has not liked the recipe invokes `recipes.byId`
- **THEN** the response has `marked: false`

#### Scenario: Authenticated caller who has liked the recipe sees marked=true

- **WHEN** an authenticated caller has liked a recipe and invokes `recipes.byId` for that recipe
- **THEN** the response has `marked: true`

#### Scenario: Authenticated caller sees marked=false after unliking

- **WHEN** an authenticated caller has liked a recipe, then unliked it via `recipes.toggleMarked`, and then invokes `recipes.byId`
- **THEN** the response has `marked: false`

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

### Requirement: Recipe TypeScript interface declares marked field

The `Recipe` interface in `src/types/recipe.ts` SHALL declare `marked: boolean` as a required non-optional field. `RecipeDetail`, which extends `Recipe`, SHALL inherit this field without redeclaration.

#### Scenario: marked field is present and typed in Recipe

- **WHEN** the `Recipe` interface is compiled
- **THEN** `marked` is a required `boolean` property with no `undefined` or `null` variant

### Requirement: Dead marked field strips are removed from update and list

The obsolete `{ marked: _marked, ...rest }` destructure patterns in the `recipes.update` mutation and the `recipes.list` items map SHALL be removed. These strips have been no-ops since the schema field was removed in #219 and their presence is misleading.

#### Scenario: update mutation compiles without marked strip

- **WHEN** the `recipes.update` mutation executes
- **THEN** no `marked` field is stripped from the Mongoose document result

#### Scenario: list items map compiles without marked strip

- **WHEN** `recipes.list` maps raw Mongoose documents to response items
- **THEN** no `marked` field is stripped from the document spread
