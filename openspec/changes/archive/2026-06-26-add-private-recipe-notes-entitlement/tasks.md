# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/private-recipe-notes-entitlement` then immediately `git push -u origin feat/private-recipe-notes-entitlement`

## Execution

- [x] **Add `canUsePrivateRecipeNotes` to `src/lib/tier-entitlements.ts`**
  - Export `canUsePrivateRecipeNotes(tier: string | null | undefined): boolean`
  - Body: `return hasAtLeastTier({ tier }, 'sous-chef')`
  - Place after `canCreatePrivate` to maintain logical grouping of boolean capability helpers
  - Verification: `npx tsc --noEmit` passes; function is importable

- [x] **Add unit tests in `src/lib/__tests__/tier-entitlements.test.ts`**
  - Add `canUsePrivateRecipeNotes` to the import list at the top of the file
  - Add a `describe('canUsePrivateRecipeNotes', ...)` block using `it.each`
  - Cover all 7 cases: `'anonymous'` → false, `'home-cook'` → false, `'prep-cook'` → false, `'sous-chef'` → true, `'executive-chef'` → true, `null` → false, `undefined` → false
  - Verification: `npx vitest run src/lib/__tests__/tier-entitlements.test.ts` — all tests pass

- [x] **Update `docs/user-tier-feature-sets.md`**
  - Add "Private Recipe Notes" under the Sous Chef tier section
  - Add "Private Recipe Notes" under the Executive Chef tier section (or note it as inherited)
  - Include a clarifying parenthetical distinguishing Private Recipe Notes (per-user, tier-gated, not yet persisted) from the existing public `note` field on Recipe documents
  - Verification: Manual review; markdown renders correctly

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npx vitest run src/lib/__tests__/tier-entitlements.test.ts` — all tests pass (including new `canUsePrivateRecipeNotes` block)
- [x] `npx tsc --noEmit` — no type errors
- [x] `npm run build` — build succeeds
- [x] All execution tasks above are marked complete

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` and check whether every changed file ends in `.md`. This change touches `.ts` files, so apply the **full path**.

**Full path:**

- **Unit tests** — `npx vitest run src/lib/__tests__/tier-entitlements.test.ts`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, iterate and fix before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `feat/private-recipe-notes-entitlement` and push to remote
- [x] Open PR from `feat/private-recipe-notes-entitlement` to `main`. PR body must include: `Closes #491`
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

Ownership metadata:

- Implementer: TBD
- Reviewer(s): TBD
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on main
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Sync approved spec deltas into `openspec/specs/`:
  - Copy `openspec/changes/add-private-recipe-notes-entitlement/specs/tier-entitlements/spec.md` → `openspec/specs/tier-entitlements/spec.md` (create directory if needed; update relative links to point to `../../changes/archive/YYYY-MM-DD-add-private-recipe-notes-entitlement/design.md`)
  - Copy `openspec/changes/add-private-recipe-notes-entitlement/specs/docs-update/spec.md` → `openspec/specs/docs-update/spec.md` (update relative links similarly)
- [x] Archive the change: move `openspec/changes/add-private-recipe-notes-entitlement/` to `openspec/changes/archive/YYYY-MM-DD-add-private-recipe-notes-entitlement/` **in a single atomic commit** that includes both the new location and deletion of the old location
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-add-private-recipe-notes-entitlement/` exists and `openspec/changes/add-private-recipe-notes-entitlement/` is gone
- [x] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-add-private-recipe-notes-entitlement` then `git push -u origin doc/archive-YYYY-MM-DD-add-private-recipe-notes-entitlement`
- [x] Open a PR from the doc branch to `main` with title `docs: archive add-private-recipe-notes-entitlement (YYYY-MM-DD)`
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [x] Monitor the doc PR until merged (same loop as implementation PR)
- [x] Prune merged local branches: `git fetch --prune` and `git branch -D feat/private-recipe-notes-entitlement doc/archive-YYYY-MM-DD-add-private-recipe-notes-entitlement`
