## Context

- Relevant architecture: `src/components/recipes/RecipeDetail.tsx`
  owns the recipe detail section layout, including notes, ingredients,
  instructions, and nutrition. The component is used by both
  `src/routes/recipes/$recipeId.tsx` and
  `src/routes/cookbooks.$cookbookId_.print.tsx`.
- Dependencies: No data-layer or API changes are required. The change
  depends on existing `RecipeDetail` component tests in
  `src/components/recipes/__tests__/RecipeDetail.test.tsx`.
- Interfaces/contracts touched: The render contract of `RecipeDetail`
  changes so that notes appear as a labeled section after instructions
  and before nutrition when `recipe.notes` exists.

## Goals / Non-Goals

### Goals

- Present notes as a distinct `Notes` section instead of unlabeled introductory text
- Ensure notes render after `Instructions`
- Keep notes before `Nutrition` when the nutrition panel exists
- Preserve shared behavior across standard detail and print flows by
  changing only the shared detail component
- Add tests that validate section presence and ordering

### Non-Goals

- Modifying recipe persistence, tRPC contracts, or form behavior
- Introducing new note formatting semantics
- Redesigning unrelated parts of the recipe detail page

## Decisions

### Decision 1: Implement the layout change inside the shared `RecipeDetail` component

- Chosen: Move notes rendering within
  `src/components/recipes/RecipeDetail.tsx` rather than patching
  individual routes.
- Alternatives considered: Override note placement separately in
  `src/routes/recipes/$recipeId.tsx`; create a route-specific wrapper
  for print rendering.
- Rationale: `RecipeDetail` already owns section ordering. A shared
  component change keeps behavior consistent between the normal recipe
  route and cookbook print route with the smallest blast radius.
- Trade-offs: Any layout change affects both consumers immediately, so
  tests need to cover the shared contract rather than a single route.

### Decision 2: Render notes as a conditional section with a `Notes` heading after instructions

- Chosen: Replace the top-of-page paragraph with a dedicated section
  that renders only when `recipe.notes` has content.
- Alternatives considered: Keep the top placement and just add a
  heading; place notes at the absolute bottom after nutrition.
- Rationale: The approved interpretation of issue #273 is explicit:
  notes should appear after instructions and before nutrition. A
  section heading removes ambiguity about what the text represents.
- Trade-offs: The visual rhythm of the page changes slightly for
  recipes with notes, and the print layout inherits that new order.

### Decision 3: Verify ordering with component-level tests

- Chosen: Extend `src/components/recipes/__tests__/RecipeDetail.test.tsx`
  with assertions for heading presence and section order.
- Alternatives considered: Rely on a basic “text renders” assertion; add only route-level coverage.
- Rationale: The behavior lives in the component, so component tests
  provide the most direct regression guard while still covering both
  route consumers indirectly.
- Trade-offs: DOM-order assertions can be more specific than simple
  text assertions, so tests should focus on stable section headings and
  rendered content rather than brittle class names.

## Proposal to Design Mapping

- Proposal element: Move notes out of the top-of-page paragraph position
  - Design decision: Decision 2
  - Validation approach: Component test verifies notes render as a
    section, not as introductory text-only behavior
- Proposal element: Place notes after `Instructions`
  - Design decision: Decision 2
  - Validation approach: Component test asserts DOM order of `Instructions`, `Notes`, and note content
- Proposal element: Keep notes before `Nutrition`
  - Design decision: Decision 2
  - Validation approach: Component test asserts DOM order when both
    notes and nutrition are present
- Proposal element: Preserve shared behavior for recipe detail and print
  - Design decision: Decision 1
  - Validation approach: Shared component implementation with
    regression coverage on `RecipeDetail`
- Proposal element: Add regression coverage
  - Design decision: Decision 3
  - Validation approach: Update `RecipeDetail.test.tsx`

## Functional Requirements Mapping

- Requirement: Notes render in a labeled `Notes` section only when note content exists
  - Design element: Decision 2
  - Acceptance criteria reference: New recipe detail notes placement spec scenarios
  - Testability notes: Render `RecipeDetail` with and without `notes`;
    assert heading and content presence/absence
- Requirement: Notes appear after `Instructions`
  - Design element: Decision 2
  - Acceptance criteria reference: New recipe detail notes placement ordering scenario
  - Testability notes: Assert DOM position using headings and note text in the rendered container
- Requirement: Notes appear before `Nutrition` when nutrition data exists
  - Design element: Decision 2
  - Acceptance criteria reference: New recipe detail notes placement ordering scenario with nutrition
  - Testability notes: Render with notes and nutrition, then verify section sequence

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Shared rendering remains consistent across normal and
    print detail consumers
  - Design element: Decision 1
  - Acceptance criteria reference: Shared component spec requirement
  - Testability notes: Validate at the shared component layer because
    both routes consume the same component
- Requirement category: operability
  - Requirement: Regression coverage should clearly flag future section-order drift
  - Design element: Decision 3
  - Acceptance criteria reference: Test artifact coverage for note section order
  - Testability notes: Add explicit ordering assertions in unit tests
- Requirement category: security
  - Requirement: No new security surface is introduced by this
    presentation-only change
  - Design element: No API or persistence changes
  - Acceptance criteria reference: N/A
  - Testability notes: Security validation is limited to confirming no
    new dependencies or network/data handling changes are introduced

## Risks / Trade-offs

- Risk/trade-off: A shared component change may surprise print-view
  expectations if users were relying on the old note position
  - Impact: Printed cookbook recipe layout changes at the same time as the detail page
  - Mitigation: Make the shared behavior explicit in specs and test coverage
- Risk/trade-off: Tests may become brittle if they depend on exact markup rather than semantic section order
  - Impact: Unnecessary test churn on benign styling changes
  - Mitigation: Assert on headings and DOM sequence, not presentation classes

## Rollback / Mitigation

- Rollback trigger: Review feedback or failed validation shows the new
  section order is incorrect or undesirable in either normal or print
  rendering
- Rollback steps: Restore prior note placement in
  `src/components/recipes/RecipeDetail.tsx`; remove or adjust the new
  section-order tests; update change artifacts to reflect the reverted
  scope
- Data migration considerations: None; this is a presentation-only change
- Verification after rollback: Confirm notes render in the previous location and all affected tests match the restored behavior

## Operational Blocking Policy

- If CI checks fail: Stop before merge, inspect the failing unit or
  type-check feedback, and update code/tests or change artifacts before
  retrying
- If security checks fail: Confirm whether the failure is unrelated
  noise versus a genuine regression; because no new dependencies are
  involved, any real security regression blocks merge until resolved
- If required reviews are blocked/stale: Do not proceed to apply or
  merge without explicit human review; refresh the branch or artifacts
  as needed and re-request review
- Escalation path and timeout: Escalate to the requester/reviewer
  immediately if validation or review remains blocked after one
  troubleshooting cycle; do not continue implementation on an
  unapproved or red CI state

## Open Questions

- None. The approved interpretation is to render `Notes` after `Instructions` and before `Nutrition`.
