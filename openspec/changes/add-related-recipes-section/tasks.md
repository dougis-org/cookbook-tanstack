## 1. Preparation

- [x] 1.1 Checkout `main` and pull with fast-forward only (`git checkout main && git pull --ff-only`)
- [x] 1.2 Create feature branch `feature/add-related-recipes-section` and push to remote (`git checkout -b feature/add-related-recipes-section && git push -u origin feature/add-related-recipes-section`)

## 2. Tests (TDD — write before implementation)

- [x] 2.1 Create `src/components/recipes/RelatedRecipesSection.test.tsx` with tests covering:
  - Renders heading and recipe cards when related recipes exist
  - Does not render when `classificationId` is undefined/null
  - Does not render when query returns empty results
  - Excludes the current recipe from displayed cards
  - Each card links to `/recipes/$recipeId`
  - Section has `print:hidden` class (or equivalent)
- [x] 2.2 Run `npx vitest run src/components/recipes/RelatedRecipesSection.test.tsx` — confirm all tests fail (red)

## 3. Implementation

- [x] 3.1 Create `src/components/recipes/RelatedRecipesSection.tsx`:
  - Props: `classificationId: string | null | undefined`, `currentRecipeId: string`
  - Uses `useQuery(trpc.recipes.list.queryOptions({ classificationIds: [classificationId], pageSize: 7 }))` when `classificationId` is set
  - Filters out `currentRecipeId` from results client-side
  - Returns `null` when `classificationId` is absent, query is loading, or filtered results are empty
  - Renders a `print:hidden` section with heading "Related Recipes" and a responsive grid of `<Link>`-wrapped `RecipeCard` components
- [x] 3.2 Add `RelatedRecipesSection` below `<RecipeDetail>` in `src/routes/recipes/$recipeId.tsx`:
  - Import `RelatedRecipesSection`
  - Render `<RelatedRecipesSection classificationId={recipe.classificationId} currentRecipeId={recipeId} />` after the existing `<div className="mt-8 ...">` block

## 4. Validation

- [x] 4.1 Run unit tests: `npx vitest run src/components/recipes/RelatedRecipesSection.test.tsx` — all pass (green)
- [x] 4.2 Run full test suite: `npm run test` — no regressions
- [x] 4.3 Run E2E tests: `npm run test:e2e` — no regressions
- [x] 4.4 Manual smoke test in browser:
  - Visit a recipe with a `classificationId` that has related recipes → section visible with cards
  - Click a related recipe card → navigates to that recipe's detail page
  - Visit a recipe with no `classificationId` → section absent
  - Print the page → section absent from print output
- [x] 4.5 TypeScript check: `npm run build` — no type errors

## 5. PR and Merge

- [ ] 5.1 Commit all changes to `feature/add-related-recipes-section` and push
- [ ] 5.2 Open PR from `feature/add-related-recipes-section` → `main` with title "feat: add related recipes section to recipe detail page"; enable auto-merge
- [ ] 5.3 Monitor CI — if checks fail: diagnose, fix, commit, push, repeat until green
- [ ] 5.4 Monitor review comments — address each, commit fixes, push, repeat until no unresolved comments remain
- [ ] 5.5 Confirm auto-merge completes (or merge manually once all checks pass and comments resolved)

## 6. Post-Merge

- [ ] 6.1 Checkout `main` and pull (`git checkout main && git pull --ff-only`)
- [ ] 6.2 Verify merged changes appear on `main`
- [ ] 6.3 Sync approved spec to `openspec/specs/related-recipes-section/spec.md` (copy from change specs)
- [ ] 6.4 Archive change directory as a single atomic commit: copy `openspec/changes/add-related-recipes-section/` to `openspec/archive/add-related-recipes-section/` and delete the original in the same commit
- [ ] 6.5 Push archive commit to `main`
- [ ] 6.6 Delete local feature branch (`git branch -d feature/add-related-recipes-section`)
