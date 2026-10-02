## GitHub Issues

- #689

## Why

- Problem statement: Several E2E spec files, plus two shared Playwright
  helpers, still wait on `page.waitForLoadState("networkidle")` or fixed
  `page.waitForTimeout(...)` sleeps instead of the project's hydration-marker
  wait helpers (`waitForHydration` / `gotoAndWaitForHydration` /
  `waitForRouterIdle` in `src/e2e/helpers/app.ts`). `networkidle` is brittle
  under client-side routing and background polling/refetch (TanStack Query),
  and fixed sleeps are nondeterministic padding that either flakes under load
  or wastes wall-clock time in CI.
- Why now: #675 (Share My Library 5/5) already fixed the two `networkidle`
  calls that its own new two-browser-context spec would otherwise have
  propagated, and during that work's `/opsx:explore` pass the broader
  pattern was found scattered across the rest of `src/e2e/`. This issue
  tracks the deliberate, non-reactive sweep instead of fixing files one at a
  time as they happen to be touched.
- Business/user impact: No user-facing impact. This is CI/test-platform
  hygiene — reduces E2E flake rate and shortens suite wall-clock time (the
  fixed sleeps in `recipe-persistence.spec.ts` alone add ~7s/run that a
  state-based wait would collapse to only what's actually needed).

## Problem Space

- Current behavior: 16 call sites across 9 files use
  `page.waitForLoadState("networkidle")` (2 are already fixed by #675 per
  the issue text, but a live grep on `main` at exploration time still shows
  them at `cookbooks-collaboration.spec.ts:91,132` — their status must be
  re-verified against `main` before this change's tasks are finalized, see
  Open Questions). 6 more call sites in `recipe-persistence.spec.ts` use
  `page.waitForTimeout(...)`.
- Desired behavior: Every wait in `src/e2e/**` that is standing in for "the
  app has finished loading/hydrating/reacting to this action" uses an
  explicit, state-based Playwright wait — either an existing helper from
  `src/e2e/helpers/app.ts`, a new helper added there if a genuinely new wait
  condition is needed, or (where a helper already exists for the underlying
  signal, as with autosave) a direct `expect(locator).toBeVisible(...)`
  assertion on that signal.
- Constraints:
  - No behavior change to the application under test — this only changes
    how tests wait, not what they assert.
  - Must not reduce coverage: each replaced wait must still guarantee the
    same precondition (e.g. "navigation settled", "autosave completed") held
    at the point the original wait occurred.
  - Changes to the two shared helpers (`src/e2e/helpers/recipes.ts:48`,
    `src/e2e/helpers/cookbooks.ts:25,95`) ripple to every spec that calls
    them; those specs are not separately listed as call sites but are
    affected and must be covered by the full suite run.
- Assumptions:
  - `waitForHydration` / `gotoAndWaitForHydration` are safe drop-in
    replacements for `networkidle` waits that occur after a `goto` or a
    client-side navigation.
  - Not every `networkidle` call site is post-navigation; some may be
    waiting on an in-place data refresh after a mutation (e.g. a list
    re-rendering after a delete/favorite toggle) where a router-idle wait is
    the wrong fix and a targeted `expect(locator)...` assertion is correct
    instead. This proposal assumes this split is possible to determine file
    by file.
- Edge cases considered:
  - `recipe-persistence.spec.ts`'s `waitForTimeout` calls were investigated
    in detail during exploration: `useAutoSave` (`src/hooks/useAutoSave.ts`)
    already flips visible status text to "Saved" after its debounced write
    completes, for both the local-only (new recipe) and server (edit) paths.
    5 of the 6 sleeps are redundant with an assertion already present a few
    lines later in the same test, or gate nothing observable at all; only 1
    needs to become a new assertion. No new helper is required for this
    file.
  - Two-browser-context specs (where one user's action must be reflected in
    another user's already-open page) have a purpose-built helper,
    `waitForContextToReflect`, added by #675 — any remaining
    `networkidle`/sleep call site that turns out to be this pattern should
    reuse that helper rather than inventing another one.

## Scope

### In Scope

- Every `page.waitForLoadState("networkidle")` call under `src/e2e/**`
  except the two already resolved by #675 (to be reconfirmed, not
  re-fixed, unless re-confirmation shows they were not actually resolved).
- Every `page.waitForTimeout(...)` call under `src/e2e/**`.
- Adding new helper(s) to `src/e2e/helpers/app.ts` only if a call site's
  wait condition has no existing helper or assertable UI signal.
- Re-running the full Playwright suite to confirm no coverage or flake
  regression from the swap.

### Out of Scope

- Anything in #675 (`cookbooks-collaboration.spec.ts`'s sharing flow and its
  new spec), per the issue.
