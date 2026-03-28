## Why

After #219 removed the dead `marked` schema field, the `recipes.list` and `recipes.byId` responses carry no favourite-status signal at all. Consumers either get nothing or must fire a separate `isMarked` call per recipe — creating N+1 queries. Adding a computed `marked: boolean` field sourced from the RecipeLike collection gives clients accurate per-user favourite status in a single round-trip and unblocks the heart/saved-indicator UI work in #222.

## What Changes

- **Add `marked: boolean` to the `Recipe` TypeScript interface** — representing "liked by the authenticated caller"; `false` for anonymous users.
- **`recipes.list`** — hoist the `RecipeLike.find({ userId })` query to run for all authenticated users (not just when `markedByMe: true`); build a `Set<string>` of liked recipe IDs; reuse it for the existing `markedByMe` filter; populate `marked` on each response item.
- **`recipes.byId`** — add a `RecipeLike.exists({ userId, recipeId })` point-lookup; include `marked: !!exists` in the response (or `false` for anonymous callers).
- **Dead code removal** — remove the obsolete `{ marked: _marked, ...d }` destructure strips from the `update` mutation and the `list` items map (the schema field no longer exists after #219; these strips are no-ops).
- **Tests** — add full positive/negative/edge test matrix for `marked` on both `list` and `byId`; update existing `markedByMe` tests to assert `marked` values.

## Capabilities

### New Capabilities

- `recipe-marked-status`: Computed per-user favourite indicator (`marked: boolean`) returned inline on `recipes.list` items and `recipes.byId` responses, sourced from the RecipeLike collection.

### Modified Capabilities

_(none — no existing spec-level behaviour is changing; `isMarked`/`toggleMarked` endpoints are unmodified)_

## Impact

**Files modified:**
- `src/types/recipe.ts` — `Recipe` interface gains `marked: boolean`; `RecipeDetail` inherits it automatically
- `src/server/trpc/routers/recipes.ts` — `list`, `byId`, and `update` procedures
- `src/server/trpc/routers/__tests__/recipes.test.ts` — new and updated test cases

**Performance:** One extra `RecipeLike.find({ userId })` per authenticated list call. Result is bounded by the user's like count. Query uses the existing compound index `{ userId: 1, recipeId: 1 }`.

**Downstream:** Unblocks #222 (heart/saved indicator on recipe list cards). The `isMarked` endpoint remains intact; #222 will remove its use from the detail page as a follow-up.

## Non-Goals

- Removing or deprecating `isMarked`/`toggleMarked` (that is #222's scope).
- Adding `marked` to mutation responses (`create`, `update`, `import`).
- Any UI changes (UI work is #222).

## Risks

- **Slight type drift on `update` return**: `update` returns a Mongoose doc spread which will not include a computed `marked` field despite `Recipe` now declaring one. The router casts via `any` so TypeScript won't catch this at compile time. Acceptable until a stricter return-type pass is done.
- **`RecipeDetail` inherits `marked`**: Consumers of `byId` via `RecipeDetail` will see `marked`; this is acceptable and consistent with the intent.

## Open Questions

_(none — design decisions resolved in explore session)_
