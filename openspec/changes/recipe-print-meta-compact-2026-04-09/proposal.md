## GitHub Issues

- dougis-org/cookbook-tanstack#284

## Why

- Problem statement: When a recipe detail page is printed, the meta grid (Prep Time, Cook Time, Servings, Difficulty) wraps onto two rows because Tailwind's `md:grid-cols-4` breakpoint does not apply during print rendering.
- Why now: Issue #284 was filed and confirmed — vertical space on print is wasted by this layout, pushing content further down the page.
- Business/user impact: Printed recipes look unprofessional and waste paper; the metadata takes up twice the vertical space it needs to.

## Problem Space

- Current behavior: The meta block uses `grid grid-cols-2 md:grid-cols-4`. On print, the browser ignores the `md:` responsive breakpoint, so the 4 items render as a 2×2 grid (2 rows).
- Desired behavior: On print, all 4 meta values appear on a single compact inline line, e.g. `Prep: 30m · Cook: 45m · Serves: 4 · Medium`.
- Constraints: The screen layout must remain unchanged. The compact line is print-only.
- Assumptions: The fix lives entirely in `RecipeDetail.tsx` and its test file. No new components or routes are needed.
- Edge cases considered:
  - Any meta field may be null/undefined — omit it from the compact line rather than showing "N/A"
  - All fields null — render an empty compact line (or omit the element entirely)
  - Only some fields present — join only the non-null ones with ` · `

## Scope

### In Scope

- Add `print:hidden` to the existing meta grid `<div>` in `RecipeDetail.tsx`
- Add a `hidden print:block` compact single-line summary below the grid
- Unit tests for the compact print meta line in `RecipeDetail.test.tsx`

### Out of Scope

- Changing the screen layout
- Modifying `print.css`
- Updating the cookbook print page (`cookbooks.$cookbookId_.print.tsx`) — `RecipeDetail` is already reused there so the fix is automatic
- Adding difficulty to `CookbookRecipeCard.metaLine` or `RecipeTimeSpan`

## What Changes

- `src/components/recipes/RecipeDetail.tsx`: meta grid gains `print:hidden`; new `hidden print:block` sibling element renders compact inline summary
- `src/components/recipes/__tests__/RecipeDetail.test.tsx`: new test cases for print meta line content and visibility classes

## Risks

- Risk: The compact line format diverges from `CookbookRecipeCard`'s `metaLine` helper (which omits difficulty).
  - Impact: Minor inconsistency — recipe detail print shows difficulty, cookbook card does not.
  - Mitigation: Acceptable — recipe detail is a full view; cookbook card is a summary card. Divergence is intentional.

- Risk: Tailwind's `print:block` / `print:hidden` utilities may not be in the purge safelist.
  - Impact: Classes stripped at build time → print line never shows / grid never hides.
  - Mitigation: Both utilities are already used elsewhere in `RecipeDetail.tsx` (`print:hidden` on servings buttons, `print:flex-row` on title wrapper), so they are already in the generated stylesheet.

## Open Questions

No unresolved ambiguity exists. The approach was confirmed during explore mode: Option C (compact inline row) was selected by the user over Options A and B.

## Non-Goals

- Redesigning the print layout beyond the meta block
- Adding a dedicated print stylesheet rule for this element
- Making `RecipeTimeSpan` or `metaLine` reusable for this use case

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
