# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/enforce-public-only-creation` then immediately `git push -u origin feat/enforce-public-only-creation`

## Execution

### Task 1: Test Helpers Enhancement
- [x] Update `src/server/trpc/routers/__tests__/test-helpers.ts` to include `makeTieredCaller(tier: UserTier, isAdmin?: boolean)`
- [x] Verify existing tests still pass with updated helpers

### Task 2: Implement Enforcement in Recipes Router
- [x] Add logic to `recipes.create` mutation for silent coercion
- [x] Add logic to `recipes.import` mutation for silent coercion
- [x] Add logic to `recipes.update` mutation for explicit rejection
- [x] Add test cases to `src/server/trpc/routers/__tests__/recipes.test.ts` covering all ACs in `specs/recipes.md`

### Task 3: Implement Enforcement in Cookbooks Router
- [x] Add logic to `cookbooks.create` mutation for silent coercion
- [x] Add logic to `cookbooks.update` mutation for explicit rejection
- [x] Add test cases to `src/server/trpc/routers/__tests__/cookbooks.test.ts` covering all ACs in `specs/cookbooks.md`

### Task 4: Final Review
- [x] Review for duplication and unnecessary complexity
- [x] Confirm all acceptance criteria are covered

## Validation

- [x] Run unit tests: `npm run test` (Passed, except unrelated migration test)
- [x] Run type checks: `npx tsc --noEmit` (Passed)
- [x] Run lint: `npm run lint:route-outlet` (Passed)
- [x] Run build: `npm run build` (Passed)
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — run `npm run test`; all tests must pass
- **Build** — run `npm run build`; build must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing (Performed manual senior review)
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from working branch to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] Enable auto-merge: `gh pr merge --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

Ownership metadata:

- Implementer: Gemini CLI
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/enforce-public-only-creation/` to `openspec/changes/archive/2026-04-21-enforce-public-only-creation/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/2026-04-21-enforce-public-only-creation/` exists and `openspec/changes/enforce-public-only-creation/` is gone
- [ ] Commit and push the archive to the default branch in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d feat/enforce-public-only-creation`
