## Why

The `marked` boolean field on the Recipe Mongoose schema has never been written to by any mutation in the codebase — every document has it absent or permanently `false`. All reads of this field in the API layer return meaningless data, while the real source of truth for user favourites (the `RecipeLike` collection) is already in place and used correctly by the `isMarked`/`toggleMarked`/`markedByMe` endpoints.

## What Changes

- Remove `marked: boolean` from `IRecipe` interface and `recipeSchema` (Mongoose model)
- Remove `marked: boolean` from the `Recipe` client-side TypeScript interface
- Remove `marked: (r.marked ?? false)` from the `recipes.byId` tRPC response projection
- Remove `marked: (d.marked ?? false)` from the `cookbooks` tRPC recipe projection
- Remove `marked: z.boolean().optional()` from `importedRecipeSchema` in import validation
- Remove `marked: false` from raw-insert test fixtures that reference the legacy field

No data migration is required — MongoDB ignores absent fields and no mutation ever set this field.

## Capabilities

### New Capabilities

None. This is a pure deletion with no new specs required.

### Modified Capabilities

None. The `RecipeLike`-based favourite system (`isMarked`, `toggleMarked`, `markedByMe` filter) is already correct and not changing. No spec-level behaviour is affected.

## Impact

**Files changed:**
- `src/db/models/recipe.ts` — IRecipe interface + recipeSchema
- `src/types/recipe.ts` — Recipe client type
- `src/server/trpc/routers/recipes.ts` — byId response projection
- `src/server/trpc/routers/cookbooks.ts` — recipe projection in cookbook detail
- `src/lib/validation.ts` — importedRecipeSchema
- `src/server/trpc/routers/__tests__/recipes.test.ts` — raw-insert fixture
- `src/lib/__tests__/export.test.ts` — fixture

**APIs:** The tRPC `recipes.byId` and `recipes.list` response shapes lose the `marked` field. Any client code reading `recipe.marked` from these responses will get `undefined`. Current UI does not read `marked` from these responses (the detail page uses a separate `isMarked` query).

**Dependencies:** None added or removed.

**Follow-up work (separate issues):**
- #220 — Embed real per-user favourite status in list/byId responses (computed from RecipeLike)
- #222 — Show heart indicator on recipe list cards; simplify detail page

## Non-Goals

- Adding real per-user marked status to responses (that is #220)
- UI changes (that is #222)
- Removing the `isMarked` / `toggleMarked` endpoints
- Migrating or dropping the `marked` field from existing MongoDB documents

## Risks

Low. This is deletion-only with no behaviour change. The field being removed was never readable as meaningful data. TypeScript strict mode will surface any missed references at compile time.

## Open Questions

None. Scope is fully bounded.
