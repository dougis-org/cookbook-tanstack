# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/gate-recipe-import` then immediately `git push -u origin feat/gate-recipe-import`

## Execution

### 1. Add tier gate and count limit to `recipes.import`

- [x] In `src/server/trpc/routers/recipes.ts`, import `canImport` from `@/lib/tier-entitlements` (already imported file — add to existing import)
- [x] At the top of the `import` mutation handler, before any other logic, add:
  ```typescript
  if (!ctx.user.isAdmin && !canImport(ctx.user.tier as EntitlementTier)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Recipe import requires Sous Chef or higher.",
    });
  }
  await enforceContentLimit(ctx.user.id, ctx.user.tier ?? undefined, ctx.user.isAdmin ?? false, "recipes");
  ```
- [x] Verify: `npx tsc --noEmit` passes

### 2. Write tests

- [x] In `src/server/trpc/routers/__tests__/recipes.test.ts`, add a new describe block `"recipes.import — tier gate and count limit"` covering:
  - `home-cook` → FORBIDDEN (tier gate)
  - `prep-cook` → FORBIDDEN (tier gate)
  - `sous-chef` under limit → allowed
  - `sous-chef` at limit (500 recipes) → FORBIDDEN (count gate) — seed with `Recipe.insertMany` for speed
  - admin with `home-cook` tier → allowed
- [x] Update existing `recipes.import` describe block: change `makeAuthCaller(user.id)` (no tier) to `makeAuthCaller(user.id, { tier: "sous-chef" })` so existing tests still pass with the new gate
- [x] Verify: `npx vitest run src/server/trpc/routers/__tests__/recipes.test.ts` passes

### 3. Full validation

- [x] `npx vitest run` — all tests pass
- [x] `npm run build` — succeeds
- [x] `npx tsc --noEmit` — passes

## Remote Push Validation

All must pass before pushing:

- **Unit tests** — `npx vitest run`
- **Build** — `npm run build`
- **Type check** — `npx tsc --noEmit`

## PR and Merge

- [x] Run pre-PR self-review from `.agent/skills/openspec-apply-change/SKILL.md`
- [x] Commit all changes to `feat/gate-recipe-import` and push
- [ ] Open PR from `feat/gate-recipe-import` to `main`
- [ ] Wait 180 seconds for CI and agentic reviewers
- [ ] Enable auto-merge: `gh pr merge --auto --merge`
- [ ] **Monitor PR comments** — address, commit, push, wait 180s, repeat
- [ ] **Monitor CI checks** — diagnose failures, fix, push, repeat
- [ ] **Poll for merge** — `gh pr view --json state`; when `MERGED` proceed to Post-Merge

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify `canImport` gate and `enforceContentLimit` call present in `recipes.import` on `main`
- [ ] Sync specs: copy `openspec/changes/gate-recipe-import/specs/*.md` into `openspec/specs/`
- [ ] Archive: move `openspec/changes/gate-recipe-import/` to `openspec/changes/archive/YYYY-MM-DD-gate-recipe-import/`
- [ ] Commit and push archive to `main`
- [ ] Prune: `git fetch --prune` and `git branch -d feat/gate-recipe-import`
