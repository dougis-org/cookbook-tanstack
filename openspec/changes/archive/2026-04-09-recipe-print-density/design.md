## Context

- Relevant architecture: `RecipeDetail` is the single component used for both individual recipe pages and cookbook print view. Print styles are split between `src/styles/print.css` (CSS media query rules) and Tailwind `print:` utilities applied directly in component JSX. Heading size constants are centralized in `src/components/printHeadingDensity.ts`.
- Dependencies: No external dependencies. All changes are CSS/Tailwind and component class strings.
- Interfaces/contracts touched:
  - `src/styles/print.css` — `@page` margin rule
  - `src/components/printHeadingDensity.ts` — `PRINT_HEADING_DENSITY_PAGE`, `PRINT_HEADING_DENSITY_SECTION` exports
  - `src/components/recipes/RecipeDetail.tsx` — ingredient `<ul>` className, section `<section>` className

## Goals / Non-Goals

### Goals

- Halve approximate ingredient list vertical height in print via 2-column layout
- Reduce heading visual weight in print by one Tailwind size step
- Tighten section bottom margins in print
- Gain ~1cm usable page height via narrower `@page` margins
- Keep all changes isolated to `@media print` — zero screen impact

### Non-Goals

- Semantic ingredient group parsing
- 2-column instructions
- Any change to screen layout or dark-mode styling

## Decisions

### Decision 1: CSS columns for ingredient 2-column layout

- Chosen: Tailwind `print:columns-2 print:gap-x-8` on the ingredient `<ul>`, with `print:space-y-1` to tighten per-item spacing
- Alternatives considered:
  - CSS Grid (`grid-template-columns: 1fr 1fr`) — predictable ordering (first half left, second half right) but ignores semantic grouping
  - Manual split into two `<ul>` elements — requires JS logic to split lines; interacts badly with spacer items
- Rationale: CSS columns is the simplest approach; the browser auto-balances column height, existing `break-inside: avoid` in `print.css` already prevents single items from splitting across column lines
- Trade-offs: Column break may land between a group label and its items; accepted given no semantic markup exists

### Decision 2: Heading size reduction via printHeadingDensity.ts constants

- Chosen: Decrement both constants one Tailwind size step
  - `PRINT_HEADING_DENSITY_PAGE`: `print:text-2xl` → `print:text-xl`
  - `PRINT_HEADING_DENSITY_SECTION`: `print:text-xl` → `print:text-lg`
- Alternatives considered: Inline override per heading — would scatter the change across 5+ locations and break the centralized constant pattern
- Rationale: The constants exist precisely for this purpose; one-file change covers recipe title and all section headings atomically
- Trade-offs: Visual hierarchy is slightly compressed; font-weight remains bold so sections remain clearly delimited

### Decision 3: Section margin reduction via Tailwind print utilities

- Chosen: Add `print:mb-4` to all `<section>` elements currently using `mb-8` (Ingredients, Instructions, Notes, Nutrition)
- Alternatives considered: CSS class in `print.css` targeting a shared class — would require adding a new class name to all sections
- Rationale: Tailwind print utilities are already the established pattern in this component; adding `print:mb-4` is co-located with the element
- Trade-offs: Slightly less breathing room between sections; bold headings still provide clear visual breaks

### Decision 4: Narrow @page margin

- Chosen: `@page { margin: 1cm }` (down from `1.5cm`)
- Alternatives considered: `margin: 1.5cm 1cm` (keep top/bottom, narrow sides only) — more surgical but unnecessary complexity
- Rationale: Symmetric `1cm` is within standard printer safe zones and gains ~1cm of usable page height
- Trade-offs: May clip content on printers with non-standard minimum margins; `1cm` is a common and safe floor

## Proposal to Design Mapping

- Proposal element: 2-column ingredient list
  - Design decision: Decision 1 — CSS columns via Tailwind print utilities on `<ul>`
  - Validation approach: Visual review via cookbook print `?displayonly=1`; E2E test verifying `columns-2` class presence on ingredient list in print route

- Proposal element: Heading size one level smaller in print
  - Design decision: Decision 2 — `printHeadingDensity.ts` constant update
  - Validation approach: Unit test asserting updated class strings on `h1` and `h2` elements

