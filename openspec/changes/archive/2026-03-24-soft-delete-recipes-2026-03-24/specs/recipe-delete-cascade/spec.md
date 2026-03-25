## MODIFIED Requirements

### Requirement: R1 — Cascade on Delete
When `recipes.delete` succeeds, the following must be true:
- The Recipe document exists in the `recipes` collection with `deleted: true` (it is NOT removed)
- The Recipe document is NOT visible via any application query (list, getById, cookbook lookup)
- No cookbook's `recipes` array contains an entry with `recipeId` equal to the deleted recipe's ID
- No `RecipeLike` document exists with `recipeId` equal to the deleted recipe's ID

#### Scenario: Recipe soft-deleted and invisible after delete
- **WHEN** the recipe owner confirms deletion
- **THEN** the recipe document remains in the collection with `deleted: true` AND is not returned by list or getById

#### Scenario: Cookbook entries removed on delete
- **WHEN** the recipe owner confirms deletion
- **THEN** all cookbook entries referencing that recipe are removed (unchanged from prior behaviour)

#### Scenario: Recipe likes removed on delete
- **WHEN** the recipe owner confirms deletion
- **THEN** all RecipeLike documents for that recipe are removed (unchanged from prior behaviour)
