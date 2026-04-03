## Context

The `Recipe` Mongoose schema (`src/db/models/recipe.ts`) currently indexes `userId`, `name`, and `deleted`. The `recipes.list` tRPC procedure (`src/server/trpc/routers/recipes.ts:89–114`) builds a MongoDB filter that may include `$in` predicates on `classificationId`, `sourceId`, `mealIds`, `courseIds`, `preparationIds`, and a boolean equality check on `isPublic` (via visibility filter). Without indexes on these fields, each filtered query performs a full collection scan.

Additionally, every query receives an automatic `deleted: { $ne: true }` predicate injected by soft-delete middleware. The existing `deleted` index handles that predicate independently; the query planner intersects it with any other matching index.

**Proposal mapping:**

| Proposal element | Design decision |
|---|---|
| Add indexes on FK filter fields | Individual ascending indexes, one per field |
| Array fields (`mealIds`, `courseIds`, `preparationIds`) | Standard `index()` call; MongoDB creates multikey index automatically |
| `isPublic` boolean | Include — participates in visibility filter on every query |
| Compound vs individual indexes | Individual (see Decision 1) |
| No behavioral change | No query logic changes; Mongoose applies index on model init |

## Goals / Non-Goals

**Goals:**
- Ensure all fields used in `$in` recipe list filters have individual ascending indexes
- Satisfy Milestone 01 requirement: "Create indexes on referenced ObjectId fields"
- Keep the change minimal and reviewable (one file, ~6 lines)

**Non-Goals:**
- Compound indexes (e.g., `{ deleted: 1, classificationId: 1 }`)
- Indexes on other collections or models
- Query profiling, benchmarking, or explain-plan analysis
- Any change to query logic or filter behavior

## Decisions

### Decision 1: Individual indexes over compound indexes

**Choice:** Add six individual `{ field: 1 }` indexes rather than compound indexes pairing each field with `deleted`.

**Rationale:** At current scale (dev/small dataset), MongoDB's query planner intersects individual indexes efficiently. Compound indexes with `deleted` as prefix would only outperform individual indexes when `deleted: true` is a significant portion of documents — which it is not at this stage. Compound indexes also increase write overhead and index storage. This decision can be revisited with profiling data.

**Alternative considered:** `{ deleted: 1, classificationId: 1 }` compound index. Rejected: premature optimization, higher write cost, and the planner handles intersection well here.

---

### Decision 2: Include `isPublic` index despite low cardinality

**Choice:** Add `{ isPublic: 1 }` index.

**Rationale:** While boolean fields have low cardinality (2 values), `isPublic` participates in the visibility filter applied to *every* public-facing recipe query. If most recipes are public, the index may be skipped by the planner for those queries — but for queries filtering to private recipes it helps. The write overhead is negligible. Erring toward inclusion is consistent with the issue requirement.

**Alternative considered:** Omit `isPublic` index. Rejected: issue #193 lists it explicitly and it has a concrete use in visibility filtering.

---

### Decision 3: No migration script required

**Choice:** Rely on Mongoose's automatic index sync at startup (`autoIndex: true` default).

**Rationale:** MongoDB builds indexes on collection startup when the model is registered. On a small dataset this is instantaneous. No manual `db.collection.createIndex()` script is needed.

## Risks / Trade-offs

- **Index build on large production dataset** → Mitigation: MongoDB background index builds don't block reads/writes; risk is negligible for this project's scale.
- **Query planner may not use low-cardinality `isPublic` index** → Mitigation: acceptable; the planner ignores unhelpful indexes; no correctness impact.
- **Future compound index need** → If profiling reveals the planner struggles, a follow-up PR can add compound indexes without removing these.

## Rollback / Mitigation

Indexes can be dropped without any data loss or behavioral change. To roll back: remove the six `recipeSchema.index()` lines and restart; MongoDB will drop indexes on next startup if `autoIndex` is enabled (or they can be manually dropped via `db.recipes.dropIndex()`).

## Open Questions

None. The design is fully determined by the filter logic in `src/server/trpc/routers/recipes.ts` and the existing schema in `src/db/models/recipe.ts`.
