## Context

- Relevant architecture: TanStack Start file-based routing (`src/routes/`), with TanStack Router's default auto-code-splitting for route components. Boot sequence is defined in `src/routes/__root.tsx` (`themeInitScript`, `criticalCss`, `bootLoaderScript`), which gates `#app-shell` visibility on exactly one `<link rel="stylesheet" href="${appCss}">` finishing load. `CookbookStandaloneLayout.tsx` defines the print/TOC-only components and is imported exclusively by `cookbooks.$cookbookId_.toc.tsx` and `cookbooks.$cookbookId_.print.tsx`.
- Dependencies: `@tanstack/react-router` / `@tanstack/react-start` (1.16x line, per `package.json`), Vite build (`vite.config.ts`, no explicit router-plugin code-splitting config today), Tailwind v4 (`@tailwindcss/vite`).
- Interfaces/contracts touched: the `Route` object exported from the two route files (adding a route-config option only — no change to loaders, params, or component signatures). No public API, DB, or server contract changes.

## Goals / Non-Goals

### Goals

- Eliminate the lazy-chunk race that causes `cookbooks-print-theme-contrast.spec.ts` to intermittently read the wrong (theme, not print) background color.
- Make the fix verifiable independently of CI flakiness (i.e. via a deterministic build-output check), not just "re-run until green."
- Keep the change minimal: a route-config option, no behavioral/visual change.

### Non-Goals

- Not changing TanStack Router's global code-splitting default for any other route.
- Not touching `src/e2e/helpers/app.ts` or `theme.spec.ts`'s timing patterns (#590).
- Not redesigning the print-background token mechanism.

## Decisions

### Decision 1: Use `codeSplitGroupings` to bundle toc/print routes into the main chunk

