## Context

- Relevant architecture: `src/components/recipes/RecipeDetail.tsx` renders
  both the Ingredients `<ul>` and Instructions `<ol>` sections; print-only
  styling is split between inline Tailwind `print:` utility classes in
  that component and hand-written rules in `src/styles/print.css` (which
  already defines print-only classes for the same `<li>` elements —
  `.recipe-ingredient-item` / `.recipe-instruction-step` — for
  `break-inside: avoid`). `RecipeDetail` is shared by the standalone
  recipe route and (indirectly, via cookbook print pages) is not wrapped
  in `PrintLayout` for the standalone case, so `var(--theme-accent)`
  resolves from whichever theme is active, same as today.
- Dependencies: none new. No package/dependency changes.
- Interfaces/contracts touched: `RecipeDetail.tsx` JSX markup for the
  ingredient and instruction `<li>` elements; `src/styles/print.css`
  gains new print-only rules.
- Existing spec constraint: the archived `print-instruction-numbering`
  capability (`openspec/specs/print-instruction-numbering/spec.md`)
  currently requires instruction text to render "flush left... no
  residual indent or gap left by the hidden number badge" and its
  Operability NFAC requires that no *new* print stylesheet or `@media
  print` CSS block be introduced (that change was implemented as inline
  Tailwind `print:` utilities only). This change intentionally
  supersedes the "no gap" wording (MODIFIED requirement in this change's
  `specs/print-instruction-numbering/spec.md` delta) because the
  requester now wants an intentional small delimiter gap. It does *not*
  violate the "no new stylesheet/block" constraint in spirit: `print.css`
  already contains exactly one `@media print { }` block (in place since
  before that capability existed, for `.recipe-ingredient-item` /
  `.recipe-instruction-step` `break-inside` rules); this change adds new
  selectors inside that same pre-existing block rather than introducing
  a second block or a new file.

## Goals / Non-Goals

### Goals

- One shared CSS class drives the print marker + left-alignment behavior
  for both the ingredient `<li>` and instruction `<li>`, so future changes
  to "how list items are delimited in print" happen in one place.
- Ingredient marker footprint shrinks (per prior "shrink it" decision) so
  ingredient text reads as left-aligned with the section heading.
- Instruction steps gain a visible print delimiter (currently none) using
  the same shrunk-dot visual language, closing #595 without introducing a
  second, different marker style.
- Container-level layout (`print:columns-2` on ingredients, single-column
  on instructions) is untouched.

### Non-Goals

- No on-screen visual change to either section.
- No change to `PrintLayout.tsx` or cookbook-specific print routes beyond
  what they inherit automatically through `RecipeDetail`.
- No new design-system component; this is a print.css-scoped fix.

## Decisions

### Decision 1: One shared class, marker generated via `::before` (not a second marker `<span>`)

- Chosen: Add a single new print-only class, `.print-list-item`, in
  `src/styles/print.css`, applied to both the ingredient `<li>` and the
  instruction `<li>` (alongside their existing
  `.recipe-ingredient-item` / `.recipe-instruction-step` classes). In
  print, `.print-list-item` sets `display: flex; align-items: baseline;
  gap: 0.35rem;` and generates the marker itself via
  `.print-list-item::before` — a small `border-radius: 9999px` dot,
  `background: var(--theme-accent)`, sized ~5px — as a flex item. The
  existing literal dot `<span>` in the ingredient markup gets
  `print:hidden` added (it already renders on-screen; print now source
  the dot from the shared class instead, so both markers are generated
  from literally the same CSS rule). The instruction step's numbered
  circle `<span>` keeps its existing `print:hidden` (unchanged) and the
  same `::before` rule supplies its print marker.
