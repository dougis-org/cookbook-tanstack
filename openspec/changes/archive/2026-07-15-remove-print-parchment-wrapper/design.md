## Context

- Relevant architecture: `RecipeDetail.tsx` is a single shared presentational
  component consumed by two print surfaces —
  `src/routes/recipes/$recipeId.tsx` (standalone print via
  `window.print()`) and `src/routes/cookbooks.$cookbookId_.print.tsx`
  (embedded per-recipe inside `.cookbook-recipe-section`, one section per
  printed page). Print-only styling in this codebase is expressed two ways:
  Tailwind `print:` variants inline on JSX (the dominant pattern throughout
  `RecipeDetail.tsx` already — `print:hidden`, `print:mb-0`,
  `print:columns-2`, etc.) and targeted rules in `src/styles/print.css` for
  things Tailwind variants can't express (custom properties, `@page`,
  pseudo-elements). This change follows the existing inline-variant pattern
  since the fix is expressible entirely with Tailwind `print:` utilities.
- Dependencies: none new. No package/library changes.
- Interfaces/contracts touched: `RecipeDetailProps` (adds one new optional
  prop); the DOM structure of `cookbooks.$cookbookId_.print.tsx`'s
  per-recipe render changes (page number moves from a sibling element to a
  prop passed into `RecipeDetail`). `data-testid="cookbook-recipe-position-label"`
  is preserved so existing test selectors keep working.

## Goals / Non-Goals

### Goals

- Eliminate the visible card chrome (background fill, rounded corners,
  drop shadow) around printed recipe content in both print surfaces.
- Give `RecipeDetail` a way to render trailing print-only content (the page
  number) inside its own content flow, removing the extra bordered/padded
  footer block that today sits outside the card.
- Preserve all on-screen (non-print) styling and behavior exactly as-is.

### Non-Goals

- Redesigning cookbook pagination, TOC, or alpha index.
- Touching `CookbookStandaloneLayout.tsx` / `RecipePageRow`'s page number
  (different component, different rendering path — see proposal Open
  Questions; not addressed here).
- Introducing a new print-specific component or stylesheet architecture.

## Decisions

### Decision 1: Suppress card chrome with print: Tailwind variants, not print.css

- Chosen: Add `print:bg-transparent print:rounded-none print:shadow-none`
  to the outer card `<div>` in `RecipeDetail.tsx`
  (currently `bg-[var(--theme-surface)] rounded-lg shadow-lg overflow-hidden`
  at `src/components/recipes/RecipeDetail.tsx:139`). `overflow-hidden` is
  left as-is (see Decision 3).
- Alternatives considered:
  1. Add a `.recipe-card` class hook and suppress it via a new rule block
     in `print.css` (`.recipe-card { background: none !important; ... }`).
  2. Conditionally omit the wrapper classes via a `isPrintContext` prop
     passed down from each route.
- Rationale: Every other print-only override in this exact file already
  uses inline `print:` variants (11+ existing instances). Matching that
  keeps the diff small, colocated, and consistent with established
  convention — no new CSS file surface area, no new prop plumbing for
  something Tailwind already expresses natively.
- Trade-offs: Slightly longer className string on one element; acceptable
  given the existing file's established style.

### Decision 2: Move the page number in via a new `printFooter` prop on RecipeDetail

- Chosen: Add an optional `printFooter?: ReactNode` prop to `RecipeDetailProps`.
  Render `{printFooter}` as the last child inside the existing `p-8` content
  div (immediately after the Nutrition section, before its two closing
  `</div>` tags — `src/components/recipes/RecipeDetail.tsx:414-417`).
  `cookbooks.$cookbookId_.print.tsx` passes the existing
  `cookbook-recipe-position-label` markup (same `data-testid`, same
  border-top/text styling) as this prop instead of rendering it as a
  sibling of `<RecipeDetail />` after the component returns.
- Alternatives considered:
  1. Leave the page number where it is (sibling, own border/padding block)
     and only fix the card chrome. Rejected — proposal explicitly calls out
     the footer's own border-top/padding as part of the wasted vertical
     space, and the user confirmed "inside" during exploration.
  2. Thread the page number as a plain value (`pageNumber?: number`) and
     let `RecipeDetail` own the label markup/styling itself. Rejected —
     `RecipeDetail` is also used outside print contexts (recipe detail
     page) where a page number never applies; keeping the label's
     markup/styling decision in the print route (which already owns
     `--theme-print-*` tokens and cookbook-specific print classes) avoids
     leaking a cookbook-print-only concept into the shared component's
     internals. A slot (`ReactNode`) is the narrower interface.
- Rationale: This keeps `RecipeDetail`'s card-close/footer-slot fully
  print-context-agnostic (any print consumer can pass trailing content)
  while still landing the number inside the same print flow / page as the
  rest of the recipe, so the border-top above it directly abuts the
  recipe's actual content instead of a card's outer shadow gap.
- Trade-offs: Adds one new prop to a shared component purely for a
  cookbook-print concern. Mitigated by making it optional and unused by
  every other consumer (standalone recipe page, recipe print) — no
  behavior change for them.

### Decision 3: Leave `overflow-hidden` on the card wrapper

- Chosen: Do not remove or print-override `overflow-hidden`.
- Alternatives considered: Strip it entirely since `rounded-lg` (the thing
  it visually clips against) is being neutralized for print.
- Rationale: `overflow-hidden` also constrains the header `CardImage`
  during on-screen rendering and has no negative effect on print layout
  when rounding is removed — an unrounded container with `overflow-hidden`
  still clips correctly, it just clips to square corners instead of round
  ones (which is exactly what "chrome-less" print output should look
  like). Removing it is unnecessary churn and reintroduces the spillover
  risk called out in the proposal for no benefit.
