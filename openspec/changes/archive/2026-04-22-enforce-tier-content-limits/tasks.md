# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/tier-content-limits` then immediately `git push -u origin feat/tier-content-limits`

## Execution

### 1. Add `hiddenByTier` to Recipe model

- [x] Add `hiddenByTier?: boolean` to `IRecipe` interface in `src/db/models/recipe.ts`
- [x] Add `hiddenByTier: { type: Boolean, default: false }` to `recipeSchema`
- [x] Verify: `npx vitest run src/server/trpc/routers/__tests__/recipes.test.ts` passes

### 2. Add `hiddenByTier` to Cookbook model

- [x] Add `hiddenByTier?: boolean` to `ICookbook` interface in `src/db/models/cookbook.ts`
- [x] Add `hiddenByTier: { type: Boolean, default: false }` to `cookbookSchema`
- [x] Verify: `npx vitest run src/server/trpc/routers/__tests__/cookbooks.test.ts` passes

### 3. Refactor `makeAuthCaller` test helper

- [x] Update `makeAuthCaller` in `src/server/trpc/routers/__tests__/test-helpers.ts`:
  - Change signature to `(userId: string, opts: { email?: string; tier?: string; isAdmin?: boolean } = {})`
  - Update `user` object: `{ id: userId, email: opts.email ?? 'test@test.com', tier: opts.tier, isAdmin: opts.isAdmin ?? false }`
  - Update `withSeededUser` internal call to `makeAuthCaller(user.id, { email: user.email })`
- [x] Delete local `makeAuthCaller` definition from `src/server/trpc/routers/__tests__/recipes.test.ts`
- [x] Add import of `makeAuthCaller` from `./test-helpers` in `recipes.test.ts`
- [x] Update any `makeAuthCaller(user.id, user.email)` call sites in `sources.test.ts` to `makeAuthCaller(user.id, { email: user.email })` (check all test files)
- [x] Verify: `npx vitest run src/server/trpc/routers/__tests__/` passes

### 4. Add `enforceContentLimit` helper

- [x] Write tests first in `src/server/trpc/routers/__tests__/helpers.test.ts` covering:
  - at-limit throws FORBIDDEN (recipe)
  - under-limit resolves (recipe)
  - admin bypass (isAdmin: true)
  - hiddenByTier excluded from count (recipe)
  - missing tier defaults to `home-cook`
  - at-limit throws FORBIDDEN (cookbook)
- [x] Implement `enforceContentLimit(userId, tier, isAdmin, resource)` in `src/server/trpc/routers/_helpers.ts`:
  - Import `getRecipeLimit`, `getCookbookLimit`, `EntitlementTier` from `@/lib/tier-entitlements`
  - Import `Recipe`, `Cookbook` from `@/db/models`
  - Early return if `isAdmin`
  - Default `tier ?? 'home-cook'` to `EntitlementTier`
  - `countDocuments({ userId, hiddenByTier: { $ne: true } })` on the appropriate model
  - Throw `TRPCError({ code: 'FORBIDDEN', message: '...' })` if `count >= limit`
- [x] Verify: `npx vitest run src/server/trpc/routers/__tests__/helpers.test.ts` passes

### 5. Wire limit check into `recipes.create`

- [x] Write failing tests first in `src/server/trpc/routers/__tests__/recipes.test.ts` for:
  - at-limit rejection (`home-cook`, 10 recipes → FORBIDDEN)
  - under-limit success (9 recipes → succeeds)
  - admin bypass (10 recipes, isAdmin → succeeds)
  - hiddenByTier excluded (10 recipes, 1 hidden → succeeds)
  - response includes `hiddenByTier: false`
- [x] Add `await enforceContentLimit(ctx.user.id, ctx.user.tier, ctx.user.isAdmin ?? false, 'recipes')` before `new Recipe(...).save()` in `src/server/trpc/routers/recipes.ts`
- [x] Ensure `hiddenByTier` is included in the `recipes.create` return value
- [x] Verify: `npx vitest run src/server/trpc/routers/__tests__/recipes.test.ts` passes

### 6. Wire limit check into `cookbooks.create`

- [x] Write failing tests first in `src/server/trpc/routers/__tests__/cookbooks.test.ts` for:
  - at-limit rejection (`home-cook`, 1 cookbook → FORBIDDEN)
  - under-limit success (0 cookbooks → succeeds)
  - admin bypass (1 cookbook, isAdmin → succeeds)
  - hiddenByTier excluded (1 cookbook hidden → succeeds)
  - response includes `hiddenByTier: false`
