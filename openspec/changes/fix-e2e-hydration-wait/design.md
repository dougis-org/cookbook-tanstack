## Context

- Relevant architecture: TanStack Start root shell (`src/routes/__root.tsx`, `shellComponent: RootDocument`) renders an inline boot-loader script that gates `#app-shell` visibility on the app stylesheet loading (`l.sheet` / `link[load]`). This is a CSS-readiness gate, not a React-hydration signal. `RootDocument` already imports `useRouterState` from `@tanstack/react-router` (currently unused for this purpose) and wraps the router-rendered route tree.
- Dependencies: `src/e2e/helpers/app.ts` (`waitForHydration`, `gotoAndWaitForHydration`), consumed by ~31 files across `src/e2e/`, including composed helpers `helpers/auth.ts`, `helpers/admin.ts`, `helpers/cookbooks.ts`.
- Interfaces/contracts touched: a new DOM attribute on `<html>` (`data-hydrated`), set/cleared by a React effect in `RootDocument`; the internal implementation of `waitForHydration()`; one call site in `src/e2e/theme.spec.ts`. No exported function signatures change.

## Goals / Non-Goals

### Goals

- Give the e2e suite a real, observable signal for "this navigation's route content has hydrated and is ready to interact with," replacing the `networkidle`-guess-and-sleep chain.
- Make that signal correct across both initial page load and client-side navigations.
- Eliminate the one confirmed local instance of the same anti-pattern (`theme.spec.ts:417`) using Playwright's native retrying assertions instead of a second bespoke signal.

### Non-Goals

- Redesigning the boot-loader's stylesheet-readiness gate.
- Introducing a monotonic/generation-counter marker, a `window.__hydrationGen`-style API, or a read-before-act contract change for any helper.
- Building a general "wait for network quiescence" utility.
- Ejecting/customizing the TanStack Start client entry (`hydrateRoot()` wiring stays framework-owned).

## Decisions

### Decision 1: Hydration marker is a boolean `data-hydrated` attribute on `<html>`, driven by a `RootDocument` effect

- Chosen: In `RootDocument` (`src/routes/__root.tsx`), call `const routerState = useRouterState()` and add:
  ```tsx
  useEffect(() => {
    if (routerState.status === 'idle') {
      document.documentElement.setAttribute('data-hydrated', 'true')
    } else {
      document.documentElement.removeAttribute('data-hydrated')
    }
  }, [routerState.status])
  ```
  The attribute is absent during any `pending` router status (initial load in flight, or a client-side navigation/lazy-chunk-load in progress) and present only once `status === 'idle'`.