- Proposal element: Tighter section margins in print
  - Design decision: Decision 3 — `print:mb-4` on section elements
  - Validation approach: Unit test asserting `print:mb-4` present on section elements

- Proposal element: Narrower `@page` margin
  - Design decision: Decision 4 — `print.css` `@page` margin update
  - Validation approach: Code review; manual print preview

## Functional Requirements Mapping

- Requirement: Ingredient list renders as 2 columns in print
  - Design element: `print:columns-2 print:gap-x-8` on ingredient `<ul>`
  - Acceptance criteria reference: specs/print-density/spec.md — ingredient 2-column
  - Testability notes: Check rendered `<ul>` has these classes; CSS columns behavior is visual, verified via print preview

- Requirement: Ingredient item spacing tighter in print
  - Design element: `print:space-y-1` on ingredient `<ul>`
  - Acceptance criteria reference: specs/print-density/spec.md — ingredient spacing
  - Testability notes: Assert class string includes `print:space-y-1`

- Requirement: Recipe title prints at `text-xl`
  - Design element: `PRINT_HEADING_DENSITY_PAGE` updated constant
  - Acceptance criteria reference: specs/print-density/spec.md — heading sizes
  - Testability notes: Unit test on `printHeadingDensity.ts` exports; `RecipeDetail` test asserting `h1` includes `print:text-xl`

- Requirement: Section headings print at `text-lg`
  - Design element: `PRINT_HEADING_DENSITY_SECTION` updated constant
  - Acceptance criteria reference: specs/print-density/spec.md — heading sizes
  - Testability notes: `RecipeDetail` test asserting section `h2` elements include `print:text-lg`

- Requirement: All recipe sections have `print:mb-4` in print
  - Design element: Decision 3
  - Acceptance criteria reference: specs/print-density/spec.md — section spacing
  - Testability notes: Assert each section element className includes `print:mb-4`

- Requirement: `@page` margin is `1cm`
  - Design element: Decision 4
  - Acceptance criteria reference: specs/print-density/spec.md — page margins
  - Testability notes: Code review of `print.css`; not directly unit-testable

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: No impact on screen rendering
  - Design element: All changes scoped to `@media print` via Tailwind `print:` utilities or `print.css`
  - Acceptance criteria reference: specs/print-density/spec.md — screen isolation
  - Testability notes: Existing screen-mode unit tests must continue to pass without modification

- Requirement category: reliability
  - Requirement: Empty ingredient lists degrade gracefully in print
  - Design element: 2-column classes on `<ul>` are harmless when list is empty (fallback `<p>` renders instead)
  - Acceptance criteria reference: specs/print-density/spec.md — empty state
  - Testability notes: Existing empty-ingredient unit test must pass

## Risks / Trade-offs

- Risk/trade-off: Group label orphaned from items at column break
  - Impact: Low — cosmetic, content still correct
  - Mitigation: Accepted; addressable in a future change if ingredient data model gains group structure

- Risk/trade-off: `text-lg` section headings may feel too small on some paper sizes or printer DPI settings
  - Impact: Medium — readability
  - Mitigation: Visual review via `?displayonly=1` before merge; bold weight preserves hierarchy

- Risk/trade-off: `1cm` margin may clip on older printers
  - Impact: Low
  - Mitigation: Revert `@page` margin to `1.25cm` if reported

## Rollback / Mitigation

- Rollback trigger: Visual review reveals heading sizes or margins are unacceptable; or printer clipping is reported post-merge
- Rollback steps: Revert the three changed files (`print.css`, `printHeadingDensity.ts`, `RecipeDetail.tsx`) individually or as a group via `git revert`
- Data migration considerations: None — CSS-only change
- Verification after rollback: Confirm cookbook print `?displayonly=1` renders as before

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix failing tests before proceeding.
- If security checks fail: Do not merge. This change is CSS-only and should present no security surface; investigate unexpected failures.
- If required reviews are blocked/stale: Re-request review after 24h; escalate to repo owner if still blocked after 48h.
- Escalation path and timeout: Tag repo owner in PR after 48h of no review activity.

## Open Questions

No open questions. All design decisions were confirmed during the explore session.
