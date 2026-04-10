## Context

- **Relevant architecture:** Dark mode is class-based via `@custom-variant dark` in `src/styles.css`; the `.dark` class is applied statically to `<html>` in `src/routes/__root.tsx`. Print styles live in `src/styles/print.css` and are minimal (page margins, body reset, `.print:hidden` support). The cookbook print surface is served by two routes: `cookbooks.$cookbookId_.toc.tsx` (screen + print) and `cookbooks.$cookbookId_.print.tsx` (print-optimised view with recipe bodies and alphabetical index).
- **Dependencies:** `CookbookStandaloneLayout.tsx` exports all print-surface components. `RecipeDetail` is imported into the print route and must remain untouched.
- **Interfaces/contracts touched:** `CookbookStandalonePage` (wrapper), `CookbookPageHeader`, `CookbookTocList`, `TocRecipeItem`, `RecipePageRow`, `CookbookAlphaIndex`, `RecipeTimeSpan` — all lose their `print:` color overrides. Two route files gain a `<PrintLayout>` import and wrapper.

## Goals / Non-Goals

### Goals

- Eliminate `print:` color overrides from components in the cookbook print surface
- Introduce `PrintLayout` as a stable, scoped light-context boundary
- Maintain identical print output to current (white background, black text, gray accents)
- Keep `print:hidden` and layout-only `print:` utilities (columns, break, margin) working unchanged
- Leave a clear migration path to CSS variable overrides when #281 (theming) lands

### Non-Goals

- CSS variable / theming integration
- Changing the visual appearance of `RecipeDetail`
- Modifying `src/styles/print.css`

## Decisions

### Decision 1: PrintLayout as a component-level light-context boundary

- **Chosen:** A `PrintLayout` React component (`src/components/cookbooks/PrintLayout.tsx`) that wraps its children in `<div className="bg-white text-gray-900">`. Both print routes wrap their top-level content in `<PrintLayout>`.
- **Alternatives considered:**
  - Separate print stylesheet (Option 1): moves pairing to CSS; fragile selector coupling, no structural improvement.
  - CSS `@layer print` (Option 3): same structural coupling as Option 1.
- **Rationale:** Wrapping in a light-context div shadows the `<html class="dark">` cascade for all descendants that don't have explicit `dark:` overrides. Components inside PrintLayout can use plain light-mode Tailwind without needing `print:` or `dark:` variants.
- **Trade-offs:** Print routes now appear light on screen (print-preview aesthetic). Accepted — these are print-oriented pages.

### Decision 2: Hardcoded light values (no CSS variable scoping yet)

- **Chosen:** `PrintLayout` uses hardcoded Tailwind classes (`bg-white text-gray-900`) rather than inline CSS variable overrides.
- **Alternatives considered:** Scoped CSS variable overrides via `style` prop — correct long-term approach but depends on #281 defining the variable names.
- **Rationale:** Keeps #211 unblocked from #281. The migration to CSS variable scoping is a one-file change in `PrintLayout.tsx` when #281 lands.
- **Trade-offs:** If a child component uses a `dark:` variant explicitly (e.g. `dark:text-white`), the `<html class="dark">` root class still activates it. Such variants must be removed from components within the print surface.

### Decision 3: Remove print: color variants, preserve layout-only print: utilities

- **Chosen:** Strip `print:text-*`, `print:bg-*`, `print:border-*` color classes. Retain `print:hidden`, `print:break-*`, `print:columns-*`, `print:max-w-*`, `print:mt-*`, and similar layout/visibility utilities.
- **Rationale:** Color overrides are no longer needed inside `PrintLayout`. Layout utilities are context-independent and must remain.
- **Trade-offs:** Careful audit required to avoid accidentally removing a layout-only `print:` class. Covered by the test strategy.

### Decision 4: CookbookStandalonePage stays but simplified

- **Chosen:** Keep `CookbookStandalonePage` as the max-width/padding wrapper. Remove its `print:bg-white print:text-black` — those are superseded by `PrintLayout`. It no longer needs to know about print context.
- **Rationale:** Avoids a large structural refactor; the component retains its layout role cleanly.
- **Trade-offs:** None significant.

## Proposal to Design Mapping

