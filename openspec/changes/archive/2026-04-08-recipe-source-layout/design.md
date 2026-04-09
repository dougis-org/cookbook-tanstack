## Context

- Relevant architecture: `src/components/recipes/RecipeDetail.tsx` is the sole component responsible for recipe display. It uses Tailwind CSS 4 with `print:` utility variants for print-specific styling. The component has no server-side concerns — it is purely presentational.
- Dependencies: Tailwind CSS 4 (via `@tailwindcss/vite`), React 19, TanStack Start. No additional packages required.
- Interfaces/contracts touched: `RecipeDetailProps` (unchanged), DOM structure of the header section within `RecipeDetail`.

## Goals / Non-Goals

### Goals

- Source attribution appears directly below the recipe title on screen (before chiclets)
- Source attribution appears to the right of the recipe title on print, on the same baseline line
- Source text size is unchanged (`text-sm`) in both contexts
- Action buttons (Edit/Delete) are hidden on print
- Chiclet visibility is unchanged (`print:hidden` as before)

### Non-Goals

- Changing source text styling beyond layout position
- Adding source to any other component or view
- Modifying print behaviour of any section other than the title-row header

## Decisions

### Decision 1: DOM position of source block

- Chosen: Move the source `<p>` block to immediately after the title+actions wrapper, before the chiclet `<div>`.
- Alternatives considered: CSS `order` property to reorder without moving DOM; absolutely positioning source for print.
- Rationale: Moving in DOM is simpler, more readable, and avoids invisible ordering side effects. CSS `order` only works within a flex parent — the title and chiclets are siblings in a block container, making `order` unusable without restructuring anyway.
- Trade-offs: Tests that check DOM order of source vs. chiclets need updating.

### Decision 2: Print inline layout via wrapper flex

- Chosen: Wrap `<h1>` + source `<p>` in a shared inner `<div>` with classes `flex flex-col print:flex-row print:items-baseline print:justify-between`. The outer title-row div keeps `flex items-start justify-between gap-4 mb-4`.
- Alternatives considered: (a) `float: right` on source for print — fragile, not Tailwind-native. (b) Separate print-only duplicate element — duplicates content, bad for accessibility. (c) CSS Grid with named areas for print — overengineered for a two-item row.
- Rationale: Tailwind `print:` variants are idiomatic and already used in this component (`print:hidden` on chiclets, `PRINT_HEADING_DENSITY_*` constants). Keeping everything in utilities means no custom stylesheet.
- Trade-offs: The `<h1>` and source `<p>` are siblings inside the inner div; on print they share a row. Long title + long source name may wrap — acceptable given real-world cookbook source names are short.

### Decision 3: Actions wrapper print visibility

- Chosen: Add `print:hidden` to the actions wrapper div (`<div className="shrink-0 print:hidden">`).
- Alternatives considered: Let each action component handle its own print visibility.
- Rationale: Actions (Edit, Delete, Export) have no meaning on a printed page. Centralizing `print:hidden` on the wrapper is DRY and ensures no action ever leaks to print regardless of future additions.
- Trade-offs: None significant.

### Decision 4: Source element unchanged inside wrapper

- Chosen: The `<p>` element for source (and the conditional `<a>` for URL) remains identical to the current implementation, just repositioned in the DOM.
- Alternatives considered: Splitting into two `<span>` elements for screen vs. print.
- Rationale: No split needed — `flex-col` on screen and `flex-row` on print handles both layouts with a single element.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: Source rendered directly below title on screen
  - Design decision: Decision 1 (DOM move) + Decision 2 (inner wrapper, `flex-col` default)
  - Validation approach: Vitest/RTL — assert source appears in DOM before chiclet wrapper

- Proposal element: Source to the right of title on print
  - Design decision: Decision 2 (inner wrapper, `print:flex-row print:justify-between`)
  - Validation approach: Visual inspection / Playwright screenshot test for print media

- Proposal element: Source same text size in all contexts
  - Design decision: Decision 4 (source element unchanged)
  - Validation approach: RTL — assert `text-sm` class present on source element

- Proposal element: Action buttons hidden on print
  - Design decision: Decision 3 (`print:hidden` on actions wrapper)
  - Validation approach: RTL — assert `print:hidden` class on actions wrapper

## Functional Requirements Mapping

- Requirement: Source appears before chiclets in the DOM
  - Design element: Decision 1
  - Acceptance criteria reference: specs/layout/spec.md — "source precedes chiclet wrapper"
  - Testability notes: RTL `getByTestId` order assertion or `previousSibling` / `nextSibling` check

- Requirement: On print, source and title share a flex row
  - Design element: Decision 2
  - Acceptance criteria reference: specs/layout/spec.md — "inner wrapper has print:flex-row"
  - Testability notes: Assert class list on inner wrapper div; visual confirmation via headed Playwright

- Requirement: Source `text-sm` unchanged
  - Design element: Decision 4
  - Acceptance criteria reference: specs/layout/spec.md — "source element has text-sm"
  - Testability notes: RTL class assertion

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: No custom CSS — all layout via Tailwind utilities
  - Design element: Decisions 2 & 3
  - Acceptance criteria reference: Code review — no `@media print` blocks added to `src/styles.css`
  - Testability notes: Manual review / grep for `@media print` in styles.css

- Requirement category: accessibility
  - Requirement: DOM order reflects visual reading order on screen
  - Design element: Decision 1 (source after title, before chiclets)
  - Acceptance criteria reference: Visual review
  - Testability notes: Screen reader order matches screen visual order

## Risks / Trade-offs

- Risk/trade-off: Long title + long source wraps on print
  - Impact: Minor visual degradation for edge cases
  - Mitigation: Use `min-w-0` on inner wrapper and `shrink-0` on source `<p>` if wrapping is observed in testing; or accept natural wrap

- Risk/trade-off: Test DOM-order assertions become fragile if header restructured again
  - Impact: Low; tests are in the same file and easy to update
  - Mitigation: Use semantic queries (`getByText`, `getByTestId`) rather than index-based queries

## Rollback / Mitigation

- Rollback trigger: Print layout regression visible in headed Playwright run, or screen layout broken in dev server
- Rollback steps: Revert DOM order change in `RecipeDetail.tsx` (move source back below chiclets, remove inner wrapper div, remove `print:hidden` from actions)
- Data migration considerations: None — purely presentational change
- Verification after rollback: `npm run test` passes; `npm run test:e2e` passes; headed browser shows previous layout

## Operational Blocking Policy

- If CI checks fail: Do not merge; investigate failing test or lint error before proceeding
- If security checks fail: Do not merge; this change has no security surface but standard policy applies
- If required reviews are blocked/stale: Wait up to 48 hours; if stale, ping reviewer directly
- Escalation path and timeout: After 48 hours with no review, tag project maintainer

## Open Questions

No open questions. Design is fully specified from proposal and codebase exploration.