- Trade-offs: None identified.

## Proposal to Design Mapping

- Proposal element: Print-only suppression of `RecipeDetail`'s card
  background/rounding/shadow.
  - Design decision: Decision 1.
  - Validation approach: Print-emulation snapshot (Playwright
    `page.emulateMedia({ media: 'print' })`) of both
    `/recipes/$recipeId` and `cookbooks.$cookbookId_.print` showing no
    visible card background/border/shadow; existing
    `recipe-print-list-item-marker.spec.ts` pattern as a model for a new
    or extended e2e assertion.
- Proposal element: Reposition per-recipe page number inside the recipe's
  print flow, removing the standalone bordered footer block.
  - Design decision: Decision 2.
  - Validation approach: Unit/component test asserting `RecipeDetail`
    renders a passed `printFooter` node inside its content container; update
    `cookbooks.$cookbookId_.print.test.tsx` to assert
    `cookbook-recipe-position-label` is now a descendant of the recipe
    content rather than a sibling after it, and still renders once per
    recipe with the correct number.
- Proposal element: No effect on on-screen rendering.
  - Design decision: Decisions 1 & 2 (both purely additive/print-scoped).
  - Validation approach: Existing recipe detail page tests/e2e continue to
    pass unmodified; visual check of `/recipes/$recipeId` in a normal
    browser tab (no print emulation) shows unchanged card styling.

## Functional Requirements Mapping

- Requirement: Printed recipe content shows no card background, rounded
  corners, or drop shadow.
  - Design element: Decision 1 (`print:bg-transparent print:rounded-none
    print:shadow-none`).
  - Acceptance criteria reference: specs — print-suppression capability,
    new scenario for card chrome.
  - Testability notes: Assertable via computed style in print-emulated
    Playwright test, or via snapshot of rendered class list.
- Requirement: The per-recipe page number in cookbook print renders inside
  the recipe's own print flow, not as a separately chrome'd block below it.
  - Design element: Decision 2 (`printFooter` prop).
  - Acceptance criteria reference: specs — cookbook-print-view capability,
    updated/new scenario for recipe page number placement.
  - Testability notes: DOM structure assertion (parent/child relationship)
    in `cookbooks.$cookbookId_.print.test.tsx`.
- Requirement: On-screen recipe detail rendering is unchanged.
  - Design element: All changes are `print:`-scoped or purely additive
    (`printFooter` defaults to nothing when omitted).
  - Acceptance criteria reference: specs — no new requirement; existing
    recipe-detail-page specs must continue to pass unmodified.
  - Testability notes: No new screen-mode assertions needed; regression
    coverage is the existing test suite for `/recipes/$recipeId`.

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: Change must not require new dependencies, build config,
    or print stylesheet architecture.
  - Design element: Decision 1 (inline Tailwind variants only).
  - Acceptance criteria reference: N/A — verified by diff review (no new
    files besides test updates, no `package.json` changes).
  - Testability notes: Reviewable directly from the diff.

## Risks / Trade-offs

- Risk/trade-off: `printFooter` prop widens `RecipeDetail`'s public interface
  for a single, cookbook-print-specific caller.
  - Impact: Minor API surface growth on a shared component.
  - Mitigation: Prop is optional, undocumented-as-generic (JSDoc will note
    it's intended for print-only trailing content), and unused by every
    other current consumer — zero behavior change elsewhere.
- Risk/trade-off: Existing `cookbooks.$cookbookId_.print.test.tsx`
  assertions that check the sibling DOM position of
  `cookbook-recipe-position-label` will break by design.
  - Impact: Test changes required alongside the implementation change
    (expected, tracked in tasks.md/tests.md, not a surprise regression).
  - Mitigation: Update the test in the same change; keep the `data-testid`
    stable so the update is a small, obviously-correct diff.

## Rollback / Mitigation

- Rollback trigger: Visual regression found in print output (e.g. header
  image spillover, missing page number, broken cookbook pagination) after
  merge, or a test suite failure that can't be resolved before release.
- Rollback steps: Revert the single commit/PR for this change — all edits
  are confined to `RecipeDetail.tsx`, `cookbooks.$cookbookId_.print.tsx`,
  and their tests; no data migrations or schema changes are involved, so a
  plain `git revert` fully restores prior behavior.
- Data migration considerations: None — this is a pure UI/print-styling
  change with no persisted data involved.
- Verification after rollback: Re-run the print-emulation tests and
  confirm the pre-change card/footer layout is restored; manually print
  preview `/recipes/$recipeId` and a cookbook to confirm.

## Operational Blocking Policy

- If CI checks fail: Fix forward within this change (this is a small,
  self-contained UI change) rather than merging with failing checks; do
  not disable or skip the failing test.
- If security checks fail: Not expected to trigger any (no new
  dependencies, no data/auth paths touched); if a scanner flags something
  unrelated pre-existing in a touched file, do not silence it — file
  separately and proceed only if it's confirmed unrelated to this change.
- If required reviews are blocked/stale: Follow standard project PR
  process (`docs/standards/ci-cd.md`); ping reviewer directly given the
  small, low-risk diff.
- Escalation path and timeout: If blocked more than one business day with
  no reviewer response, escalate directly to dougis (issue reporter and
  repo owner) given the small scope of this change.

## Open Questions

- None beyond those already logged in `proposal.md` (TOC page number scope,
  exact placement default) — both have stated defaults that this design
  proceeds with unless redirected before implementation.
