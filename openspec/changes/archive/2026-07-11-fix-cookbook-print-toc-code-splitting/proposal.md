## GitHub Issues

- #589

## Why

- Problem statement: `src/e2e/cookbooks-print-theme-contrast.spec.ts` intermittently fails in CI. The reported background colors in every failure exactly match each theme's critical-CSS boot color (e.g. `rgb(15, 23, 42)` = `#0f172a`, the `dark` theme's boot background), not the always-light `--theme-print-bg` the test expects. This means the print/TOC page's background utility class is not yet in effect at the moment the test reads it.
- Why now: the flakiness blocked/clouded review of PR #586 (an unrelated change) and will keep intermittently failing CI for any future PR that happens to touch or merely run near this spec.
- Business/user impact: no known user-facing defect — this is CI signal noise, but persistent CI flakiness erodes trust in the test suite and slows down unrelated PRs.

## Problem Space

- Current behavior: `/cookbooks/$cookbookId/toc` and `/cookbooks/$cookbookId/print` are ordinary file-based routes with no `codeSplitGroupings` override, so they pick up TanStack Router's default per-route code splitting. Their component code (and, per Tailwind v4's per-chunk CSS generation, plausibly their route-scoped CSS) ships in a lazy chunk that is *not* covered by the boot-loader's readiness gate in `src/routes/__root.tsx` (`bootLoaderScript` only awaits the single main `<link href="${appCss}">`). The `--theme-print-*` token family and the `bg-[var(--theme-print-bg)]` utility class are used exclusively inside `CookbookStandaloneLayout.tsx`, which only these two routes import — making them the only routes where this specific lazy-chunk race is observable via a background-color assertion.
- Desired behavior: the print/TOC routes' component and styles are available synchronously with the rest of the app shell, so there is no window where the print-page markup can render before its "always light" background/foreground styling is in effect.
- Constraints: must not change the print/TOC pages' visual output, DOM structure, or route paths — this is a build/bundling fix, not a UI change. Should not weaken or remove the boot-loader/FOUC-prevention mechanism documented in `src/routes/__root.tsx` and covered by `src/e2e/fouc-prevention.spec.ts`.
- Assumptions: TanStack Router's `codeSplitGroupings` route option (confirmed present in `@tanstack/router-core`'s type definitions) is respected by the currently pinned `@tanstack/react-router` / `@tanstack/react-start` versions (1.16x line) used in this repo.
- Edge cases considered:
  - The bare `/print` route (without `displayonly=1`) triggers `window.print()` on load — removing code splitting must not change this behavior or its timing.
  - The `/toc` and `/print` routes both use `CookbookStandaloneLayout.tsx`; un-splitting only these two routes must not pull unrelated route chunks (e.g. recipe detail pages reached via TOC links) into the main bundle.
  - `PrintLayout.tsx` already applies an inline-style override of `--theme-bg` (a different, unrelated token family) that has no loading dependency — this proposal does not touch that mechanism, only the `--theme-print-*` / `CookbookStandaloneLayout` path that the failing test actually exercises.

## Scope

### In Scope

- Disabling route-level code splitting for `src/routes/cookbooks.$cookbookId_.toc.tsx` and `src/routes/cookbooks.$cookbookId_.print.tsx` via `codeSplitGroupings`.
- Verifying (via build output inspection) that these two routes no longer emit separate lazy chunks.
- Updating `cookbooks-print-theme-contrast.spec.ts` (and any other affected print/toc specs) if their current timing assumptions or comments become inaccurate as a result of this change.
- Re-running the previously flaky spec repeatedly (or otherwise gaining confidence) to confirm the race is resolved.

### Out of Scope

- Rewriting `waitForHydration` / `gotoAndWaitForHydration` in `src/e2e/helpers/app.ts` (tracked separately in issue #590).
- Fixing the same-page theme-toggle `waitForTimeout(100)` in `src/e2e/theme.spec.ts` (also tracked in #590).
- Any redesign of the dual print-background mechanism (`--theme-print-*` tokens vs. `PrintLayout`'s inline `--theme-bg` override) — noted as a design curiosity during investigation but not a defect this change needs to fix.
- Changing TanStack Router's global auto-code-splitting default for the rest of the app.

## What Changes

- Add `codeSplitGroupings: []` to the route options in `cookbooks.$cookbookId_.toc.tsx` and `cookbooks.$cookbookId_.print.tsx`, so their component (and associated CSS) is bundled into the main chunk instead of split into a lazily-loaded one. (Corrected during implementation from an initial `[[...all keys]]` draft — see `design.md` Decision 1 for why only an empty groupings array actually suppresses the split.)
- No application logic, markup, or styling changes.

## Risks

- Risk: un-splitting these routes slightly increases the main bundle size.
  - Impact: marginal — `CookbookStandaloneLayout.tsx` and its two route files are small, print-only-styling components with no heavy dependencies.
  - Mitigation: none needed given the small size; can be revisited if bundle-size CI budgets flag it.
- Risk: the hypothesis (lazy CSS chunk racing the boot-loader gate) is directionally correct but not the complete picture, and the flake persists after this change.
  - Impact: issue #589 stays open; wasted implementation effort.
  - Mitigation: verify via build-output chunk inspection before/after, and via repeated CI/local runs of the target spec, per `tasks.md`/`tests.md`.
- Risk: `codeSplitGroupings` behaves differently than expected on the pinned router version (e.g. partial effect, or requires an additional Vite/router-plugin config flag).
  - Impact: fix doesn't fully eliminate the lazy chunk.
  - Mitigation: build-output verification step catches this before relying on CI re-runs alone.

## Open Questions

- Question: should `codeSplitGroupings` be applied identically to both routes, or does `print.tsx`'s additional `RecipeDetail` import (larger dependency surface than `toc.tsx`) warrant a different grouping?
  - Needed from: no external input needed — default to identical treatment (full un-split) for both, since both exhibit the same failure mode in the test and both wrap content in `CookbookStandalonePage`.
  - Blocker for apply: no.
- Question: is there a lightweight way to assert "no separate chunk for these routes" as an ongoing regression check (e.g. a build-output test), or is manual/one-time verification sufficient?
  - Needed from: decide during design/tasks — leaning toward one-time verification only, to keep scope tight.
  - Blocker for apply: no.

## Non-Goals

- Not attempting to fix e2e hydration-wait patterns broadly (that's issue #590).
- Not changing the app's route code-splitting strategy beyond these two specific routes.
- Not altering any visual/print output.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
