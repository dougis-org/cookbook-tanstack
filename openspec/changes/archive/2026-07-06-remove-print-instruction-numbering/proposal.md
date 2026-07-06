## GitHub Issues

- dougis-org/cookbook-tanstack#566

## Why

- Problem statement: Recipe instruction steps render with a numbered circle
  badge in both the web view and the print/PDF output. On print, the badge
  wastes horizontal space (pushing instruction text away from the left
  margin) and vertical space (via the `flex gap-4` layout), making printed
  recipes less compact and harder to scan on paper.
- Why now: Filed directly by the product owner as a print-quality
  complaint (issue #566); it's a small, isolated fix with no dependencies
  blocking it.
- Business/user impact: Printed recipes are a core use case for a cooking
  app (users print recipes to use at the stove). Tighter, cleaner print
  layout improves the printed artifact's usability and page count.

## Problem Space

- Current behavior: `RecipeDetail.tsx` renders instructions as an `<ol>` of
  `<li className="flex gap-4">` rows. Each row has a `<span>` numbered
  circle badge (`step.number`) followed by a `<p>` with the step text.
  This same markup renders identically for both screen and print media —
  there is no print-specific handling for the numbering.
- Desired behavior: On print media only, the numbered circle badge is
  hidden and the instruction text sits flush left, with reduced vertical
  spacing between steps. On screen (web), numbering and current spacing
  are unchanged.
- Constraints:
  - Must not change the web/screen rendering of instructions at all.
  - Must reuse the existing Tailwind `print:` variant convention already
    used elsewhere in `RecipeDetail.tsx` (e.g. `print:mb-4`,
    `print:columns-2 print:gap-x-8 print:space-y-1` on the ingredients
    list, `PRINT_HEADING_DENSITY_SECTION` for headings) rather than
    introducing a new print-styling mechanism (no `@media print` CSS
    files, no separate print-only component).
  - Spacer `<li>` elements (`recipe-instruction-spacer`, used for blank
    lines within instructions) must continue to render correctly in both
    media.
- Assumptions:
  - The `<ol>` ordered-list semantics can remain in the DOM for print
    (screen readers / copy-paste still get implicit ordering); we are only
    hiding the visual badge, not switching to a `<ul>`.
  - "Numbering" in the issue refers specifically to the visual circle
    badge, not to relying on native `<ol>`/counter numbering — today the
    app already draws its own badge rather than using `list-style`, so
    there is no native counter to suppress separately.
- Edge cases considered:
  - Recipes with only one instruction step: hiding the badge still leaves
    a normal, flush-left paragraph.
  - Recipes with spacer rows between steps: spacer `<li>` elements have no
    badge already, so no logic change needed for them.
  - Print preview across the four themes (`dark`, `dark-greens`,
    `light-cool`, `light-warm`): print output is intended to be
    theme-agnostic/monochrome-friendly already (see existing
    `print:` classes elsewhere in the file), so no per-theme regression is
    expected, but should be spot-checked.

## Scope

### In Scope

- `src/components/recipes/RecipeDetail.tsx`: instruction step markup
  (the `<ol>`, `<li>` rows, number badge `<span>`, and step `<p>`) gets
  print-specific Tailwind classes to hide the badge and tighten spacing.
- Verifying print preview (browser print dialog / `window.print()`) shows
  the desired flush-left, compact layout.
- Any existing tests (unit/E2E) that assert on instruction step markup
  structure, updated if they now need to account for new print-only
  classes.

### Out of Scope

- Any change to the web/screen instruction rendering, spacing, or the
  numbered badge as seen on screen.
- Ingredients list, notes, or other recipe-detail sections.
- Any change to how recipe instructions are stored, parsed, or split into
  steps (`splitLines`, `instructionSteps` derivation logic).
- Cookbook/print-TOC pagination logic (unrelated print feature).
- Introducing a global print stylesheet or print-specific component
  architecture.

## What Changes

- Add `print:hidden` (or equivalent) to the numbered circle badge `<span>`
  in the instructions list so it does not render when printing.
- Adjust the `<li>` row's flex layout for print (e.g. `print:gap-0` /
  `print:block`) so the step paragraph sits flush left once the badge is
  hidden, instead of leaving a phantom gap.
- Reduce vertical spacing between instruction steps for print (e.g.
  `print:space-y-1` on the `<ol>`, analogous to the ingredients list
  pattern already in the file), so print uses less vertical space per the
  issue.
- No changes to component props, data model, or any non-print-facing
  behavior.

## Risks

- Risk: Hiding the badge via `print:hidden` while keeping the `<li>` as a
  flex container could leave residual gap/whitespace where the badge used
  to be.
  - Impact: Print output looks correct on first glance but has awkward
    left-indentation, missing the "sit fully to the left" requirement
    from the issue.
  - Mitigation: Also override the row's flex gap/layout for print (not
    just hide the badge), and visually verify via browser print preview
    before considering the change done.
- Risk: Print CSS changes could unintentionally affect the ingredients
  section or other sections sharing similar class patterns if edits are
  made to a shared class/constant instead of the instruction-specific
  markup.
  - Impact: Regression in ingredients print layout.
  - Mitigation: Scope all new classes strictly to the instruction `<li>`/
    `<span>`/`<p>` elements; do not touch shared constants like
    `PRINT_HEADING_DENSITY_SECTION` unless intentionally reused.

## Open Questions

- Question: Should the printed instruction text use a leading marker at
  all (e.g. native `list-style: decimal` via a print-only class), or
  should it be a plain, unmarked paragraph per step as read literally from
  the issue ("remove the numbering... allow text to sit fully to the
  left")?
  - Needed from: dougis (issue reporter / product owner)
  - Blocker for apply: no — default assumption is a fully unmarked
    paragraph per step (no native counters, no badge), matching the
    literal issue wording. Will implement this by default unless
    corrected.

## Non-Goals

- Redesigning the recipe print layout beyond the instructions section.
- Changing print behavior for any page other than the recipe detail page.
- Adding user-facing print settings/preferences (e.g. a toggle to show
  numbers on print).

## Change Control

If scope changes after proposal approval, update `proposal.md`,
`design.md`, `specs/**/*.md`, and `tasks.md` before implementation starts.