- [x] Add `await enforceContentLimit(ctx.user.id, ctx.user.tier, ctx.user.isAdmin ?? false, 'cookbooks')` before `new Cookbook(...).save()` in `src/server/trpc/routers/cookbooks.ts`
- [x] Ensure `hiddenByTier` is included in the `cookbooks.create` return value
- [x] Verify: `npx vitest run src/server/trpc/routers/__tests__/cookbooks.test.ts` passes

### 7. Include `hiddenByTier` in list/get response payloads

- [x] Audit `recipes.list` and `recipes.get` in `src/server/trpc/routers/recipes.ts` — confirm `hiddenByTier` is not stripped in `.lean()` or `.toObject()` calls; add to select/projection if needed
- [x] Audit `cookbooks.list` and `cookbooks.get` in `src/server/trpc/routers/cookbooks.ts` — same
- [x] Add assertions in existing list/get tests that `hiddenByTier` appears in response items
- [x] Verify: full test suite `npx vitest run` passes

### 8. Create migration script

- [x] Create `scripts/migrate-hidden-by-tier.ts` following the pattern of `scripts/migrate-user-tiers.ts`:
  - dotenv config (`.env.local`, `.env`)
  - Guard on missing `MONGODB_URI`
  - Raw `MongoClient` connection
  - `recipes.updateMany({ hiddenByTier: { $exists: false } }, { $set: { hiddenByTier: false } })`
  - `cookbooks.updateMany({ hiddenByTier: { $exists: false } }, { $set: { hiddenByTier: false } })`
  - Log modified counts; exit 0 on success, exit 1 on error
- [x] Add `"db:migrate-hidden-by-tier": "tsx scripts/migrate-hidden-by-tier.ts"` to `package.json` scripts
- [x] Manual smoke test: `npm run db:migrate-hidden-by-tier` against local Docker MongoDB — confirm counts logged, re-run confirms 0 modified

## Validation

- [x] `npx vitest run` — all unit/integration tests pass
- [x] `npm run build` — TypeScript compiles with no errors
- [x] `npx tsc --noEmit` — strict type check passes
- [x] `npm run test:e2e` — E2E suite passes (or confirm no E2E coverage for this path)
- [x] Manual: `npm run db:migrate-hidden-by-tier` runs cleanly against local DB
- [x] All execution sub-tasks above checked off

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npx vitest run`; all tests must pass
- **Integration tests** — included in `npx vitest run` (node environment tests)
- **Build** — `npm run build`; must succeed with no errors
- **Type check** — `npx tsc --noEmit`; must pass
- If **ANY** of the above fail, iterate and fix before pushing

## PR and Merge

- [x] Run required pre-PR self-review from `.agent/skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to `feat/tier-content-limits` and push to remote
- [x] Open PR from `feat/tier-content-limits` to `main`
- [x] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [x] Enable auto-merge: `gh pr merge --auto --merge`
- [x] **Monitor PR comments** — poll autonomously; address comments, commit fixes, follow remote push validation steps, push, wait 180s, repeat until no unresolved comments
- [x] **Monitor CI checks** — poll autonomously; diagnose failures, fix, commit, follow remote push validation steps, push, wait 180s, repeat until all checks pass
- [x] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify user; **never force-merge**

Ownership metadata:

- Implementer: Claude Code agent
- Reviewer(s): dougis (auto-assigned)
- Required approvals: 1

Blocking resolution flow:

- CI failure → diagnose → fix → `npx vitest run` + `npm run build` → commit → push → re-check
- Security finding → remediate → commit → push → re-scan
- Review comment → address → commit → `npx vitest run` → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify `enforceContentLimit`, `hiddenByTier` model fields, and migration script appear on `main`
- [x] Mark all remaining tasks as complete
- [x] No documentation updates required beyond `package.json` script (already in code)
- [x] Sync approved spec deltas: copy `openspec/changes/enforce-tier-content-limits/specs/*.md` into `openspec/specs/` (create dir if needed)
- [x] Archive the change: move `openspec/changes/enforce-tier-content-limits/` to `openspec/changes/archive/YYYY-MM-DD-enforce-tier-content-limits/` — stage both copy and deletion in **one commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-enforce-tier-content-limits/` exists and `openspec/changes/enforce-tier-content-limits/` is gone
- [x] Commit and push archive to `main` in one commit
- [x] Prune merged branch: `git fetch --prune` and `git branch -d feat/tier-content-limits`
