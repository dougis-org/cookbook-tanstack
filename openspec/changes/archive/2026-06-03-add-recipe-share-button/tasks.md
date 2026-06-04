# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/add-recipe-share-button` then immediately `git push -u origin feat/add-recipe-share-button`

## Execution

- [x] **Task 1 — Implement ShareButton Component:** Create the component file `src/components/ui/ShareButton.tsx` to handle direct copying of `window.location.href`. It will feature a 2-second visual confirmation ("Copied!" with a checkmark) and degrade gracefully to selection copying/manual alerts if `navigator.clipboard` is restricted.
- [x] **Task 2 — Write ShareButton Unit Tests:** Create the unit test file `src/components/ui/__tests__/ShareButton.test.tsx` using Vitest to assert successful render, clipboard actions, state restoration, legacy fallbacks, and print:hidden styling.
- [x] **Task 3 — Integrate into Recipe Details Page:** Import and mount `<ShareButton />` next to `<PrintButton />` inside the actions prop of `<RecipeDetail>` in `src/routes/recipes/$recipeId.tsx`.
- [x] **Task 4 — Write E2E Playwright Tests:** Implement `src/e2e/recipe-share.spec.ts` to assert that the Share button performs correctly inside chromium, displays the success label, updates clipboard state, and recovers gracefully.

Suggested start-of-work commands: `git checkout main` → `git pull --ff-only` → `git checkout -b feat/add-recipe-share-button` → `git push -u origin feat/add-recipe-share-button`

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] Run unit/integration tests: `npm run test:unit`
- [x] Run E2E tests: `npx playwright test src/e2e/recipe-share.spec.ts`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — run `npm run test:unit`; all tests must pass
- **E2E tests** — run `npx playwright test src/e2e/recipe-share.spec.ts --reporter=line`; all tests must pass
- **Build** — run `npm run build`; build must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from working branch to `main`. **The PR body MUST explicitly state "Closes #185".**
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved to allow the process to progress. Follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll for check status autonomously using `gh pr checks --json isRequired,state`; when any **required (blocking)** CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all required checks pass
- [x] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

Ownership metadata:

- Implementer: Antigravity AI
- Reviewer(s): dougis (Doug Hubbard)
- Required approvals: 1 approval

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change
- [x] Sync approved spec deltas into `openspec/specs/` (global spec)
- [x] Archive the change: move `openspec/changes/add-recipe-share-button/` to `openspec/changes/archive/2026-06-03-add-recipe-share-button/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [x] Confirm `openspec/changes/archive/2026-06-03-add-recipe-share-button/` exists and `openspec/changes/add-recipe-share-button/` is gone
- [x] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-2026-06-03-add-recipe-share-button` then `git push -u origin doc/archive-2026-06-03-add-recipe-share-button`
- [x] Open a PR from `doc/archive-2026-06-03-add-recipe-share-button` to `main` with title `docs: archive add-recipe-share-button (2026-06-03)` — **do NOT push directly to `main`**
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [x] Prune merged local branches: `git fetch --prune` and `git branch -d feat/add-recipe-share-button doc/archive-2026-06-03-add-recipe-share-button`

Required cleanup after archive: `git fetch --prune` and `git branch -d feat/add-recipe-share-button doc/archive-2026-06-03-add-recipe-share-button`
