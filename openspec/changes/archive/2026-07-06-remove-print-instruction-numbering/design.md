## Context

- Relevant architecture: `src/components/recipes/RecipeDetail.tsx` renders
  the recipe detail page, including the Instructions section
  (~lines 321-356). Instruction text is split into `instructionSteps` (via
  `splitLines`/step derivation, `useMemo`'d from `recipe.instructions`);
  each non-spacer step renders as an `<li>` containing a numbered circle
  `<span>` badge and a `<p>` with step text. Print styling in this file
  already uses Tailwind's `print:` variant directly on JSX elements (e.g.
  ingredients list: `print:columns-2 print:gap-x-8 print:space-y-1`;
  sections: `print:mb-4`; headings: shared `PRINT_HEADING_DENSITY_SECTION`
  constant). There is no separate print stylesheet or print-only
  component split in this codebase for recipe detail — print handling is
  done inline via Tailwind's `print:` media-query variant.
- Dependencies: Tailwind CSS 4 `print:` variant (already relied upon
  elsewhere in this file, no new dependency). No changes to
  `RecipeForm.tsx`, data model, or the `splitLines`/`instructionSteps`
  derivation.
- Interfaces/contracts touched: none — this is presentation-only markup
  and className changes inside a single component. No prop, hook, route,
  or API contract changes.

## Goals / Non-Goals

### Goals

- On print media, instruction steps render without the numbered circle
  badge, with the step text flush to the left edge of the instructions
  block.
- On print media, vertical spacing between instruction steps is reduced
  relative to the current screen spacing.
- Screen/web rendering of instructions (badge, spacing, layout) is
  pixel-identical to current behavior — zero visual change on screen.
- Spacer rows between instruction steps continue to render correctly (as
  blank vertical space) in both screen and print.

### Non-Goals

- Changing how instruction text is parsed, stored, or split into steps.
- Changing print behavior for ingredients, notes, or any other
  recipe-detail section.
- Introducing a print-only stylesheet, print-only component, or
  JS-based print-mode detection — stay within the existing inline
  `print:` Tailwind variant convention.
- Adding a user-facing toggle for print numbering.

## Decisions

### Decision 1: Hide the number badge with `print:hidden` rather than restructuring markup

- Chosen: Add the Tailwind `print:hidden` utility class to the existing
  number badge `<span>` (RecipeDetail.tsx:343) so it is removed from the
  print rendering via CSS only, leaving the DOM/JSX structure and screen
  behavior untouched.
- Alternatives considered:
  - Conditionally render the badge in JS based on a "is printing" state
    (e.g. `window.matchMedia('print')` listener). Rejected: adds
    stateful complexity, re-render churn, and a JS dependency for what
    CSS already solves declaratively; also mismatches the existing
    convention in this file (all other print differences are pure
    Tailwind `print:` classes).
  - Render two separate lists (one for screen, one for print) with
    `hidden print:block` / `block print:hidden` toggling between them.
    Rejected: doubles the markup and step-mapping logic for a single
    badge element; unnecessary duplication for what a single utility
    class solves.
- Rationale: Matches the existing pattern in the same file
  (`print:columns-2`, `print:mb-4`, etc.), is a one-line change, has no
  runtime cost, and cannot desync between screen/print since it's the
  same DOM node with a CSS-only visibility toggle.
- Trade-offs: The badge's `<span>` and its `step.number` content remain in
  the DOM at print time (just not rendered visually) — negligible since
  it was already there for screen and carries no interactive behavior.

### Decision 2: Convert the `<li>` row from `flex` to plain block layout for print, instead of just zeroing the gap

- Chosen: Add `print:block` (overriding `flex`) to the instruction row
  `<li>` (RecipeDetail.tsx:339-342), and drop the paragraph's dependency
  on flex sizing for print (the `<p className="flex-1 pt-1">` need not
  change `flex-1` since it's harmless when the parent isn't `flex` for
  print, but add `print:pt-0` to remove the top padding that exists to
  vertically center the paragraph against the badge — no longer needed
  once the badge is hidden).
