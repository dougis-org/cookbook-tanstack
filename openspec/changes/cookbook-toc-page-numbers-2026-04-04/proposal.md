## Why

The cookbook Table of Contents shows recipe index numbers (1, 2, 3…) but not print page numbers, which Milestone 04 requires. Readers printing a cookbook need page numbers to navigate the physical document.

## What Changes

- Add a shared `buildPageMap()` utility (`src/lib/cookbookPages.ts`) that maps `recipeId → pageNumber` using a flat 1-page-per-recipe heuristic; designed to be upgraded to line-count estimation in a follow-up
- Update `TocRecipeItem` in `CookbookStandaloneLayout` to accept and render a `pageNumber` prop with a dotted leader line
- Page numbers displayed dimly on screen; full opacity with right-aligned dotted leader in print
- `RecipeTimeSpan` hidden in print (non-standard TOC content; stays visible on screen)
- The `buildPageMap()` utility is intentionally reusable for two planned follow-on issues: alphabetical back-of-book index (#245) and per-recipe page numbers in print view (#246)

## Capabilities

### New Capabilities

- `cookbook-page-map`: Shared utility for computing `recipeId → pageNumber` from an ordered recipe list; flat heuristic now, extensible to content-based estimation

### Modified Capabilities

- `cookbook-toc-print-layout`: TOC entry format gains a dotted leader + right-aligned page number column; print-time styling updated accordingly

## Impact

- **Modified file**: `src/components/cookbooks/CookbookStandaloneLayout.tsx` — `TocRecipeItem`, `CookbookTocList`
- **New file**: `src/lib/cookbookPages.ts` — `buildPageMap()` utility
- **No backend changes**: `trpc.cookbooks.byId` already returns recipes pre-sorted by `orderIndex`; page number = array index + 1
- **No API changes**: page numbers are derived entirely client-side
- **Test files**: unit tests for `buildPageMap()`; component tests for `TocRecipeItem` with page number

## Problem Space

### In-scope
- TOC page (`/cookbooks/:id/toc`) showing estimated page numbers
- Print styling: dotted leader, right-aligned page number
- Screen styling: dimmed page number visible
- Shared `buildPageMap()` utility for future reuse

### Out-of-scope
- Line-count-based page estimation (follow-up work)
- Alphabetical back-of-book index (issue #245)
- Per-recipe page numbers in print view (issue #246)
- Cover page offset (first recipe = page 1, no cover page offset)
- Chapter headings do not consume page count

## Risks

- Page numbers are estimates only; actual print pagination depends on browser, font, and paper size. This is expected and acceptable for MVP.
- If `buildPageMap()` heuristic is later upgraded, all three consumers (TOC, index, print) update automatically — desirable, but means a heuristic change is a cross-cutting concern.

## Open Questions

All design questions resolved during exploration:
- Heuristic: flat 1-page-per-recipe ✓
- Screen display: dimmed (not hidden) ✓
- Chapter headings: do not consume pages ✓
- First recipe: page 1 (no cover page offset) ✓
- Future extensibility: `buildPageMap()` utility shared across TOC, index (#245), and print (#246) ✓

No unresolved ambiguity remains.

## Non-Goals

- Accurate pagination (actual print layout depends on browser rendering)
- Automatic page number updates when recipe content changes (static at load time)
- Back-of-book alphabetical index (separate issue #245)
- Recipe-level page numbers in the print view (separate issue #246)

---

> **Change-control note:** If scope changes after approval, `proposal.md`, `design.md`, `specs/`, and `tasks.md` must all be updated before implementation proceeds.
