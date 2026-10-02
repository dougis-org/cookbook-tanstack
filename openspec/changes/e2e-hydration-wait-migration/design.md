## Context

- Relevant architecture: Playwright E2E suite under `src/e2e/`. Shared
  wait/readiness helpers live in `src/e2e/helpers/app.ts`
  (`waitForHydration`, `gotoAndWaitForHydration`, `waitForRouterIdle`,
  `waitForContextToReflect`). Two shared action helpers,
  `src/e2e/helpers/recipes.ts` (`submitRecipeForm`) and
  `src/e2e/helpers/cookbooks.ts` (`createCookbook`, `addRecipeToCookbook`,
  `createCookbookWithRecipe`), are imported by most specs and currently
  contain their own `networkidle` calls.
- Dependencies: Client-side routing is TanStack Router; data fetching is
  TanStack Query (refetch-on-window-focus is already accounted for by
  `waitForContextToReflect`, out of scope here). Autosave state machine is
  `src/hooks/useAutoSave.ts`, rendered via `src/components/recipes/StatusIndicator.tsx`.
- Interfaces/contracts touched: Only test code (`src/e2e/**`). No
  application source changes.

## Goals / Non-Goals

### Goals

- Remove every `page.waitForLoadState("networkidle")` and
  `page.waitForTimeout(...)` call from `src/e2e/**`.
- Replace each with the minimal correct wait: delete it where an adjacent
  wait/assertion already covers the same precondition, or point it at
  `waitForHydration` where the call is genuinely waiting on a
  post-navigation hydration that nothing else in the test covers yet.
- Keep the test suite's effective assertions unchanged — a deleted wait must
  not weaken what the test proves.

### Non-Goals

- Introducing a new helper in `app.ts`. Investigation of all 21 call sites
  (15 `networkidle` + 6 `waitForTimeout`, enumerated below) found that every
  one resolves to either deletion or an existing helper/assertion pattern —
  none needs a wait condition that doesn't already have a signal to key off
  of. If tasks.md execution finds a 22nd site not caught here that genuinely
  needs a new condition, that's a scope change requiring a proposal update
  per Change Control, not a silent addition.
- Changing `useAutoSave`'s debounce timing, the autosave status text, or any
  other production behavior.
