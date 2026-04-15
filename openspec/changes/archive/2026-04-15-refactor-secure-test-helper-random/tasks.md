# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b refactor-secure-test-helper-random` then immediately `git push -u origin refactor-secure-test-helper-random`

## Execution

- [x] **Step 3 — Create utility helper:** Create `src/e2e/helpers/utils.ts` with `getUniqueSuffix()` using `node:crypto`.
- [x] **Step 4 — Refactor Auth helper:** Update `src/e2e/helpers/auth.ts` to use `getUniqueSuffix()`.
- [x] **Step 5 — Refactor Cookbooks helper:** Update `src/e2e/helpers/cookbooks.ts` to use `getUniqueSuffix()`.
- [x] **Step 6 — Refactor Recipes helper:** Update `src/e2e/helpers/recipes.ts` to use `getUniqueSuffix()`.
- [x] **Step 7 — Review for duplication:** Ensure no other `Math.random()` calls remain in `src/e2e/helpers/`.

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npx playwright test` (Focus on `src/e2e/helpers/` consumers)
- [x] Run type checks: `tsc --noEmit`
- [x] Run build: `npm run build`
- [x] Run linting: `npm run lint:route-outlet`
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — `npm run test`; all tests must pass
- **Regression / E2E tests** — `npx playwright test`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from working branch to `main`
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] Enable auto-merge: `gh pr merge --auto --merge`
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [x] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

Ownership metadata:

- Implementer: Gemini CLI
- Reviewer(s): Codebase owners
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change
- [x] Sync approved spec deltas into `openspec/specs/`
- [x] Archive the change: move `openspec/changes/refactor-secure-test-helper-random/` to `openspec/changes/archive/2026-04-15-refactor-secure-test-helper-random/` **and stage both the new location and the deletion of the old location in a single commit**
- [x] Confirm `openspec/changes/archive/2026-04-15-refactor-secure-test-helper-random/` exists and `openspec/changes/refactor-secure-test-helper-random/` is gone
- [x] Commit and push the archive to the default branch in one commit
- [x] Prune merged local feature branches: `git fetch --prune` and `git branch -d refactor-secure-test-helper-random`