- Proposal element: New `PrintLayout` component with `bg-white text-gray-900`
  - Design decision: Decision 1
  - Validation approach: Visual inspection on screen + snapshot tests

- Proposal element: Remove `print:` color overrides from print-surface components
  - Design decision: Decision 3
  - Validation approach: Grep for `print:text-`, `print:bg-`, `print:border-` in affected files post-change; should be zero

- Proposal element: Wrap TOC and print routes in `<PrintLayout>`
  - Design decision: Decision 1
  - Validation approach: Unit tests confirm `PrintLayout` renders; E2E confirms print output unchanged

- Proposal element: Hardcoded values now, CSS variable migration path for #281
  - Design decision: Decision 2
  - Validation approach: Comment in `PrintLayout.tsx` documents the migration path; no test required

- Proposal element: `RecipeDetail` must remain untouched
  - Design decision: Decision 1 (boundary scoping)
  - Validation approach: Confirm `RecipeDetail` tests pass without modification

## Functional Requirements Mapping

- Requirement: Print output renders white background, black text, gray borders
  - Design element: `PrintLayout` light-context boundary + stripped `print:` overrides
  - Acceptance criteria reference: specs/print-layout.md — Print output
  - Testability notes: E2E Playwright test with `print` media emulation; visual snapshot

- Requirement: Screen view of TOC and print routes renders light (print-preview aesthetic)
  - Design element: `PrintLayout` always-light wrapper
  - Acceptance criteria reference: specs/print-layout.md — Screen rendering
  - Testability notes: Unit test asserts `bg-white` class present on wrapper; visual check

- Requirement: `print:hidden` chrome elements remain hidden in print output
  - Design element: Decision 3 (layout utilities preserved)
  - Acceptance criteria reference: specs/print-layout.md — Print output
  - Testability notes: E2E print snapshot confirms absence of breadcrumb/back button

- Requirement: No `dark:` or `print:` color variants on print-surface components
  - Design element: Decisions 2 + 3
  - Acceptance criteria reference: specs/print-layout.md — Code quality
  - Testability notes: Static grep check in CI or post-implementation audit

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No regressions in existing print-surface tests
  - Design element: Scoped change; `RecipeDetail` and `print.css` untouched
  - Acceptance criteria reference: All existing unit and E2E tests must pass
  - Testability notes: `npm run test` + `npm run test:e2e`

- Requirement category: maintainability
  - Requirement: Future theming (#281) requires only one file change (`PrintLayout.tsx`)
  - Design element: Decision 2 migration path
  - Acceptance criteria reference: Comment in `PrintLayout.tsx`
  - Testability notes: Code review check

## Risks / Trade-offs

- Risk/trade-off: A child component (e.g. `RecipeDetail`) carries explicit `dark:text-*` variants that activate from `<html class="dark">` regardless of `PrintLayout`
  - Impact: Dark text/backgrounds inside recipe sections on print
  - Mitigation: Audit `RecipeDetail` classes during implementation. If bleed-through is confirmed, introduce CSS variable scoping in `PrintLayout` before merge (escalate, not defer).

- Risk/trade-off: Accidental removal of a layout-only `print:` utility
  - Impact: Broken column layout or page break behaviour in print output
  - Mitigation: Class-by-class audit documented in tasks; E2E print snapshot catches regressions.

## Rollback / Mitigation

- **Rollback trigger:** Print output regression (dark text, missing columns, broken page breaks) confirmed by E2E tests or visual review.
- **Rollback steps:** Revert the PR. No data migrations involved — this is a pure styling change.
- **Data migration considerations:** None.
- **Verification after rollback:** Re-run `npm run test:e2e`; confirm print snapshot matches baseline.

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Fix the failing check before requesting re-review.
- **If security checks fail:** Do not merge. Investigate — this change touches no auth or data paths; a security failure likely indicates a dependency issue unrelated to this PR.
- **If required reviews are blocked/stale:** Ping reviewer after 48 hours. If blocked for 5+ business days, escalate to project lead.
- **Escalation path and timeout:** If `RecipeDetail` dark-bleed risk (see Risks) is confirmed and cannot be resolved within the PR, create a follow-up issue, document the known limitation, and defer merge until the follow-up is scoped.

## Open Questions

No open questions. All design decisions confirmed during the explore session that preceded this proposal.
