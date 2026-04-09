## Context

- Relevant architecture: `RecipeDetail` is a single React component (`src/components/recipes/RecipeDetail.tsx`) used in both the recipe detail route (`/recipes/$recipeId`) and the cookbook print route (`/cookbooks/$cookbookId/print`). Its meta block is a Tailwind CSS grid with responsive classes.
- Dependencies: Tailwind CSS 4 (via `@tailwindcss/vite`). Print utilities `print:hidden` and `print:block` are already in use in the file, so they are present in the generated stylesheet.
- Interfaces/contracts touched: Only `RecipeDetail.tsx` and its test file. No new props, no new exports, no route changes.

## Goals / Non-Goals

### Goals

- Meta block renders on a single compact inline line when printed
- Null/missing fields are omitted gracefully (no "N/A" in print line)
- Screen layout is completely unchanged
- Fix applies to both recipe detail page and cookbook print page (via shared component)

### Non-Goals

- Changing `print.css`
- Extracting a shared `PrintMetaLine` component
- Modifying `CookbookRecipeCard`, `RecipeTimeSpan`, or any other component

## Decisions

### Decision 1: Print layout strategy — hide grid, show inline line

- Chosen: Add `print:hidden` to the existing meta grid; add a sibling `hidden print:block` element with the compact inline summary.
- Alternatives considered:
  - A: Add `print:grid-cols-4` to force 4 columns (simpler, but font/padding still large)
  - A+: `print:grid-cols-4 print:gap-2 print:p-2 print:text-sm` (compact grid, still two DOM layers)
- Rationale: Option C produces the most print-native output — a single readable line matching the style of `CookbookRecipeCard.metaLine`. The hide/show pattern is already established in this component.
- Trade-offs: Slightly more markup; the compact line duplicates data already in the grid. Acceptable because it is print-only and trivially derived.

### Decision 2: Compact line format

- Chosen: `Prep: Xm · Cook: Xm · Serves: N · Difficulty` — pipe-separated with ` · ` delimiter, using short labels.
- Alternatives considered: Full words ("30 min", "4 servings") — more verbose, more likely to wrap.
- Rationale: Matches the `·` delimiter already used in `CookbookRecipeCard.metaLine`. Short labels (`Prep:`, `Cook:`, `Serves:`) are self-explanatory.
- Trade-offs: Difficulty is capitalized inline without a label (just the value, e.g. "Medium") since the field is self-describing in context.

### Decision 3: Null field handling

- Chosen: Omit null/undefined fields from the compact line entirely. If all fields are null, the element renders but is empty.
- Alternatives considered: Show "N/A" for missing fields (mirrors the grid).
- Rationale: Print output should be minimal and clean. "N/A" adds noise. The grid shows N/A for screen readers and interactive use; the print line is purely informational.
- Trade-offs: If all fields are null, the print line is empty but still renders. Acceptable edge case.

## Proposal to Design Mapping

- Proposal element: Add `print:hidden` to meta grid
  - Design decision: Decision 1 — hide grid on print
  - Validation approach: Test that the grid container has the `print:hidden` class

- Proposal element: Add `hidden print:block` compact summary
  - Design decision: Decision 1 + Decision 2
  - Validation approach: Test that the compact element has `hidden` and `print:block` classes; test its text content

- Proposal element: Omit null fields
  - Design decision: Decision 3
  - Validation approach: Test with partial/null recipe fields that the separator and null values don't appear

## Functional Requirements Mapping

- Requirement: Meta grid has `print:hidden` class
  - Design element: Existing `<div className="grid ...">` gains `print:hidden`
  - Acceptance criteria reference: specs/recipe-print-meta.md — FR1
  - Testability notes: Assert class presence on the grid container element

- Requirement: Compact print line has `hidden` and `print:block` classes
  - Design element: New sibling `<p>` or `<div>` with `hidden print:block`
  - Acceptance criteria reference: specs/recipe-print-meta.md — FR2
  - Testability notes: Query by `data-testid="print-meta-line"` and assert classes

- Requirement: Compact line shows all non-null fields joined by ` · `
  - Design element: Inline array filter + join, same pattern as `CookbookRecipeCard.metaLine`
  - Acceptance criteria reference: specs/recipe-print-meta.md — FR3
  - Testability notes: Render with known values, assert `getByTestId('print-meta-line').textContent`

- Requirement: Null fields are omitted from compact line
  - Design element: Decision 3 — filter(Boolean) on the parts array
  - Acceptance criteria reference: specs/recipe-print-meta.md — FR4
  - Testability notes: Render with some null fields, assert missing labels/values

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Screen layout unchanged
  - Design element: `print:hidden` only hides on print media; grid classes unchanged
  - Acceptance criteria reference: specs/recipe-print-meta.md — NFR1
  - Testability notes: Existing grid/servings tests continue to pass without modification

- Requirement category: operability
  - Requirement: Fix applies to both recipe page and cookbook print page without duplication
  - Design element: Both routes use the same `RecipeDetail` component; no route changes needed
  - Acceptance criteria reference: Implicit — no new routes or components
  - Testability notes: Covered by existing route-level tests

## Risks / Trade-offs

- Risk/trade-off: Compact line duplicates meta data already in the grid
  - Impact: Minor — two sources of truth for the same data in one component
  - Mitigation: Both derive from the same `recipe` prop; no sync risk

## Rollback / Mitigation

- Rollback trigger: Visual regression in print output or failing tests
- Rollback steps: Revert the two changes to `RecipeDetail.tsx` (remove `print:hidden` from grid, remove the compact line element)
- Data migration considerations: None — UI-only change
- Verification after rollback: `npm run test` passes; print preview shows original grid

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing tests or build error before proceeding.
- If security checks fail: Do not merge. This change is UI-only so security failures indicate an unrelated issue; investigate before proceeding.
- If required reviews are blocked/stale: Re-request review after 24 hours. Escalate to repo owner if still blocked after 48 hours.
- Escalation path and timeout: Tag `dougis` on the PR after 48 hours of no review activity.

## Open Questions

No open questions. All design decisions were confirmed during the explore/proposal phase.