- Touching `cookbooks-collaboration.spec.ts`'s own sharing-flow logic beyond
  the two `networkidle` lines themselves (#675's scope boundary).

## Decisions

### Decision 1: Classify every call site into "redundant" (delete) vs. "needs a wait" (point at `waitForHydration`) — add no new helper

- Chosen: Full per-site audit (done during design, not deferred to
  implementation) against the actual surrounding code, not just the issue's
  generic description.
- Alternatives considered:
  - Blanket swap every `networkidle` → `waitForHydration` without checking
    context. Rejected: several sites (see mapping below) sit after another
    wait/assertion that already guarantees readiness, and a second wait is
    dead weight, not safety — it also risks masking the real signal if the
    first wait is ever removed later, since nothing would then be checking.
  - Add a generic `waitForMutationSettled` helper to `app.ts` for the
    same-page, non-navigation sites. Rejected: each of those sites already
    has a specific, existing, correct signal to wait on (a locator becoming
    visible/hidden, an assertion that already retries) — a generic helper
    would duplicate what's already there with less precision.
- Rationale: The issue's own scope line anticipates "adding new helpers...
  if a genuinely new wait condition is needed" — the audit shows this
  project's existing helpers and patterns already cover every real case.
- Trade-offs: This audit found in design, not tasks, means tasks.md can be
  a flat per-file checklist with no further investigation step — but it
  also means this design doc is the single place that must stay correct;
  tasks.md re-states the same classification so a task executor isn't
  relying on memory of this document while editing.

### Decision 2: `cookbooks-collaboration.spec.ts:91,132` are in scope for this change, not already resolved by #675

- Chosen: Re-verified against the current worktree (branched fresh off
  `origin/main`) rather than trusting the issue text's claim.
- Alternatives considered: Skip these two lines per the issue's stated
  exclusion. Rejected: `grep` against `origin/main` shows both lines still
  present — #675 has not (yet, or at all) removed them. Leaving them out of
  this change's scope would leave the known-bad pattern in the file the
  issue itself used as the motivating example.
- Rationale: The issue's exclusion was conditioned on #675 already having
  fixed the file; that precondition is false against current `main`, so the
  exclusion doesn't apply. If #675 lands first and removes these lines
  before this change is applied, the corresponding task becomes a no-op
  (verify absence, skip) rather than a conflict.
- Trade-offs: Small risk of a merge conflict with #675 if both touch the
  same lines concurrently; mitigated by re-checking at apply time (see
  tasks.md) rather than assuming this design-time snapshot still holds.

## Proposal to Design Mapping

- Proposal element: "Every `networkidle`/`waitForTimeout` call site under
  `src/e2e/**`" (Scope/What Changes)
  - Design decision: Decision 1 — full classification table below
  - Validation approach: Full `npm run test:e2e` run; grep sweep confirming
    zero remaining `networkidle`/`waitForTimeout` matches outside this
    change's explicit exclusions

### Classification table (file:line → disposition)

| Site | Disposition | Why |
|---|---|---|
| `helpers/recipes.ts:48` | Delete | Every caller of `submitRecipeForm` already calls `gotoAndWaitForHydration` immediately before invoking it (verified against all 29 call sites in `src/e2e/**`) |
| `helpers/cookbooks.ts:25` | Delete | Followed immediately by `cookbookLink.waitFor({ state: "visible" })`, which already polls |
| `helpers/cookbooks.ts:95` | Delete | `addRecipeToCookbook` (called just before) already ends with `dialog.waitFor({ state: "hidden" })` |
| `recipe-share.spec.ts:20` | Replace with `waitForHydration(page)` | Follows `page.waitForURL(...)`; nothing else confirms the destination page hydrated |
| `recipes-favorites.spec.ts:19` | Replace with `waitForHydration(page)` | Same pattern as above |
| `cookbooks-auth.spec.ts:60` | Replace with `waitForHydration(page)` | `createCookbook()` returns right after its own internal `waitForURL`; no hydration wait yet |
| `cookbooks-auth.spec.ts:105` | Replace with `waitForHydration(page)` | Same as above |
| `auth-session.spec.ts:28` | Delete | Immediately followed by an explicit `waitForHydration(page)` call on the very next line — pure duplication |
| `owner-icon.spec.ts:22,37,58` | Replace with `waitForHydration(page)` | Each follows `page.waitForURL(...)` with no subsequent hydration wait |
| `recipes-auth.spec.ts:127` | Replace with `waitForHydration(page)` | Same pattern |
| `recipes-crud.spec.ts:204` | Replace with `waitForHydration(page)` | Follows a post-delete redirect (`waitForURL("/recipes")`); the list must have rendered before asserting the deleted heading is absent, otherwise `.not.toBeVisible()` could pass vacuously on an unrendered page |
| `cookbooks-collaboration.spec.ts:91` | Delete | Immediately preceded by `gotoAndWaitForHydration(page, cookbookUrl)` in the same statement block |
| `cookbooks-collaboration.spec.ts:132` | Delete | Followed by an `expect(...).not.toBeVisible()` assertion that already retries |
| `recipe-persistence.spec.ts:25` | Delete | No-op gap between two sleeps; nothing reads state in between |
| `recipe-persistence.spec.ts:28` | Replace with `expect(page.getByText("Saved")).toBeVisible()` | `useAutoSave` sets status to `"saved"` after the debounced localStorage write completes, even on the local-only (no server) path |
| `recipe-persistence.spec.ts:51,83` | Delete | Precede a plain form-submit click; submission isn't autosave-gated |
| `recipe-persistence.spec.ts:61,93` | Delete | Immediately followed by an existing `expect(page.getByText("Saved")).toBeVisible({ timeout: 10000 })` that already retries |

## Functional Requirements Mapping

- Requirement: No `networkidle`/`waitForTimeout` call remains in
  `src/e2e/**` outside explicitly-excluded files.
  - Design element: Classification table above, applied file by file.
  - Acceptance criteria reference: `specs/e2e-test-waits/spec.md`
  - Testability notes: `grep -rn 'waitForLoadState("networkidle"\|waitForTimeout' src/e2e/` returns zero matches (or only matches explicitly carved out, if any remain — none are expected per the table).

- Requirement: Test assertions are not weakened by any deletion.
  - Design element: Each "Delete" row above cites the specific adjacent
    wait/assertion that already covers the removed call's precondition.
  - Acceptance criteria reference: `specs/e2e-test-waits/spec.md`
  - Testability notes: Full suite run shows the same pass/fail outcomes per
    spec as before the change (no newly-passing-for-wrong-reason tests).

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Flake rate of affected spec files does not increase.
  - Design element: Each replacement wait is state-based (locator/text
    visibility) rather than a time- or network-heuristic-based wait.
  - Acceptance criteria reference: `specs/e2e-test-waits/spec.md`
  - Testability notes: Run each changed spec file repeatedly (e.g. 3x) in
    CI or locally before merge; compare against baseline flake rate if one
    is tracked, otherwise confirm 0 failures across the repeated runs.

- Requirement category: performance
  - Requirement: Suite wall-clock time does not regress (expected to
    improve, not required to).
  - Design element: Deleted sleeps in `recipe-persistence.spec.ts` remove
    ~7s of fixed waiting per full run of that file; `waitForHydration` waits
    resolve as soon as the marker appears rather than waiting for a full
    network-idle window.
  - Acceptance criteria reference: `specs/e2e-test-waits/spec.md`
  - Testability notes: Compare `npm run test:e2e` wall-clock time
    before/after for the touched files (informational, not a hard gate).

## Risks / Trade-offs

- Risk/trade-off: `cookbooks-collaboration.spec.ts:91,132` may be touched
  concurrently by #675's own PR.
  - Impact: Merge conflict or duplicate fix on the same lines.
  - Mitigation: Tasks.md's first task re-greps these two lines against the
    then-current `main` before editing; if already absent, that task is
    marked done with no edit rather than failing.
- Risk/trade-off: The `recipes-crud.spec.ts:204` disposition
  (`waitForHydration` rather than deleting) adds one line rather than
  removing it, unlike most of the sweep.
  - Impact: Slightly inconsistent with the "mostly deletions" shape of this
    change; could look like scope creep if not explained.
  - Mitigation: Documented explicitly in the classification table and its
    rationale (vacuous-pass risk on an unrendered page) so the asymmetry is
    traceable to a reason, not an oversight.
- Risk/trade-off: Helper changes in `helpers/recipes.ts` and
  `helpers/cookbooks.ts` affect every spec that imports them (dozens of
  call sites across the suite), not just the files named in "What Changes".
  - Impact: A mistake in either helper fails many unrelated specs at once.
  - Mitigation: Full suite run (not a filtered subset) is a required gate
    in tasks.md before this change is considered complete.

## Rollback / Mitigation

- Rollback trigger: Full `npm run test:e2e` run shows new failures or a
  materially higher flake rate (e.g. intermittent failures on repeated runs
  of a previously-stable file) attributable to this change.
- Rollback steps: `git revert` the change's commit(s) on its branch; since
  this change touches only test files with no application-code or schema
  changes, revert carries no data-migration or deployment risk.
- Data migration considerations: None — test-only change.
- Verification after rollback: Re-run the previously-failing/flaking spec
  file(s) to confirm they return to their pre-change pass behavior.

## Operational Blocking Policy

- If CI checks fail: Treat as a signal the classification in this design
  was wrong for that specific site (likely a hidden race the old
  `networkidle`/sleep was papering over) — fix the test's wait condition
  per Decision 1's method, don't reintroduce a loose wait to make CI pass.
- If security checks fail: Not expected (test-only, no new dependencies or
  secrets); if a scanner flags something anyway, treat as unrelated to this
  change's scope and investigate independently before merging.
- If required reviews are blocked/stale: Follow standard project PR
  auto-merge policy (per `docs/standards/ci-cd.md`) — this change carries no
  special override.
- Escalation path and timeout: If `cookbooks-collaboration.spec.ts` lines
  91/132 produce a real merge conflict with #675, resolve by taking
  whichever PR merges first as the source of truth for those two lines and
  dropping the now-redundant edit from the other.

## Open Questions

- None outstanding. The two open questions carried from `proposal.md` are
  resolved by this document: #675 has not removed the
  `cookbooks-collaboration.spec.ts` lines (Decision 2), and every call
  site's post-navigation vs. post-mutation classification is settled in the
  table above.
