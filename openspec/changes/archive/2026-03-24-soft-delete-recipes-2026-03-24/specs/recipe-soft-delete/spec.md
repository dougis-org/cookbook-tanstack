## ADDED Requirements

### Requirement: Recipe delete sets deleted flag
The system SHALL soft-delete a recipe by setting `deleted: true` on the document rather than removing it from the collection. The document MUST remain in the `recipes` collection after a delete operation.

#### Scenario: Recipe document retained after delete
- **WHEN** the `recipes.delete` mutation is called for a recipe
- **THEN** the recipe document still exists in the `recipes` collection with `deleted: true`

#### Scenario: Deleted recipe absent from list results
- **WHEN** the `recipes.list` query is called
- **THEN** recipes with `deleted: true` are NOT included in the results

#### Scenario: Deleted recipe absent from getById
- **WHEN** `recipes.getById` is called with the ID of a soft-deleted recipe
- **THEN** the query returns `null` (recipe not found)

#### Scenario: Deleted recipe absent from cookbook recipe list
- **WHEN** a cookbook's recipe list is fetched
- **THEN** any soft-deleted recipes referenced by that cookbook are NOT returned

### Requirement: Soft-delete filter is automatic and schema-level
The system SHALL inject `{ deleted: { $ne: true } }` into all `find`, `findOne`, `findOneAndUpdate`, and `countDocuments` queries on the Recipe model via Mongoose pre-find middleware. Application code MUST NOT need to add this filter manually.

#### Scenario: Middleware filters without application changes
- **WHEN** any Recipe query runs (list, getById, ownership check, edit)
- **THEN** soft-deleted recipes are excluded without any explicit filter in the calling code

### Requirement: Backward compatibility with existing documents
The soft-delete filter MUST use `{ deleted: { $ne: true } }` so that existing recipe documents without the `deleted` field continue to appear in all queries without a backfill migration.

#### Scenario: Existing document without deleted field is visible
- **WHEN** a recipe document exists that has no `deleted` field
- **THEN** it is returned normally by list, getById, and all other queries

### Requirement: Soft-deleted recipe cannot be edited
Because `findOneAndUpdate` is covered by the pre-find middleware, editing a soft-deleted recipe SHALL be impossible via the standard `recipes.update` mutation.

#### Scenario: Edit on soft-deleted recipe returns not found
- **WHEN** `recipes.update` is called with the ID of a soft-deleted recipe
- **THEN** the ownership check finds no document and the mutation is rejected
