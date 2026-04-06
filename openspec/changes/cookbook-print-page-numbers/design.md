## Context

- **Relevant architecture:** The cookbook print view (`src/routes/cookbooks.$cookbookId_.print.tsx`) fetches all recipes via `trpc.cookbooks.printById` and renders them in order. `src/lib/cookbookPages.ts` exports `buildPageMap(recipes)` which maps `recipeId → position number (1-based)`. `CookbookStandaloneLayout.tsx` contains `CookbookTocList` and `CookbookAlphaIndex`, both of which already call `buildPageMap()` independently and render position labels.
- **Dependencies:** `buildPageMap()` is stable and already in use — no changes to it.
- **Interfaces/contracts touched:** `RecipeDetailProps` — not modified. `TocRecipeItem` and `RecipePageRow` render functions — label text only.

## Goals / Non-Goals

### Goals

- Render `#N` at the bottom of each recipe section in the print view
- Change `pg N` → `#N` in TOC and alphabetical index for consistency
- Label is muted gray on screen, readable in print output

### Non-Goals

- Modifying `buildPageMap()` heuristic
- Changing `RecipeDetail` component props
- Adding position labels to any non-print views

## Decisions

### Decision 1: Label format `#N` over `pg N`

- **Chosen:** `#{pageNumber}` (e.g., `#3`)
- **Alternatives considered:** `pg 3`, `Page 3`, `p.3`
- **Rationale:** `#N` signals order position rather than a physical page count promise. The heuristic is 1-recipe-per-slot, so calling it a "page" is misleading for long recipes. `#N` is honest and terse.
- **Trade-offs:** Slightly unconventional; readers expecting "pg" may need a moment to orient. Mitigated by context (cookbook TOC) making the meaning clear.

### Decision 2: Wrapper div in print route, not a new prop on `RecipeDetail`

- **Chosen:** Render the `#N` label inside `.cookbook-recipe-section` div in the print route, after `<RecipeDetail>`.
- **Alternatives considered:** Adding `pageNumber?: number` prop to `RecipeDetail`
- **Rationale:** Page numbering is a print-view concern. `RecipeDetail` is a general-purpose component used across the app; polluting it with a print-only prop increases coupling. The wrapper approach keeps the concern in the right layer.
- **Trade-offs:** The label is visually separated from the recipe header, appearing at the bottom. This is actually the conventional position for page numbers.

### Decision 3: Styling — gray on screen, readable in print

- **Chosen:** `mt-4 pt-2 border-t border-slate-700/30 print:border-gray-200 text-right text-xs text-gray-500 print:text-gray-600 tabular-nums`
- **Alternatives considered:** `hidden print:block` (invisible on screen)
- **Rationale:** Light gray on screen makes `?displayonly=1` testing viable without needing to trigger a print dialog. The thin top border creates a visual separator that echoes the dotted-leader lines in the TOC.
- **Trade-offs:** The label is faintly visible on the screen view of the print page, which is intentional.

## Proposal to Design Mapping

- Proposal element: Add `#N` to each recipe section in print view
  - Design decision: Decision 2 (wrapper div), Decision 1 (label format)
  - Validation approach: Render print view with `?displayonly=1`; verify each recipe section has its `#N` label
- Proposal element: Change `pg N` → `#N` in TOC and index
  - Design decision: Decision 1 (label format)
  - Validation approach: Render print view; inspect TOC and alphabetical index rows
- Proposal element: Label visible in print, muted on screen
  - Design decision: Decision 3 (styling)
  - Validation approach: Visual check in `?displayonly=1` mode; browser print preview

## Functional Requirements Mapping

- **Requirement:** Each recipe section shows `#N` at the bottom
  - Design element: `pageMap.get(recipe.id)` lookup + conditional render in print route
  - Acceptance criteria reference: specs/print-page-numbers.md
  - Testability notes: Unit test renders `CookbookPrintPage` and checks for `#1`, `#2` text nodes

- **Requirement:** TOC rows show `#N` instead of `pg N`
  - Design element: `TocRecipeItem` label text change
  - Acceptance criteria reference: specs/print-page-numbers.md
  - Testability notes: Unit test renders `CookbookTocList` and asserts no `pg` text, presence of `#` prefix

- **Requirement:** Alphabetical index rows show `#N` instead of `pg N`
  - Design element: `RecipePageRow` label text change
  - Acceptance criteria reference: specs/print-page-numbers.md
  - Testability notes: Unit test renders `CookbookAlphaIndex` and asserts `#N` format

- **Requirement:** `#N` values are consistent across TOC, index, and recipe sections
  - Design element: All three call `buildPageMap()` with the same recipe list in the same order
  - Acceptance criteria reference: specs/print-page-numbers.md
  - Testability notes: Test uses a known recipe list and asserts the same number appears in all three locations for a given recipe

## Non-Functional Requirements Mapping

- **Requirement category:** Reliability
  - Requirement: No render errors when a recipe is not found in `pageMap`
  - Design element: `{pageNumber !== undefined && ...}` guard
  - Acceptance criteria reference: specs/print-page-numbers.md
  - Testability notes: Pass a recipe with an ID not in the map; verify no label renders, no crash

## Risks / Trade-offs

- Risk/trade-off: `#N` label could read as a hashtag/anchor
  - Impact: Minor confusion
  - Mitigation: Small size, muted color, footer position — reads as a footnote

## Rollback / Mitigation

- **Rollback trigger:** `#N` label causes layout issues in print output, or stakeholder rejects the format
- **Rollback steps:** Revert `cookbooks.$cookbookId_.print.tsx` (remove import + pageMap call + label div); revert `CookbookStandaloneLayout.tsx` (`#` → `pg` in two span elements)
- **Data migration considerations:** None — purely UI
- **Verification after rollback:** Print view renders without `#N`; TOC and index show `pg N` again

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Fix failing tests or type errors before proceeding.
- **If security checks fail:** Do not merge. This change is UI-only with no auth/data surface, so failures would indicate a pre-existing issue — escalate.
- **If required reviews are blocked/stale:** Ping reviewer after 24h; escalate to maintainer after 48h.
- **Escalation path and timeout:** Maintainer (Doug) has final say; no automated timeout bypass.

## Open Questions

No open questions. Design decisions were confirmed during the explore session prior to proposal creation.
