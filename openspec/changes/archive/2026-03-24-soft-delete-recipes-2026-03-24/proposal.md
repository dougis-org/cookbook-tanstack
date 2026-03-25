## Why

Permanently deleting recipe documents is irreversible and risks accidental data loss. A soft-delete approach retains the primary record while hiding it from all application queries, enabling future recovery without complicating current read paths.

## What Changes

- Add a `deleted` boolean field (default `false`) to the `Recipe` Mongoose schema
- Add a compound index on `deleted` for query efficiency
- Add Mongoose pre-find middleware on the `Recipe` schema to automatically inject `{ deleted: { $ne: true } }` into all read queries — no application code changes needed for filtering
- Update the `delete` tRPC mutation to soft-delete (`updateOne` setting `deleted: true`) instead of hard-deleting (`findByIdAndDelete`)
- Cookbook entry removal and RecipeLike cleanup remain as-is (cascade via existing transaction)

## Capabilities

### New Capabilities

- `recipe-soft-delete`: Recipe delete sets `deleted: true` on the document rather than removing it; all read queries automatically exclude soft-deleted recipes via schema-level middleware

### Modified Capabilities

- `recipe-delete-cascade`: The cascade behavior (remove cookbook entries, delete recipe likes) is unchanged, but the recipe document itself is now soft-deleted rather than hard-deleted

## Impact

- **`src/db/models/recipe.ts`** — schema field, index, pre-find middleware, explanatory comment
- **`src/server/trpc/routers/recipes.ts`** — `delete` mutation body (write path only)
- **`src/server/trpc/routers/__tests__/recipes.test.ts`** — new TDD tests; existing tests unaffected (pre-find middleware filters `deleted: { $ne: true }`, which matches all non-deleted documents including ones without the field)
- No API contract changes — the `delete` mutation input/output signature is unchanged
- No UI changes required

## Non-Goals

- Restore / undelete functionality (out of scope per issue #204)
- Hard-purge of soft-deleted records (out of scope)
- Admin visibility into deleted recipes (out of scope)
- Migration script to backfill `deleted: false` on existing documents (not needed — `$ne: true` matches missing field)

## Risks

- **Middleware coverage**: Mongoose pre-find hooks must cover all query types used (`find`, `findOne`, `findOneAndUpdate`, `countDocuments`). Missing a hook type silently surfaces deleted recipes. Mitigated by exhaustive hook registration and documentation.
- **`findByIdAndUpdate` on soft-deleted recipes**: The pre-hook for `findOneAndUpdate` will also filter soft-deleted recipes from edit/ownership checks, which is the desired behaviour (can't edit a deleted recipe). Must be verified in tests.
- **Test helpers**: Tests that use `Recipe.findByIdAndUpdate` to manipulate fixture data will trigger the pre-hook. Since fixtures are not soft-deleted, this is safe — but should be noted in the implementation.

## Open Questions

None — design decisions resolved during exploration:
- Filtering via Mongoose middleware (not MongoDB view, not scattered app filters)
- `{ deleted: { $ne: true } }` for backward compatibility with existing documents
- `Recipe.updateOne()` for the soft-delete write to bypass pre-hooks
- Transaction retained for integrity
