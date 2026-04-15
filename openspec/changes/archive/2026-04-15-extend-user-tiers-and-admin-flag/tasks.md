# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/extend-user-tiers-and-admin-flag` then immediately `git push -u origin feat/extend-user-tiers-and-admin-flag`

## Execution

Work in TDD order: write tests first, then implement.

### 1. User tier type module

- [x] Create `src/types/user.ts` with `UserTier` union, `TIER_RANK` map, and `hasAtLeastTier` helper
- [x] Write unit tests in `src/types/__tests__/user.test.ts` covering:
  - All tier comparisons (all pairings of `required` vs `user.tier`)
  - Admin bypass (`isAdmin: true` always returns `true`)
  - `undefined` tier treated as `'home-cook'`
- [x] Verify tests pass: `npx vitest run src/types/__tests__/user.test.ts`

### 2. Better-Auth config — additionalFields

- [x] Add `user.additionalFields` for `tier` and `isAdmin` to `src/lib/auth.ts`
- [x] Update `src/lib/auth-client.ts` to declare `tier` and `isAdmin` for client-side types
- [x] Verify TypeScript compiles without errors: `npx tsc --noEmit`
- [x] Check that `ctx.user.tier` and `ctx.user.isAdmin` are correctly typed in `src/server/trpc/context.ts` — add explicit type assertions if Better-Auth inference does not propagate (see design.md risk)
- [x] Run existing auth tests: `npx vitest run src/lib/__tests__/`

### 3. Route guards

- [x] Write tests in `src/lib/__tests__/auth-guard.test.ts` for:
  - `requireTier` happy path (sufficient tier proceeds)
  - `requireTier` sad path (insufficient tier redirects to `/account` with `reason: 'tier-limit-reached'`)
  - `requireTier` exact match passes
  - `requireTier` admin bypass
  - `requireTier` missing tier treated as home-cook
  - `requireAdmin` happy path (admin proceeds)
  - `requireAdmin` sad path (non-admin redirected)
- [x] Implement `requireTier(tier: UserTier)` in `src/lib/auth-guard.ts` (replace `@future` stub)
- [x] Implement `requireAdmin()` stub with real enforcement logic in `src/lib/auth-guard.ts`
- [x] Verify tests pass: `npx vitest run src/lib/__tests__/auth-guard.test.ts`

### 4. tRPC procedure guards

- [x] Write tests in `src/server/trpc/__tests__/init.test.ts` (or alongside existing tests) for:
  - `tierProcedure` succeeds for sufficient tier
  - `tierProcedure` throws `FORBIDDEN` for insufficient tier
  - `tierProcedure` admin bypass
  - `tierProcedure` throws `UNAUTHORIZED` (not `FORBIDDEN`) for unauthenticated call
  - `tierProcedure` missing tier treated as home-cook (throws `FORBIDDEN` for elevated requirement)
  - `adminProcedure` allows admin user
  - `adminProcedure` throws `FORBIDDEN` for non-admin
- [x] Add `tierProcedure(tier: UserTier)` factory to `src/server/trpc/init.ts`
- [x] Add `adminProcedure` stub with real enforcement logic to `src/server/trpc/init.ts`
- [x] Extend `UserDocument` interface in `src/server/trpc/routers/users.ts` with `tier?: UserTier` and `isAdmin?: boolean`
- [x] Update `transformUserDoc` to pass through `tier` and `isAdmin` fields
- [x] Verify tests pass: `npx vitest run src/server/trpc/`

### 5. Migration script

- [x] Create `scripts/migrate-user-tiers.ts`:
  - Connect to MongoDB using `MONGODB_URI`
  - `updateMany({ tier: { $exists: false } }, { $set: { tier: 'executive-chef', isAdmin: false } })`
  - `updateOne({ email: 'doug@dougis.com' }, { $set: { isAdmin: true } })`
  - Log: count of updated docs, whether admin was found and flagged, completion status
  - Exit with non-zero code on connection failure
- [x] Add `"db:migrate-tiers": "tsx scripts/migrate-user-tiers.ts"` to `package.json`
- [x] Run migration against dev MongoDB: `npm run db:migrate-tiers`
- [x] Verify idempotency: run a second time and confirm 0 documents modified for tier, admin flag preserved

### 6. Final sweep

- [x] Run full type check: `npx tsc --noEmit`
- [x] Run all unit/integration tests: `npm run test`
- [x] Run build: `npm run build`
- [x] Confirm no `noUnusedLocals` / `noUnusedParameters` errors

## Validation

- [x] All unit tests pass: `npm run test`
- [x] TypeScript compiles: `npx tsc --noEmit`
- [x] Build succeeds: `npm run build`
- [ ] E2E auth tests pass: `npm run test:e2e` (auth-session, cookbooks-auth, recipes-auth specs)
- [x] Migration ran successfully against dev DB with correct output
- [x] Idempotency confirmed (second run shows 0 tier updates)
- [x] `doug@dougis.com` document in dev DB has `tier: 'executive-chef'` and `isAdmin: true`
- [ ] All acceptance criteria scenarios from specs covered by tests

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **Integration tests** — included in `npm run test`
- **Regression / E2E tests** — `npm run test:e2e` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [ ] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to `feat/extend-user-tiers-and-admin-flag` and push to remote
- [ ] Open PR from `feat/extend-user-tiers-and-admin-flag` to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

Ownership metadata:

- Implementer: Claude Code
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
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec) — create `openspec/specs/user-tiers/` with the five capability specs
- [ ] Archive the change: move `openspec/changes/extend-user-tiers-and-admin-flag/` to `openspec/changes/archive/YYYY-MM-DD-extend-user-tiers-and-admin-flag/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-extend-user-tiers-and-admin-flag/` exists and `openspec/changes/extend-user-tiers-and-admin-flag/` is gone
- [ ] Commit and push the archive to `main` in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d feat/extend-user-tiers-and-admin-flag`
