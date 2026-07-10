## Context

- Relevant architecture: `CookbookStandalonePage` (`src/components/cookbooks/CookbookStandaloneLayout.tsx`) is a shared layout wrapper used only by `src/routes/cookbooks.$cookbookId_.toc.tsx` and `src/routes/cookbooks.$cookbookId_.print.tsx`. Both routes render cookbook-print-style content (`CookbookPageHeader`, `CookbookTocList`, `CookbookAlphaIndex`, footers) that intentionally sources color from the `--theme-print-*` token family (defined once, always-light, in `src/styles/base.css` and mirrored in `design-system/tokens/colors-and-type.css`), independent of the active `--theme-*` (dark/dark-greens/light-cool/light-warm) selection.
- Dependencies: No new dependencies. Uses existing CSS custom properties already defined in `src/styles/base.css`/`design-system/tokens/colors-and-type.css`.
- Interfaces/contracts touched: `pageBaseClass` constant inside `CookbookStandaloneLayout.tsx`. No exported component prop/signature changes.

## Goals / Non-Goals

### Goals

- Make the on-screen background of `CookbookStandalonePage` consistently paired with the same always-light token family (`--theme-print-bg`) already used by its descendant foreground/border colors.
- Preserve the existing, already-correct `@media print` output (forced white background via `src/styles/print.css`).
- Keep the fix isolated to the shared layout component so both `/toc` and `/print` (including `?displayonly=1`) benefit without route-specific code.

### Non-Goals

- Redesigning TOC/print typography, spacing, or column layout.
- Changing `--theme-print-*` token values or introducing new tokens.
- Touching `RecipeDetail` or per-recipe body sections rendered below the TOC.
- Adding a print-preview-specific theme toggle.

## Decisions

### Decision 1: Change `pageBaseClass` to use `--theme-print-bg`

- Chosen: In `src/components/cookbooks/CookbookStandaloneLayout.tsx`, change:
  ```ts
  const pageBaseClass = 'min-h-screen bg-[var(--theme-bg)]'
  ```
  to:
  ```ts
  const pageBaseClass = 'min-h-screen bg-[var(--theme-print-bg)]'
  ```
- Alternatives considered:
  1. Add a new prop (e.g. `variant="print"`) to `CookbookStandalonePage` that switches background tokens conditionally. Rejected — `CookbookStandalonePage` has exactly two consumers today, both print-style pages; a variant prop adds an API surface with no current use case for a non-print variant.
  2. Override background only inside a wrapping `<div>` in each route file instead of the shared component. Rejected — duplicates the fix across two files and risks future drift (the same class of bug this change is fixing was already once caused by divergent implementations across `/toc` and `/print`, per the earlier `fix-cookbook-print-toc-layout-2026-03-27` change).
  3. Redefine `--theme-bg` itself to not vary by theme. Rejected — `--theme-bg` is used throughout the rest of the app and must remain theme-driven.
- Rationale: `--theme-print-bg` (`#ffffff`) is already defined as the paired background token for `--theme-print-fg`/`--theme-print-fg-muted`/`--theme-print-fg-subtle`/`--theme-print-border`/`--theme-print-accent`. Using it for the page container closes the pairing gap with a single-line change, no new tokens, no new component API.
- Trade-offs: The TOC/print pages will now always render with a white background on screen, even for users who never intend to print (e.g. just browsing the TOC page). This is considered acceptable and desired — it previews exactly what will be printed, which is the stated purpose of these routes.

## Proposal to Design Mapping

- Proposal element: "The on-screen background of `CookbookStandalonePage` matches the same always-light token family already used by its text/border content" (Problem Space, Desired behavior)
  - Design decision: Decision 1
  - Validation approach: Component test asserting `pageBaseClass`/rendered container includes `bg-[var(--theme-print-bg)]` and not `bg-[var(--theme-bg)]`; manual/E2E visual check across all four themes on both routes.
