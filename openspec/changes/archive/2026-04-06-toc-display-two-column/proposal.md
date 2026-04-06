## Why

The TOC and Alpha Index currently display in a single column on screen, while the print view renders them in two columns. This inconsistency means users previewing the cookbook in a browser see a layout that doesn't reflect what will be printed. Resolving issue #260 makes the screen experience visually consistent with the printed output.

## What Changes

- `CookbookTocList`: the recipe list `<ol>` elements gain `sm:columns-2 sm:gap-8 sm:space-y-0` so the 2-column layout activates on screen at the `sm` breakpoint and above. Mobile (< `sm`) remains single-column. Print retains its existing `print:` variants.
- `CookbookAlphaIndex`: the shared flat-list `<ol>` gains the same `sm:columns-2 sm:gap-8 sm:space-y-0` treatment. Visible in the print preview route (`/cookbooks/:id/print?displayonly=1`) as well as during actual printing.
- Both changes apply to the shared components in `src/components/cookbooks/CookbookStandaloneLayout.tsx`, so `/toc` and `/print` routes benefit automatically.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cookbook-toc-print-layout`: requirement that the 2-column layout is print-only is changing — it now also applies on-screen at `sm`+ breakpoints.
- `cookbook-alpha-index`: requirement that the 2-column list layout is print-only is changing — it now also applies on-screen at `sm`+ breakpoints.

## Impact

- **File**: `src/components/cookbooks/CookbookStandaloneLayout.tsx` — 4 `<ol>` class strings updated (3 in `CookbookTocList`, 1 in `CookbookAlphaIndex`).
- **Routes affected**: `/cookbooks/:id/toc` (TOC display), `/cookbooks/:id/print` and `/cookbooks/:id/print?displayonly=1` (print and preview).
- **No API, database, or routing changes.**
- **Tests**: existing snapshot/class tests for `CookbookTocList` and `CookbookAlphaIndex` may need class-string updates.

## Open Questions

No unresolved ambiguity. Decisions confirmed during exploration:
- Mobile (< `sm`) stays single-column. ✓
- Both `CookbookTocList` and `CookbookAlphaIndex` get the same treatment. ✓
- The `/print` route (shared component) also benefits automatically. ✓

## Non-Goals

- Adding the Alpha Index to the standalone `/toc` route — it only lives in `/print`.
- Changing page-number logic, chapter grouping, or any other TOC/index behaviour.
- Responsive behaviour below `sm` (mobile stays single-column).
