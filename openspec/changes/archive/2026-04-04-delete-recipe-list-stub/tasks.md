## 1. Preparation

- [x] 1.1 Checkout `main` and pull with fast-forward only (`git checkout main && git pull --ff-only`)
- [x] 1.2 Create working branch `chore/delete-recipe-list-stub` and push to remote (`git checkout -b chore/delete-recipe-list-stub && git push -u origin chore/delete-recipe-list-stub`)

## 2. Execution

- [x] 2.1 Delete `src/components/recipes/RecipeList.tsx`

## 3. Validation

- [x] 3.1 Run `npm run build` — confirm zero TypeScript errors and no missing import warnings
- [x] 3.2 Run `npm run test` — confirm all unit/integration tests pass

## 4. PR and Merge

- [x] 4.1 Commit deletion and push to remote
- [x] 4.2 Open PR from `chore/delete-recipe-list-stub` → `main` with title `chore: delete unused RecipeList stub component (closes #194)`
- [x] 4.3 Enable auto-merge once CI is green and no blocking review comments remain
- [x] 4.4 Monitor CI checks and address any review comments; push fixes until PR is clean

## 5. Post-Merge

- [x] 5.1 Checkout `main` and pull; verify deletion appears on default branch
- [ ] 5.2 Archive this change (`openspec archive change delete-recipe-list-stub`) as a single atomic commit; push to `main`
- [ ] 5.3 Prune merged local branch (`git branch -d chore/delete-recipe-list-stub`)
