## Legacy Data Migration Field Mapping

This document defines the planned field mapping and lineage strategy for Milestone 9 migration work from `dump-recipe_laravel-202603111712.sql` into the current MongoDB models under `src/db/models/`.

## Scope

The legacy dump currently exposes migration-relevant tables for classifications, sources, meals, courses, preparations, recipes, cookbooks, and the pivot tables that connect recipes to taxonomy terms and cookbooks.

The dump does not expose a `users` table or direct `user_id` ownership columns on `recipes` or `cookbooks`. Initial import will therefore assign content to a configured admin user and preserve record-level lineage for later bulk ownership reassignment.

## Ownership And Lineage Strategy

- Every migrated recipe and cookbook will be imported with `userId = <configured-admin-user-id>`.
- Every transformed recipe and cookbook record will preserve `legacyId`.
- Because the dump contains no direct owner field on `recipes` or `cookbooks`, transformed lineage artifacts will record `legacyOwnerId = null` and `legacyOwnerSource = null` unless another ownership source is discovered later.
- Mapping manifests will preserve legacy-to-import ID resolution for taxonomy, recipes, and cookbooks so later ownership reassignment can target imported records deterministically.

## Timestamp Normalization Rules

- `0000-00-00 00:00:00` is treated as an invalid legacy timestamp and normalized to `null` in transformed artifacts.
- Valid MySQL datetime and timestamp values are normalized to ISO 8601 strings during transformation.
- `recipes.date_added` maps to `dateAdded` when present; invalid or zero values become `null`.
- `created_at` and `updated_at` are preserved when valid. If they are `null` at import time, the importer may fall back to model defaults or to another approved timestamp source.

## Text And Numeric Normalization Rules

- Legacy text is preserved as UTF-8 strings after unescaping MySQL dump sequences such as `\r\n`, `\n`, `\t`, and escaped quotes.
- Empty strings remain empty strings unless the target field semantics require `null`.
- Legacy nutrition fields stored as varchar values are parsed into numbers when they are numeric and normalized to `null` otherwise.
- Legacy boolean flags stored as `0` or `1` are converted to `false` or `true`.

## Quarantine Criteria

Records are quarantined instead of silently skipped when any of the following is true:

- a required legacy identifier is missing or duplicated inside a transformed dataset
- a required relationship cannot be resolved through extracted reference data
- a required target field cannot be produced from the legacy record
- a record contains malformed data that cannot be normalized safely without inventing a value

Quarantined records must be listed in a manifest with the legacy table name, legacy record ID, reason, and blocking severity.

## Table Mapping

### `classifications` -> `Classification`

| Legacy field | Target field | Rule |
| --- | --- | --- |
| `id` | lineage `legacyId` | Preserved in manifests and transformed artifacts |
| `name` | `name` | Copy as-is |
| `name` | `slug` | Slugify for unique lookup value |
| none | `description` | Set to `null` |
| `created_at` | `createdAt` | Normalize timestamp |
| `updated_at` | `updatedAt` | Normalize timestamp |

### `sources` -> `Source`

| Legacy field | Target field | Rule |
| --- | --- | --- |
| `id` | lineage `legacyId` | Preserved in manifests and transformed artifacts |
| `name` | `name` | Copy as-is |
| none | `url` | Set to `null` |
| `created_at` | `createdAt` | Normalize timestamp |
| `updated_at` | `updatedAt` | Normalize timestamp |

### `meals` -> `Meal`

| Legacy field | Target field | Rule |
| --- | --- | --- |
| `id` | lineage `legacyId` | Preserved in manifests and transformed artifacts |
| `name` | `name` | Copy as-is |
| `name` | `slug` | Slugify for unique lookup value |
| none | `description` | Set to `null` |
| `created_at` | `createdAt` | Normalize timestamp |
| `updated_at` | `updatedAt` | Normalize timestamp |

### `courses` -> `Course`

| Legacy field | Target field | Rule |
| --- | --- | --- |
| `id` | lineage `legacyId` | Preserved in manifests and transformed artifacts |
| `name` | `name` | Copy as-is |
| `name` | `slug` | Slugify for unique lookup value |
| none | `description` | Set to `null` |
| `created_at` | `createdAt` | Normalize timestamp |
| `updated_at` | `updatedAt` | Normalize timestamp |

