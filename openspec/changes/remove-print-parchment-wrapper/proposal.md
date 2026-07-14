## GitHub Issues

- #598

## Why

- Problem statement: When a recipe is printed, `RecipeDetail` renders inside a
  card (`bg-[var(--theme-surface)] rounded-lg shadow-lg overflow-hidden`).
  This screen-appropriate card chrome is not suppressed for print, so on
  paper it shows up as a faint rounded box-shadow "edge" wrapping the recipe.
  In the cookbook print flow (`cookbooks.$cookbookId_.print.tsx`), the
  per-recipe page number is also rendered as a separate block *below* that
  card, with its own `border-t`/`pt-2`/`mt-4`, adding a second slab of
  vertical padding purely to hold one line of text.
- Why now: Reported directly by the product owner (#598) as an active
  annoyance — it wastes vertical space on every printed recipe and every
  recipe page in a printed cookbook, with no offsetting value on paper.
- Business/user impact: Printing is a core use case for this app (physical
  recipe cards, printed cookbooks). Wasted vertical space means more pages
  per cookbook, more paper/ink, and a less polished physical artifact.

## Problem Space

- Current behavior: `RecipeDetail.tsx`'s outer wrapper
  (`src/components/recipes/RecipeDetail.tsx:139-140`) applies
  `bg-[var(--theme-surface)] rounded-lg shadow-lg overflow-hidden`
  unconditionally, with no `print:` override. This component is shared by
  both the standalone recipe print path (`/recipes/$recipeId`, printed via
  `window.print()`) and the cookbook print route
  (`cookbooks.$cookbookId_.print.tsx`), which renders one `RecipeDetail` per
  recipe inside a `.cookbook-recipe-section`. In the cookbook print route,
  the page number footer (`cookbook-recipe-position-label`,
  `cookbooks.$cookbookId_.print.tsx:105-112`) is a sibling block placed
  after `<RecipeDetail />`, separated from it by its own top border and
  padding.
- Desired behavior: On paper, the recipe content reads as plain content —
  no rounded card, no shadow, no distinct background fill. The page number
  (cookbook print only) still prints, but as part of the recipe's own print
  flow rather than a separately chrome'd block underneath it, so the
  vertical space currently spent on the footer's border/padding is
  reclaimed.
- Constraints: The same `RecipeDetail` component is used on-screen (where
  the card styling is correct and must be preserved) and in two print
  contexts. Any fix must be print-scoped (e.g. Tailwind `print:` variants or
  `print.css` rules) and must not alter on-screen rendering.
- Assumptions: The "faint paper edge image" described in #598 is the
  `shadow-lg` + `rounded-lg` + surface background on `RecipeDetail`'s outer
  div, not a literal `<img>` asset — no decorative image asset exists in
  the codebase matching "parchment" or "paper edge" (confirmed by search).
- Edge cases considered:
  - `CardImage` (recipe header image) still needs to print correctly when
    `imageUrl` is set (standalone recipe print) and print cleanly with no
    image (cookbook print always passes `imageUrl: null`).
  - The card's `overflow-hidden` currently clips the header image to the
    card's rounded corners; removing rounding must not reintroduce any
    visual overflow bug for the image on paper.
  - Cookbook print already page-breaks each recipe onto its own page via
    `.cookbook-recipe-section { break-before: page }` — the fix must keep
    that behavior intact and keep the page number appearing once per
    recipe, still legible and positioned sensibly at the end of that
    recipe's content.

## Scope

### In Scope

- Print-only style changes to `RecipeDetail.tsx`'s outer wrapper so the
  card background, rounding, and shadow do not render when printing.
- Repositioning the per-recipe page number in
  `cookbooks.$cookbookId_.print.tsx` so it sits inside the recipe's print
  flow instead of below it in a separately bordered/padded footer block.
- Any `print.css` additions needed to support the above (following the
  existing pattern of `print:` Tailwind variants plus targeted `print.css`
  rules already used in this file).

### Out of Scope

- Any change to on-screen (non-print) recipe detail styling or layout.
- Redesigning cookbook print pagination, TOC, or alpha-index layout.
- Changes to `CookbookStandaloneLayout.tsx`'s own card/box styling (its
  `#{pageNumber}` usage is a separate, unrelated component — see Open
  Questions).
