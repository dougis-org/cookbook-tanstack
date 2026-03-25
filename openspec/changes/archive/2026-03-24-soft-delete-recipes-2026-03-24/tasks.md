## 1. Branch Setup

- [x] 1.1 Check out `main` and pull latest: `git checkout main && git pull`
- [x] 1.2 Create feature branch: `git checkout -b feat/soft-delete-recipes`

## 2. Tests First (TDD)

- [x] 2.1 In `src/server/trpc/routers/__tests__/recipes.test.ts`, add a `describe('delete — soft delete')` block with failing tests covering:
  - Deleted recipe document remains in collection with `deleted: true`
  - Deleted recipe is NOT returned by `recipes.list`
  - Deleted recipe is NOT returned by `recipes.getById`
  - Cookbook entries for the deleted recipe are still removed
  - RecipeLike documents for the deleted recipe are still removed
- [x] 2.2 Add a test that a recipe without the `deleted` field is still returned by list and getById (backward compatibility)
- [x] 2.3 Confirm all new tests fail: `npx vitest run src/server/trpc/routers/__tests__/recipes.test.ts`

## 3. Recipe Model Changes

- [x] 3.1 Add `deleted` field to `IRecipe` interface in `src/db/models/recipe.ts`:
  ```ts
  deleted?: boolean;
  ```
- [x] 3.2 Add `deleted` field to `recipeSchema` with `default: false`
- [x] 3.3 Add sparse index on `deleted`: `recipeSchema.index({ deleted: 1 });`
- [x] 3.4 Add Mongoose pre-find middleware after the index definitions, covering `find`, `findOne`, `findOneAndUpdate`, and `countDocuments` — each injecting `{ deleted: { $ne: true } }` into the query filter
- [x] 3.5 Add a comment block above the middleware explaining: (a) what it does, (b) why `$ne: true` is used, (c) that the write path must use `updateOne` to bypass it

## 4. Delete Mutation

- [x] 4.1 In `src/server/trpc/routers/recipes.ts`, inside the `delete` mutation transaction, replace:
  ```ts
  await Recipe.findByIdAndDelete(input.id, { session });
  ```
  with:
  ```ts
  // Use updateOne (not findByIdAndUpdate) to bypass the pre-find middleware
  await Recipe.updateOne({ _id: input.id }, { $set: { deleted: true } }, { session });
  ```
- [x] 4.2 Leave the `Cookbook.updateMany` and `RecipeLike.deleteMany` operations unchanged

## 5. Validation

- [x] 5.1 Run unit/integration tests and confirm all pass: `npm run test`
- [x] 5.2 Run E2E tests: `npm run test:e2e`
- [x] 5.3 Run build to catch type errors: `npm run build`
- [ ] 5.4 Manually smoke-test: delete a recipe in dev, verify it disappears from UI and cookbook, then check MongoDB directly to confirm document remains with `deleted: true`

## 6. PR and Merge

- [x] 6.1 Stage and commit: `git add src/db/models/recipe.ts src/server/trpc/routers/recipes.ts src/server/trpc/routers/__tests__/recipes.test.ts`
- [x] 6.2 Create PR referencing issue #204; enable auto-merge
- [ ] 6.3 Monitor CI — resolve any failing checks before merging
- [ ] 6.4 If Codacy or Snyk flags issues, address before merge

## 7. Post-Merge

- [x] 7.1 Sync approved spec deltas back to canonical specs:
  - Copy `openspec/changes/soft-delete-recipes-2026-03-24/specs/recipe-soft-delete/spec.md` → `openspec/specs/recipe-soft-delete/spec.md`
  - Apply MODIFIED delta to `openspec/specs/recipe-delete-cascade/spec.md` (update R1)
- [ ] 7.2 Archive the change: `/opsx:archive soft-delete-recipes-2026-03-24`
- [ ] 7.3 Delete local feature branch: `git branch -d feat/soft-delete-recipes`
