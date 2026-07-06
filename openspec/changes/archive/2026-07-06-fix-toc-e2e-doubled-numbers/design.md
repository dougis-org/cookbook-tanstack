## Context

- Relevant architecture: `/cookbooks/:id/print` (`src/routes/cookbooks.$cookbookId_.print.tsx`)
  renders three distinct number-bearing regions on one page:
  1. `.cookbook-toc-page` → `CookbookTocList` → `TocRecipeItem` — the TOC
     fixed by PR #567. No index number, no page number, as of that fix.
  2. Per-recipe `.cookbook-recipe-section` → `.cookbook-recipe-position-label`
     footer — renders `#{pageNumber}` via `buildPageMap`. Untouched by
     PR #567, covered by the test at lines 84-99.
  3. `CookbookAlphaIndex` (renders `RecipePageRow`, which still shows
     `N.` and `#N`) — untouched by PR #567, not currently covered by this
     spec file at all.
- Dependencies: Playwright E2E suite (`@bgotink/playwright-coverage`),
  helper `gotoAndWaitForHydration`.
- Interfaces/contracts touched: only the test file
  `src/e2e/cookbooks-print.spec.ts`. No production code changes.

## Goals / Non-Goals

### Goals

- Make the stale test in `cookbooks-print.spec.ts` pass against PR #567's
  corrected TOC behavior.
- Keep the test meaningful: it must fail if recipe ordering in the TOC
  regresses, and fail if the doubled-number bug reappears.
- Scope all assertions to `.cookbook-toc-page` so they cannot accidentally
  pass/fail based on the unrelated `#N` labels in regions 2 and 3 above
  (both legitimately still render `#1`/`#2`-shaped text elsewhere on the
  same page).

### Non-Goals

- Adding new coverage for `CookbookAlphaIndex`/`RecipePageRow` (region 3).
  Out of scope per proposal.
- Changing any production component code.

## Decisions

### Decision 1: Scope all TOC assertions to `.cookbook-toc-page`

- Chosen: Use `page.locator(".cookbook-toc-page")` as the base locator for
  every assertion in the rewritten test, rather than bare `page.getByText(...)`.
- Alternatives considered: Use `data-testid` on the TOC container instead
  of the existing `.cookbook-toc-page` class. Rejected — the class already
  exists and uniquely identifies the TOC region; adding a new test id is
  unnecessary churn for this fix.
- Rationale: The page renders `#1`/`#2` text in two other regions
  (recipe-section footers, alpha index). An unscoped `page.getByText("#1")`
  or `.not.toBeVisible()` check would be ambiguous or flaky. Scoping to
  `.cookbook-toc-page` makes the test assert only about the TOC, which is
  what PR #567 actually changed.
- Trade-offs: Slightly more verbose locator chains; acceptable for
  correctness.

### Decision 2: Assert ordering via DOM sequence of recipe name locators, not text content alone

- Chosen: Get the TOC's recipe name elements in DOM order (e.g. via
  `.cookbook-toc-page li` or the recipe name locator list) and assert
  `recipe1Name` appears before `recipe2Name` positionally — for example by
  reading all list-item text via `.allTextContents()` and checking the
  index of `recipe1Name`'s entry is less than `recipe2Name`'s.
- Alternatives considered: Only assert both names are visible (a weaker
  form of the current test, minus the number checks). Rejected — this
  would silently accept a reordering regression, defeating the test's
  original ordering intent named in its title.
- Rationale: Matches the proposal's requirement to keep verifying "correct
  cookbook order" without relying on now-removed index text.
- Trade-offs: Slightly more implementation detail in the test (reading
  list item text) versus a pure semantic locator, but still resilient to
  incidental markup changes as long as list items contain the recipe name.

### Decision 3: Add explicit absence assertions for the old doubled-number text, scoped to the TOC

- Chosen: Within `.cookbook-toc-page`, assert `getByText("1.", { exact: true })`
  and `getByText(/^#\d+$/)` are not present (e.g.
  `await expect(tocPage.getByText("1.", { exact: true })).toHaveCount(0)`
  and similarly for the `#N` pattern).
