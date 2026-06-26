# Tasks

## Preparation

- [ ] **Step 1 — Verify #491 (PR #539) is merged:** Confirm `canUsePrivateRecipeNotes` exists in `src/lib/tier-entitlements.ts` before starting. If not merged, either wait or inline `hasAtLeastTier({ tier }, 'sous-chef')` temporarily.
- [ ] **Step 2 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 3 — Create and publish working branch:** `git checkout -b feat/private-recipe-notes-router` then immediately `git push -u origin feat/private-recipe-notes-router`

## Execution

### Task 1 — Verify Recipe model owner field

- [ ] Confirm `src/db/models/recipe.ts` uses `userId` (not `ownerId`) as the owner field on `IRecipe`.
- [ ] Note: Recipe visibility query in `upsert` must use `{ userId: new Types.ObjectId(ctx.user.id) }`, not `ownerId`.
- **Verification:** `grep -n "userId\|ownerId" src/db/models/recipe.ts`

### Task 2 — Write integration tests (TDD: tests first)

- [ ] Create `src/server/trpc/routers/__tests__/privateRecipeNotes.test.ts`
- [ ] Import test helpers: `makeAnonCaller`, `makeAuthCaller`, `makeTieredCaller`, `seedUserWithBetterAuth` from `src/server/trpc/routers/__tests__/test-helpers.ts`
- [ ] Import `RecipeNote` and `Recipe` from `src/db/models`
- [ ] Write tests covering all acceptance-criteria scenarios from `openspec/changes/private-recipe-notes-router/specs/private-recipe-notes-router/spec.md`:

  **`get` scenarios:**
  - Anonymous caller → `UNAUTHORIZED`
  - home-cook, no note → `{ hasNote: false, note: null }`
  - home-cook, note exists → `{ hasNote: true, note: null }`
  - prep-cook, note exists → `{ hasNote: true, note: null }`
  - sous-chef, no note → `{ hasNote: false, note: null }`
  - sous-chef, note exists → `{ hasNote: true, note: { body, updatedAt } }`
  - executive-chef, note exists → `{ hasNote: true, note: { body, updatedAt } }`

  **`upsert` scenarios:**
  - home-cook → `FORBIDDEN`
  - prep-cook → `FORBIDDEN`
  - body = 10001 chars → `BAD_REQUEST`
  - unknown recipeId → `NOT_FOUND`
  - public recipe → note created, get returns full note as sous-chef
  - own private recipe → note created successfully
  - second upsert overwrites first (exactly one document in DB)
  - body = 10000 chars → accepted

  **`delete` scenarios:**
  - home-cook → `FORBIDDEN`
  - sous-chef, note exists → deleted; get returns `{ hasNote: false, note: null }`
  - sous-chef, no note → `NOT_FOUND`

