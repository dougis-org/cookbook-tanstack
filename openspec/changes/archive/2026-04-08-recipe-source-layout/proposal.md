## GitHub Issues

- dougis-org/cookbook-tanstack#280

## Why

- Problem statement: The recipe source attribution is currently displayed below the taxonomy chiclets, which pushes it visually far from the recipe title it belongs to. On print, the chiclets are hidden but the source remains in a suboptimal position below where the chiclets were.
- Why now: Issue #280 raised by the project author requesting the layout improvement.
- Business/user impact: Readers scanning a printed recipe see the source attribution immediately adjacent to the title (industry standard for cookbook attribution), rather than having to search for it below category tags.

## Problem Space

- Current behavior: Source is rendered after the chiclet row (Classification + Meal/Course/Preparation badges). On screen, chiclets appear between title and source. On print, chiclets are hidden (`print:hidden`) but source stays in its current DOM position, leaving it separated from the title by the space vacated by hidden elements.
- Desired behavior: Source renders directly below the recipe title on screen. On print, source flows to the right of the recipe title on the same line, at the same text size.
- Constraints: Must not break the chiclet layout on screen. Must use Tailwind print utilities (no custom CSS files). Must preserve the existing `text-sm` size for source in all contexts.
- Assumptions: Edit/Delete action buttons are not needed on print and can receive `print:hidden`.
- Edge cases considered:
  - No source: layout degrades gracefully (title fills the full row on print).
  - Long source name + long title: `flex-wrap` or truncation may be needed on print; `items-baseline` alignment keeps them visually anchored.
  - Source with URL (renders as `<a>`) vs. source name-only (renders as `<span>`): both inline fine.

## Scope

### In Scope

- Reorder source block in `src/components/recipes/RecipeDetail.tsx` to appear directly below the title (before chiclets)
- Nest title + source in a shared inner wrapper div with `print:flex-row print:items-baseline print:justify-between`
- Add `print:hidden` to the actions wrapper
- Update `src/components/recipes/__tests__/RecipeDetail.test.tsx` to reflect new DOM order

### Out of Scope

- Changes to any other component (RecipeCard, RecipeForm, etc.)
- Changing the source text size or styling beyond what's needed for layout
- Print stylesheet changes outside of Tailwind utilities
- Any change to how source data is fetched or resolved

## What Changes

- `src/components/recipes/RecipeDetail.tsx`: DOM restructure of the header section (lines 134–185); source block moves above chiclets; title + source wrapped in a new inner div with print-responsive flex classes; actions wrapper gains `print:hidden`
- `src/components/recipes/__tests__/RecipeDetail.test.tsx`: Test assertions updated for new DOM order (source before chiclets)

## Risks

- Risk: Print layout regression — source wrapping onto a new line on very long title + source combinations.
  - Impact: Low; print is supplementary and the issue explicitly accepts this layout change.
  - Mitigation: Use `min-w-0` on title + `shrink-0` on source for print, or accept natural wrap if title is extremely long.
- Risk: Test brittleness — tests that assert on relative DOM position of source vs. chiclets may fail.
  - Impact: Low; tests are co-located and straightforward to update.
  - Mitigation: Update tests as part of the same PR.

## Open Questions

No unresolved ambiguity exists. The issue description is explicit about both the screen behavior (source directly below title) and the print behavior (source to the right of title, same size). All edge cases are addressed within the existing Tailwind print utility system.

## Non-Goals

- Changing font size or weight of the source attribution
- Adding a source field to the print header that doesn't exist on screen
- Modifying the chiclet layout or print visibility behaviour
- Any server-side or data-layer changes

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