- Chosen: add `codeSplitGroupings: []` (an empty array of groups) to the `createFileRoute(...)({ ... })` options in both `cookbooks.$cookbookId_.toc.tsx` and `cookbooks.$cookbookId_.print.tsx`. **Correction from the original proposal/design draft:** the initial hypothesis was that grouping every splittable key (`loader`, `component`, `pendingComponent`, `errorComponent`, `notFoundComponent`) into a single array would prevent splitting. Empirical verification (build-output inspection, per Decision 2) showed this is wrong — the router-plugin's compiler (`@tanstack/router-plugin`'s `compileCodeSplitReferenceRoute`) always replaces any route-option key that appears in *any* group with a `lazyRouteComponent(() => import(...))` dynamic import; grouping keys together only controls whether they land in the *same* split chunk file, not whether a chunk is created at all. A key is only kept inline in the main "reference route" (no split, no dynamic import) when it does **not** appear in any group — i.e. when `codeSplitGroupings` is `[]`. This was confirmed by rebuilding with `codeSplitGroupings: []` and observing no separate JS chunk for `cookbooks.$cookbookId_.toc`/`.print` in `.output/public/assets/` or `.output/server/_ssr/`, versus a chunk still present with the all-keys-grouped form.
- Alternatives considered:
  1. Globally disable auto-code-splitting for the whole app (via router plugin config) — rejected: far larger blast radius (every route's bundle size and load behavior changes), not needed since only these two routes exhibit the failure.
  2. Make `waitForHydration` wait for *all* stylesheet/chunk loads generically, treating this as a test-only problem — rejected as the primary fix: doesn't address the actual defect (a real, if brief, unstyled-content window exists for real users on slow connections, not just in tests), and duplicates scope already tracked in #590 for the test-helper layer specifically.
  3. Move `CookbookStandaloneLayout.tsx`'s styles to inline styles (like `PrintLayout.tsx` already does for `--theme-bg`) instead of Tailwind utility classes reading CSS custom properties — rejected: much larger diff across every exported component in that file, and doesn't fix the underlying code-splitting behavior, just works around one symptom of it.
- Rationale: `codeSplitGroupings` is a first-class, documented TanStack Router route option (confirmed present in `@tanstack/router-core`'s type definitions) purpose-built for exactly this "keep this route ungrouped from lazy loading" case. It's a one-line, declarative, per-route opt-out with no custom build tooling required.
- Trade-offs: main bundle grows slightly (these two routes' component code, previously lazy, now always loads). Acceptable given the components involved are small and print-preview-only.

### Decision 2: Verify via build-output chunk inspection, not just CI re-runs

- Chosen: after the code change, run a production build (`npm run build`) and inspect the emitted chunk manifest/asset list to confirm no separate JS/CSS chunk exists for the toc/print route components. Treat this as the primary verification signal; use repeated local/CI runs of the previously-flaky spec as a secondary confirmation, not the only one.
- Alternatives considered: rely solely on re-running the e2e spec N times and calling it fixed if it stays green — rejected as insufficient on its own, since the whole point of this bug is that the failure is probabilistic; a clean run streak is weak evidence without also confirming the underlying mechanism (the lazy chunk) is actually gone.
- Rationale: a build-output check is deterministic and directly tests the causal mechanism identified in the proposal, rather than indirectly inferring it from flaky-test absence.
- Trade-offs: requires a manual/scripted build inspection step; no new automated regression test is being added for "these routes must not be code-split" (see Open Questions) — accepted as a reasonable scope boundary for a targeted bug fix.

## Proposal to Design Mapping

- Proposal element: disable code splitting on toc/print routes
  - Design decision: Decision 1
  - Validation approach: build-output chunk inspection (Decision 2) + e2e spec re-runs
- Proposal element: verify the hypothesis is correct before/after
  - Design decision: Decision 2
  - Validation approach: manual build inspection comparing chunk list before and after the route-config change
- Proposal element: update `cookbooks-print-theme-contrast.spec.ts` if timing assumptions change
  - Design decision: no code-level design change needed for the spec itself; confirm existing `gotoAndWaitForHydration` call sites in the spec remain valid once the race is removed. If the flake is fully explained by the chunk race, no spec logic changes are anticipated beyond removing any now-stale comments that reference retry-prone timing.

## Functional Requirements Mapping

- Requirement: `/cookbooks/$cookbookId/toc` and `/cookbooks/$cookbookId/print` must render with the print-forced light background/foreground on first paint, across all four themes, with no window where the active site theme's colors are visible instead.
  - Design element: Decision 1 (`codeSplitGroupings`)
  - Acceptance criteria reference: `specs/e2e-testing-reliability/spec.md` (to be created) — "print/TOC routes render print-safe background without a code-split race"
  - Testability notes: existing `cookbooks-print-theme-contrast.spec.ts` already encodes this assertion (background color + WCAG contrast per theme, per route variant); no new test needed, existing test becomes reliably green.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: `cookbooks-print-theme-contrast.spec.ts` must not require retries to pass in CI.
  - Design element: Decision 1 removes the race; Decision 2 gives confidence it's actually removed.
  - Acceptance criteria reference: `specs/e2e-testing-reliability/spec.md`
  - Testability notes: run the full parametrized spec (4 themes × 3 route variants = 12 tests) multiple times locally/CI without relying on Playwright's automatic retry to get a pass.
- Requirement category: performance
  - Requirement: main bundle size increase from un-splitting these two routes must remain small/negligible.
  - Design element: Decision 1 (scoped to two small, dependency-light route files)
  - Acceptance criteria reference: build-output inspection (Decision 2)
  - Testability notes: compare build output bundle sizes before/after; no formal budget exists in this repo today, so this is a sanity check, not a hard gate.

## Risks / Trade-offs

- Risk/trade-off: `codeSplitGroupings` might not fully prevent a separate CSS chunk (it's documented as controlling JS-level route-part grouping; CSS chunk emission is a Vite/Tailwind build concern that may or may not follow the same grouping).
  - Impact: fix could be partial — JS bundled together but CSS still split.
  - Mitigation: Decision 2's build-output inspection checks the actual emitted asset list (JS *and* CSS), not just the router config; if CSS is still split, this will be visible before relying on it, and the design will need a follow-up (e.g. explicit CSS import ordering or moving the print-only Tailwind classes into a non-split shared file) — flagged as an open question below.
- Risk/trade-off: proposal's causal hypothesis (lazy-chunk race) is wrong or incomplete.
  - Impact: spec keeps flaking after this change ships.
  - Mitigation: build-output check catches "did the chunk actually disappear"; if it did and the flake persists, that's strong evidence to reopen investigation rather than re-guessing.

## Rollback / Mitigation

- Rollback trigger: build-output inspection shows the change doesn't remove the separate chunk, or the flaky spec continues failing at the same rate after the change ships and is observed in CI over a reasonable number of runs.
- Rollback steps: revert the `codeSplitGroupings` addition in both route files (single-commit, two-line revert); no data or state migrations involved.
- Data migration considerations: none — this is a build-configuration-only change with no persisted state.
- Verification after rollback: confirm the two route files return to prior behavior (build produces the previously-observed lazy chunk); no other verification needed since no other behavior changes.

## Operational Blocking Policy

- If CI checks fail: investigate whether the failure is the target flaky spec (re-open investigation, do not just add retries) or unrelated; do not merge with the target spec still failing.
- If security checks fail: not expected to be triggered by a route-config-only change; if triggered, treat as unrelated and investigate independently before merging.
- If required reviews are blocked/stale: standard project PR process applies (see `docs/standards/ci-cd.md`); no special handling needed for this change given its small, contained diff.
- Escalation path and timeout: if the build-output inspection shows the CSS chunk is still separate after the JS-level fix (see Risks), escalate back to design (this document) for a follow-up decision rather than proceeding with a partial fix.

## Open Questions

- Does `codeSplitGroupings` affect CSS-chunk emission the same way it affects JS-chunk emission for this Tailwind v4 + Vite setup? To be answered empirically during implementation via the build-output inspection task, before considering this change complete.
