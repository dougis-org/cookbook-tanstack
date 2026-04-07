## GitHub Issues

- #246
- #191 (introduces `buildPageMap` utility)
- #245 (alphabetical index, also uses `buildPageMap`)

## Why

- **Problem statement:** The cookbook print view renders all recipes in order but provides no positional reference for each recipe. Readers using the Table of Contents (#191) or alphabetical index (#245) see reference numbers, but the recipe pages themselves show nothing — making cross-referencing impossible.
- **Why now:** Issues #191 and #245 are complete. The shared `buildPageMap()` utility already exists and is already consumed by the TOC and index components. This is the final piece to close the cross-reference loop.
- **Business/user impact:** Readers printing a cookbook can locate a recipe by its `#N` number from the TOC or index and find the matching section in the printed output.

## Problem Space

- **Current behavior:** Each recipe section in the print view (`/cookbooks/:cookbookId/print`) renders with no page/position indicator. The TOC shows `pg N` labels; the alphabetical index also shows `pg N`. These labels feel like physical page promises that the heuristic cannot reliably keep.
- **Desired behavior:** Each recipe section shows a small `#N` position indicator at the bottom. The TOC and alphabetical index also change from `pg N` to `#N`, so the reference system is consistent and honest about what it represents (order position, not physical page count).
- **Constraints:** `buildPageMap()` uses a 1-recipe-per-slot heuristic. The `#N` framing is intentionally chosen to avoid implying physical page accuracy.
- **Assumptions:** `printById` returns recipes in `orderIndex` order — the same ordering `buildPageMap()` relies on.
- **Edge cases considered:** Recipes with no entry in the page map (shouldn't happen with current data, but guarded with `pageNumber !== undefined` check). Empty cookbook (already handled by `CookbookEmptyState`).

## Scope

### In Scope

- Add `#N` position label to the bottom of each recipe section in the print view
- Change `pg N` → `#N` in `TocRecipeItem` (TOC rows)
- Change `pg N` → `#N` in `RecipePageRow` (alphabetical index rows)
- Label is lightly visible on screen (gray), more prominent in print output

### Out of Scope

- Improving the `buildPageMap()` heuristic (e.g., line-count-based estimation) — tracked separately
- Changing `RecipeDetail` component interface
- Any changes to the non-print cookbook views

## What Changes

- `src/routes/cookbooks.$cookbookId_.print.tsx` — import and call `buildPageMap(recipes)`; render `#N` footer in each `.cookbook-recipe-section`
- `src/components/cookbooks/CookbookStandaloneLayout.tsx` — replace `pg {pageNumber}` with `#{pageNumber}` in both `TocRecipeItem` and `RecipePageRow`

## Risks

- Risk: `#N` label could be mistaken for a hashtag/anchor link rather than a position number
  - Impact: Minor UX confusion
  - Mitigation: Small size, muted color, and placement at the bottom of the recipe section make it read as a footnote rather than an interactive element
- Risk: Browser print footer (added by OS/browser) could visually collide with the `#N` label
  - Impact: Minor visual overlap in some print environments
  - Mitigation: The `#N` label is inside the page content flow; browser footers are outside it — no actual collision

## Open Questions

No unresolved ambiguity. The approach, placement, styling, and label format were confirmed during the explore session. Implementation is ready to proceed.

## Non-Goals

- Making page numbers physically accurate (the `#N` system intentionally trades accuracy for consistency)
- Adding page numbers to non-print views of the cookbook
- Upgrading the `buildPageMap()` heuristic

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
