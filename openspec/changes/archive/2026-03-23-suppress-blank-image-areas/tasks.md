## 1. Branch Setup

- [x] 1.1 Pull latest `main` and create branch `suppress-blank-image-areas`

## 2. CardImage Component

- [x] 2.1 Create `src/components/ui/CardImage.tsx` — props: `src?: string | null`, `alt: string`, `className?: string`; returns `null` when `src` is falsy; renders `<div className={className}><img ... className="w-full h-full object-cover" /></div>` when truthy

## 3. RecipeCard and RecipeDetail — Refactor to CardImage

- [x] 3.1 In `src/components/recipes/RecipeCard.tsx`, replace the `{recipe.imageUrl && (...)}` block with `<CardImage src={recipe.imageUrl} alt={recipe.name} className="h-48 bg-gray-200 dark:bg-gray-700" data-testid="recipe-card-image" />`
- [x] 3.2 In `src/components/recipes/RecipeDetail.tsx`, replace the `{recipe.imageUrl && (...)}` block with `<CardImage src={recipe.imageUrl} alt={recipe.name} className="h-96 bg-gray-200 dark:bg-gray-700" data-testid="recipe-detail-image" />`
- [x] 3.3 Verify `RecipeCard` and `RecipeDetail` tests still pass — behaviour is unchanged, only the implementation changes

## 4. CategoryCard — Remove Image Block

- [x] 4.1 Delete the `h-40` image container div (and its inner "No Image" div) from `src/components/categories/CategoryCard.tsx`
- [x] 4.2 Verify no tests reference the removed image container; update any that do

## 5. CookbookCard — CardImage Header + Inline Icon + Badge in Body

- [x] 5.1 Replace the `h-40` header block with `<CardImage src={cookbook.imageUrl} alt={cookbook.name} className="h-40 bg-gray-200 dark:bg-gray-700" />` in `src/components/cookbooks/CookbookCard.tsx`
- [x] 5.2 Add `BookOpen` icon inline left of the title in the card body, rendered only when `!cookbook.imageUrl` (`w-5 h-5 text-gray-400 flex-shrink-0`)
- [x] 5.3 Move the Private badge out of the image container and into the card body (alongside the recipe count), visible regardless of image state
- [x] 5.4 Update `src/components/cookbooks/__tests__/CookbookCard.test.tsx` to assert: no header when no image, icon present in title when no image, badge in card body always

## 6. Cookbook Detail Thumbnails

- [x] 6.1 In `src/routes/cookbooks.$cookbookId.tsx`, replace the recipe row `h-12 w-12` thumbnail div with `<CardImage src={recipe.imageUrl} alt={recipe.name} className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0" />`
- [x] 6.2 Replace the picker `h-10 w-10` thumbnail div with `<CardImage src={r.imageUrl} alt={r.name} className="h-10 w-10 bg-gray-600 rounded overflow-hidden flex-shrink-0" />`

## 7. Validation

- [x] 7.1 Run `npm run test` — all unit tests pass
- [x] 7.2 Run `npm run test:e2e` — all E2E tests pass
- [x] 7.3 Visually verify in browser: recipe cards (with/without image), recipe detail, category cards, cookbook cards (with/without image), cookbook recipe list, add-recipe picker

## 8. PR and Merge

- [x] 8.1 Push branch and open PR targeting `main`
- [x] 8.2 Enable auto-merge on the PR
- [x] 8.3 Resolve any CI failures or review comments before merge

## 9. Post-Merge

- [x] 9.1 Promote `openspec/changes/suppress-blank-image-areas/specs/conditional-image-display/spec.md` to `openspec/specs/conditional-image-display/spec.md`
- [x] 9.2 Archive or supersede `openspec/specs/conditional-recipe-image/spec.md` (requirements now covered by `conditional-image-display`)
- [x] 9.3 Run `/opsx:archive` to archive the change
- [x] 9.4 Delete the local feature branch
