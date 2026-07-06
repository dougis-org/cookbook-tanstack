## GitHub Issues

- #565
- #567 (PR implementing the fix; this change addresses its failing CI)

## Why

- Problem statement: PR #567 fixed issue #565 (TOC showed each recipe's
  position twice — a `1.` index on the left and a `#1` page number on the
  right) by removing both numbers from `TocRecipeItem`/`CookbookTocList`.
  However, the pre-existing E2E test
  `src/e2e/cookbooks-print.spec.ts:71-82` ("TOC section lists all recipes
  in cookbook order with correct 1-based position numbers") still asserts
  the old, now-removed `1.`/`2.` index text is visible in the TOC. This
  test was never updated to match the fix, so it fails against the
  corrected behavior.
- Why now: The stale assertion is blocking PR #567's "Build and test
  workflow" CI check (failed on two separate runs), which blocks merging
  the fix for #565.
- Business/user impact: Until this test is fixed, PR #567 cannot merge
  through normal CI gates, leaving the reported doubled-numbers bug
  unresolved in production.

## Problem Space

- Current behavior: `cookbooks-print.spec.ts` test 4.3 navigates to
  `/cookbooks/:id/print?displayonly=1` and asserts `page.getByText("1.")`
  and `page.getByText("2.")` are visible — text that PR #567 intentionally
  removed from the TOC.
- Desired behavior: The test should verify recipes are listed in correct
  cookbook order (by `orderIndex`) without depending on visible sequence-
  index text, since the TOC no longer renders index numbers or page
  numbers per recipe.
- Constraints: Must not touch or weaken the neighboring test at lines
  84-99 ("displayonly mode shows #N labels for recipe sections..."), which
  covers the unrelated `.cookbook-recipe-position-label` footer rendered
  once per recipe section body — that feature is unaffected by #565/#567
  and its `#N` labels are intentional, legitimate page references.
- Assumptions: The unit-level coverage already added in PR #567
  (`CookbookStandaloneLayout.test.tsx`) already verifies `1.`/`#N` text is
  absent from the TOC at the component level; this E2E test only needs to
  verify ordering/rendering end-to-end, not duplicate that unit coverage.
- Edge cases considered: Cookbooks with chapters (grouped TOC) vs. flat
  (no chapters) TOC — PR #567 already fixed flat-list ordering via a
  Codacy review comment (sort by `orderIndex`); this E2E test currently
  only exercises a flat, two-recipe cookbook, so no chapter-specific
  assertion changes are needed here.

## Scope

### In Scope

- Update the assertions in the test currently titled "TOC section lists
  all recipes in cookbook order with correct 1-based position numbers" in
  `src/e2e/cookbooks-print.spec.ts` so it passes against the corrected,
  number-free TOC while still meaningfully verifying recipe ordering.
- Rename the test to reflect what it now verifies (it no longer checks
  "position numbers").

### Out of Scope

- Any change to `TocRecipeItem`, `CookbookTocList`, `RecipePageRow`, or
  `RecipeIndexNumber` component code — PR #567's component-level fix is
  considered correct and is not being revisited.
- The neighboring test (lines 84-99) covering `.cookbook-recipe-position-label`
  footers on recipe sections.
- Any DeepSource JavaScript findings on PR #567 unrelated to this E2E
  failure (not yet triaged; out of scope unless they block CI after this
  fix lands).

## What Changes

- `src/e2e/cookbooks-print.spec.ts`: rewrite the stale test to assert
  recipe names appear in the TOC in correct cookbook order (e.g. via DOM
  order of `.getByText(recipeName)` locators or an ordered list query),
  and optionally assert the old `1.`/`2.` index text is now absent to
  guard against regression of the original bug.

## Risks

- Risk: A loosely-written ordering assertion could pass even if ordering
  regresses (false confidence).
  - Impact: Medium — would undermine the value of this E2E coverage.
  - Mitigation: Assert ordering positionally (e.g. compare bounding box /
    DOM index of recipe name locators), not just presence, so the test
    fails if order is wrong.
- Risk: Renaming the test could look like an unrelated change in the PR
  diff.
  - Impact: Low.
  - Mitigation: Keep the rename in the same commit as the assertion fix
    with a clear commit message referencing #565/#567.

## Open Questions

Resolved by dougis (2026-07-06):

- Land as a new commit on PR #567's existing branch
  (`copilot/fix-table-of-contents-numbers`) — no separate PR.
- The fixed test will assert both correct recipe ordering AND absence of
  the old `1.`/`#N` index text in the TOC, as a regression guard.

No remaining unresolved ambiguity.

## Non-Goals

- Re-litigating whether removing the TOC page numbers was the right fix
  for #565 (already decided and implemented in PR #567; Codacy's
  suggestion to restore page numbers was considered and explicitly not
  applied, since chapter/global TOC numbers were the redundant pair, not
  the alpha-index cross-reference numbers).
- Investigating or fixing the DeepSource JavaScript check failure on PR
  #567 beyond what's needed to unblock CI (tracked as an open question
  above, not committed scope).

## Change Control

If scope changes after proposal approval, update `proposal.md`,
`design.md`, `specs/**/*.md`, and `tasks.md` before implementation starts.