### `preparations` -> `Preparation`

| Legacy field | Target field | Rule |
| --- | --- | --- |
| `id` | lineage `legacyId` | Preserved in manifests and transformed artifacts |
| `description` | `name` | Copy legacy description into the required target name field |
| `description` | `description` | Copy as-is |
| `description` | `slug` | Slugify for unique lookup value |
| `created_at` | `createdAt` | Normalize timestamp |
| `updated_at` | `updatedAt` | Normalize timestamp |

### `recipes` -> `Recipe`

| Legacy field | Target field | Rule |
| --- | --- | --- |
| `id` | lineage `legacyId` | Preserved in manifests and transformed artifacts |
| none | `userId` | Set to configured admin user |
| `name` | `name` | Copy as-is |
| `ingredients` | `ingredients` | Copy with normalized line endings |
| `instructions` | `instructions` | Copy with normalized line endings |
| `notes` | `notes` | Copy as-is |
| `servings` | `servings` | Copy numeric value; normalize invalid values to `null` |
| none | `prepTime` | Set to `null` |
| none | `cookTime` | Set to `null` |
| none | `difficulty` | Set to `null` |
| `source_id` | `sourceId` | Resolve through source legacy ID manifest; `0` becomes `null` |
| `classification_id` | `classificationId` | Resolve through classification legacy ID manifest; `0` becomes `null` |
| `date_added` | `dateAdded` | Normalize timestamp |
| `calories` | `calories` | Parse numeric or set `null` |
| `fat` | `fat` | Parse numeric or set `null` |
| `cholesterol` | `cholesterol` | Parse numeric or set `null` |
| `sodium` | `sodium` | Parse numeric or set `null` |
| `protein` | `protein` | Parse numeric or set `null` |
| none | `imageUrl` | Set to `null`; no legacy image migration is expected |
| none | `isPublic` | Default to `true` |
| `marked` | `marked` | Convert `0` or `1` to boolean |
| `created_at` | `createdAt` | Normalize timestamp |
| `updated_at` | `updatedAt` | Normalize timestamp |

Taxonomy relationships for `mealIds`, `courseIds`, and `preparationIds` are sourced from the recipe pivot tables rather than direct recipe columns.

### `cookbooks` -> `Cookbook`

| Legacy field | Target field | Rule |
| --- | --- | --- |
| `id` | lineage `legacyId` | Preserved in manifests and transformed artifacts |
| none | `userId` | Set to configured admin user |
| `name` | `name` | Copy as-is |
| none | `description` | Set to `null` |
| none | `isPublic` | Default to `true` |
| none | `imageUrl` | Set to `null` |
| `created_at` | `createdAt` | Normalize timestamp |
| `updated_at` | `updatedAt` | Normalize timestamp |

Cookbook recipe ordering is sourced from `cookbook_recipes` rather than direct cookbook columns.

### `recipe_meals` -> `Recipe.mealIds`

- preserve pivot `id` as lineage metadata
- resolve `recipe_id` and `meal_id` through their manifests
- group values by `recipe_id` and materialize ordered arrays of resolved `Meal` ObjectIds

### `recipe_courses` -> `Recipe.courseIds`

- preserve pivot `id` as lineage metadata
- resolve `recipe_id` and `course_id` through their manifests
- group values by `recipe_id` and materialize ordered arrays of resolved `Course` ObjectIds

### `recipe_preparations` -> `Recipe.preparationIds`

- preserve pivot `id` as lineage metadata
- resolve `recipe_id` and `preparation_id` through their manifests
- group values by `recipe_id` and materialize ordered arrays of resolved `Preparation` ObjectIds

### `cookbook_recipes` -> `Cookbook.recipes[]`

- preserve pivot `id` as lineage metadata
- resolve `cookbook_id` and `recipe_id` through their manifests
- group by `cookbook_id`
- materialize `recipes: [{ recipeId, orderIndex }]` using the legacy pivot row order as `orderIndex`

## Known Gaps

- No direct legacy owner column has been identified on `recipes` or `cookbooks`.
- No legacy image field has been identified on `recipes` or `cookbooks`.
- `Source.url`, `Meal.description`, `Course.description`, and `Classification.description` have no direct legacy source field and default to `null` unless a later source is discovered.