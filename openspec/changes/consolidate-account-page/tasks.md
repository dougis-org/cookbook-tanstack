# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done at proposal time (`main` was
      fetched and the worktree branched from `origin/main`).
- [x] **Step 2 — Create and publish working branch:** `.worktrees/consolidate-account-page`
      exists on branch `consolidate-account-page`, already pushed
      (`origin/consolidate-account-page`, confirmed up to date at proposal
      commit `9a3cdfb`).

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — confirmed present
      in the available skills list.
- [x] **Verify `openspec-review-code` is available** — NOT available: the skill
      exists in the raw `.github/openspec-shared` submodule content but was
      never mirrored into this project's `.claude/skills/` (unlike the other
      four openspec-* skills, which are). Per user decision, substituting the
      available `code-review` skill for the Pre-Commit Code Review step below
      for this change; the submodule sync gap is a separate, pre-existing
      issue not fixed here.

## Execution

- [x] **Issue lifecycle: mark in-progress** — ran
      `gh issue edit #655 --add-label "in-progress"` and moved the Cookbook
      project (project 9) item `PVTI_lADODH__HM4BcOPpzg2uvJk` to "In progress".

### 1. Extract ProfileSection

- [x] 1.1 Create `src/components/account/ProfileSection.tsx`: move the body of
      `src/components/auth/ProfileInfo.tsx` into it verbatim (same `useAuth()`
      call, same `isPending` skeleton, same `if (!session) return null` guard),
      named export or default export `ProfileSection`.
- [x] 1.2 Delete `src/components/auth/ProfileInfo.tsx` and its test file (or
      move/rename the test alongside the new component — see task 6.x).

### 2. Extract StatusSection

- [x] 2.1 Create `src/components/account/StatusSection.tsx`: move the
      tier/usage/upgrade-CTA JSX and the `ProgressBar` helper out of
      `src/routes/account.tsx`'s `AccountPage`, including the
      `trpc.usage.getOwned` `useQuery` call and the tier-fallback logic
      (`rawTier` → `"home-cook"` default).
- [x] 2.2 `StatusSection` accepts `reason?: RedirectReason` as a prop (per
      design.md decision 1) rather than reading `Route.useSearch()` itself;
      render the existing `REDIRECT_REASON_MESSAGES[reason]` banner when
      present.

### 3. Extract PreferencesSection

- [x] 3.1 Create `src/components/account/PreferencesSection.tsx`: move the
      theme radiogroup, print-preference toggles, save button, and all local
      state (`selectedTheme`, `printPreferences`, `hasEdited`, `status`,
      `errorMessage`) from `SettingsPage` in
      `src/routes/account_.settings.tsx`, verbatim.
