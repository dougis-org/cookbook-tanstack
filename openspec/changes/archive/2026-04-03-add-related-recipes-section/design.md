## Context

The recipe detail page (`src/routes/recipes/$recipeId.tsx`) loads a single recipe via `trpc.recipes.byId` and renders it with the `RecipeDetail` component. `RecipeDetail` is a pure presentation component — it receives a recipe and renders it, with no data-fetching logic. The existing `trpc.recipes.list` endpoint already supports `classificationIds` filtering and `pageSize`, and applies visibility rules automatically.

`RecipeCard` is a presentation component used on the recipe list page, wrapped in a `<Link>` by the caller.

## Goals / Non-Goals

**Goals:**
- Render up to 6 related recipes at the bottom of the recipe detail page
- Keep `RecipeDetail` a pure display component (no data fetching)
- Use the existing `trpc.recipes.list` API without backend changes
- Hide the section when classification is absent or yields no results
- Exclude the section from print output

**Non-Goals:**
- No backend changes
- No pagination of related results
- No loading spinner
- No related-by-taxonomy (meals/courses/preparations)

## Decisions

### D1: Component placement — sibling in route, not inside RecipeDetail

`RelatedRecipesSection` is rendered as a sibling below `<RecipeDetail>` in `$recipeId.tsx`, not as a prop or child of `RecipeDetail`.

**Rationale:** `RecipeDetail` is a pure display component. Adding a data-fetching-aware prop would blur its responsibility. The route is already the natural data-fetching boundary for this page.

**Alternative considered:** Pass `relatedRecipes` as a prop to `RecipeDetail`. Rejected because it would require `RecipeDetail` to know about layout for related content, and the prop would be irrelevant in other usages (e.g., print view, edit preview).

### D2: Fetch pageSize 7, filter client-side

Query `trpc.recipes.list` with `classificationIds: [recipe.classificationId]` and `pageSize: 7`. Filter out the current recipe client-side before rendering, yielding at most 6 results.

**Rationale:** Fetching exactly 6 risks returning 5 visible results when the current recipe is in the set. Fetching 7 guarantees up to 6 after filtering. The extra document fetch is negligible.

**Alternative considered:** Server-side exclusion via a new `excludeId` parameter. Rejected — adding a backend parameter for this edge case is disproportionate; client-side filtering is trivial.

### D3: Dedicated `RelatedRecipesSection` component

New file at `src/components/recipes/RelatedRecipesSection.tsx`. Accepts `classificationId` and `currentRecipeId` as props. Owns the query internally.

**Rationale:** The section has its own query, conditional visibility logic, and heading — enough responsibility to warrant its own component rather than inline JSX in the route. Keeping it in `src/components/recipes/` aligns with the existing domain-component pattern.

### D4: No loading state

While the query is loading, the section simply does not render. No spinner, no skeleton.

**Rationale:** The related section is non-critical discovery content. A missing section while data loads is preferable to visual noise, and aligns with the user's explicit decision during exploration.

### D5: Visibility follows existing list rules

No explicit `isPublic` override. The query inherits `visibilityFilter(ctx.user)` automatically — guests see only public related recipes, authenticated users see their own private recipes too.

**Rationale:** No special casing needed. The existing rules are correct for this context.

## Proposal → Design mapping

| Proposal element | Design decision |
|---|---|
| Sibling below RecipeDetail (Option B) | D1 |
| Fetch via trpc.recipes.list | D2 |
| Dedicated RelatedRecipesSection component | D3 |
| No loading spinner | D4 |
| print:hidden | Implemented via className in RelatedRecipesSection |
| Hidden when no results / no classificationId | D3 — component returns null when no results |

## Risks / Trade-offs

- **Non-deterministic ordering** → Results reflect MongoDB natural order within the filter. Acceptable for discovery; no mitigation needed.
- **Empty section flash** → Not applicable; section doesn't render until data is available (D4).
- **Classification with 0 related recipes** → Component returns null; section absent from DOM. Covered by spec scenarios.

## Rollback / Mitigation

This change adds new UI only — no schema changes, no API changes. Rollback is reverting the two affected files. No data migration needed.

## Open Questions

None. All decisions resolved during exploration and confirmed by user.
