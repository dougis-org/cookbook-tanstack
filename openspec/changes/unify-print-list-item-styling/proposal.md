## GitHub Issues

- #594
- #595

## Why

- Problem statement: Recipe print output wastes horizontal page space on the
  ingredient list (an oversized bullet-dot indent) and lacks any visual
  delimiter between instruction steps (the numbered circle marker is hidden
  in print, `print:hidden`, so consecutive steps run together with only
  vertical spacing to separate them).
- Why now: Both issues were filed together (#594, #595) by the same
  reporter against the same print view and point at the same root design
  gap — the two `<li>` list items (`recipe-ingredient-item`,
  `recipe-instruction-step`) evolved independent, inconsistent print
  treatments. Fixing them together avoids shipping two visually mismatched
  patches to the same printed page.
- Business/user impact: Printed recipes are a core use case (kitchen
  reference, physical recipe binders/cookbooks). Wasted margin and
  hard-to-scan instruction steps directly hurt that experience.

## Problem Space

- Current behavior:
  - Ingredients (`src/components/recipes/RecipeDetail.tsx:308-314`): each
    `<li>` renders a `w-2 h-2 ... mr-3` accent-colored dot before the text,
    a ~20px offset per line. In print this list also runs
    `print:columns-2`, doubling the wasted space (once per column).
  - Instructions (`src/components/recipes/RecipeDetail.tsx:343-351`): each
    `<li>` renders a numbered circle marker on screen, but that marker is
    `print:hidden` — so in print there is no marker at all, and steps are
    delimited only by `print:space-y-1` vertical gaps.
- Desired behavior: Both lists use one shared, print-only visual language
  for their item markers — a small accent-colored dot, flush enough to the
  left margin that it reads as "left-aligned," with a tight, consistent gap
  between marker and text. Ingredients keep their 2-column print layout;
  instructions stay single-column. No section should reserve more vertical
  space per line than it does today (print instruction spacing is already
  tight; the fix must not loosen it).
- Constraints:
  - Print-only change — on-screen (non-print) rendering of both sections
    must be visually unchanged (ingredients keep their current dot+margin
    look; instructions keep their current numbered-circle look).
  - `@media print` styling in `src/styles/print.css` cannot use
    `theme()` (loaded as `?url`, bypasses the Tailwind transform per
    existing comment in that file) — new rules must use CSS custom
    properties or literal values, consistent with existing conventions
    there.
  - Ingredients' `print:columns-2` container behavior and instructions'
    single-column container behavior are out of scope — only the
    per-item marker/indent styling is being unified, not the list
    container layout.
- Assumptions:
  - "Shrink it" (from prior discussion) means reducing the ingredient
    dot's footprint (size and/or margin), not removing the marker
    entirely.
  - The shared marker reuses the existing accent-dot visual language
    already used for ingredients on screen — no literal bullet character
    (`•`) or unicode glyph is introduced, per design-system convention of
    using solid shape markers, not typographic bullets.
  - Instruction steps gain a new print-only dot marker where none exists
    today; this is additive in print and does not affect the on-screen
    numbered-circle marker.
- Edge cases considered:
  - Empty-line spacer items (`recipe-ingredient-spacer`,
    `recipe-instruction-spacer`) must not render a marker — the shared
    classes apply only to real content `<li>` items, not spacers.
  - Ingredient lines that wrap to a second visual line (long ingredient
    text) must keep the marker aligned to the first line only (baseline
    alignment, not stretched/centered across wrapped lines).
  - Multi-page printed recipes: `break-inside: avoid` /
    `page-break-inside: avoid` on `.recipe-ingredient-item` and
    `.recipe-instruction-step` (already in `print.css`) must continue to
    work unchanged with the new marker markup.

## Scope

### In Scope

- Add two shared print-only classes (naming TBD in design.md, e.g.
  `.print-list-item` / `.print-list-marker`) that control per-item marker
  size, spacing, and left-alignment in print, applied to both the
  ingredient `<li>` and instruction `<li>` in `RecipeDetail.tsx`.
- Shrink the ingredient bullet dot's footprint in print (#594).
- Add a matching small dot marker to instruction steps in print, replacing
  reliance on `print:hidden` with no delimiter (#595).
- Update `src/styles/print.css` and/or the relevant Tailwind classes in
  `RecipeDetail.tsx` to implement the shared marker treatment.
- Add/update tests (component and print-specific E2E/visual coverage if
  such coverage exists) confirming print marker size and left-alignment
  for both sections.

### Out of Scope

- Changing ingredients' `print:columns-2` or instructions' single-column
  print layout.
- Changing on-screen (non-print) styling of either section.
- Changing the cookbook print view (`PrintLayout.tsx`,
  `cookbooks.$cookbookId_.print.tsx`) beyond whatever it inherits
  automatically by reusing `RecipeDetail` — no separate cookbook-specific
  marker styling is being introduced.
- Redesigning instruction numbering on screen (the numbered circle stays
  as-is outside of print).

## What Changes

- `src/components/recipes/RecipeDetail.tsx`: ingredient `<li>` and
  instruction `<li>` markup updated to share print marker classes; the
  instruction step's marker span becomes visible in print (small dot)
  instead of `print:hidden`.
- `src/styles/print.css` (and/or Tailwind utility classes inline): new
  shared rules defining the shrunk marker size, tight gap, and left
  alignment for both sections' list items.
- Test coverage updated to assert the new shared print marker behavior on
  both sections.

## Risks

- Risk: Shrinking the ingredient marker too aggressively could make it
  hard to distinguish from the text baseline dot glyphs some fonts render
  (e.g. periods), reducing scannability.
  - Impact: Printed ingredient list becomes harder to scan quickly,
    undermining the original request's intent.
  - Mitigation: Keep the dot large enough to read as a distinct shape
    (e.g. ~1.5px–2px equivalent, accent-colored) and verify visually via
    print-preview/E2E screenshot before merging.
- Risk: Sharing a single CSS class across two structurally different list
  types (`<ul>` 2-column vs `<ol>` 1-column) could cause unintended
  layout coupling if the shared class also touches container-level
  properties.
  - Impact: A future change to one section's container layout could
    silently break the other section.
  - Mitigation: Scope the shared class strictly to per-item marker/gap
    styling, never to container-level (`columns`, list `display`)
    properties, and document that boundary in design.md.
- Risk: `break-inside: avoid` behavior on instruction steps could interact
  unexpectedly with the newly-visible marker span if it changes the
  `<li>`'s box model in print.
  - Impact: Steps could break across pages differently than before.
  - Mitigation: Verify multi-page print output (existing E2E print specs
    in `src/e2e/cookbooks-print*.spec.ts`) after the change.

## Open Questions

- Question: Exact shrunk dot size/margin values for the ingredient marker
  — is there a specific pixel target, or is "smaller than today, still
  visually distinct" sufficient?
  - Needed from: Requester (dougis)
  - Blocker for apply: no — design.md will propose concrete values,
    reviewable before implementation.
- Question: Should the shared print classes live in `print.css` as new
  rules, or as inline Tailwind print-variant utility classes in
  `RecipeDetail.tsx` (matching the file's existing pattern of inline
  `print:` utilities rather than custom CSS classes)?
  - Needed from: Requester (dougis) or default to existing file
    convention (inline Tailwind `print:` utilities) unless told
    otherwise.
  - Blocker for apply: no — design.md will pick one and note the
    rationale.

## Non-Goals

- Introducing a general-purpose "list item" design system component for
  on-screen use.
- Changing instruction step numbering or ingredient bullet styling
  on-screen.
- Addressing print layout/pagination issues unrelated to list item
  markers.

## Change Control

If scope changes after proposal approval, update `proposal.md`,
`design.md`, `specs/**/*.md`, and `tasks.md` before implementation starts.