- Alternatives considered:
  - A monotonic generation counter (`window.__hydrationGen`, incremented on each idle-settle) — rejected per proposal: `gotoAndWaitForHydration` is only ever called immediately after a fresh navigation the test just triggered, so there is no prior "idle" state a poll could go stale against. A counter would add API surface (read-before-act) with no corresponding correctness gain for this call pattern.
  - Hooking `hydrateRoot()`'s callback directly — rejected: no `src/client.tsx` exists in this repo; the `tanstackStart()` Vite plugin owns that wiring, and ejecting it is out of scope and higher-risk than an in-tree effect.
  - Deriving readiness purely from `#app-shell` visibility (status quo) — rejected: proven insufficient, since it reflects CSS load only, not React commit or route-content readiness (the #589 root cause).
- Rationale: `useRouterState().status` already reflects TanStack Router's own pending/loading state, including lazy route module and loader resolution — exactly the signal needed to close the #589-shaped race (route-level code-splitting outrunning readiness checks). Reusing it means no new dependency and no duplicated pending-state tracking.
- Trade-offs: The marker is coarse — it says "the router is idle," not "every visual paint this specific test cares about has flushed." Tests reading computed CSS immediately after the marker settles are still relying on the browser having painted by the time Playwright's next `evaluate`/`getComputedStyle` call runs, same as any DOM-ready signal. This is judged acceptable because it removes the guess (arbitrary CSS load timing, an ignored network timeout, a flat sleep) and replaces it with a signal tied to actual route-completion state; any remaining last-mile paint timing is exactly what Playwright's own auto-retry (used in Decision 2 and already used correctly elsewhere in the suite) is designed to absorb.

### Decision 2: `waitForHydration()` waits on the marker; `networkidle` and the fixed sleep are removed, not adjusted

- Chosen:
  ```ts
  export async function waitForHydration(page: Page) {
    await page.waitForLoadState("domcontentloaded");
    await page.locator("#app-shell").waitFor({ state: "visible" });
    await page.locator('html[data-hydrated="true"]').waitFor({ state: "attached" });
  }
  ```
  `#app-shell` visibility is retained as a prerequisite (it still correctly gates on the boot-loader releasing the shell — without it, the router could report `idle` while the boot-loader spinner is still covering the screen). The `networkidle` try/catch and `waitForTimeout(100)` are deleted outright.
- Alternatives considered: Keeping `networkidle` as a best-effort extra wait alongside the new marker — rejected per proposal's confirmed finding that no app code drives persistent background network activity; keeping a no-op-in-practice check adds latency and a false sense of coverage without protecting any real route.
- Rationale: `gotoAndWaitForHydration`/`waitForHydration` exported signatures are unchanged, so none of the 31 dependent files need edits — the fix is entirely internal to the helper.
- Trade-offs: If a route is later found that genuinely needs to wait on a specific in-flight request, that will now surface as a visible new flake (good — actionable) rather than being silently (and coincidentally) masked by the old `networkidle` attempt. See Risks / Trade-offs and Rollback below for how to handle that if it occurs during validation.

### Decision 3: `theme.spec.ts:417` is fixed independently, with no shared marker involved

- Chosen: Replace
  ```ts
  await page.waitForTimeout(100)
  ```
  with
  ```ts
  await expect(page.locator('html')).toHaveClass(/light-cool/)
  ```
  placed immediately after `selectThemeViaDropdown(page, 'Light (cool)', { commit: true })` and before the subsequent `getComputedStyle` read, mirroring the pattern already used correctly at lines 170, 194, 219, 255, and 260 of the same file.
- Alternatives considered: Extending the `data-hydrated` marker to also cover post-interaction settle waits — rejected; this is a same-page state change with no router transition involved, so the marker (tied to router status) would never re-arm for it. Using it here would be reaching for the wrong tool.
- Rationale: Playwright's `expect(...).toHaveClass()` already auto-retries against real DOM state, which is a strictly stronger and simpler guarantee than a fixed sleep for a same-page class mutation.
- Trade-offs: None identified — this is a mechanical, low-risk substitution confirmed against an existing in-file precedent.

## Proposal to Design Mapping

- Proposal element: Replace `networkidle`/fixed-sleep guess chain with a real signal (Category 1, navigation readiness)
  - Design decision: Decision 1 (marker) + Decision 2 (`waitForHydration` rewrite)
  - Validation approach: New/updated Playwright test(s) asserting `waitForHydration` resolves only after `data-hydrated="true"` is present, and a regression check against the #589 repro route (`/cookbooks/:id/toc` or `:id/print`) to confirm the marker doesn't settle before lazy-loaded route content is present.
- Proposal element: Marker must work across initial load and subsequent client-side navigations
  - Design decision: Decision 1 (effect keyed on `routerState.status`, clears on `pending`, re-sets on `idle`)
  - Validation approach: e2e test performing two sequential `gotoAndWaitForHydration` calls (or one `goto` + one in-page `Link` click) and asserting the marker correctly re-arms and re-settles for the second transition.
- Proposal element: Fix parallel anti-pattern instance at `theme.spec.ts:417` (Category 2, post-interaction settle)
  - Design decision: Decision 3
  - Validation approach: Existing `theme.spec.ts` test suite run (the modified test itself is the validation; no new test file needed since the assertion being added is the fix).
- Proposal element: No other call site among the 4 flagged specs needs a change
  - Design decision: N/A — audit finding carried over from exploration/proposal, not a design decision. Re-confirmed as part of Validation (full e2e suite run) rather than a new design artifact.
- Proposal element: Drop `networkidle` entirely rather than fix it
  - Design decision: Decision 2
  - Validation approach: Full e2e suite run post-change; any newly-surfaced route-specific flake is triaged per the Operational Blocking Policy below rather than reintroducing a blanket wait.

## Functional Requirements Mapping

- Requirement: `waitForHydration(page)` must not resolve until the current route's React tree has committed and the router has finished any pending transition/lazy-load for that route.
  - Design element: Decision 1 + Decision 2.
  - Acceptance criteria reference: specs — "Navigation readiness marker" capability.
  - Testability notes: Assert via Playwright that interacting with route-specific content (not just `#app-shell`) immediately after `waitForHydration` succeeds without retry, on a route that exercises lazy-loaded code (the #589 repro route).
- Requirement: The marker must re-arm on client-side navigation, not only on first load.
  - Design element: Decision 1 (effect dependency on `routerState.status`).
  - Acceptance criteria reference: specs — "Navigation readiness marker" capability, re-arm scenario.
  - Testability notes: Two-navigation test asserting `data-hydrated` is absent during the second transition's `pending` phase and present again once `idle`.
- Requirement: `theme.spec.ts`'s post-dropdown-commit read must be deterministic without a fixed sleep.
  - Design element: Decision 3.
  - Acceptance criteria reference: specs — "Post-interaction settle assertions" capability.
  - Testability notes: The modified test itself asserts `toHaveClass` before reading computed style; a flaky-prone removal of the old sleep would surface as a failing/flaky CI run, caught by normal suite execution.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Removing `networkidle` must not reduce suite pass-rate stability (no new flakes introduced).
  - Design element: Decision 2.
  - Acceptance criteria reference: specs — "Navigation readiness marker" capability, non-functional scenario.
  - Testability notes: Full `npm run test:e2e` run pre- and post-change compared for new failures; any new failure investigated per Operational Blocking Policy before merge.
- Requirement category: performance
  - Requirement: The new wait path must not be slower in aggregate than the current guess chain (which includes a 5s `networkidle` timeout attempt on routes where it fails, plus a 100ms sleep on every call).
  - Design element: Decision 2 (marker-based wait resolves as soon as the router is actually idle, with no fixed floor and no 5s worst-case stall).
  - Testability notes: Compare e2e suite wall-clock time before/after in CI run output.

## Risks / Trade-offs

- Risk/trade-off: Marker settles (`status === 'idle'`) before the browser has actually painted the route's final visual state, for tests reading computed CSS immediately afterward.
  - Impact: Could reintroduce a subtler version of the #589 flake if unaddressed.
  - Mitigation: Validate specifically against the print/toc contrast-check route as part of this change's test additions (see Rollback section for the fallback if this surfaces).
- Risk/trade-off: Dropping `networkidle` unmasks a route that coincidentally relied on the old wait.
  - Impact: New, previously-hidden flake surfaces post-merge.
  - Mitigation: Full-suite run required before merge (Operational Blocking Policy); any such route gets a targeted, route-specific wait rather than reintroducing the blanket `networkidle` check.
- Risk/trade-off: `RootDocument`'s effect runs on every `routerState.status` change, adding a small amount of work per navigation.
  - Impact: Negligible — a single attribute set/remove per transition.
  - Mitigation: None needed; noted for completeness.

## Rollback / Mitigation

- Rollback trigger: Full e2e suite run post-change shows new, reproducible failures attributable to the marker settling too early (i.e., not explainable as a pre-existing flake).
- Rollback steps: Revert the `src/routes/__root.tsx` effect and `src/e2e/helpers/app.ts` changes via `git revert` on the merge commit; `theme.spec.ts:417`'s fix is independent and does not need to be reverted alongside it.
- Data migration considerations: None — no persisted state involved.
- Verification after rollback: Re-run the full e2e suite to confirm the revert restores prior (known) pass/fail baseline.

## Operational Blocking Policy

- If CI checks fail: Triage whether the failure is a pre-existing flake (compare against `main` baseline) or newly introduced by this change. Newly introduced failures block merge until either fixed with a targeted, route-specific wait or the marker design is revisited.
- If security checks fail: Not expected to be touched by this change (no new dependencies, no auth/data-handling code); if a scanner nonetheless flags something, treat as blocking per repo default policy and resolve before merge.
- If required reviews are blocked/stale: Follow `pr-review-toolkit:review-pr` iteration policy per `tasks.md` — address findings, push, re-request; escalate to the requester if unresolved after 3 iterations.
- Escalation path and timeout: If the full-suite validation run surfaces a genuinely ambiguous flake (can't confirm pre- vs post-change origin within one investigation pass), stop and report to the requester with the specific route/spec rather than guessing further waits into the helper — that would reproduce the exact problem this change exists to fix.

## Open Questions

- None outstanding. All design-level ambiguity (marker shape, placement, re-arm behavior, disposition of `networkidle`) was resolved during the preceding `/opsx:explore` session and carried into the approved proposal.
