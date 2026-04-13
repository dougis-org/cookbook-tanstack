## Context

- Relevant architecture: `src/styles/print.css` — single `@page { margin: 1cm }` rule. `src/routes/cookbooks.$cookbookId_.print.tsx` — effect that calls `window.print()`. `src/components/cookbooks/CookbookStandaloneLayout.tsx` — renders TOC wrapper and `.cookbook-recipe-section` sections. `src/components/cookbooks/PrintLayout.tsx` — CSS variable scope wrapper for print.
- Dependencies: CSS `page` property (Chrome 85+, Firefox 110+). No new npm packages required.
- Interfaces/contracts touched: `CookbookPrintPage` component (title swap effect), `print.css` (new named `@page` rule), `CookbookStandaloneLayout` (new CSS class on TOC wrapper).

## Goals / Non-Goals

### Goals

- Cookbook print pages (TOC + recipe sections) render with `0.5cm` top/bottom and `1cm` left/right margins
- Browser header shows cookbook name rather than URL when printing
- Margin values are explicit and easy to change in one place
- Zero impact on straight recipe print (`/recipes/:id`)

### Non-Goals

- Full browser header/footer suppression
- Custom `position: fixed` running header
- Dynamic per-page chapter info in margin box

## Decisions

### Decision 1: Named `@page` rule scoped to cookbook print

- Chosen: Define `@page cookbook-page { margin: 0.5cm 1cm; }` in `print.css`. Apply via `page: cookbook-page` CSS property on `.cookbook-recipe-section` (already exists) and a new `.cookbook-toc-page` class added to the TOC container in `CookbookStandaloneLayout`.
- Alternatives considered: (a) Global margin reduction — rejected, would also shrink single-recipe print. (b) Inline `style` on the wrapper — rejected, `page` named rules require a CSS class or selector, not an inline style.
- Rationale: Named `@page` is the standards-correct mechanism for per-section page formatting. The `page` property cascades to the first element that starts a new page context, so assigning it to `.cookbook-recipe-section` (which already has `break-before: page`) is natural.
- Trade-offs: Safari support for named `@page` is partial; the existing `@page { margin: 1cm }` default remains as fallback so Safari degrades gracefully.

### Decision 2: `document.title` swap in print effect

- Chosen: In `CookbookPrintPage`'s `useEffect`, save `document.title`, set it to the cookbook name, call `window.print()`, then restore in the effect's cleanup function (i.e. the returned teardown function).
- Alternatives considered: (a) Mutate title before effect fires — too early, `printData` may not be available. (b) Use `<title>` tag manipulation via `@tanstack/router`'s `head` API — heavier and asynchronous; effect is simpler for this transient swap.
- Rationale: The effect already gates on `!isLoading && printData`. Wrapping `window.print()` with title save/restore is the minimal change. Restoring in cleanup handles navigation-away-before-print edge case.
- Trade-offs: Title change is momentary and invisible to users unless they inspect during the print dialog. No persistent side effects.

### Decision 3: Margin values as CSS custom properties

- Chosen: Define margin values as literals in the named `@page` rule, with a comment noting the intended values for easy adjustment. Do NOT use CSS variables inside `@page` (not supported in browsers).
- Alternatives considered: CSS variables in `@page` — rejected, `@page` rules do not inherit CSS custom properties from the document.
- Rationale: Explicit values in one `@page` block are the simplest adjustable form.
- Trade-offs: Values not driven by design tokens; must be updated manually.

## Proposal to Design Mapping

- Proposal element: Tighter top/bottom margins for cookbook print
  - Design decision: Decision 1 (named `@page cookbook-page`)
  - Validation approach: E2E test checking `@page` rule presence, visual snapshot of print-emulated layout
- Proposal element: Explicit left/right margin definitions for adjustability
  - Design decision: Decision 1 and Decision 3 (explicit literals in `@page` block)
  - Validation approach: Code review — confirm both axes present in `@page` rule
- Proposal element: `document.title` swap to cookbook name
  - Design decision: Decision 2 (effect cleanup pattern)
  - Validation approach: Unit test — mock `window.print`, assert title set to cookbook name during call, restored after
- Proposal element: Zero impact on recipe print
  - Design decision: Decision 1 (named rule only on cookbook classes)
  - Validation approach: Confirm `.cookbook-recipe-section` and `.cookbook-toc-page` are only present in cookbook print routes

## Functional Requirements Mapping

- Requirement: Cookbook print pages use `0.5cm` top/bottom, `1cm` left/right margins
  - Design element: `@page cookbook-page` rule; `page: cookbook-page` on target elements
  - Acceptance criteria reference: specs/print-margin-optimization.md — margin rule scenario
  - Testability notes: Playwright emulated print media; verify `@page` rule in CSS

- Requirement: Browser header shows cookbook name when printing
  - Design element: `document.title` swap in `CookbookPrintPage` effect
  - Acceptance criteria reference: specs/print-margin-optimization.md — title swap scenario
  - Testability notes: Unit test with mocked `window.print`, assert `document.title` at call time

- Requirement: No change to single-recipe print margins
  - Design element: Named `@page` only used in cookbook-specific CSS classes
  - Acceptance criteria reference: specs/print-margin-optimization.md — recipe isolation scenario
  - Testability notes: Confirm no `page: cookbook-page` in recipe route or components

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Title restored if navigation occurs before or during print
  - Design element: Effect cleanup function restores `document.title`
  - Acceptance criteria reference: specs/print-margin-optimization.md — title restore scenario
  - Testability notes: Unit test — unmount component during effect, assert title restored

- Requirement category: operability
  - Requirement: Margin values are easy to adjust in one location
  - Design element: Decision 3 — explicit literals with adjustment comment in `@page` block
  - Acceptance criteria reference: Code review checklist
  - Testability notes: N/A — structural; verified by inspection

## Risks / Trade-offs

- Risk/trade-off: Safari ignores named `@page` rules
  - Impact: Safari users get existing `1cm` margins (no regression, just no improvement)
  - Mitigation: Existing `@page { margin: 1cm }` fallback retained

- Risk/trade-off: `document.title` races with React re-renders if data refetches
  - Impact: Unlikely — effect depends on `!isLoading && printData` and `hasPrinted.current` guard
  - Mitigation: Existing `hasPrinted` ref prevents double-fire; title swap is inside the same guarded block

## Rollback / Mitigation

- Rollback trigger: CSS named `@page` causes layout regression in target browsers, or title swap causes visible tab-title artifact complaints.
- Rollback steps: Revert `print.css` `@page cookbook-page` block and `page:` property assignments. Revert title swap lines in `cookbooks.$cookbookId_.print.tsx`.
- Data migration considerations: None — CSS and JS change only.
- Verification after rollback: Print a cookbook; confirm margins return to `1cm`; confirm browser title shows URL/route name as before.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix failing tests before proceeding.
- If security checks fail: Do not merge. Investigate and resolve before implementation.
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to owner after 48 hours.
- Escalation path and timeout: Repo owner (`dougis`) after 48 hours of stale review.

## Open Questions

No open questions. All decisions resolved during propose phase.