- Alternatives considered:
  - Keep `flex` and only set `print:gap-0`. Rejected: while this removes
    the empty gap left by the hidden badge, the `<li>` remains a flex
    container with a zero-width badge `<span>` as a flex item, which
    still consumes layout computation and can leave a hairline
    difference in text start position depending on the badge's
    (invisible but still flex-participating... no, `hidden` removes it
    from flex layout entirely). This alternative is actually equivalent
    in practice once `print:hidden` is used (an element with `display:
    none` is removed from flex flow), so `print:gap-0` alone would be
    sufficient for horizontal flushness. `print:block` is chosen anyway
    for simplicity/clarity of intent (no flex, no gap math) and to
    directly express "plain flush paragraph" per the issue wording,
    but `print:gap-0` is an acceptable equivalent fallback if `block`
    introduces any unexpected reflow.
  - Rationale: Once the badge has `print:hidden` (`display: none`), it is
    removed from the flex layout entirely, so `gap-4` no longer produces
    a visible gap regardless. Using `print:block` is a defensive,
    explicit choice that keeps the print DOM simple (no flex context at
    all) and removes any need to reason about flex-item sizing
    (`flex-1`) at print time.
- Trade-offs: None material — this only affects the print media query;
  screen layout is untouched since these are `print:`-prefixed classes.

### Decision 3: Reduce inter-step vertical spacing for print via `print:space-y-1` on the `<ol>`

- Chosen: Add `print:space-y-1` to the instructions `<ol>`
  (RecipeDetail.tsx:329), analogous to the ingredients list's existing
  `print:space-y-1` (RecipeDetail.tsx:294), replacing the effective
  spacing contribution of the screen-only `space-y-4`.
- Alternatives considered:
  - Leave `space-y-4` as-is for print. Rejected: does not satisfy the
    issue's explicit ask to "use less vertical space" on print.
  - Use a smaller custom value (e.g. `print:space-y-0.5`). Considered but
    not chosen initially — `print:space-y-1` mirrors the exact value
    already used for ingredients in the same file, keeping print spacing
    visually consistent between the two sections. Can be tuned later if
    visual QA shows it's still too loose/tight.
- Rationale: Reuses an established, already-validated value from the same
  page rather than inventing a new spacing constant.
- Trade-offs: None; print-only, additive utility class.

## Proposal to Design Mapping

- Proposal element: "Add `print:hidden` ... to the numbered circle badge"
  - Design decision: Decision 1
  - Validation approach: Visual print-preview check (browser print
    dialog) confirms no badge renders; screen view unchanged (manual
    check + no new/changed screen classes).
- Proposal element: "Adjust the `<li>` row's flex layout for print ...
  print:gap-0 / print:block"
  - Design decision: Decision 2
  - Validation approach: Visual print-preview check confirms step text
    starts flush at the instructions block's left edge with no residual
    indent/gap.
- Proposal element: "Reduce vertical spacing between instruction steps
  for print"
  - Design decision: Decision 3
  - Validation approach: Visual print-preview check comparing step-to-step
    vertical gap before/after; confirm it visually matches the
    ingredients section's print density.
- Proposal element: "Must not change the web/screen rendering of
  instructions at all"
  - Design decision: Decisions 1-3 (all changes are `print:`-scoped
    Tailwind classes, additive only, no changes to existing non-`print:`
    classes)
  - Validation approach: Screen-mode visual check (no print media
    active) shows identical badge, spacing, and layout to current
    behavior; existing unit/E2E tests covering instruction rendering
    continue to pass unmodified where they assert on screen DOM/classes.

## Functional Requirements Mapping

- Requirement: Print output must not show the instruction number badge.
  - Design element: Decision 1 (`print:hidden` on badge `<span>`)
  - Acceptance criteria reference: specs — "instructions render without
    numbered badge in print media"
  - Testability notes: Verifiable via a component/DOM test asserting the
    badge element carries the `print:hidden` class (jsdom does not
    evaluate media queries, so assert on class presence rather than
    computed visibility), plus manual/E2E print-preview visual check.

- Requirement: Print output must show instruction text flush to the left.
  - Design element: Decision 2 (`print:block` on `<li>`, remove
    print-time top padding)
  - Acceptance criteria reference: specs — "instruction step text is
    flush-left in print media once badge is hidden"
  - Testability notes: Class-presence assertion in unit test
    (`print:block`, `print:pt-0`); visual confirmation via print preview
    since actual flush-left rendering is a layout/CSS outcome not
    fully verifiable in jsdom.

- Requirement: Print output must use less vertical space between steps
  than current screen spacing.
  - Design element: Decision 3 (`print:space-y-1` on `<ol>`)
  - Acceptance criteria reference: specs — "instruction list spacing is
    reduced in print media"
  - Testability notes: Class-presence assertion in unit test
    (`print:space-y-1` alongside existing `space-y-4`); visual
    confirmation via print preview.

