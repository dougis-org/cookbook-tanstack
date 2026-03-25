## 1. Execution

- [x] 1.1 Check out `main` branch and pull latest: `git checkout main && git pull`
- [x] 1.2 Create feature branch: `git checkout -b feat/cookbook-print-view`

## 2. Write Failing Tests — tRPC procedure

Write tests first in `src/server/trpc/routers/__tests__/cookbooks.test.ts` — all should fail (procedure does not exist yet):

- [x] 2.1 `printById` returns full recipe fields: `ingredients`, `instructions`, `notes`, `prepTime`, `cookTime`, `servings`, `difficulty`, `calories`, `classificationName`, `sourceName`, `meals`, `courses`, `preparations`
- [x] 2.2 `printById` returns recipes in `orderIndex` order (not insertion order)
- [x] 2.3 `printById` returns `null` for a private cookbook when called without auth
- [x] 2.4 `printById` returns `null` for an unknown cookbook ID

## 3. Write Failing Tests — RecipeDetail component

Write tests first in `src/components/recipes/__tests__/RecipeDetail.test.tsx` — should fail (prop does not exist yet):

- [x] 3.1 `<RecipeDetail hideServingAdjuster />` does not render `ServingSizeAdjuster` for a recipe with servings data
- [x] 3.2 `<RecipeDetail />` (default, no prop) still renders `ServingSizeAdjuster` for a recipe with servings data (regression guard — should pass already)

## 4. Write Failing Tests — Playwright E2E

Write tests first — all should fail (route does not exist yet):

### Print route behaviour

- [x] 4.1 Unauthenticated user can load `/cookbooks/$cookbookId/print` for a public cookbook without redirect
- [x] 4.2 Unauthenticated user sees not-found state for a private cookbook print route
- [x] 4.3 TOC section lists all recipes in cookbook order with correct 1-based position numbers
- [x] 4.4 Each recipe section has the `cookbook-recipe-section` CSS class
- [x] 4.5 Computed style of `.cookbook-recipe-section` has `break-before: page` or `page-break-before: always` (via `page.evaluate`)
- [x] 4.6 No `<img>` elements are present on the print route
- [x] 4.7 `ServingSizeAdjuster` is not present in the DOM on the print route
- [x] 4.8 Back link and Print button elements carry the `print:hidden` class

### Cookbook detail navigation

- [x] 4.9 Print button on cookbook detail page is an `<a>` (Link) pointing to the print route URL, not a `<button>` with `onclick`

## 5. Implement: tRPC `cookbooks.printById` procedure

- [x] 5.1 In `src/server/trpc/routers/cookbooks.ts`, add side-effect imports for `source`, `meal`, `course`, `preparation` models (needed for `.populate()` chains)
- [x] 5.2 Implement `printById` procedure: input `{ id: ObjectId }`, apply `visibilityFilter`, fetch cookbook, sort stubs by `orderIndex`, fetch all recipe docs with `.populate("classificationId", "name").populate("sourceId", "name url").populate("mealIds", "name").populate("courseIds", "name").populate("preparationIds", "name")`, return cookbook metadata + ordered `FullRecipe[]` (no `imageUrl`)
- [x] 5.3 Run `npm run test` — tasks 2.1–2.4 should now pass

## 6. Implement: RecipeDetail `hideServingAdjuster` prop

- [x] 6.1 In `src/components/recipes/RecipeDetail.tsx`, add optional `hideServingAdjuster?: boolean` prop to `RecipeDetailProps`
- [x] 6.2 Wrap the `ServingSizeAdjuster` render block with `{!hideServingAdjuster && <ServingSizeAdjuster ... />}`
- [x] 6.3 Run `npm run test` — tasks 3.1–3.2 should now pass

## 7. Implement: CSS page-break rules

- [x] 7.1 In `src/styles/print.css`, add inside the `@media print` block:
  ```css
  .cookbook-recipe-section {
    break-before: page;
    page-break-before: always;
  }
  ```
  Note: do NOT add `break-after` to a TOC section — both rules would fire at the TOC/recipe-1 boundary and insert a blank page.

## 8. Implement: New route `cookbooks.$cookbookId_.print.tsx`

- [x] 8.1 Create `src/routes/cookbooks.$cookbookId_.print.tsx` exporting `Route = createFileRoute('/cookbooks/$cookbookId_/print')` and `CookbookPrintPage` component
- [x] 8.2 Implement loading and not-found states (match TOC route pattern)
- [x] 8.3 Implement screen-only chrome: back link to `/cookbooks/$cookbookId`, Print button (`window.print()`), breadcrumb — all wrapped `print:hidden`
- [x] 8.4 Render TOC section (no special CSS class needed) — same content structure as the TOC route (cookbook name/description header, numbered recipe list)
- [x] 8.5 Render each recipe in a `<div className="cookbook-recipe-section">` using `<RecipeDetail recipe={recipe} hideServingAdjuster />` — ensure `recipe` prop matches the `Recipe & { meals?, courses?, preparations?, classificationName?, sourceName?, sourceUrl? }` shape expected by `RecipeDetail`
- [x] 8.6 Confirm no `imageUrl` is passed to `RecipeDetail` (omit from `printById` return shape or pass `null`)
- [x] 8.7 Confirm route tree auto-generates: run `npm run dev` and verify `src/routeTree.gen.ts` includes the new route

## 9. Implement: Update cookbook detail Print button

- [x] 9.1 In `src/routes/cookbooks.$cookbookId.tsx`, replace the Print `<button onClick={() => window.print()}>` with `<Link to="/cookbooks/$cookbookId_/print" params={{ cookbookId }}>` with the same visual styling and `<Printer>` icon

## 10. All Tests Green

- [x] 10.1 Run `npm run test` — all Vitest tests pass
- [ ] 10.2 Run `npm run test:e2e` — all Playwright tests pass (tasks 4.1–4.9)
- [x] 10.3 Production build passes: `npm run build`
- [ ] 10.4 Manual: open browser print preview — confirm TOC on first page(s), each recipe on its own page, no blank page between TOC and recipe 1

## 11. PR and Merge

- [ ] 11.1 Commit changes with a conventional commit message referencing issue #192
- [ ] 11.2 Push branch and open PR: `git push -u origin feat/cookbook-print-view`
- [ ] 11.3 Create PR with title: `feat(cookbooks): add dedicated print route with full recipe content (#192)`
- [ ] 11.4 Enable auto-merge on the PR
- [ ] 11.5 Resolve any CI failures or review comments before merge

**Blocking criteria:**
- Build failures → fix TypeScript errors before pushing
- Test failures → fix before marking PR ready
- Security scan findings → address or document as accepted risk with reviewer sign-off

## 12. Post-Merge

- [ ] 12.1 Run `/opsx:archive cookbook-print-view` to archive this change
- [ ] 12.2 Delete local feature branch: `git branch -d feat/cookbook-print-view`
- [ ] 12.3 Close GitHub issue #192
