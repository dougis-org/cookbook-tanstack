## GitHub Issues

- #268

## Why

- **Problem statement:** In print mode, recipe pages display taxonomy/classification chiclets (meal, course, preparation, category badges). These are color-coded navigation aids that lose their meaning when printed — colors may not render, and they add visual noise without adding information value in a printed document.
- **Why now:** The print view has received recent investment (#246, #191, #245, #270). Suppressing chiclets is a small, clean-up that brings print output to a polished state.
- **Business/user impact:** Printed cookbooks look cleaner and more professional. Users printing individual recipe pages (from `/recipes/:id`) also benefit — print suppression applies wherever `RecipeDetail` renders.

## Problem Space

- **Current behavior:** `RecipeDetail` renders a `<div>` containing `ClassificationBadge` and `TaxonomyBadge` chiclets. In print, the `ClassificationBadge` has partial print styling (transparent bg, black text/border) applied via `print.css`, but it is still visible. `TaxonomyBadge` has no print-specific CSS at all.
- **Desired behavior:** All chiclets (category, meal, course, preparation) are hidden in all print contexts — both the cookbook print view (`/cookbooks/:id/print`) and direct recipe page prints (`/recipes/:id`).
- **Constraints:** The change must not affect screen display. The existing `.classification-badge` block in `print.css` becomes dead code once the wrapper is hidden and should be removed.
- **Assumptions:** Suppression in all recipe print contexts is intentional (confirmed by user during explore).
- **Edge cases considered:** A recipe with no chiclets already renders nothing in that section — no change needed. A recipe with only some chiclet types renders them all inside the same wrapper div, so hiding the wrapper handles all cases uniformly.

## Scope

### In Scope

- Add `print:hidden` to the chiclet wrapper `<div>` in `RecipeDetail.tsx`
- Remove the now-dead `.classification-badge` block from `print.css`

### Out of Scope

- Changing chiclet display in any non-print context
- Modifying `ClassificationBadge` or `TaxonomyBadge` components themselves
- Adding semantic CSS classes to `TaxonomyBadge`
- Print styling of any other `RecipeDetail` sections

## What Changes

- `src/components/recipes/RecipeDetail.tsx` — add `print:hidden` to the badge wrapper div (line ~131)
- `src/styles/print.css` — remove the `.classification-badge` block (lines 38–42)

## Risks

- Risk: Future print-specific chiclet content (e.g., showing category name in plain text) would require reversing this approach.
  - Impact: Low — unlikely requirement, and the change is trivial to reverse.
  - Mitigation: None needed at this scale.

## Open Questions

No unresolved ambiguity. Scope confirmed during explore: suppress chiclets in all recipe print contexts, not just the cookbook print view.

## Non-Goals

- Making chiclet content print-friendly (e.g., plain-text fallback) — the intent is full suppression
- Any changes to the non-print recipe views

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
