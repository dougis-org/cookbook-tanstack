## Context

- **Relevant architecture:** `RecipeDetail` is a shared component rendered in both the cookbook print view (`/cookbooks/:id/print`) and the recipe detail page (`/recipes/:id`). Chiclets are rendered in a single wrapper `<div>` at ~line 131 that contains `ClassificationBadge` and `TaxonomyBadges` (meals, courses, preparations). Tailwind's `print:hidden` utility maps to `@media print { display: none }` and is already the established pattern for print suppression in this project (see `print.css` line 16).
- **Dependencies:** None. This is a self-contained UI change.
- **Interfaces/contracts touched:** `RecipeDetail` component (no prop interface changes). `src/styles/print.css` (CSS deletion only).

## Goals / Non-Goals

### Goals

- Hide all chiclets (category, meal, course, preparation) in all print contexts
- Remove dead CSS from `print.css`

### Non-Goals

- Changing chiclet display on screen
- Adding print-friendly fallback text for taxonomy
- Modifying `ClassificationBadge` or `TaxonomyBadge` components

## Decisions

### Decision 1: Use Tailwind `print:hidden` on the wrapper div

- **Chosen:** Add `print:hidden` to the existing `<div className="flex flex-wrap gap-2 mb-4">` wrapper in `RecipeDetail.tsx` (~line 131).
- **Alternatives considered:**
  - Add `.classification-badge, .taxonomy-badge { display: none }` to `print.css` — requires adding a semantic class to `TaxonomyBadge` (which currently has none), touching more files for no benefit.
  - Add `print:hidden` to individual badge components — would require modifying `ClassificationBadge` and `TaxonomyBadge`, which are general-purpose UI components that shouldn't carry print-context assumptions.
- **Rationale:** The wrapper div already co-locates all chiclet rendering. One class addition hides all types atomically. Consistent with how `print:hidden` is already used in this codebase.
- **Trade-offs:** Hides all chiclets in any print context that renders `RecipeDetail` — this is the desired behavior per confirmed scope.

### Decision 2: Remove `.classification-badge` print CSS block

- **Chosen:** Delete lines 38–42 from `src/styles/print.css` (the `.classification-badge` block).
- **Alternatives considered:** Leave it — harmless dead code but contradicts project hygiene.
- **Rationale:** Once the wrapper is hidden, the `.classification-badge` print styles are never applied. Removing them prevents future confusion about intent.
- **Trade-offs:** None. The block has no effect post-change.

## Proposal to Design Mapping

- **Proposal element:** Add `print:hidden` to chiclet wrapper in `RecipeDetail.tsx`
  - **Design decision:** Decision 1 — `print:hidden` on wrapper div
  - **Validation approach:** Visual test (print preview) + Playwright print E2E check
- **Proposal element:** Remove `.classification-badge` block from `print.css`
  - **Design decision:** Decision 2 — delete dead CSS
  - **Validation approach:** CSS file inspection; confirm no regression in screen display

## Functional Requirements Mapping

- **Requirement:** Chiclets are not visible in print output
  - **Design element:** `print:hidden` on wrapper div in `RecipeDetail`
  - **Acceptance criteria reference:** specs/print-suppression.md
  - **Testability notes:** Playwright can snapshot print media using `page.emulateMedia({ media: 'print' })` and assert `.flex.flex-wrap` is not visible
- **Requirement:** Screen display of chiclets is unchanged
  - **Design element:** `print:hidden` only applies in `@media print`
  - **Acceptance criteria reference:** specs/print-suppression.md
  - **Testability notes:** Existing `RecipeDetail` screen tests should pass unchanged

## Non-Functional Requirements Mapping

- **Requirement category:** Maintainability
  - **Requirement:** No dead CSS remains post-change
  - **Design element:** Decision 2 — remove `.classification-badge` block
  - **Acceptance criteria reference:** Code review
  - **Testability notes:** Visual diff of `print.css`

## Risks / Trade-offs

- **Risk/trade-off:** Future need to show chiclet content in print (e.g., plain-text category name)
  - **Impact:** Low — would require reversing `print:hidden` and designing a print-only rendering path
  - **Mitigation:** Change is trivial to revert; no data loss

## Rollback / Mitigation

- **Rollback trigger:** Regression in screen display of chiclets, or unexpected print layout breakage
- **Rollback steps:** Remove `print:hidden` from wrapper div; restore `.classification-badge` block in `print.css`
- **Data migration considerations:** None
- **Verification after rollback:** Run Vitest unit tests + Playwright E2E; confirm chiclets visible on screen

## Operational Blocking Policy

- **If CI checks fail:** Do not merge; fix the failing check before proceeding
- **If security checks fail:** Do not merge; this change is CSS/JSX-only so security failures would indicate a broader issue
- **If required reviews are blocked/stale:** Re-request review after 24 hours; escalate to repo owner if no response after 48 hours
- **Escalation path and timeout:** Tag @dougis in PR after 48 hours of review inactivity

## Open Questions

No unresolved questions. Design is straightforward and fully determined by the proposal.
