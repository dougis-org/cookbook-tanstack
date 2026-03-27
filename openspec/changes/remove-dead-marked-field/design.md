## Context

The Recipe Mongoose model has a `marked: boolean` field that was intended to track whether a recipe was "favourited". It was superseded by the `RecipeLike` collection (a separate join-table document per user/recipe pair), which correctly drives `isMarked`, `toggleMarked`, and `markedByMe` filtering. The old field was never updated by any mutation after `RecipeLike` was introduced, making every document's `marked` value stale or absent.

The field still surfaces in four places, all returning meaningless data:
1. `recipes.byId` response: `marked: (r.marked ?? false)` — always `false`
2. `recipes.list` response: `...r` spread — always `false`
3. `cookbooks` recipe projection: `marked: (d.marked ?? false)` — always `false`
4. Import validation: `marked: z.boolean().optional()` — parsed but never stored

No UI component reads `recipe.marked` from the list or byId responses (the detail page calls `isMarked` separately).

## Goals / Non-Goals

**Goals:**
- Remove all traces of the dead `marked` schema field from the codebase
- Ensure TypeScript strict mode catches any remaining references at compile time
- Leave the RecipeLike-based favourite system completely untouched

**Non-Goals:**
- Adding real per-user `marked` status to responses (follow-up: #220)
- UI changes (follow-up: #222)
- MongoDB data migration (not needed — absent field = `undefined`, no documents rely on reads)
- Removing `isMarked` / `toggleMarked` tRPC endpoints

## Decisions

### Decision 1: No data migration

The `marked` field on existing MongoDB documents can be left as-is. Mongoose schemas are not strict by default for reads — absent or extra fields are simply ignored. No documents will break if the schema field is removed.

*Alternative considered:* Running a migration to `$unset` the field on all documents. Rejected as unnecessary operational work with no user-visible benefit.

### Decision 2: Remove `marked` from the `Recipe` client type entirely

Since no current UI reads `recipe.marked` from list/byId responses, removing it from `src/types/recipe.ts` is safe. TypeScript will surface any missed usages at compile time.

*Alternative considered:* Keep the field typed as `boolean | undefined` to avoid a breaking change. Rejected — the field has never been meaningful, so keeping it in the type perpetuates confusion.

### Decision 3: Touch import validation

`importedRecipeSchema` in `validation.ts` accepts `marked: z.boolean().optional()`. Removing it means any legacy export files containing `marked: true` will silently drop the field on re-import. This is the correct behaviour since the `marked` field would not be stored anyway.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| A UI component reads `recipe.marked` that was missed in the investigation | TypeScript strict mode (`noUnusedLocals`, strict null checks) will surface at build time |
| An external client (mobile app, script) reads `recipe.marked` from the tRPC API | None — tRPC is internal-only; no external API contract to break |
| Import files with `marked: true` silently drop the field | Acceptable — the field was never persisted post-import either |

## Rollback / Mitigation

This change is trivially reversible: re-add the field to the schema and projections. No data is lost since the field was never written with meaningful values.

CI (TypeScript build + Vitest tests) must pass before merge.

## Open Questions

None. All decisions are straightforward for a deletion-only change.
