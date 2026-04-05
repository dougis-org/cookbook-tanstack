## Context

The cookbook print view (`src/routes/cookbooks.$cookbookId_.print.tsx`) renders a full printable cookbook: a TOC via `CookbookTocList`, followed by all recipe content via `RecipeDetail`. It uses `trpc.cookbooks.printById` which returns recipes with `orderIndex` and full content.

`CookbookStandaloneLayout.tsx` is the shared component library for all cookbook standalone pages (TOC, print, future views). It currently exports: `CookbookTocList`, `CookbookPageHeader`, `CookbookPageChrome`, `CookbookStandalonePage`, `CookbookPageLoading`, `CookbookPageNotFound`, `CookbookEmptyState`, `RecipeTimeSpan`, `RecipeIndexNumber`. `TocRecipeItem` exists but is **not exported**.

`src/lib/cookbookPages.ts` exports `buildPageMap(recipes)` — maps recipeId → page number based on display order (1-indexed, flat heuristic). Both the TOC and the new index must use the same ordered list as input so page numbers stay in sync.

## Goals / Non-Goals

**Goals:**
- Add `CookbookAlphaIndex` component to `CookbookStandaloneLayout.tsx` that renders recipes A–Z, grouped by first letter, with page numbers from `buildPageMap()`
- Append `CookbookAlphaIndex` to the print view after all recipe content (back-of-book)
- Refactor `TocRecipeItem` → `RecipePageRow` (exported, no dotted leader)
- Add `subtitle` prop to `CookbookPageHeader` (removes hardcoded "Table of Contents")

**Non-Goals:**
- No standalone `/index` route
- No nav entry point in the UI
- No article stripping for sort order
- No changes to `buildPageMap()` heuristic
- No cross-links between TOC and index

## Decisions

### D1 — Index embedded in print view, not a standalone route

The index is a print artifact. Embedding it in the existing print route avoids a duplicate data fetch (`printById` already has everything needed), eliminates a new route, and keeps the printed output as a single document (TOC → recipes → index).

**Alternative considered:** Standalone `/index` route — rejected because it has no screen utility (direct recipe links exist), adds a route with no nav entry point, and duplicates the data fetch.

### D2 — `CookbookAlphaIndex` receives `recipes` prop, calls `buildPageMap` internally

The component takes `recipes: { id: string; name: string }[]` (display-ordered, as provided by `printById`), calls `buildPageMap(recipes)` internally to get page numbers, then sorts and groups alphabetically for rendering. Page numbers are therefore consistent with the TOC by construction.

**Alternative considered:** Accept a pre-built `pageMap` prop — rejected as unnecessary coupling; the component is self-contained and the caller shouldn't need to know about page map construction.

### D3 — `RecipePageRow` replaces `TocRecipeItem`, dotted leader removed

`TocRecipeItem` is unexported and tightly coupled to the TOC. Renaming to `RecipePageRow` and exporting it makes the shared nature explicit. The dotted leader (`border-dotted`) is removed from both TOC and index — it adds visual noise on screen and wastes ink in print.

Callers: `CookbookTocList` (existing) and `CookbookAlphaIndex` (new). No external callers since `TocRecipeItem` was never exported.

### D4 — `CookbookPageHeader` subtitle prop, defaults to `"Table of Contents"`

The existing call sites (`toc.tsx`, `print.tsx`) both use `"Table of Contents"` as the subtitle. Adding `subtitle?: string` with a default preserves backward compat. The print view passes `subtitle="Table of Contents"` explicitly; the index section uses its own `<h2>` heading rather than a second `CookbookPageHeader`.

**Alternative considered:** Separate `CookbookIndexPageHeader` component — rejected as unnecessary duplication for a one-prop difference.

### D5 — Letter grouping uses `name[0].toUpperCase()`; recipes with no valid first letter go into `#` bucket

Simple, zero-dependency implementation. Non-Latin or numeric first characters (edge case for a recipe app) fall into `#`. No article stripping — sort/group key is the raw name.

### D6 — Index rows are plain text, not `<Link>` components

The index is a print artifact; hyperlinks are meaningless on paper. Removing the router dependency from `RecipePageRow` for the index also simplifies the component. The TOC rows remain `<Link>` for screen navigation.

`RecipePageRow` therefore does not render a link — it renders a `<div>`. `CookbookTocList` wraps recipe rows in `<Link>` itself, or the component accepts a `linkTo` prop.

**Decision:** Give `RecipePageRow` an `as` pattern — accept optional `href`/`to` for the TOC use case, render plain `<div>` when absent. But this adds complexity. **Simpler:** keep `TocRecipeItem` as a thin `<Link>`-wrapped variant and have `RecipePageRow` be the plain layout. `CookbookTocList` continues using `TocRecipeItem` (now internally calling `RecipePageRow`); `CookbookAlphaIndex` uses `RecipePageRow` directly.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Dotted leader removal is a visual change to the existing TOC | Intentional, confirmed with product owner |
| `buildPageMap()` 1-page-per-recipe heuristic means index page numbers may not match actual printed pages for long recipes | Known limitation shared with TOC; acceptable until heuristic is upgraded |
| `printById` query shape must include `name` on each recipe | Already present — `CookbookTocList` uses `recipe.name` today |

## Rollback / Mitigation

All changes are additive or internal refactors within two files. Rollback = revert both files. No database, API, or route changes to undo.

If CI blocks: the dotted leader removal and subtitle prop are independent of the index feature — they can be split into a separate PR if needed.

## Open Questions

None. All decisions confirmed during exploration session.

---

### Proposal → Design Mapping

| Proposal Element | Design Decision |
|-----------------|----------------|
| `CookbookAlphaIndex` component | D1, D2 |
| Append to print view (back-of-book) | D1 |
| Page numbers synced to TOC | D2 |
| `RecipePageRow` replaces `TocRecipeItem` | D3 |
| Dotted leader removed from both | D3 |
| `CookbookPageHeader` subtitle prop | D4 |
| Letter grouping with `#` fallback | D5 |
| Index rows are plain text (no links) | D6 |
