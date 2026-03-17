## 1. Branch Setup

- [x] 1.1 Create feature branch: `git checkout -b feat/suppress-empty-image-space`

## 2. Core Implementation

- [x] 2.1 Update `src/components/recipes/RecipeCard.tsx`: wrap the `h-48` image container in `{recipe.imageUrl && (...)}` and remove the inner `else` placeholder `<div>`
- [x] 2.2 Update `src/components/recipes/RecipeDetail.tsx`: wrap the `h-96` image section in `{recipe.imageUrl && (...)}` and remove the inner `else` placeholder `<div>`

## 3. Tests

- [x] 3.1 Add test to `src/components/recipes/__tests__/RecipeDetail.test.tsx`: assert "No Image Available" placeholder is NOT rendered when `imageUrl` is null
- [x] 3.2 Add test to `src/components/recipes/__tests__/RecipeDetail.test.tsx`: assert `<img>` is rendered when `imageUrl` is provided
- [x] 3.3 Create or update `RecipeCard` test file: assert no image container rendered when `imageUrl` is absent; assert `<img>` rendered when present

## 4. Validation

- [x] 4.1 Run unit tests: `npx vitest run src/components/recipes/`
- [x] 4.2 Run full test suite: `npm run test`
- [x] 4.3 Run build: `npm run build` — must complete with no TypeScript errors
- [x] 4.4 Visually verify in dev server (`npm run dev`): recipe list and detail pages show no empty image space for imageless recipes

## 5. PR and Merge

- [x] 5.1 Commit changes with message referencing issue: `fix: suppress image space when no imageUrl (#159)`
- [x] 5.2 Push branch and create PR; link to issue #159 in the PR body
- [x] 5.3 Enable auto-merge on the PR (per CI/CD standards in `docs/standards/ci-cd.md`)
- [ ] 5.4 Resolve any CI failures or review comments before merge

## 6. Post-Merge

- [ ] 6.1 Delete feature branch after merge
- [ ] 6.2 Run `/opsx:archive` to archive this change
- [ ] 6.3 Sync approved spec delta to `openspec/specs/conditional-recipe-image/spec.md`
