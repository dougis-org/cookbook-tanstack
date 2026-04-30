# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/reconcile-user-content` then immediately `git push -u origin feat/reconcile-user-content`

## Execution

### Task 1: Implement `src/lib/reconcile-user-content.ts`

- [x] **1a.** Create `src/lib/reconcile-user-content.ts`
- [x] **1b.** Import `Recipe`, `Cookbook` from `@/db/models`, `getMongoClient` from `@/db`, `TIER_RANK`, `UserTier` from `@/types/user`, `canCreatePrivate`, `getRecipeLimit`, `getCookbookLimit` from `@/lib/tier-entitlements`
- [x] **1c.** Define `TierChangeDirection` type: `'upgrade' | 'downgrade' | 'same'`
- [x] **1d.** Implement `getTierChangeDirection(oldTier, newTier): TierChangeDirection` using `TIER_RANK` comparison
- [x] **1e.** Implement `reconcileRecipes(session, userId, direction, newTier): Promise<{ recipesUpdated: number; recipesHidden: number; madePublic: number }>`
- [x] **1f.** Implement `reconcileCookbooks(session, userId, direction, newTier): Promise<{ cookbooksUpdated: number; cookbooksHidden: number; madePublic: number }>` — same pattern as recipes
- [x] **1g.** Export main `reconcileUserContent(userId, oldTier, newTier)` function:
- [x] **1h.** Write unit tests in `src/lib/__tests__/reconcile-user-content.test.ts` — see tests artifact for full list

**Verification:** `npm run test -- src/lib/__tests__/reconcile-user-content.test.ts`

### Task 2: Update `visibilityFilter` in `src/server/trpc/routers/_helpers.ts`

- [x] **2a.** Modify `visibilityFilter` to add `hiddenByTier: { $ne: true }` to both branches of the `$or`
- [x] **2b.** Update test in `src/server/trpc/routers/__tests__/helpers.test.ts` to reflect new filter shape
- [x] **2c.** Verify `countUserContent` / `enforceContentLimit` behavior unchanged (they already use `userContentFilter` with `hiddenByTier: { $ne: true }`)

**Verification:** `npm run test -- src/server/trpc/routers/__tests__/helpers.test.ts`

### Task 3: Wire `reconcileUserContent` into `admin.setTier` in `src/server/trpc/routers/admin.ts`

- [x] **3a.** Add `import { reconcileUserContent } from "@/lib/reconcile-user-content"` at top of file
- [x] **3b.** In `admin.users.setTier` mutation, after the `usersCollection.updateOne` call succeeds, call `reconcileUserContent(input.userId, currentTier, input.tier)`
- [x] **3c.** Catch and log errors from reconciliation (non-blocking to the mutation response)
- [ ] **3d.** Write integration test: create user with content, call `admin.setTier`, verify counts returned and content updated

**Verification:** `npm run test -- src/server/trpc/routers/__tests__/admin.test.ts`

## Validation

- [x] Run unit/integration tests: `npm run test`
- [ ] Run E2E tests: `npm run test:e2e`
- [x] Run type checks: `npx tsc --noEmit`
- [ ] Run build: `npm run build` — fails on pre-existing mailtrap missing dependency (unrelated to this change)
- [ ] Run security/code quality checks: see project standards in `docs/standards/`
- [ ] All completed tasks marked as complete (`- [x]`)
- [ ] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **Integration tests** — `npm run test` (same suite, no separate integration step)
- **Regression / E2E tests** — `npm run test:e2e` — all tests must pass
- **Build** — `npm run build` — build must succeed with no errors

if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [ ] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `feat/reconcile-user-content` branch to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

The comment and CI resolution loops are iterative: address → validate locally → push → wait 180 seconds → re-check → poll for merge → repeat until the PR merges.

**Ownership metadata:**
- Implementer: (assigned)
- Reviewer(s): (assigned)
- Required approvals: 1

**Blocking resolution flow:**
- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/reconcile-user-content/` to `openspec/changes/archive/YYYY-MM-DD-reconcile-user-content/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-reconcile-user-content/` exists and `openspec/changes/reconcile-user-content/` is gone
- [ ] Commit and push the archive to the default branch in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d feat/reconcile-user-content`

**Required cleanup after archive:** `git fetch --prune` and `git branch -d feat/reconcile-user-content`