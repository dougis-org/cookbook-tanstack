## Why

The recipe detail page shows full recipe content but offers no path to discover other recipes in the same classification. Adding a related recipes section closes this gap and keeps users engaged within the app.

## What Changes

- New `RelatedRecipesSection` component renders up to 6 recipe cards filtered by the current recipe's `classificationId`
- `$recipeId.tsx` renders `RelatedRecipesSection` below `<RecipeDetail>` (sibling, not inside it)
- Section is hidden when no related recipes exist or when `classificationId` is not set on the current recipe
- Section is excluded from print output (`print:hidden`)

## Capabilities

### New Capabilities

- `related-recipes-section`: Displays a grid of related recipes at the bottom of the recipe detail page, based on matching `classificationId`, excluding the current recipe

### Modified Capabilities

<!-- No existing spec-level requirements are changing -->

## Impact

- **Files modified:** `src/routes/recipes/$recipeId.tsx`
- **Files created:** `src/components/recipes/RelatedRecipesSection.tsx`
- **API:** Uses existing `trpc.recipes.list` — no backend changes
- **No breaking changes**

## Problem Space

The recipe detail page is a dead end — once a user finishes reading a recipe there is no contextual next step. Related recipes by classification is a natural discovery path already supported by the data model (`classificationId` on every recipe).

## Scope

**In scope:**
- Fetching and rendering related recipes by `classificationId`
- Excluding the current recipe from results
- Hiding the section when no results exist or classification is unset
- Hiding the section when printing

**Out of scope:**
- Sorting or filtering related recipes beyond classification match
- Pagination of related recipes
- Related recipes based on taxonomy (meals, courses, preparations)
- Authenticated-only features (visibility follows existing `trpc.recipes.list` rules)

## Risks

- If many recipes share a classification, results are capped at 6 and ordering is non-deterministic (mongo default). This is acceptable for discovery use.
- The secondary query adds a small latency cost on the detail page; no mitigation needed given it is non-blocking.

## Non-Goals

- Do not add a loading spinner for the related section
- Do not paginate related results
- Do not modify `RecipeDetail` to accept or render related recipes

## Open Questions

No unresolved ambiguity. All design decisions were confirmed during exploration:
- Component placement: sibling below `<RecipeDetail>` in the route (Option B)
- Loading state: none (section simply absent until data arrives)
- Print: hidden via `print:hidden`
- Component: dedicated `RelatedRecipesSection` file

---

> **Change-control note:** If scope changes after approval, `proposal.md`, `design.md`, `specs/`, and `tasks.md` must all be updated before `/opsx:apply` proceeds.
