## GitHub Issues

- dougis-org/cookbook-tanstack#290

## Why

- Problem statement: When printing a cookbook, recipes with long ingredient lists frequently spill onto a second page, wasting paper and making the printed cookbook harder to use.
- Why now: Issue #290 was filed requesting this improvement. The compact print meta line (PR #288) was already merged, providing a base for further print density work.
- Business/user impact: Cookbook print is a core user feature. Reducing page count per recipe makes printed cookbooks more compact and professional.

## Problem Space

- Current behavior: Ingredients render in a single column. Recipe title prints at `text-2xl`, section headings at `text-xl`. `@page` margin is `1.5cm`. Sections have `mb-8` bottom margins.
- Desired behavior: Ingredients render in 2 columns when printing. Headings are one size level smaller. Section spacing is tighter. Page margins are narrower. Combined, this brings more recipes to 1 page.
- Constraints: Ingredient data is a raw text blob split by newlines — no semantic distinction between group labels and ingredient lines. The 2-column layout cannot selectively prevent column breaks before group labels.
- Assumptions: CSS `column-count: 2` with balanced columns is acceptable. Occasional orphaned group labels (label at bottom of column 1, items in column 2) are an acceptable trade-off for the density gain.
- Edge cases considered:
  - Recipes with empty ingredient lists: no 2-column impact, existing "No ingredients listed" fallback unchanged.
  - Ingredient groups with labels: column break may land between label and its items — accepted limitation.
  - Very short ingredient lists (1–3 items): 2-column will balance to ~1–2 items per column, which looks fine.
  - Nutrition section with grid layout: not affected by ingredient column change.

## Scope

### In Scope

- 2-column ingredient list in `@media print` only
- Tighter ingredient list spacing in print (`space-y-1` vs `space-y-2`)
- Reduce recipe title print size: `print:text-2xl` → `print:text-xl`
- Reduce section heading print size: `print:text-xl` → `print:text-lg`
- Reduce section bottom margin in print: `print:mb-4` on all `<section>` elements currently using `mb-8`
- Narrow `@page` margin: `1.5cm` → `1cm`
- Changes apply to both cookbook print view and individual recipe print (via `RecipeDetail` component)

### Out of Scope

- 2-column instruction list (instructions are sequential and already width-efficient)
- Semantic ingredient group parsing or markup
- Pagination guarantees (1 page per recipe is a goal, not a contract)
- Screen layout changes of any kind

## What Changes

- `src/styles/print.css` — `@page` margin `1.5cm` → `1cm`
- `src/components/printHeadingDensity.ts` — heading size constants reduced one level
- `src/components/recipes/RecipeDetail.tsx` — ingredient `<ul>` gains print column utilities; all `<section>` elements gain `print:mb-4`

## Risks

- Risk: Group labels orphaned from their ingredient items at column break
  - Impact: Low — cosmetic; does not affect content correctness
  - Mitigation: Accepted trade-off given no semantic markup in current data model; can be revisited if data model gains group structure
- Risk: Heading sizes too small to clearly delimit sections when printed
  - Impact: Medium — readability regression
  - Mitigation: Changes are reviewable before merge via `?displayonly=1` on cookbook print route; font-weight stays bold so visual hierarchy is preserved
- Risk: Narrow margins clip content on some printers with non-standard minimum margins
  - Impact: Low — `1cm` is within the safe zone for most modern printers
  - Mitigation: `1cm` is a common recipe/cookbook print margin; revert to `1.25cm` if reported

## Open Questions

No unresolved ambiguity. All decisions were confirmed during the explore session:
- 2-column applies to ingredients only (not instructions) ✓
- Heading reduction is "one level" on both title and section headings ✓
- Section margin tightening applies to all sections ✓
- Changes apply to both cookbook and individual recipe print ✓

## Non-Goals

- Guaranteed 1-page-per-recipe output for all recipes
- Changes to instruction layout
- Changes to screen (non-print) styling
- Semantic ingredient group markup

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