- Proposal element: "Pairing the on-screen background... Verifying the fix across all four themes on both affected routes" (Scope, In Scope)
  - Design decision: Decision 1
  - Validation approach: E2E test (or manual pass) toggling each theme class on `<html>` and confirming header/TOC/footer text remains visible against the now-fixed white background.
- Proposal element: "No change to `src/styles/print.css` or actual `@media print` rendering" (Scope, Out of Scope)
  - Design decision: N/A — no changes made to `print.css`; existing print media tests remain the regression guard.
  - Validation approach: Existing print-view tests/snapshots continue to pass unmodified.

## Functional Requirements Mapping

- Requirement: TOC/print page background must render as light (`--theme-print-bg`) on screen regardless of active theme.
  - Design element: Decision 1 (`pageBaseClass` change).
  - Acceptance criteria reference: `specs/cookbook-print-view/spec.md` (new scenario to be added).
  - Testability notes: Assert via rendered class name / computed style in a component test; no visual-diffing tooling required since the token is deterministic.
- Requirement: Actual `@media print` output must remain unchanged (white background, as already forced by `print.css`).
  - Design element: No change — `print.css`'s `body { background: #fff !important }` is untouched and takes precedence in print media regardless of container background.
  - Acceptance criteria reference: `specs/cookbook-print-view/spec.md` (existing scenarios, unmodified).
  - Testability notes: Existing print-media tests/snapshots serve as the regression check; no new print-media test strictly required, but one may be added for explicitness.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: The fix must not alter behavior of any other route/component consuming `--theme-bg`.
  - Design element: Change is scoped to a single local constant (`pageBaseClass`) inside `CookbookStandaloneLayout.tsx`, not a shared token definition.
  - Acceptance criteria reference: N/A (no spec change needed elsewhere); verified by full unit/E2E suite passing unchanged for non-cookbook-print areas.
  - Testability notes: Run full `npm run test` and `npm run test:e2e` suites to confirm no unrelated regressions.

## Risks / Trade-offs

- Risk/trade-off: Any future consumer of `CookbookStandalonePage` that wants a theme-driven background will need a new variant/prop.
  - Impact: Low — no such consumer exists today; only `/toc` and `/print` use this component.
  - Mitigation: Document the always-light intent in a short code comment at `pageBaseClass` so future contributors understand why the background is fixed rather than theme-driven.
- Risk/trade-off: Users browsing `/toc` or `/print` outside of an intent to print will always see a white page, even in dark themes.
  - Impact: Low/expected — these routes are explicitly a print preview; showing exactly what will print is the desired behavior per the proposal.
  - Mitigation: None needed; this is the intended fix, not a side effect to mitigate.

## Rollback / Mitigation

- Rollback trigger: If the change is found to break the on-screen appearance of `/toc` or `/print` in any theme, or unexpectedly affects another consumer of `CookbookStandalonePage`.
- Rollback steps: Revert the one-line change to `pageBaseClass` in `src/components/cookbooks/CookbookStandaloneLayout.tsx`. Fully reversible — no data migrations, no API changes, no deployment steps.
- Data migration considerations: None — this is a CSS class-string change only.
- Verification after rollback: Re-run the existing `CookbookStandaloneLayout` and `CookbookPrintPage`/`CookbookTocPage` test suites to confirm reversion restores prior (buggy but known) behavior.

## Operational Blocking Policy

- If CI checks fail: Fix forward — the change is a single line plus test updates; patching is faster and lower-risk than reverting.
- If security checks fail: Not expected to trigger any security-relevant scanners (CSS-only change); if flagged, investigate as a false positive before any other action, per project Codacy conventions.
- If required reviews are blocked/stale: Follow standard project PR review process; no special handling needed given the small, low-risk diff.
- Escalation path and timeout: If review is unresponsive beyond the normal PR SLA, ping the repository owner (`dougis`) directly; no automated timeout logic applies to this manual UI fix.

## Open Questions

None. All decisions were resolved during the exploration phase.
