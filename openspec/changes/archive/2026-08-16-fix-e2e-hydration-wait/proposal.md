## GitHub Issues

- #590

## Why

- Problem statement: The shared e2e hydration-wait helper (`src/e2e/helpers/app.ts`) does not verify that a page is actually ready before tests interact with it. Its final steps are guesses — a `networkidle` check that silently swallows its own timeout, followed by an unconditional `waitForTimeout(100)` with no relationship to any observable page state. Because 31 files across `src/e2e/` depend on this helper (directly or via composed helpers like `helpers/auth.ts`, `helpers/admin.ts`, `helpers/cookbooks.ts`), every spec that navigates inherits this guess.
- Why now: Investigating the flaky `cookbooks-print-theme-contrast.spec.ts` (#589) traced the root cause to route-level code-splitting racing the boot-loader's stylesheet-readiness gate. That fix is scoped separately, but it surfaced this broader, suite-wide problem, and a parallel instance of the same anti-pattern (`theme.spec.ts:417`) that should be fixed in the same pass.
- Business/user impact: Flaky e2e tests cost engineering time (re-runs, false failures blocking merges) and erode trust in the suite as a regression signal, particularly for visual/theme-contrast assertions that are timing-sensitive by nature.

## Problem Space

- Current behavior: `waitForHydration()` waits for `domcontentloaded`, then `#app-shell` visibility, then attempts `networkidle` (catching and ignoring a timeout), then sleeps a flat 100ms. `#app-shell` visibility is a CSS-readiness signal set by the boot-loader's inline script when the app stylesheet loads — it is not a React-hydration signal and does not indicate event handlers are attached, despite the helper's stated purpose. Separately, `theme.spec.ts:417` uses its own local `waitForTimeout(100)` after a same-page theme-dropdown commit, before reading computed CSS.
- Desired behavior: Two distinct problems get two distinct, deterministic fixes:
  1. Navigation readiness (`gotoAndWaitForHydration` / `waitForHydration`) is driven by a real, observable signal tied to both React commit and TanStack Router's route-transition/lazy-chunk-loading state, replacing the `networkidle` guess and the trailing sleep.
  2. Post-interaction settle waits (same-page state changes after initial hydration, e.g. theme toggles) do not use the hydration helper at all — they use Playwright's native auto-retrying assertions (`toHaveClass`, `toHaveCSS`) against the specific state being changed.
- Constraints:
  - TanStack Start's `tanstackStart()` Vite plugin auto-generates the client entry that calls `hydrateRoot()`; this repo has no `src/client.tsx` to eject/customize, so the readiness signal must be implemented as an in-tree React effect (e.g. in `src/routes/__root.tsx`, where `useRouterState` is already imported), not a hook into the framework's hydrate callback.
  - The signal must work correctly for both the initial page load and subsequent client-side navigations, since the suite (and potentially future call sites) needs a helper that isn't limited to first `goto`.
  - `gotoAndWaitForHydration` and `waitForHydration`'s exported signatures must not change — 31 dependent files should not require edits.
- Assumptions:
  - A boolean marker (rather than a monotonic generation counter) is sufficient for the navigation-readiness signal because `gotoAndWaitForHydration` is only ever called immediately after a fresh navigation (`goto` or a route change the test just triggered) — there is no prior "idle" state for a poll to go stale against in that specific call pattern.
  - No app code currently drives persistent background network activity (polling, websockets, `setInterval`-based refetching) that would legitimately keep `networkidle` from settling; confirmed via repo-wide search. The existing `networkidle` try/catch was a speculative addition made during the #589 investigation to reduce wasted test cycles, not a fix for a specific route's real behavior.
- Edge cases considered:
  - Route-level code-splitting (the #589 root cause): the readiness signal must not settle until the route's lazily-loaded chunk has actually resolved, not just until the root shell has painted. Tying the signal to `useRouterState().status === 'idle'` (which reflects TanStack Router's own pending/loading state, including lazy route module and loader resolution) addresses this.
  - Client-side navigations after first load: the same signal must re-arm and settle again on each transition, not just once at boot.
  - Cached/second-navigation races already handled by the existing boot-loader script (`l.sheet` check for cached stylesheets) are out of scope for this change and unaffected.

## Scope

### In Scope

- Replace the internals of `waitForHydration()` in `src/e2e/helpers/app.ts`: drop the `networkidle` try/catch and the trailing `waitForTimeout(100)`, and wait instead on a new deterministic readiness marker.
- Add a root-level React effect (in `src/routes/__root.tsx`) that sets a boolean DOM marker (e.g. `document.documentElement.dataset.hydrated`) once React has committed and `useRouterState().status === 'idle'`, and clears/re-arms it across client-side route transitions.
- Fix the parallel anti-pattern instance at `src/e2e/theme.spec.ts:417`: replace `await page.waitForTimeout(100)` with `await expect(page.locator('html')).toHaveClass(/light-cool/)` before the subsequent `getComputedStyle` read, matching the pattern already used correctly elsewhere in the same file.
- Confirm (already audited during exploration) that no other call site among the 4 specs named in #590 (`cookbooks-print-theme-contrast.spec.ts`, `theme.spec.ts`, `dark-theme.spec.ts`, `cookbooks-print.spec.ts`) needs a change beyond the shared helper fix, since every other CSS/class read in those files occurs immediately after `gotoAndWaitForHydration` (navigation-readiness category), not after a same-page interaction.

### Out of Scope

- Any change to the boot-loader script's stylesheet-readiness gate or the #589 route-splitting fix itself (tracked separately).
- Introducing a monotonic/generation-counter marker or changing the read-before-act contract of any e2e helper — explicitly ruled out as unnecessary complexity for this issue's actual call patterns.
- Ejecting or customizing the TanStack Start client entry point.
- Editing any of the 31 files that call `gotoAndWaitForHydration`/`waitForHydration` beyond what's needed if the exported function behavior changes in an observable way (expected: none, since signatures and effective behavior — "resolves once the page is truly ready" — stay the same, just implemented correctly).

## What Changes

- `src/routes/__root.tsx`: add a hydration/route-idle marker effect.
- `src/e2e/helpers/app.ts`: rewrite `waitForHydration()` to wait on the new marker instead of `networkidle` + fixed sleep.
- `src/e2e/theme.spec.ts`: replace the line-417 fixed sleep with a `toHaveClass` assertion.

## Risks

- Risk: The new marker could settle before a route's content has actually painted, if `useRouterState().status` reaches `idle` before the DOM reflects the loaded route.
  - Impact: Reintroduces flakiness in exactly the scenarios this change is meant to fix, particularly the CSS-contrast assertions in `cookbooks-print-theme-contrast.spec.ts`.
  - Mitigation: Validate against the actual #589 repro scenario (print/toc route code-splitting) as part of this change's tests, not just against happy-path routes.
- Risk: Dropping `networkidle` entirely could unmask a route that genuinely does need to wait for a pending request before its content is stable (even though none was found in this investigation).
  - Impact: A previously-masked flake could surface as a new, real failure once the guess is removed.
  - Mitigation: Run the full e2e suite (not just the 4 flagged specs) after the change to catch regressions before merge; treat any new failure as a signal to investigate that specific route rather than reintroducing a blanket wait.
- Risk: A DOM-attribute marker on `<html>` could theoretically be cleared/re-set in a way that creates a brief false-negative window during rapid client-side navigations in tests that don't expect it.
  - Impact: Low — no current call site chains a navigation immediately followed by another navigation without an intervening assertion, but this is worth confirming during implementation.
  - Mitigation: Design review in `design.md` should explicitly walk through the re-arm timing.

## Open Questions

- None. All ambiguity raised during the `/opsx:explore` session preceding this proposal (marker design: boolean vs. generation-counter; scope split between navigation-readiness and post-interaction waits; disposition of the `networkidle` swallow; audit of the 4 flagged specs) was resolved with the requester before this proposal was created, and the requester explicitly instructed proceeding straight to proposal generation.

## Non-Goals

- This change does not attempt to eliminate all timing-sensitive e2e assertions suite-wide — only the shared hydration helper and the one confirmed parallel instance of the anti-pattern.
- This change does not change what `gotoAndWaitForHydration`/`waitForHydration` are called for, only how they determine readiness internally.
- This change does not add a general-purpose "wait for network quiescence" utility; per the risk section, if a specific route is found to need one during validation, that is separate follow-up work, not part of this change's initial scope.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
