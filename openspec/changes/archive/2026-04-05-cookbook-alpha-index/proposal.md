## Why

The cookbook print view (`/cookbooks/:id/print`) already renders a Table of Contents and all recipe content, but has no back-of-book alphabetical index. A traditional cookbook back-of-book index gives readers a second way to locate recipes by name — complementing the chapter-ordered TOC — and is most useful as a printed artifact.

## What Changes

- New `CookbookAlphaIndex` component renders recipes sorted A–Z, grouped by first letter, with print page numbers sourced from `buildPageMap()`
- `CookbookPageHeader` gains a `subtitle` prop (replaces hardcoded "Table of Contents" string)
- `TocRecipeItem` is renamed to `RecipePageRow` and made a named export; dotted leader line removed from both TOC and index rows
- The alphabetical index is appended to the print view after all recipe content (back-of-book position)
- No standalone route, no navigation entry point — the index is a print-only artifact within the existing print route

## Capabilities

### New Capabilities

- `cookbook-alpha-index`: Alphabetical recipe index component rendered within the cookbook print view, grouped by first letter with page numbers synced to the TOC via `buildPageMap()`

### Modified Capabilities

- `cookbook-toc-print-layout`: `TocRecipeItem` → `RecipePageRow` (renamed, exported, dotted leader removed); `CookbookPageHeader` gains `subtitle` prop
- `cookbook-print-view`: Print view extended to include alphabetical index section after recipe content

## Impact

- **Modified files (2):**
  - `src/components/cookbooks/CookbookStandaloneLayout.tsx` — new `CookbookAlphaIndex` component, renamed `RecipePageRow`, `CookbookPageHeader` subtitle prop
  - `src/routes/cookbooks.$cookbookId_.print.tsx` — append `CookbookAlphaIndex`, pass `subtitle` prop to header
- **No new routes, no API changes, no new dependencies**
- **Existing tests for `CookbookTocList` unaffected** — only the row component is renamed/simplified
- Visual change to existing TOC: dotted leader line removed from all recipe rows

## Risks

- Removing the dotted leader from the TOC is a visual change to an existing feature; low risk but intentional
- Page numbers in the index rely on `buildPageMap()` 1-page-per-recipe heuristic — same limitation as the TOC, acceptable for now

## Non-Goals

- No standalone `/cookbooks/:id/index` route
- No navigation link to the index from the cookbook detail page or TOC page
- No stripping of leading articles (A/An/The) for sort order
- No upgrade to the `buildPageMap()` heuristic (tracked separately)
- No cross-linking between TOC and index pages

## Open Questions

No unresolved ambiguity. All design decisions confirmed during exploration:
- Print-only artifact, embedded in print view (confirmed)
- No nav entry point (confirmed)
- Dotted leader removed from both TOC and index (confirmed)
- No article stripping (confirmed)
- Subtitle prop on `CookbookPageHeader` (confirmed)

---

> **Change control:** If scope changes after approval, `proposal.md`, `design.md`, `specs/`, and `tasks.md` must be updated before implementation proceeds.
>
> **Status:** Awaiting human approval before design, specs, or tasks proceed.
