## GitHub Issues

- #562

## Why

- Problem statement: Cookbook owners with a large, flat recipe list have no fast way to organize recipes into chapters. Today, chapters must be created one at a time (`+ New Chapter`) and every recipe re-assigned individually via drag-and-drop or the Add Recipe modal's chapter picker.
- Why now: Issue #562 was filed directly against this gap — organizing a cookbook by hand becomes tedious past a handful of recipes, and category data (`classificationId`) already exists on every recipe, so the grouping information is available without new input from the user.
- Business/user impact: Removes the single biggest piece of friction in adopting the chapter feature (`cookbook-chapters` capability) for existing cookbooks with many recipes. Encourages retroactive organization of cookbooks created before chapters existed.

## Problem Space

- Current behavior: `cookbooks.createChapter` creates one empty chapter (or, if it's the first chapter, migrates *all* existing recipes into it undifferentiated). Recipes must then be moved between chapters one at a time via `cookbooks.reorderRecipes` (drag-and-drop) or assigned at add-time via the chapter picker in the Add Recipe modal. There is no bulk, data-driven way to split a cookbook into chapters.
- Desired behavior: A single owner/editor action ("Build Chapters by Category") examines every recipe not currently in a chapter, groups them by the recipe's category (`classificationName`), and creates or reuses one chapter per unique category, moving the grouped recipes into it — after the owner confirms a preview of what will happen.
- Constraints:
  - Must reuse the existing `Cookbook.chapters[]` / recipe-stub `chapterId` data model (`cookbook-chapters` capability) — no schema changes.
  - Must preserve the "full-state replace is atomic" pattern already used by `reorderRecipes` and `deleteChapter` (single `$set` on `cookbook.recipes`, not per-recipe updates).
  - Must respect existing permission model: owner or `editor` collaborator only (`fetchEditableCookbook`), same as every other chapter mutation.
- Assumptions:
  - "Category" in issue #562 refers to the recipe's `classificationId`/`classificationName` field — the single-valued taxonomy dimension that already powers the `/categories` UI (`trpc.classifications.list`) — not the multi-valued `mealIds`/`courseIds`/`preparationIds` tag arrays, which cannot cleanly assign one recipe to exactly one new chapter.
  - Recipes with `classificationId === null` are treated as their own group, named `"Uncategorized"`.
- Edge cases considered:
  - Cookbook has zero unchaptered recipes (either empty or fully chaptered already) → action is a no-op; button is disabled.
  - Cookbook currently has zero chapters → this action creates the first chapters (parallel to `createChapter`'s "first chapter migrates existing recipes" precedent), after which chapter-required rules (e.g. `addRecipe` requiring `chapterId`) kick in as they already do today.
  - An existing chapter's name case-insensitively/whitespace-matches a category name → recipes are merged into that existing chapter rather than creating a visually duplicate chapter.
  - Multiple new categories need chapters created in the same run → created chapters are ordered alphabetically among themselves, appended after all pre-existing chapters.
  - Non-owner, non-editor caller → `FORBIDDEN`, same as other chapter mutations.

## Scope

### In Scope

- New `cookbooks.buildChaptersByCategory` tRPC mutation (`verifiedProcedure`, `{ cookbookId }` input) that:
  - Groups all recipe stubs with no `chapterId` by `Recipe.classificationName` (falling back to `"Uncategorized"`).
  - Merges each group into an existing chapter when its name case-insensitively/trim-matches the category name; otherwise creates a new chapter.
  - Assigns `orderIndex` to newly created chapters alphabetically by category name, appended after the current max chapter `orderIndex`.
  - Commits the result via a single atomic update (`$set`/`$push`), returning a summary (`{ created: [{ name, recipeCount }], merged: [{ chapterId, name, recipeCount }] }`) for the UI preview.
- New "Build Chapters by Category" button on the cookbook detail page (`src/routes/cookbooks.$cookbookId.tsx`), visible under the same `canEdit` condition as "New Chapter"/"Add Recipe", disabled/hidden when there are no unchaptered recipes.
- New preview/confirm modal that calls a dry-run of the same grouping logic (or a `dryRun` flag on the mutation) to show planned chapters/merges and recipe counts before the owner confirms.
- Spec delta to the existing `cookbook-chapters` capability (`openspec/specs/cookbook-chapters/spec.md`) covering the new requirement and its scenarios.
- Unit/integration tests for the grouping, merge-matching, and ordering logic; component test for the button and modal; e2e coverage for the end-to-end flow.

### Out of Scope

- Grouping by `mealIds`/`courseIds`/`preparationIds` (multi-valued taxonomy) — only `classificationId`/`classificationName` is used as the grouping key.
- Any change to `createChapter`, `deleteChapter`, `renameChapter`, `reorderChapters`, or `reorderRecipes` beyond what's needed to share their existing atomic-update pattern.
- Undo/redo for the bulk operation — the existing chapter delete/rename tools remain the only way to reverse an unwanted grouping.
- Changing how the `/categories` page or `Classification` model works.

## What Changes

- Add `cookbooks.buildChaptersByCategory` mutation to `src/server/trpc/routers/cookbooks.ts`.
- Add category-grouping/merge-matching helper(s) alongside the existing chapter helpers (`getChapters`, `recipeStub`, etc.) in the same router file.
- Add "Build Chapters by Category" button + preview/confirm modal to `src/routes/cookbooks.$cookbookId.tsx`.
- Extend `openspec/specs/cookbook-chapters/spec.md` with a new requirement and scenarios for this behavior.

## Risks

- Risk: Ambiguous "category" interpretation diverges from what issue #562's author actually meant (e.g. they may have meant meal/course/preparation, not classification).
  - Impact: Feature ships but doesn't satisfy the reporter's intent, requiring rework.
  - Mitigation: Explicitly documented the `classificationId`/`classificationName` interpretation and its rationale in this proposal and in the spec delta; flagged as an open question below for explicit confirmation before implementation.
- Risk: Case-insensitive/trimmed chapter-name matching could unintentionally merge a user's manually-named chapter (e.g. a chapter named "Dessert" created for unrelated reasons) with the "Dessert" category group.
  - Impact: Recipes land in a chapter the owner didn't intend to receive them.
  - Mitigation: Preview/confirm modal surfaces the merge target before committing, so the owner can cancel if the match is wrong.
- Risk: Large cookbooks (many unchaptered recipes) could make the single atomic `$set` update large.
  - Impact: Marginally larger write payload; not expected to be a real performance concern given cookbook sizes already handled by `reorderRecipes`.
  - Mitigation: None needed beyond existing patterns; flag for revisit only if it becomes an issue in practice.

## Open Questions

- Question: Does the reporter agree that "category" means `classificationId`/`classificationName`, not `mealIds`/`courseIds`/`preparationIds`?
  - Needed from: Issue #562 reporter (dougis)
  - Blocker for apply: no — proceeding with the `classificationId` interpretation as the working assumption; can be revisited before or during implementation if corrected.

## Non-Goals

- Automatic re-running or "live sync" of chapters as recipe categories change after the initial build.
- Supporting grouping by more than one taxonomy dimension at once.
- Bulk chapter operations beyond this one action (e.g. bulk rename, bulk delete-empty-chapters).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