- Requirement: Web/screen rendering of instructions must be unchanged.
  - Design element: All decisions are additive `print:`-prefixed classes;
    no existing non-prefixed class is removed or altered.
  - Acceptance criteria reference: specs — "screen rendering of
    instructions is unchanged"
  - Testability notes: Existing tests covering instruction step
    rendering (badge text/number, screen classes) must continue to pass
    without modification; a diff review of the component shows only
    added `print:*` classes, no removed/changed non-print classes.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Spacer rows between instruction steps must not be
    affected by this change.
  - Design element: None of the three decisions touch the
    `recipe-instruction-spacer` `<li>` branch (RecipeDetail.tsx:331-337);
    changes are scoped to the non-spacer branch only.
  - Acceptance criteria reference: specs — "spacer rows unaffected"
  - Testability notes: Existing tests/behavior for spacer rendering
    continue to pass unmodified; no new spacer-specific test needed
    since no spacer code path changes.

- Requirement category: operability (maintainability)
  - Requirement: Print styling changes must follow the existing inline
    `print:` Tailwind convention already used in this file, not introduce
    a new mechanism.
  - Design element: All three decisions use plain Tailwind `print:`
    utility classes applied directly in JSX, consistent with
    `PRINT_HEADING_DENSITY_SECTION`/`print:mb-4`/`print:columns-2` usage
    elsewhere in `RecipeDetail.tsx`.
  - Acceptance criteria reference: specs — "implementation uses existing
    print: Tailwind convention"
  - Testability notes: Code review / diff inspection confirms no new
    stylesheet, media-query CSS, or JS print-detection logic was added.

## Risks / Trade-offs

- Risk/trade-off: Relying on `print:hidden` + flex-to-block conversion
  could interact unexpectedly with browser-specific print rendering
  (e.g. some browsers historically had quirks with `display: none` inside
  print media combined with flex).
  - Impact: Low — modern evergreen browsers (Chrome, Firefox, Safari)
    handle `@media print { display: none }` reliably; this is a
    well-trodden pattern already used elsewhere on this same page
    (`print:hidden` is not yet used in this file, but `print:` utilities
    broadly are).
  - Mitigation: Manual print-preview check (Ctrl+P / Cmd+P) in at least
    one browser before considering the change complete, per the
    project's UI verification norms.

- Risk/trade-off: Tuning `print:space-y-1` may turn out too tight or too
  loose once visually inspected against real recipe content (long vs.
  short instruction steps).
  - Impact: Cosmetic only; no functional breakage.
  - Mitigation: Value mirrors the already-shipped ingredients section
    spacing exactly, so it is a known-acceptable density; can be
    adjusted in a fast follow-up if visual QA disagrees.

## Rollback / Mitigation

- Rollback trigger: Print preview shows broken/garbled layout, or
  screen rendering regresses (any visual difference from current
  behavior) after the change.
- Rollback steps: Revert the added `print:*` className changes in
  `src/components/recipes/RecipeDetail.tsx` (single-file, className-only
  diff — trivial `git revert` of the associated commit/PR).
- Data migration considerations: None — no data model, schema, or
  persisted-content changes are involved.
- Verification after rollback: Confirm print preview and screen view of
  a recipe detail page both match pre-change behavior (screen was never
  supposed to change, so this also validates no regression was left
  behind).

## Operational Blocking Policy

- If CI checks fail: Treat as a normal PR — fix the failing check (lint,
  type-check, unit tests) before merge; this change has no infra/deploy
  surface so CI failures are expected to be code-level only (e.g. a
  broken test assertion on the new classes).
- If security checks fail: Not expected — change touches only
  presentational className strings in one React component with no new
  dependencies, inputs, or data flows. If a scanner nonetheless flags
  something, treat it as a false positive to be triaged, not blocking
  by default, but do not suppress without review.
- If required reviews are blocked/stale: Follow the repo's standard PR
  process (see project `docs/standards/ci-cd.md`); ping reviewer/resolve
  AI-reviewer threads per repo convention before relying on auto-merge.
- Escalation path and timeout: Given the small, low-risk, single-file
  scope, no special escalation path is needed beyond normal PR review;
  if blocked more than a few days, ping the issue reporter (dougis) for
  re-review priority.

## Open Questions

- Same open question as `proposal.md`: whether the printed step should
  remain fully unmarked (no counter at all) versus using a native
  `list-style: decimal` counter instead of a custom badge. Default:
  fully unmarked paragraph per step, per literal issue wording. Not a
  blocker for design/specs/tasks — implementation will proceed on this
  default and can be adjusted trivially (single class change) if
  corrected.