- [x] 3.2 Port the `handleSave` function and its `useAuth()`/session-hydration
      `useEffect` (including the `!hasEdited` guard) verbatim — do not change
      state ownership or pull `session`/`theme` in as props (see design.md
      decision 1's rationale on the session-refresh-clobbers-edit risk).
- [x] 3.3 Confirm `PreferencesSection` still imports `DEFAULT_THEME`,
      `isValidThemeId`, `THEMES` from `@/contexts/ThemeContext`, and
      `DEFAULT_PRINT_PREFERENCES`, `resolvePrintPreferences`, `PrintPreferences`
      from `@/lib/printPreferences` unchanged.

### 4. Compose the consolidated `/account` page

- [x] 4.1 Update `src/routes/account.tsx`: keep `beforeLoad: requireAuth()`
      and the existing `validateSearch` (the `reason` search param), remove
      the tier/usage JSX and `ProgressBar` now owned by `StatusSection`.
- [x] 4.2 Render `<ProfileSection />`, `<StatusSection reason={reason} />`,
      `<PreferencesSection />` in that order inside `AccountPage`, under a
      single page-level `<h1>Account</h1>` with icon (per design.md decision
      2's composition sketch).
- [x] 4.3 Delete the internal `<Link to="/account/settings">Settings</Link>`
      block (previously `account.tsx:74-80`) with no replacement.
- [x] 4.4 Verify each section's card wrapper (`rounded-xl border ... p-6`) and
      its own `<h2>` sub-heading are preserved so the page doesn't lose visual
      hierarchy now that the page-level `<h1>`/icon is deduplicated.

### 5. Convert old routes to redirect-only

- [x] 5.1 Read `src/lib/auth-guard.ts` to confirm `requireAuth()`'s exact
      synchronous-throw signature before writing the redirect `beforeLoad`s.
- [x] 5.2 Rewrite `src/routes/auth/profile.tsx`: `beforeLoad` calls
      `requireAuth()(args)` then unconditionally `throw redirect({ to:
      "/account" })`; remove the `ProfilePage` function and the
      `ProfileInfo`/`AuthPageLayout` imports; add a named
      `LegacyProfileRedirect` stub component (unreachable, satisfies the
      route-export convention) per Verity gate feedback.
- [x] 5.3 Rewrite `src/routes/account_.settings.tsx`: same pattern —
      `requireAuth()(args)` then `throw redirect({ to: "/account" })`; remove
      `SettingsPage` and all its local state/imports; add a named
      `LegacyAccountSettingsRedirect` stub component for the same reason.

### 6. Header link

- [x] 6.1 In `src/components/Header.tsx`, change the user link's `to=` prop
      from `"/auth/profile"` to `"/account"`. No other change to that block's
      JSX, classes, or icon.

### 7. Update existing tests

- [x] 7.1 Update `src/routes/__tests__/-account.test.tsx` to assert against
      the new composed `AccountPage` (all three sections present) instead of
      just the status/tier content, and to assert the internal Settings link
      is gone.
- [x] 7.2 Convert `src/routes/__tests__/-account-settings.test.tsx` into a
      redirect test for `/account/settings`; move form-behavior assertions
      (save success/error, `hasEdited` guard) into a new
      `PreferencesSection.test.tsx`.
- [x] 7.3 Update `src/components/__tests__/Header.test.tsx` and
      `src/components/auth/__tests__/Header.test.tsx` to assert the user link
      targets `/account`, not `/auth/profile`.
- [x] 7.4 Update `src/e2e/header-sidebar.spec.ts` to follow the Header user
      link to `/account` and assert the consolidated page content.
- [x] 7.5 Grep the full repo for `/auth/profile` and `/account/settings`
      string literals and update remaining references — found and fixed
      `src/e2e/theme.spec.ts` and `src/e2e/auth-session.spec.ts`, which
      weren't in the original five-file list.

### 8. New test coverage

- [x] 8.1 Add a test for `src/components/account/PreferencesSection.tsx`
      asserting an in-progress, unsaved theme/print-preference edit survives
      a simulated session-object refresh (the `hasEdited` guard).
- [x] 8.2 Add redirect tests for `/auth/profile`: authenticated visitor is
      redirected to `/account`; unauthenticated visitor is redirected to
      `/auth/login` (not to `/account` as an intermediate step).
- [x] 8.3 Add redirect tests for `/account/settings`: same two cases as 8.2.
- [x] 8.4 Add a test confirming `/account` renders correctly at a mobile
      viewport width with no clipped section. Caught and fixed a real bug:
      `ProfileSection`'s email/username spans had no truncation and
      overflowed horizontally on narrow viewports — added `truncate`/`min-w-0`.

- [ ] Look for existing tooling or functions in the codebase that can be
      reused or extended before writing new logic from scratch — done
      throughout (e.g. reused `requireAuth()`, `REDIRECT_REASON_MESSAGES`,
      existing theme/print-preference helpers verbatim rather than
      reimplementing).
- [x] Confirm acceptance criteria are covered — see specs/ delta files;
      traceability sections map every requirement to a task above.

## Pre-Commit Code Review

- [x] **Before the final commit**, run the `code-review` skill (substituted
      for the unavailable `openspec-review-code`, see Preflight) against the
      full diff. Result: zero findings across correctness, reuse,
      simplification, efficiency, and convention checks — extraction
      components verified byte-for-byte against the deleted originals, no
      dead code left behind, no stray `/auth/profile`/`/account/settings`
      string references outside the auto-generated route tree, 208/208
      touched-file unit tests pass, `tsc --noEmit` clean on all reviewed
      files (10 pre-existing errors elsewhere, unrelated to this change).
      The repo's separate `verity guard --on commit,push` pre-commit hook
      additionally blocked two commit attempts:
      (1) unvalidated `user.image` URL + unhandled malformed `createdAt` in
      `ProfileSection.tsx` — fixed with an https-only, explicit-allowlist
      image check (no host trusted yet since no avatar-hosting provider is
      configured in `src/lib/auth.ts`) and a `NaN`-guarded date formatter,
      both covered by new tests;
      (2) discovered while re-testing: `vitest.config.ts`'s `exclude` list
      didn't cover `.verity/.snapshot/`, so Verity's own pre-commit snapshot
      mechanism caused vitest to double-run a stale mirrored copy of touched
      test files — a pre-existing, repo-wide gap (not specific to this
      change) that explains earlier test-count fluctuations (2061/2165/2167)
      seen throughout this session. Added `.verity/**` to the exclude list;
      full suite is now stable at 2063/2063.

## Validation

- [x] Run unit/integration tests — 2061/2061 passed (`npm run test`).
- [x] Run E2E tests — 34/34 passed across `header-sidebar.spec.ts`,
      `auth-session.spec.ts`, `account.spec.ts`, `theme.spec.ts`; confirmed
      no regression against an untouched spec (`cookbooks-auth.spec.ts`,
      9/9).
- [x] Run type checks / build — `npm run build` succeeds, exit 0.
- [x] Run security/code quality checks required by project standards — see
      Pre-Commit Code Review above (zero findings).
- [x] All completed tasks marked as complete.
- [x] All steps in Remote push validation (see below).

## Remote push validation

Non-docs change (route/component files changed) — full path applies:

- [x] Unit tests pass — 2165/2165 (`npm run test`, final pre-push run).
- [x] Integration tests pass — included in the same unit run above.
- [x] E2E/regression tests pass — 34/34 (verified in Validation above; no
      source files changed since that run, only docs/tasks/tests.md and
      submodule initialization, so not re-run a second time).
- [x] Build succeeds with no errors — `npm run build`, exit 0, final
      pre-push run.

## PR and Merge

- [ ] Ensure the Pre-Commit Code Review step above was run and findings
      addressed before the final commit.
- [ ] Commit all changes to the working branch and push to remote.
- [ ] Open PR from `consolidate-account-page` to `main`. PR body MUST
      include `Closes #655`.
- [ ] **Issue lifecycle: mark in-review** — run
      `gh issue edit #655 --add-label "in-review" --remove-label "in-progress"`
      and move the project item to "In Review" (same discovery pattern as
      above).
- [ ] Wait 60 seconds for CI to start.
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all
      findings (commit, push, re-run) until zero findings remain. Report a
      stall after 3+ iterations with no progress.
- [ ] Enable auto-merge only after the review gate passes:
      `gh pr merge <PR-URL> --auto --merge` (never `--admin`).
- [ ] Iterate until merged: build/tests → PR comments → CI checks, repeating
      from step 1 after every push, until `gh pr view --json state` returns
      `MERGED` (or `CLOSED`, in which case stop and notify the user).

Ownership metadata:

- Implementer: agent (this session)
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent + CI
- Required approvals: CI green + zero unresolved review findings

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary
      checkout, not the worktree).
- [ ] Verify the merged changes appear on `main`.
- [ ] Mark all remaining tasks as complete.
- [ ] Update repository documentation impacted by the change (none
      identified beyond this file).
- [ ] Sync approved spec deltas into `openspec/specs/` (account-page and
      header are new capabilities; auth-route-guards and user-settings get
      ADDED/MODIFIED/REMOVED sections merged in). Update relative links
      pointing into the change directory to resolve from the archive
      location.
- [ ] Archive the change: move `openspec/changes/consolidate-account-page/`
      to `openspec/changes/archive/YYYY-MM-DD-consolidate-account-page/` in
      a single commit (copy + delete together).
- [ ] Confirm the archive directory exists and the original is gone.
- [ ] Create a doc branch `doc/archive-YYYY-MM-DD-consolidate-account-page`,
      push it, open a PR titled
      `docs: archive consolidate-account-page (YYYY-MM-DD)` to `main`.
- [ ] Immediately enable auto-merge on the doc PR.
- [ ] Monitor the doc PR until merged (same loop as the implementation PR).
- [ ] Prune merged local branches: `git fetch --prune` and
      `git branch -D consolidate-account-page doc/archive-YYYY-MM-DD-consolidate-account-page`.
