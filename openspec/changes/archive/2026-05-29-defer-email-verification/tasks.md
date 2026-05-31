# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/defer-email-verification` then immediately `git push -u origin feat/defer-email-verification`

## Execution

### Better-Auth hook — confirmed, no spike needed

> The `afterEmailVerification` hook was confirmed during exploration. The installed `better-auth` version exposes it in the `emailVerification` config block with signature `async ({ user }) => void` — identical pattern to `sendVerificationEmail`. Proceed directly to Task 1.

### Task 1 — Add `pendingVerification` field to Recipe model

- [x] Add `pendingVerification?: boolean` to `IRecipe` interface in `src/db/models/recipe.ts`
- [x] Add field to Mongoose schema: `pendingVerification: { type: Boolean, default: false }`
- [x] Verify: existing documents unaffected (`$ne: true` semantics, consistent with `deleted` pattern — no migration needed)
- [x] Write/extend unit test confirming the field is accepted and stored
- [x] Verification: `npx tsc --noEmit` passes; recipe model tests pass

### Task 2 — Update tRPC recipe queries to filter pending recipes

- [x] Update `recipes.list` in `src/server/trpc/routers/recipes.ts`:
  - In the public/non-owner branch, add `pendingVerification: { $ne: true }` to the filter
  - In the owner's own-recipe branch, allow pending recipes through (owner can see their own)
- [x] Update `recipes.byId` in `src/server/trpc/routers/recipes.ts`:
  - If the fetched recipe has `pendingVerification: true` and `ctx.user._id` does not match `recipe.userId`, return not-found (same pattern as `deleted`)
- [x] Update `usage.getOwned` in `src/server/trpc/routers/usage.ts`:
  - Add `pendingVerification: { $ne: true }` to the owned recipe count query
- [x] Update taxonomy aggregation queries to exclude pending recipes in public contexts
- [x] Write **required integration test**: seed DB with one pending and one published recipe; assert `recipes.list` public call returns only the published recipe
- [x] Verification: `npm run test` passes; integration test passes

### Task 3 — Create `publishPendingRecipes` service

- [x] Create `src/server/recipes/pendingRecipes.ts`
- [x] Implement `publishPendingRecipes(userId: string): Promise<void>`:
  ```ts
  // Uses Recipe.updateMany({ userId, pendingVerification: true }, { $unset: { pendingVerification: 1 } })
  ```
- [x] Write unit tests:
  - User with pending recipes: all recipes have `pendingVerification` unset after call
  - User with no pending recipes: function completes without error, no writes
  - Idempotency: calling twice is safe
- [x] Verification: `npm run test` passes for new service

### Task 4 — Wire `afterEmailVerification` hook in Better-Auth config

- [x] In `src/lib/auth.ts`, add to the `emailVerification` config block:
  ```ts
  afterEmailVerification: async ({ user }) => {
    await publishPendingRecipes(user.id)
  }
  ```
- [x] Import `publishPendingRecipes` from `src/server/recipes/pendingRecipes.ts`
- [x] Write unit/integration test: mock hook invocation confirms `publishPendingRecipes` is called with correct userId
- [x] Verification: `npx tsc --noEmit` passes; auth config tests pass

### Task 5 — Update `/recipes/new` route guard and RecipeForm submit path

- [x] In `src/routes/recipes/new.tsx`: change `beforeLoad: requireVerifiedAuth()` to `beforeLoad: requireAuth()`
- [x] In `src/components/recipes/RecipeForm.tsx`:
  - Add detection of `emailVerified === false` from `useAuth()` at submit time
  - If unverified: call create mutation with `pendingVerification: true`; on success, set component state to show `PostSubmitVerifyGate` (pass the created recipe to it)
  - If verified: existing submit flow unchanged
- [x] Extend existing route guard tests (do not delete them):
  - Unverified authenticated user can reach the page (no redirect)
  - Unauthenticated user is still redirected to login
- [x] Verification: `npm run test` passes; existing tests still pass

### Task 6 — Build `PostSubmitVerifyGate` component

- [x] Create `src/components/recipes/PostSubmitVerifyGate.tsx`
- [x] Props: `{ recipe: { _id: string; name: string } }`
- [x] Renders:
  - Recipe name displayed prominently above the gate
  - Copy: "One more step — verify your email to publish this recipe." (no emoji, theme tokens only)
  - "Resend verification email" button — reuse `requestVerificationEmail` from `src/components/auth/verificationEmail`
  - Loading / success / error states (reuse `VerificationBanner` pattern)
- [x] Write React Testing Library unit tests:
  - Renders recipe name
  - Renders correct copy with no emoji
  - Resend button triggers email request
  - Shows success/error state after request
- [x] Verification: component tests pass; `npx tsc --noEmit` passes

### Task 7 — End-to-end validation

- [x] Run full test suite: `npm run test && npm run test:e2e`
- [x] Run TypeScript check: `npx tsc --noEmit`
- [ ] Manually verify:
  - Sign up as a new user → navigate to `/recipes/new` → fill form → submit → see `PostSubmitVerifyGate` with recipe name displayed
  - Verify email via link → confirm recipe appears in public recipe list
  - Check that an unverified user's pending recipe does NOT appear in recipe list when logged out

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] All completed tasks marked as complete
- [x] All steps in Remote push validation passed

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — included in `npm run test`; all must pass
- **Regression / E2E tests** — `npm run test:e2e`; all must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `feat/defer-email-verification` and push to remote
- [x] Open PR from `feat/defer-email-verification` to `main`. PR body MUST include: `Closes #452`
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved. Follow all Remote push validation steps then push to `feat/defer-email-verification`; wait 180 seconds then repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll using `gh pr checks <PR-URL> --json isRequired,state`; when any required blocking check fails, diagnose and fix, commit, follow Remote push validation, push, wait 180 seconds, repeat until all required checks pass
- [x] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:

- Implementer: (assignee)
- Reviewer(s): (repo owner / TBD)
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
- [x] Sync approved spec deltas into `openspec/specs/` (global spec)
- [x] Archive the change: move `openspec/changes/defer-email-verification/` to `openspec/changes/archive/YYYY-MM-DD-defer-email-verification/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-defer-email-verification/` exists and `openspec/changes/defer-email-verification/` is gone
- [x] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-defer-email-verification` then `git push -u origin doc/archive-YYYY-MM-DD-defer-email-verification`
- [x] Open a PR from `doc/archive-YYYY-MM-DD-defer-email-verification` to `main` with title `docs: archive defer-email-verification (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Monitor the doc PR until it merges (same loop as the implementation PR)
- [x] Prune merged local branches: `git fetch --prune` and `git branch -d feat/defer-email-verification doc/archive-YYYY-MM-DD-defer-email-verification`