- Any application code change. If investigation finds a case where no
  observable signal exists for a wait condition (the app genuinely has no
  UI/DOM indication that an async operation completed), that is a product
  gap to raise as a separate, new issue — not something this change fixes
  by adding an app-side signal.
- Non-E2E test suites (Vitest unit/integration tests are unaffected).

## What Changes

- `src/e2e/helpers/recipes.ts:48` — replace `networkidle` wait.
- `src/e2e/helpers/cookbooks.ts:25,95` — replace `networkidle` waits.
- `src/e2e/recipe-share.spec.ts:20` — replace `networkidle` wait.
- `src/e2e/recipes-favorites.spec.ts:19` — replace `networkidle` wait.
- `src/e2e/cookbooks-auth.spec.ts:60,105` — replace `networkidle` waits.
- `src/e2e/auth-session.spec.ts:28` — replace `networkidle` wait.
- `src/e2e/owner-icon.spec.ts:22,37,58` — replace `networkidle` waits.
- `src/e2e/recipes-auth.spec.ts:127` — replace `networkidle` wait.
- `src/e2e/recipes-crud.spec.ts:204` — replace `networkidle` wait.
- `src/e2e/cookbooks-collaboration.spec.ts:91,132` — reconfirm against #675;
  fix only if still present.
- `src/e2e/recipe-persistence.spec.ts:25,28,51,61,83,93` — delete 5 redundant
  sleeps, convert 1 into an `expect(page.getByText("Saved")).toBeVisible()`
  assertion.
- `src/e2e/helpers/app.ts` — add a new helper only if investigation of the
  above turns up a wait condition with no existing helper or assertable
  signal; expected to be zero or very few additions given the patterns
  found so far.

## Risks

- Risk: A `networkidle` call site is masking a genuine race in the app
  (e.g. a mutation that resolves slightly before its UI effect is visible)
  that a tighter, state-based wait would expose as a new flake.
  - Impact: New, previously-hidden E2E flakiness surfaces in CI.
  - Mitigation: Run the full affected spec file (not just the changed test)
    multiple times locally/in CI before merge; fix the underlying race if
    found rather than reintroducing a loose wait.
- Risk: A helper change in `helpers/recipes.ts` or `helpers/cookbooks.ts`
  has wider blast radius than the two call sites it's listed under, since
  every spec importing that helper is affected.
  - Impact: A regression here fails many specs at once, not just the ones
    enumerated in "What Changes".
  - Mitigation: Run the full `npm run test:e2e` suite, not a filtered subset,
    before marking tasks complete.
- Risk: Removing a `waitForTimeout` that was inadvertently compensating for
  an unrelated timing issue (not the one documented in its comment) causes
  a different test to flake.
  - Impact: Flaky test reintroduced under a different cause.
  - Mitigation: Each `recipe-persistence.spec.ts` change was already traced
    against `useAutoSave`'s actual state machine during exploration (see
    Edge Cases); re-verify against current `main` state, not just the
    exploration-time snapshot, before applying.

## Open Questions

- Question: Does `#675`'s PR state actually remove the two
  `cookbooks-collaboration.spec.ts` `networkidle` calls, or does the issue
  text's claim predate/outpace the real fix?
  - Needed from: repo state check (re-run `grep` against `main` immediately
    before starting tasks; if still present, PR status for #675 should also
    be checked so this change doesn't collide with in-flight work on the
    same lines).
  - Blocker for apply: no — resolved procedurally in tasks.md's first task,
    not by the requester.
- Question: For each `networkidle` call site, is it post-navigation (safe
  swap to `gotoAndWaitForHydration`/`waitForHydration`) or post-mutation
  in-place (needs a targeted `expect(locator)` assertion instead)? This was
  not individually verified for all 14 remaining non-helper call sites
  during exploration — only the shape of the two categories was confirmed to
  exist.
  - Needed from: no requester input needed; this is a design.md-level
    per-file classification task.
  - Blocker for apply: no.

## Non-Goals

- Eliminating all sources of E2E flake (only this specific anti-pattern).
- Speeding up the E2E suite as a primary goal (a side effect, not the
  reason for this change).
- Changing the `useAutoSave` debounce timing or any other application
  behavior.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