- Alternatives considered:
  1. Two classes (`.print-list-item` for the wrapper + `.print-list-marker`
     for an explicit marker `<span>` reused in both sections' JSX).
     Rejected: requires adding a new marker `<span>` to the instruction
     `<li>` and repurposing the ingredient one, more markup churn, and
     splits "how markers look" across two rules instead of one.
  2. Inline Tailwind `print:` utility classes repeated identically in both
     JSX blocks (matching the file's existing predominant style).
     Rejected: the whole point of this change is "one class," not "the
     same string typed twice" — a literal shared class in `print.css`
     guarantees the two sections cannot drift, and pseudo-element
     markers aren't expressible as a single reusable Tailwind utility
     without arbitrary-value CSS that's harder to read than plain CSS
     here.
  3. Literal bullet character (`•`) via `content: '•'`. Rejected per
     proposal assumption: reuses existing accent-dot visual language
     instead of introducing a typographic bullet glyph.
- Rationale: A single class that both supplies layout (flex + gap) and
  generates the marker (`::before`) is the most literal reading of "a
  single CSS class... outlining how the list items iterate" — one rule is
  the complete source of truth for print item appearance in both
  sections, and it requires zero new DOM nodes.
- Trade-offs: Pseudo-element markers are slightly less obvious to future
  readers than an explicit `<span>` in JSX; mitigated with a one-line
  comment in `print.css` (matching the file's existing comment
  convention) explaining the `::before` marker and pointing at both
  consuming sections.

### Decision 2: Marker size and spacing values

- Chosen: dot diameter `5px` (via `width`/`height`), `border-radius:
  9999px`, `background: var(--theme-accent)`, `gap: 0.35rem` between
  marker and text, `align-items: baseline` on the flex container with a
  small `translateY` nudge on the `::before` box (e.g. `transform:
  translateY(-0.1em)`) so the dot visually sits mid-x-height rather than
  glued to the text baseline.
- Alternatives considered: Reusing the ingredient's current `w-2 h-2`
  (8px) size. Rejected: doesn't meaningfully "shrink" the footprint
  relative to today; 5px plus a 0.35rem gap (~5.6px) totals roughly half
  the current 20px offset while staying visually distinct from stray
  punctuation.
- Rationale: Matches the proposal's risk mitigation (stay large enough to
  read as a distinct shape) while materially recovering print width,
  doubly so across ingredients' 2-column layout.
- Trade-offs: Exact pixel values are a judgment call with no hard
  requirement from the reporter; flagged as verifiable/adjustable during
  print-preview QA rather than a hard acceptance gate.

### Decision 3: Scope boundary — container layout stays untouched

- Chosen: `.print-list-item` only ever sets item-level (`<li>`) flex/gap
  and the `::before` marker. It never sets `columns`, `list-style` at the
  `<ul>`/`<ol>` level, or anything container-scoped. `print:columns-2`
  stays as an inline Tailwind utility directly on the ingredients `<ul>`;
  the instructions `<ol>` keeps no column utility.
- Alternatives considered: Folding column behavior into a second shared
  "list container" class for symmetry. Rejected: the proposal explicitly
  scopes this change to per-item marker styling, and the two containers
  are already intentionally different, so forcing symmetry there would
  violate the proposal's stated out-of-scope boundary.
- Rationale: Keeps blast radius minimal and matches the explicit
  ingredients-stay-2-column / instructions-stay-1-column instruction from
  the requester.
- Trade-offs: None significant; this is the conservative, requested
  choice.

## Proposal to Design Mapping

- Proposal element: Shrink oversized ingredient bullet indent (#594)
  - Design decision: Decision 1 (`.print-list-item::before` shared
    marker) + Decision 2 (5px dot, 0.35rem gap)
  - Validation approach: Print-preview / print-specific E2E screenshot
    comparison (`src/e2e/cookbooks-print*.spec.ts` pattern) confirming
    ingredient text starts within the new, smaller offset from the page
    margin.
- Proposal element: Add delimiter to instruction steps without extra
  vertical space (#595)
  - Design decision: Decision 1 (same `::before` rule reused on
    `.recipe-instruction-step`, no change to `print:space-y-1`)
  - Validation approach: Print-preview / E2E confirming a visible dot
    precedes each instruction step in print and vertical spacing between
    steps is unchanged from current `print:space-y-1`.
- Proposal element: Single shared CSS class for both sections
  - Design decision: Decision 1 (`.print-list-item` is the sole class
    driving both sections' marker/alignment behavior)
  - Validation approach: Code review confirming both `<li>` types
    reference `.print-list-item` and no per-section duplicate marker CSS
    exists.
- Proposal element: Ingredients stay 2-column, instructions stay 1-column
  - Design decision: Decision 3 (container-level classes untouched)
  - Validation approach: Existing print E2E specs for column layout
    continue to pass unmodified.
- Proposal element: No on-screen visual change
  - Design decision: Decision 1 (`::before` rule is inside `@media
    print`, `print:hidden` added only to the existing on-screen dot span,
    which itself is unaffected outside print)
  - Validation approach: Component tests / visual check confirming
    non-print rendering of both sections is byte-identical to current
    markup minus the added `print:hidden` class (which has no effect
    outside print).

## Functional Requirements Mapping

- Requirement: Ingredient list items render a smaller print marker than
  today, flush enough to read as left-aligned.
  - Design element: Decision 1 + 2
  - Acceptance criteria reference: `specs/*.md` (to be authored) —
    ingredient print marker size/offset requirement.
  - Testability notes: Assertable via computed style / DOM class
    presence in jsdom-based component tests (checking for
    `.print-list-item` and `print:hidden` on the old span); visual
    confirmation requires print-emulation E2E (Playwright supports
    `page.emulateMedia({ media: 'print' })`).

- Requirement: Instruction steps render a visible print marker; vertical
  spacing between steps is unchanged.
  - Design element: Decision 1
  - Acceptance criteria reference: `specs/*.md` — instruction print
    marker requirement.
  - Testability notes: Same as above; also assert `print:space-y-1` class
    is unchanged on the `<ol>`.

- Requirement: Both sections' print item styling is driven by exactly one
  shared class.
  - Design element: Decision 1
  - Acceptance criteria reference: `specs/*.md` — shared-class
    requirement.
  - Testability notes: Static/code-review check (grep for
    `print-list-item` usage count == 2 call sites) plus a regression test
    asserting both `<li>` types carry the class.

## Non-Functional Requirements Mapping

- Requirement category: operability / maintainability
  - Requirement: Print marker styling for both sections must be
    modifiable in one place.
  - Design element: Decision 1 (single class in `print.css`)
  - Acceptance criteria reference: `specs/*.md` — maintainability note.
  - Testability notes: Code review only; not independently automatable
    beyond the call-site-count check above.

- Requirement category: reliability (print pagination)
  - Requirement: Existing `break-inside: avoid` behavior on
    `.recipe-ingredient-item` / `.recipe-instruction-step` must be
    unaffected by the new marker.
  - Design element: Decision 1 (marker is a `::before` pseudo-element,
    does not alter the `<li>`'s participation in `break-inside`)
  - Acceptance criteria reference: `specs/*.md` — pagination
    non-regression note.
  - Testability notes: Existing E2E print specs
    (`src/e2e/cookbooks-print*.spec.ts`) re-run unmodified as regression
    coverage.

## Risks / Trade-offs

- Risk/trade-off: `::before` marker color depends on `var(--theme-accent)`
  resolving sanely against a white print background outside
  `PrintLayout`-wrapped routes (standalone recipe print).
  - Impact: On themes with a light/low-contrast accent, the marker could
    be faint on paper.
  - Mitigation: This is pre-existing behavior (today's ingredient dot has
    the same dependency) — no regression introduced; out of scope to fix
    theme-accent print contrast generally, but flagged for a follow-up
    issue if QA reveals a problem during this change's verification.
- Risk/trade-off: Baseline alignment (`align-items: baseline` +
  `translateY` nudge) is a visual judgment call that may need tuning per
  font rendering differences across browsers' print engines (Chrome vs.
  Firefox print preview).
  - Impact: Minor marker vertical misalignment in some browsers.
  - Mitigation: Verify in at least Chrome print preview (primary
    supported path per existing E2E print specs, which use Playwright/
    Chromium); document as a known limitation if not tunable further.

## Rollback / Mitigation

- Rollback trigger: Print-preview QA or E2E specs show broken pagination,
  illegible markers, or unwanted on-screen visual change.
- Rollback steps: Revert the `RecipeDetail.tsx` and `print.css` changes in
  this change's commit(s); no data migration or persisted state is
  involved, so a straight `git revert` is sufficient.
- Data migration considerations: None — pure presentational CSS/markup
  change.
- Verification after rollback: Re-run `src/e2e/cookbooks-print*.spec.ts`
  and confirm ingredient/instruction print output matches pre-change
  screenshots.

## Operational Blocking Policy

- If CI checks fail: Fix forward within this change; do not merge with
  failing print E2E specs since they are the primary regression guard for
  this presentational change.
- If security checks fail: Not expected to be triggered by a CSS/markup-
  only change; if triggered, treat as a general CI failure per above.
- If required reviews are blocked/stale: Follow the project's standard PR
  process — see `docs/standards/ci-cd.md`; no special handling needed for
  this change given its small, low-risk surface.
- Escalation path and timeout: Standard project PR review timeout; no
  change-specific escalation defined.

## Open Questions

- None blocking. The proposal's open questions (exact shrunk marker
  values, CSS location) are resolved by Decision 1 and Decision 2 above;
  values remain adjustable during implementation/QA without requiring
  another proposal round, since they don't change scope.
