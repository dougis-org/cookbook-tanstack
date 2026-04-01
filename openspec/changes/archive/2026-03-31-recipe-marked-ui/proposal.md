## Why

Now that `recipes.list` and `recipes.byId` embed per-user `marked` status directly in their responses (#220), the UI can show a heart/saved indicator on every recipe card without extra queries, and the detail page can drop its redundant `isMarked` call. This removes unnecessary network round-trips and aligns the frontend with the data already being returned.

## What Changes

- **RecipeCard** gains a heart icon (Lucide `Heart`) that reflects `marked` state from the list response — filled/red when saved, outline otherwise, visible only to authenticated users
- **Recipe list page** passes `marked` through from list items into `RecipeCard`
- **Recipe detail page** removes the separate `useQuery(trpc.recipes.isMarked...)` call and reads `recipe.marked` from the `byId` response instead; `toggleMarked.onSuccess` invalidates `byId` rather than `isMarked`
- **`isMarked` endpoint** is kept; no breaking change

## Capabilities

### New Capabilities

- `recipe-card-marked-indicator`: Heart icon on recipe list cards reflects per-user saved status

### Modified Capabilities

- `recipe-marked-status`: Detail page now consumes `marked` from `byId` response instead of a separate `isMarked` query; `toggleMarked` invalidation key changes from `isMarked` to `byId`

## Impact

- `src/components/recipes/RecipeCard.tsx` — add `marked` to props, render Heart icon
- `src/routes/index.tsx` (or wherever `RecipeCard` is used in list) — pass `marked` through
- `src/routes/recipes/$recipeId.tsx` — remove `isMarked` query, switch to `recipe.marked`
- No API changes; no database changes; no breaking changes

## Problem Space

**In scope:**
- Adding the heart indicator to `RecipeCard` driven by `marked` from list response
- Removing the `isMarked` query from the detail page and switching to `recipe.marked`
- Updating `toggleMarked.onSuccess` to invalidate the correct query key

**Out of scope:**
- Any design changes to how marked/saved state is stored or computed
- Adding the indicator to cookbook recipe entries
- Removing the `isMarked` tRPC endpoint

## Scope

Small, self-contained UI change. Three files modified, no schema or API changes.

## Risks

- Low. The `marked` field is now always present on list and detail responses. The only risk is a regression in the heart state on the detail page if the invalidation key is wrong — covered by existing unit tests and the `recipes-favorites` e2e spec.

## Open Questions

No unresolved ambiguity. Issue #222 fully specifies the required changes and the implementation approach is clear from the existing code.

## Non-Goals

- Removing or deprecating the `isMarked` endpoint
- Changing the visual design of the Save/Saved button on the detail page
- Adding marked-toggle capability to list cards (read-only indicator only)

---

*If scope changes after approval, proposal, design, specs, and tasks must be updated before apply.*
