## 1. Preparation

- [x] 1.1 Check out `main` branch and pull latest remote changes
- [x] 1.2 Create feature branch: `git checkout -b feat/recipe-marked-ui` and push: `git push -u origin feat/recipe-marked-ui`

## 2. Tests — RecipeCard heart indicator (red)

- [x] 2.1 Add test: `marked={true}` renders a filled heart icon (aria-label or `data-testid` on the Heart element)
- [x] 2.2 Add test: `marked={false}` renders an outline heart icon
- [x] 2.3 Add test: `marked` omitted renders no heart icon
- [x] 2.4 Update `makeRecipe` helper in `src/components/recipes/__tests__/RecipeCard.test.tsx` to include `marked` in its type if needed
- [x] 2.5 Confirm new tests fail: `npx vitest run src/components/recipes/__tests__/RecipeCard.test.tsx`

## 3. Tests — detail page uses recipe.marked (red)

- [x] 3.1 Add/update unit test for `$recipeId.tsx`: assert no `isMarked` query is fired on mount (or assert `recipe.marked` is the source of truth)
- [x] 3.2 Confirm new/updated tests fail

## 4. Implement — RecipeCard heart indicator

- [x] 4.1 Add `marked?: boolean` to `RecipeCardProps` (the `Pick<Recipe, ...>` type in `src/components/recipes/RecipeCard.tsx`)
- [x] 4.2 Import `Heart` from `lucide-react`
- [x] 4.3 Render a heart icon when `marked !== undefined`: filled/red when `marked === true`, outline otherwise; position in the card (top-right corner or alongside difficulty badge)
- [x] 4.4 Confirm RecipeCard tests pass: `npx vitest run src/components/recipes/__tests__/RecipeCard.test.tsx`

## 5. Implement — recipe list passes marked through

- [x] 5.1 In `src/routes/recipes/index.tsx`, pass `marked={recipe.marked || undefined}` to `<RecipeCard>` in the list render (pass `undefined` for anonymous callers so the icon is hidden)

## 6. Implement — detail page: remove isMarked query

- [x] 6.1 Remove the `const { data: markedData } = useQuery(trpc.recipes.isMarked.queryOptions(...))` call from `src/routes/recipes/$recipeId.tsx` (lines 29–31)
- [x] 6.2 Replace all `markedData?.marked` references with `recipe?.marked`
- [x] 6.3 Update `toggleMarked.onSuccess` to invalidate `[['recipes', 'byId']]` instead of `[['recipes', 'isMarked']]`

## 7. Refactor Review

- [x] 7.1 Review `$recipeId.tsx` for any residual complexity after removing the `isMarked` query — confirm the component is simpler and there are no dead imports (`isMarked`, unused state, etc.)
- [x] 7.2 Review `RecipeCard` for any duplication between the heart rendering here and the heart on the detail page — note shared pattern in a comment if relevant, but do not over-abstract
- [x] 7.3 Run tests after any cleanup: `npx vitest run`

## 8. Validation

- [x] 8.1 Run full test suite: `npm run test`
- [x] 8.2 Run `npm run build` — no TypeScript errors
- [x] 8.3 Smoke-test locally: start dev server, verify heart icon appears on recipe list cards for a logged-in user, and verify Save/Saved button on detail page still works correctly

## 9. PR and Merge

- [x] 9.1 Commit and push the feature branch
- [x] 9.2 Open PR targeting `main` referencing issue #222
- [x] 9.3 Enable auto-merge on the PR
- [x] 9.4 Resolve any CI failures or review comments before merge

## 10. Post-Merge

- [x] 10.1 Archive this change: run `/opsx:archive recipe-marked-ui`
- [x] 10.2 Sync the approved spec deltas to `openspec/specs/`
- [x] 10.3 Delete the local feature branch after merge: `git branch -d feat/recipe-marked-ui`
