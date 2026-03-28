## 1. Preparation

- [x] 1.1 Checkout `main` and pull with fast-forward only (`git checkout main && git pull --ff-only`)
- [x] 1.2 Create working branch `fix/cookbook-print-toc-layout` and push to remote (`git push -u origin fix/cookbook-print-toc-layout`)

## 2. RED — Write failing Vitest tests for `CookbookTocList`

Write tests in `src/components/cookbooks/__tests__/CookbookStandaloneLayout.test.tsx` before any implementation. All tests in this section must fail (component does not exist yet).

- [x] 2.1 Add a `describe('CookbookTocList')` block with a test: flat TOC (no chapters) renders all recipe names and sequential 1-based position numbers
- [x] 2.2 Add test: flat TOC `<ol>` carries the `print:columns-2` and `print:gap-8` classes
- [x] 2.3 Add test: each `<li>` in the flat TOC carries the `print:break-inside-avoid` class
- [x] 2.4 Add test: each recipe entry renders as a `<Link>` to `/recipes/$recipeId`
- [x] 2.5 Add test: chapter-grouped TOC renders chapter headings and groups recipes under the correct chapter
- [x] 2.6 Add test: chapter-grouped TOC uses a single global counter across all chapters (recipe 3 in chapter 2 is numbered "3.", not "1.")
- [x] 2.7 Add test: each chapter `<ol>` carries `print:columns-2` and `print:gap-8` classes
- [x] 2.8 Add test: chapter heading carries the `print:break-after-avoid` class
- [x] 2.9 Run `npx vitest run src/components/cookbooks/__tests__/CookbookStandaloneLayout.test.tsx` — confirm all new tests fail (RED)

## 3. GREEN — Implement `CookbookTocList`

- [x] 3.1 Add `CookbookTocList` component and export to `src/components/cookbooks/CookbookStandaloneLayout.tsx` with props `{ recipes: TocRecipe[], chapters: TocChapter[] }` — handles flat and chapter-grouped layouts, always renders `<Link to="/recipes/$recipeId">` entries, applies `print:columns-2 print:gap-8 print:space-y-0` on `<ol>`, `print:break-inside-avoid` on `<li>`, `print:break-after-avoid` on chapter headings, global sequential numbering across chapters
- [x] 3.2 Run `npx vitest run src/components/cookbooks/__tests__/CookbookStandaloneLayout.test.tsx` — confirm all new tests pass (GREEN)

## 4. RED — Write failing E2E tests for the corrected print route TOC

Add tests to `src/e2e/cookbooks-print.spec.ts` before touching the route. Tests reference behaviour the print route does not yet have.

- [x] 4.1 Add E2E test: TOC `<ol>` in the print route carries the `print:columns-2` class (verify via `.toHaveClass(/print:columns-2/)` on the list element)
- [x] 4.2 Add E2E test: for a cookbook with chapters, the print route TOC renders chapter headings above their grouped recipes
- [x] 4.3 Add E2E test: TOC recipe entries in the print route are `<a>` links pointing to `/recipes/$recipeId`
- [x] 4.4 Run `npm run test:e2e -- --grep "Cookbook Print"` — confirm new tests fail (RED)

## 5. GREEN — Refactor routes to use `CookbookTocList`

- [x] 5.1 Import `CookbookTocList` in `src/routes/cookbooks.$cookbookId_.toc.tsx`; replace the inline flat `<ol>` and chapter-grouped `<div>` JSX with `<CookbookTocList recipes={recipes} chapters={chapters} />`; remove any now-unused imports
- [x] 5.2 Run `npx vitest run` — confirm unit tests still pass after TOC route refactor
- [x] 5.3 Destructure `chapters` from `printData` in `src/routes/cookbooks.$cookbookId_.print.tsx`; import `CookbookTocList`; replace the flat `<ol className="space-y-2 mb-8">` block with `<CookbookTocList recipes={recipes} chapters={chapters} />`; remove any now-unused imports
- [x] 5.4 Run `npx vitest run` — confirm unit tests still pass after print route refactor
- [x] 5.5 Run `npm run test:e2e -- --grep "Cookbook Print"` — confirm all E2E tests (new and existing) pass (GREEN)

## 6. REFACTOR — Simplify and clean up

- [x] 6.1 Run the `/simplify` skill against the three modified files (`CookbookStandaloneLayout.tsx`, `cookbooks.$cookbookId_.toc.tsx`, `cookbooks.$cookbookId_.print.tsx`) to reduce duplication, improve clarity, and confirm consistency
- [x] 6.2 Run `npx tsc --noEmit` — no type errors (3 pre-existing errors unrelated to this change)
- [x] 6.3 Confirm no orphaned imports in `toc.tsx` or `print.tsx` (TypeScript strict mode will catch `noUnusedLocals`)
- [x] 6.4 Run `npx vitest run` — confirm all unit tests still pass after simplification

## 7. Full validation

- [x] 7.1 Run `npm run test` — all unit and integration tests pass
- [x] 7.2 Run `npm run test:e2e` — all E2E tests pass
- [ ] 7.3 Manually verify in browser: standalone TOC page (`/cookbooks/$id/toc`) print preview shows 2 columns and correct chapter grouping
- [ ] 7.4 Manually verify in browser: full-print page (`/cookbooks/$id/print`) print preview shows 2-column TOC with correct chapter grouping

## 8. PR and Merge

- [x] 8.1 Commit all changes to `fix/cookbook-print-toc-layout` and push to remote
- [x] 8.2 Open PR to `main` referencing GitHub issue #218 in the PR description
- [x] 8.3 Enable auto-merge on the PR
- [x] 8.4 Monitor CI checks — diagnose and fix any failures, commit and push fixes until all checks are green
- [x] 8.5 Address any review comments — commit and push fixes until no unresolved comments remain

## 9. Post-Merge

- [ ] 9.1 Checkout `main` and pull (`git checkout main && git pull --ff-only`)
- [ ] 9.2 Verify merged changes appear on `main`
- [ ] 9.3 Sync approved spec deltas to `openspec/specs/`: copy `openspec/changes/fix-cookbook-print-toc-layout/specs/cookbook-print-view/spec.md` and `openspec/changes/fix-cookbook-print-toc-layout/specs/cookbook-toc-print-layout/spec.md` into the corresponding `openspec/specs/` directories
- [ ] 9.4 Archive the change in a single atomic commit: copy `openspec/changes/fix-cookbook-print-toc-layout/` to `openspec/archive/fix-cookbook-print-toc-layout-YYYY-MM-DD/` and delete the original — do not split into two commits
- [ ] 9.5 Push the archive commit to `main`
- [ ] 9.6 Delete the local and remote `fix/cookbook-print-toc-layout` branch