- Any changes to the single-recipe print route's data fetching or other
  non-visual behavior.

## What Changes

- `src/components/recipes/RecipeDetail.tsx`: outer wrapper div gains
  print-scoped overrides so `bg-[var(--theme-surface)]`, `rounded-lg`, and
  `shadow-lg` are neutralized under `@media print` (both when printed
  standalone and when embedded in cookbook print).
- `src/routes/cookbooks.$cookbookId_.print.tsx`: the `#{pageNumber}` label
  moves from a sibling block after `<RecipeDetail />` (with its own
  border-top/padding) to inside the recipe's print flow, removing the
  redundant border/padding block.
- Possible small addition to `src/styles/print.css` if a Tailwind `print:`
  utility can't cleanly express the removal (e.g. clearing a CSS custom
  property-driven background).

## Risks

- Risk: Removing `overflow-hidden`/`rounded-lg` could let the header image
  visually spill past its container edge on paper if any residual
  border-radius-dependent clipping was relied upon.
  - Impact: Minor visual glitch on the standalone recipe print header image.
  - Mitigation: Verify visually (Playwright print-emulation snapshot or
    manual print preview) for a recipe with an image before/after.
- Risk: Moving the page number into the recipe's print flow changes its
  DOM position, which existing tests
  (`cookbooks.$cookbookId_.print.test.tsx`) assert on via
  `data-testid="cookbook-recipe-position-label"`.
  - Impact: Existing tests may need updating to match the new structure.
  - Mitigation: Update/extend tests as part of this change rather than
    treating it as a side effect; keep the `data-testid` stable so intent
    is unambiguous in the diff.
- Risk: `shadow-lg` in real Chrome print output already depends on
  "Background graphics" being enabled in the print dialog, so the visual
  bug is inconsistent across browsers/settings today. Print-suppressing it
  explicitly removes that inconsistency, but there's a small chance nobody
  currently relies on the shadow rendering as a subtle print separator
  between stacked cookbook recipes.
  - Impact: Low — a "faint" shadow was never a used, deliberate separator;
    page-breaks already exist between recipes in cookbook print.
  - Mitigation: None needed; page-break-before already isolates each
    recipe onto its own printed page.

## Open Questions

- Question: `CookbookStandaloneLayout.tsx` (`RecipePageRow`) also renders a
  `#{pageNumber}` (line 46) for the cookbook's table-of-contents index —
  is that in scope, or is #598 only about the per-recipe wrapper/number
  described in `cookbooks.$cookbookId_.print.tsx`?
  - Needed from: dougis
  - Blocker for apply: no — TOC page numbers are a distinct, already
    minimal element (no card wrapper around them), so this proposal treats
    them as out of scope unless told otherwise.
- Question: Should the page number's new position be a fixed spot within
  the recipe flow (e.g. immediately after the title, matching how
  `printMetaLine` already sits near the top) or after all recipe content
  (matching where it is today, just without the separate bordered block)?
  - Needed from: dougis
  - Blocker for apply: no — design.md will default to "same relative
    position (after all content), same border-top rule, but with reduced
    padding integrated into the recipe's own print flow" unless
    redirected.

## Non-Goals

- No changes to cookbook print pagination logic, page-count calculation,
  or the alpha index.
- No changes to the visual design of the on-screen (non-print) recipe
  card.
- No new print-specific components; this stays a targeted style fix to
  existing markup.

## Change Control

If scope changes after proposal approval, update `proposal.md`,
`design.md`, `specs/**/*.md`, and `tasks.md` before implementation starts.