- Alternatives considered: Skip the absence check and rely solely on the
  unit test in `CookbookStandaloneLayout.test.tsx` for regression
  protection. Rejected per proposal's resolved open question — E2E-level
  regression coverage for a user-reported bug (#565) is valuable because
  it exercises the real rendered print page, not just the component in
  isolation.
- Rationale: Directly encodes the bug being fixed (#565) as a permanent
  regression guard at the E2E layer, matching what a user would see.
- Trade-offs: None significant; low-cost assertions.

### Decision 4: Rename the test

- Chosen: Rename from "TOC section lists all recipes in cookbook order
  with correct 1-based position numbers" to "TOC section lists all
  recipes in cookbook order without duplicate position numbers".
- Alternatives considered: Keep the old name to minimize diff noise.
  Rejected — the old name actively describes behavior that no longer
  exists (a passing test titled "...with correct 1-based position
  numbers" that asserts numbers are absent would be confusing/misleading).
- Rationale: Test names should describe current, not historical, behavior.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: Update stale assertions in `cookbooks-print.spec.ts`
  to match number-free TOC.
  - Design decision: Decision 1 (scoping) + Decision 2 (ordering)
  - Validation approach: Run the rewritten test locally against the
    current branch; it must pass. Run the full `npx playwright test`
    suite to confirm no regressions in the neighboring test (lines 84-99).
- Proposal element: Rename the test to reflect new behavior.
  - Design decision: Decision 4
  - Validation approach: Test title in Playwright output/report matches
    new name; CI "Build and test workflow" run shows the renamed test.
- Proposal element: Add absence check as regression guard for #565.
  - Design decision: Decision 3
  - Validation approach: Temporarily reintroducing the old
    `RecipeIndexNumber`/`#{pageNumber}` markup in `TocRecipeItem` locally
    and confirming the rewritten test fails, then reverting — done as a
    manual sanity check during implementation, not committed.

## Functional Requirements Mapping

- Requirement: TOC displays each recipe exactly once, in cookbook order,
  with no duplicate numbering.
  - Design element: Decisions 1-3 (scoped ordering + absence assertions)
  - Acceptance criteria reference: `tasks.md` task for rewriting the test
  - Testability notes: Fully testable via Playwright locator ordering and
    count assertions against `.cookbook-toc-page`.

## Non-Functional Requirements Mapping

- Requirement category: reliability (CI stability)
  - Requirement: PR #567's "Build and test workflow" check must pass.
  - Design element: All decisions collectively fix the failing test.
  - Acceptance criteria reference: CI run on the branch after the fix
    commit is pushed.
  - Testability notes: Directly observable via GitHub Actions run status.

## Risks / Trade-offs

- Risk/trade-off: Scoping locators to `.cookbook-toc-page` assumes that
  class name remains stable.
  - Impact: Low — it's an existing, intentional class already used for
    print CSS targeting (see `src/styles/print.css`), unlikely to be
    renamed without a deliberate, reviewed change.
  - Mitigation: None needed beyond normal review if that class is ever
    renamed.

## Rollback / Mitigation

- Rollback trigger: If the rewritten test is flaky or still fails in CI
  after pushing.
- Rollback steps: Revert the test-file commit on
  `copilot/fix-table-of-contents-numbers`; investigate failure via the
  CI run's Playwright HTML report before re-attempting.
- Data migration considerations: None — test-only change, no data/schema
  impact.
- Verification after rollback: Confirm PR #567's CI returns to its
  current (known) failure mode, ruling out unrelated regressions
  introduced by this fix.

## Operational Blocking Policy

- If CI checks fail: Pull the Playwright HTML report / trace from the
  failed run (`playwright-report/`) to diagnose before pushing another
  attempt; do not force-merge past a red "Build and test workflow" check.
- If security checks fail: Not applicable — this change touches only a
  test file with no security surface.
- If required reviews are blocked/stale: Since this lands on an existing
  Copilot-authored PR (#567), request re-review from the same
  reviewers/bots (Codacy, DeepSource) after pushing; do not merge without
  their checks re-running green.
- Escalation path and timeout: If CI remains red after two fix attempts,
  stop and re-open investigation (systematic-debugging) rather than
  continuing to push speculative fixes.

## Open Questions

None remaining — all prior open questions were resolved in `proposal.md`.
