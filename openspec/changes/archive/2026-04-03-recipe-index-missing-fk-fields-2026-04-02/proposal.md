## Why

The `Recipe` Mongoose schema defines indexes only on `userId`, `name`, and `deleted`, but the recipe list query filters on `classificationId`, `sourceId`, `mealIds`, `courseIds`, and `preparationIds` using `$in` operators. Without indexes on these fields every filtered query becomes a full collection scan, degrading linearly as recipe count grows. Milestone 01 of the migration plan explicitly requires indexes on referenced ObjectId fields.

## What Changes

- Add six `recipeSchema.index()` declarations to `src/db/models/recipe.ts`:
  - `{ classificationId: 1 }` — scalar ref, filtered via `$in`
  - `{ sourceId: 1 }` — scalar ref, filtered via `$in`
  - `{ mealIds: 1 }` — array ref, creates multikey index; filtered via `$in`
  - `{ courseIds: 1 }` — array ref, creates multikey index; filtered via `$in`
  - `{ preparationIds: 1 }` — array ref, creates multikey index; filtered via `$in`
  - `{ isPublic: 1 }` — boolean field present in every visibility filter

No API changes, no schema changes, no migration required. MongoDB creates indexes at startup when the model is loaded; existing documents are indexed automatically.

## Capabilities

### New Capabilities

None — this change adds no user-facing capabilities.

### Modified Capabilities

- `mongodb-data-layer`: Adding index declarations to the Recipe schema. No behavioral requirements change; the data contract is unchanged. This is an implementation-level improvement, not a requirement change — listed here for completeness only.

## Impact

- **File changed:** `src/db/models/recipe.ts` (6 lines added)
- **Runtime impact:** MongoDB will build the missing indexes on first startup after deployment; on a small dataset this is instantaneous
- **Write overhead:** Marginally increased per-write cost for the six new indexes — negligible at current scale
- **No breaking changes**

## Problem Space

Filtered recipe list queries (`recipes.list` tRPC procedure, `src/server/trpc/routers/recipes.ts:89–114`) apply `$in` filters on foreign-key fields that have no indexes. As the recipe collection grows, query time grows linearly with collection size for any filtered request. The soft-delete middleware also injects `deleted: { $ne: true }` into every query; the `deleted` index handles that predicate, but it cannot help with the filter fields.

**In scope:**
- Adding individual ascending indexes on the five filter fields + `isPublic`

**Out of scope:**
- Compound indexes (e.g., `{ deleted: 1, classificationId: 1 }`) — premature at current scale
- Text indexes or atlas search
- Indexes on other collections
- Query plan analysis or benchmarking

## Risks

- Negligible: index creation on an empty/small collection is instant and has no downtime risk
- Compound index optimization may be revisited if profiling shows the query planner not using these indexes effectively under real load

## Open Questions

No unresolved ambiguity. The fields to index are directly observable from the tRPC filter-building logic at `src/server/trpc/routers/recipes.ts:89–114`. GH issue #193 confirms the requirement against Milestone 01.

## Non-Goals

- Do not add indexes to other models in this change
- Do not change query logic or filter behavior
- Do not add compound or partial indexes (save for a future performance milestone)

---

*If scope changes after approval, `proposal.md`, `design.md`, `specs/`, and `tasks.md` must be updated before apply proceeds.*
