## REMOVED Requirements

### Requirement: Recipe schema stores a marked boolean field
The Recipe Mongoose schema previously declared `marked: boolean` as a stored field on recipe documents. This field was intended to track a user's favourite status at the document level.

**Reason**: Superseded by the `RecipeLike` collection, which correctly tracks per-user favourite state. The schema field was never written to after `RecipeLike` was introduced, making it permanently stale. All reads returned `false` (meaningless data).

**Migration**: No data migration required. Existing documents may have `marked: false` or the field absent — both are harmless. The `RecipeLike`-based system (`isMarked`, `toggleMarked`, `markedByMe` filter) continues to be the source of truth for favourite state.

#### Scenario: Recipe documents no longer carry a marked field in the schema
- **WHEN** a recipe is fetched via `recipes.byId` or `recipes.list`
- **THEN** the response shape does not include a `marked` property

#### Scenario: Import files containing a marked field are accepted without error
- **WHEN** a recipe import file includes `marked: true` or `marked: false`
- **THEN** the import succeeds and the `marked` value is silently ignored (not stored)
