# Tasks

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** `git checkout -b feature/user-settings-preferences` then immediately `git push -u origin feature/user-settings-preferences`

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [ ] **Issue lifecycle: mark in-progress**: run `gh issue edit 609 --add-label "in-progress"`. Then discover the GitHub Project linked to `dougis-org/cookbook-tanstack` (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [ ] **T1 — Add `theme` to Better-Auth `additionalFields`** (`src/lib/auth.ts`): add `theme: { type: "string" as const, defaultValue: "dark", required: false }` alongside `tier`/`isAdmin` (Design Decision 2). Write/extend a test confirming the field is present in the auth config and round-trips through `authClient.updateUser`.
- [ ] **T2 — Write failing tests first (TDD) for the settings route** (`src/routes/__tests__/-account-settings.test.ts` or equivalent, mirroring `src/routes/__tests__/-account.test.tsx` patterns): cover loading state, rendering current theme, save success, save error (selection not discarded), and `requireAuth()` redirect for logged-out access — per `specs/user-settings/spec.md` scenarios.
- [ ] **T3 — Implement `src/routes/account_.settings.tsx`**: `createFileRoute("/account_/settings")`, `beforeLoad: requireAuth()`, theme selection form following `design-system/CLAUDE.md` (theme tokens only, Title Case labels, Lucide icons, no emoji). Save handler calls `authClient.updateUser({ theme })` directly (Design Decision 1) — no new tRPC procedure. Verify tests from T2 pass.
- [ ] **T4 — Add settings link from `AccountPage`** (`src/routes/account.tsx`): add a `<Link to="/account/settings">` entry point. Extend `src/routes/__tests__/-account.test.tsx` to assert the link renders.
- [ ] **T5 — Write failing tests first (TDD) for `ThemeProvider` reconciliation** (extend existing `ThemeContext` test coverage): mount with a mocked session whose `user.theme` differs from `localStorage`, assert DOM class/state/`localStorage` update post-hydration to match session; mount with matching values, assert no change; mount with no session, assert unaffected — per `specs/theme-system/spec.md` scenarios.
- [ ] **T6 — Implement reconciliation in `src/contexts/ThemeContext.tsx`**: extend the existing post-mount effect to compare `session.user.theme` (via `useAuth()`/`useSession()`) against the resolved local value and reconcile per Design Decision 3. Verify tests from T5 pass. Confirm no change to pre-hydration inline-script behavior in `src/routes/__root.tsx`.
- [ ] **T7 — E2E coverage**: extend `src/e2e/theme.spec.ts` (or add a sibling spec) to cover a logged-in save-and-reload round trip for theme, per `specs/user-settings/spec.md` and `specs/theme-system/spec.md` scenarios. Confirm anonymous theme E2E flows are unaffected.
- [ ] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — confirm no existing settings-form component/pattern is being duplicated.
- [ ] Confirm all acceptance criteria in `specs/user-settings/spec.md` and `specs/theme-system/spec.md` are covered by the tests written in T2/T5/T7.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] Run unit/integration tests (`npm run test`)
- [ ] Run E2E tests (`npm run test:e2e`)
- [ ] Run type checks
- [ ] Run build (`npm run build`)
- [ ] Run security/code quality checks required by project standards
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against `main`) and check whether every changed file ends in `.md`. This change touches `src/lib/auth.ts`, `src/routes/account_.settings.tsx`, `src/routes/account.tsx`, and `src/contexts/ThemeContext.tsx` — the full path applies.

**Full path**:

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — included in `npm run test` (Vitest + React Testing Library); all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `feature/user-settings-preferences` to `main`. PR body MUST include `Closes #609`.
- [ ] **Issue lifecycle: mark in-review**: run `gh issue edit 609 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: (assignee on #609)
- Reviewer(s): per repo default PR review assignment
- Required approvals: per repo branch protection rules

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (e.g. `docs/database.md` if the `user` collection's documented fields need `theme` noted)
- [ ] Sync approved spec deltas into `openspec/specs/`: create `openspec/specs/user-settings/spec.md` (new capability) and update `openspec/specs/theme-system/theme-persistence.md` (or add a new file in that capability directory) with the MODIFIED requirement from `specs/theme-system/spec.md`. Update relative links (`../../design.md` → `../../changes/archive/YYYY-MM-DD-user-settings-preferences/design.md`, similarly for `tasks.md`).
- [ ] Archive the change: move `openspec/changes/user-settings-preferences/` to `openspec/changes/archive/YYYY-MM-DD-user-settings-preferences/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-user-settings-preferences/` exists and `openspec/changes/user-settings-preferences/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-user-settings-preferences` then `git push -u origin doc/archive-YYYY-MM-DD-user-settings-preferences`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-user-settings-preferences` to `main` with title `docs: archive user-settings-preferences (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D feature/user-settings-preferences doc/archive-YYYY-MM-DD-user-settings-preferences`

Required cleanup after archive: `git fetch --prune` and `git branch -D feature/user-settings-preferences doc/archive-YYYY-MM-DD-user-settings-preferences`
