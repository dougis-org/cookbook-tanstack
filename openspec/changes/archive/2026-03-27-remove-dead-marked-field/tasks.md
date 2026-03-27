## 1. Execution

- [x] 1.1 Check out `main` and pull latest: `git checkout main && git pull`
- [x] 1.2 Create feature branch: `git checkout -b remove-dead-marked-field`

## 2. Schema and Model

- [x] 2.1 Remove `marked` from `IRecipe` interface in `src/db/models/recipe.ts`
- [x] 2.2 Remove `marked` from `recipeSchema` field definitions in `src/db/models/recipe.ts`

## 3. Client Type

- [x] 3.1 Remove `marked: boolean` from the `Recipe` interface in `src/types/recipe.ts`

## 4. tRPC Routers

- [x] 4.1 Remove `marked: (r.marked ?? false)` from the `byId` response projection in `src/server/trpc/routers/recipes.ts`
- [x] 4.2 Remove `marked: (d.marked ?? false)` from the recipe projection in `src/server/trpc/routers/cookbooks.ts`

## 5. Validation

- [x] 5.1 Remove `marked: z.boolean().optional()` from `importedRecipeSchema` in `src/lib/validation.ts`

## 6. Test Fixtures

- [x] 6.1 Remove `marked: false` from the raw legacy-document insert fixture in `src/server/trpc/routers/__tests__/recipes.test.ts`
- [x] 6.2 Remove `marked: false` from the recipe fixture in `src/lib/__tests__/export.test.ts`

## 7. Validation

- [x] 7.1 Run TypeScript build to verify no missed references: `npm run build`
- [x] 7.2 Run unit and integration tests: `npm run test`
- [x] 7.3 Confirm no remaining `\.marked` references on Recipe/IRecipe: `grep -n "\.marked" src/`

## 8. PR and Merge

- [x] 8.1 Commit all changes with message: `chore(recipe): remove dead marked field from schema and response types`
- [x] 8.2 Push branch and open PR against `main`, referencing `Closes #219` and `Part of #181`
- [x] 8.3 Enable auto-merge on the PR
- [x] 8.4 Resolve any CI failures or review comments before merge

## 9. Post-Merge

- [ ] 9.1 Archive this change: `/opsx:archive remove-dead-marked-field`
- [ ] 9.2 Delete local feature branch after merge
- [ ] 9.3 Start next issue: #220 (embed real per-user marked status in responses)
