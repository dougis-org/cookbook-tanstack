## Context

The cookbook detail route (`src/routes/cookbooks.$cookbookId.tsx`) renders owner-only controls unconditionally. The sibling issue #190 (list page New Cookbook button) was fixed in PR #201 using `useSession` → `isLoggedIn`. This change applies the same concept to the detail page, but ownership (not just authentication) is the gate.

The `cookbooks.byId` tRPC procedure already returns `userId` on the cookbook object, so the ownership check requires no backend change.

`SortableRecipeRow` calls `useSortable()` internally, which requires being inside a `SortableContext` (and therefore a `DndContext`). Non-owners will not have these contexts, so non-owners need a separate static row component rather than a shared row with an `isOwner` prop.

## Goals / Non-Goals

**Goals:**
- Hide owner-only controls from unauthenticated and non-owner users
- Follow the `useSession` → `isOwner` pattern from `src/routes/recipes/$recipeId.tsx`
- Non-owners see a clean, readable, non-interactive recipe list

**Non-Goals:**
- Showing a sign-in prompt
- Any backend changes
- A shared `isOwner` hook or abstraction (overkill for two call sites)

## Decisions

**Decision 1: Two row components — `SortableRecipeRow` (owners) and `StaticRecipeRow` (non-owners)**

`useSortable()` must be called inside a `SortableContext`. If non-owners don't get a `DndContext`, `SortableRecipeRow` cannot be used for their rows — it would throw. Two components with shared visual structure is the cleanest solution.

*Alternatives considered:*
- **Single component with `isOwner` prop + always-on DnD context:** Non-owners would still have DnD infrastructure mounted but non-functional. Rejected — misleading and wasteful.
- **Extract shared `RecipeRowContent` + two thin wrappers:** Valid, but the row is small enough that duplication is cheaper than the abstraction.

**Decision 2: `isOwner = session?.user?.id === cookbook?.userId`**

Exact same derivation as `src/routes/recipes/$recipeId.tsx:49`. No loading guard — buttons will flash away on session resolve, same accepted tradeoff as the sibling change.

**Decision 3: Playwright integration tests, no Vitest mocking**

The DnD library requires a real browser DOM; mocking `@dnd-kit/core` and `@dnd-kit/sortable` would be fragile and add no meaningful coverage of the gating logic. Playwright E2E tests provide full-stack coverage with no mocking burden, following the established pattern in `src/e2e/recipes-auth.spec.ts`.

Test file: `src/e2e/cookbooks-auth.spec.ts`

**Decision 4: No cookbook helper function**

Test setup creates a cookbook inline (fill title, submit) — the form is simple enough that a dedicated `createCookbook` helper adds no value.

**Decision 5: Empty state text unchanged — "No recipes in this cookbook yet" for all users**

Non-owners see the same empty-state message as owners, with no Add Recipe CTA. The wording is neutral enough to apply to both.