- [ ] Run tests — all should fail (router doesn't exist yet)
- **Verification:** `npx vitest run src/server/trpc/routers/__tests__/privateRecipeNotes.test.ts`

### Task 3 — Implement `src/server/trpc/routers/privateRecipeNotes.ts`

- [ ] Create `src/server/trpc/routers/privateRecipeNotes.ts`
- [ ] Imports needed:
  - `z` from `"zod"`
  - `TRPCError` from `"@trpc/server"`
  - `protectedProcedure`, `tierProcedure`, `router` from `"../init"`
  - `Recipe`, `RecipeNote` from `"@/db/models"`
  - `canUsePrivateRecipeNotes` from `"@/lib/tier-entitlements"`
  - `objectId` from `"./_helpers"`
  - `Types` from `"mongoose"`

- [ ] Implement `get`:
  ```
  protectedProcedure
    .input(z.object({ recipeId: objectId }))
    .query(async ({ ctx, input }) => {
      const userId = new Types.ObjectId(ctx.user.id)
      const recipeId = new Types.ObjectId(input.recipeId)
      const note = await RecipeNote.findOne({ userId, recipeId }).lean()
      if (!note) return { hasNote: false, note: null }
      if (!canUsePrivateRecipeNotes(ctx.user.tier)) return { hasNote: true, note: null }
      return { hasNote: true, note: { body: note.body, updatedAt: note.updatedAt } }
    })
  ```

- [ ] Implement `upsert`:
  ```
  tierProcedure('sous-chef')
    .input(z.object({ recipeId: objectId, body: z.string().max(10000) }))
    .mutation(async ({ ctx, input }) => {
      const userId = new Types.ObjectId(ctx.user.id)
      const recipeId = new Types.ObjectId(input.recipeId)
      const recipe = await Recipe.findOne({
        _id: recipeId,
        $or: [{ isPublic: true }, { userId }],
        deleted: { $ne: true },
      }).lean()
      if (!recipe) throw new TRPCError({ code: 'NOT_FOUND' })
      await RecipeNote.findOneAndUpdate(
        { userId, recipeId },
        { body: input.body },
        { upsert: true, new: true },
      )
      return { success: true }
    })
  ```

- [ ] Implement `delete`:
  ```
  tierProcedure('sous-chef')
    .input(z.object({ recipeId: objectId }))
    .mutation(async ({ ctx, input }) => {
      const userId = new Types.ObjectId(ctx.user.id)
      const recipeId = new Types.ObjectId(input.recipeId)
      const result = await RecipeNote.deleteOne({ userId, recipeId })
      if (result.deletedCount === 0) throw new TRPCError({ code: 'NOT_FOUND' })
      return { success: true }
    })
  ```

- [ ] Export `privateRecipeNotesRouter`
- **Verification:** `npx vitest run src/server/trpc/routers/__tests__/privateRecipeNotes.test.ts` — all tests should pass

### Task 4 — Register router on `appRouter`

- [ ] Edit `src/server/trpc/router.ts`
- [ ] Add import: `import { privateRecipeNotesRouter } from './routers/privateRecipeNotes'`
- [ ] Add to `appRouter`: `privateRecipeNotes: privateRecipeNotesRouter,`
- **Verification:**
  - `npx tsc --noEmit` — no type errors
  - `npm run test` — all existing tests still pass

### Task 5 — Full validation pass

- [ ] `npx vitest run src/server/trpc/routers/__tests__/privateRecipeNotes.test.ts`
- [ ] `npm run test`
- [ ] `npx tsc --noEmit`
- [ ] `npm run build`

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] All `privateRecipeNotes` integration tests pass
- [ ] All pre-existing router tests pass (no regressions in `recipes`, `cookbooks`, etc.)
- [ ] `npx tsc --noEmit` passes with no errors
- [ ] `npm run build` succeeds
- [ ] No security findings from Codacy/Snyk (run if available)

## Remote push validation

**Full path** (code changes present):

- **Unit/integration tests:** `npm run test` — all must pass
- **Build:** `npm run build` — must succeed with no errors

If any step fails, fix before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings automatically addressed before the final commit
- [ ] Commit all changes and push to `feat/private-recipe-notes-router`
- [ ] Open PR from `feat/private-recipe-notes-router` to `main`. PR body must include:
  - `Closes #492`
  - Summary of the three procedures and their tier gates
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] Wait 180 seconds for CI and agentic reviewers
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before anything else
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address each unresolved thread, commit fixes, run [Remote push validation], push, wait 180 seconds; repeat until all threads resolved
  3. **CI check failures** — poll `gh pr checks <PR-URL> --json isRequired,state`; fix failing required checks, commit, run [Remote push validation], push, wait 180 seconds; restart from step 1

Ownership metadata:
- Implementer: (agent)
- Reviewer(s): (auto — Copilot/Codacy)
- Required approvals: per repo ruleset

Blocking resolution flow:
- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify `privateRecipeNotes` router is present on the default branch
- [ ] Mark all tasks complete
- [ ] Sync spec delta to global spec: copy `openspec/changes/private-recipe-notes-router/specs/private-recipe-notes-router/spec.md` to `openspec/specs/private-recipe-notes-router/spec.md`; update relative links from `../../design.md` to `../../changes/archive/YYYY-MM-DD-private-recipe-notes-router/design.md`
- [ ] Archive the change: move `openspec/changes/private-recipe-notes-router/` to `openspec/changes/archive/YYYY-MM-DD-private-recipe-notes-router/` in a single atomic commit (copy + delete staged together)
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-private-recipe-notes-router/` exists and `openspec/changes/private-recipe-notes-router/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-private-recipe-notes-router` then `git push -u origin doc/archive-YYYY-MM-DD-private-recipe-notes-router`
- [ ] Open PR from doc branch to `main` with title `docs: archive private-recipe-notes-router (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor doc PR until merged; address any comments/CI failures on the doc branch
- [ ] `git fetch --prune` and `git branch -D feat/private-recipe-notes-router doc/archive-YYYY-MM-DD-private-recipe-notes-router`
