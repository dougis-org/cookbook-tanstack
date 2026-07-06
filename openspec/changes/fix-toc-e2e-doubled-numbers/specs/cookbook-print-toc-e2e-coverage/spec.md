## MODIFIED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: MODIFIED E2E coverage for cookbook print TOC ordering

The `src/e2e/cookbooks-print.spec.ts` test suite SHALL verify, scoped to
the `.cookbook-toc-page` region of `/cookbooks/:id/print?displayonly=1`,
that recipes appear in correct cookbook order and that no duplicate
position/page numbers (`N.` sequence index or `#N` page number) are
rendered in the TOC.

#### Scenario: TOC lists recipes in correct cookbook order

- **Given** a public cookbook with two recipes added in order (recipe1
  then recipe2, no chapters)
- **When** an unauthenticated user loads
  `/cookbooks/:id/print?displayonly=1`
- **Then** within `.cookbook-toc-page`, recipe1's name appears before
  recipe2's name in DOM order

#### Scenario: TOC does not render duplicate position numbers

- **Given** the same public cookbook and print route as above
- **When** the page has loaded
- **Then** within `.cookbook-toc-page`, no `1.`/`2.` sequence-index text
  is present and no `#1`/`#2` page-number text is present

#### Scenario: Unrelated per-section and alpha-index numbering is unaffected

- **Given** the same public cookbook and print route as above
- **When** the page has loaded
- **Then** the pre-existing test covering `.cookbook-recipe-position-label`
  footers (outside `.cookbook-toc-page`) continues to assert `#1`/`#2`
  labels are present, unchanged by this modification

## Traceability

- Proposal element: "Update stale assertions in `cookbooks-print.spec.ts`
  to match number-free TOC" -> Requirement: MODIFIED E2E coverage for
  cookbook print TOC ordering
- Design decision: Decision 1 (scope to `.cookbook-toc-page`), Decision 2
  (DOM-order assertion) -> Requirement: MODIFIED E2E coverage for cookbook
  print TOC ordering, Scenario "TOC lists recipes in correct cookbook order"
- Design decision: Decision 3 (absence assertions) -> Requirement:
  MODIFIED E2E coverage for cookbook print TOC ordering, Scenario "TOC
  does not render duplicate position numbers"
- Design decision: Decision 4 (rename) -> reflected in the scenario titles
  above (no scenario references "1-based position numbers" as a positive
  expectation)
- Requirement -> Task(s): see `tasks.md`, task "Rewrite stale TOC ordering
  E2E test"

## Non-Functional Acceptance Criteria

Not applicable — this change is test-only and does not introduce new
performance, security, or reliability surface. See functional scenarios
above for the full behavior covered.
