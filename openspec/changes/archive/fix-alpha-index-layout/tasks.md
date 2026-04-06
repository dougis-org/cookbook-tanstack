## 1. Preparation

- [x] 1.1 Checkout `main` and pull with fast-forward only (`git checkout main && git pull --ff-only`)
- [x] 1.2 Create feature branch `fix/alpha-index-layout` from `main` and push to remote (`git push -u origin fix/alpha-index-layout`)

## 2. Implementation

- [x] 2.1 In `src/components/cookbooks/CookbookStandaloneLayout.tsx`, add `print:break-before-page` to the root `<div>` of `CookbookAlphaIndex` so the index always begins on a new print page
- [x] 2.2 Replace the per-letter `<div> + <h3> + <ol className="print:columns-2">` structure in `CookbookAlphaIndex` with a flat `IndexItem[]` array (discriminated union: `{ type: 'letter'; letter: string } | { type: 'recipe'; recipe: TocRecipe; pageNumber: number }`)
- [x] 2.3 Render the flat `IndexItem[]` in a single `<ol className="print:columns-2 print:gap-8">` wrapping all items
- [x] 2.4 Render letter items as `<li>` with bold styling and `print:break-after-avoid` to prevent orphaning at column bottoms
- [x] 2.5 Render recipe items using the existing `RecipePageRow` component (no changes to that component)

## 3. Test Updates

- [x] 3.1 Update `src/components/cookbooks/__tests__/CookbookAlphaIndex.test.tsx` — remove assertions for `<h3>` letter headings and per-letter `<ol>` elements
- [x] 3.2 Add assertions that a single `<ol>` contains both letter label `<li>` items and recipe row `<li>` items in the expected order
- [x] 3.3 Add assertion that the index container has the `print:break-before-page` class (or equivalent test for page-break behavior)
- [x] 3.4 Verify all existing scenarios still pass: sort order, page numbers, `#` bucket, empty list

## 4. Validation

- [x] 4.1 Run `npm run test` — all unit and integration tests must pass
- [x] 4.2 Run `npm run test:e2e` — E2E print spec must pass
- [x] 4.3 Load `http://localhost:3000/cookbooks/<id>/print?displayonly=1` and verify print preview shows index on its own page with a continuous two-column flow across letter groups
- [x] 4.4 Verify letter labels do not orphan at column bottoms in a realistic cookbook dataset

## 5. PR and Merge

- [x] 5.1 Commit all changes to `fix/alpha-index-layout` and push to remote
- [x] 5.2 Open a PR from `fix/alpha-index-layout` to `main` referencing GitHub issue #261; enable auto-merge
- [x] 5.3 Monitor CI checks — diagnose and fix any failures, commit and push fixes until all checks are green
- [x] 5.4 Address any review comments — commit fixes, push, and repeat until no unresolved comments remain

## 6. Post-Merge

- [x] 6.1 Checkout `main` and pull — verify merged changes appear on the default branch
- [x] 6.2 Sync approved spec deltas to `openspec/specs/cookbook-alpha-index/spec.md` and `openspec/specs/cookbook-print-view/spec.md`
- [x] 6.3 Archive the change directory (`openspec/changes/fix-alpha-index-layout/` → `openspec/changes/archive/`) in a single atomic commit that includes both the copy to archive and the deletion of the original; push to `main`
- [x] 6.4 Prune the merged local branch (`git branch -d fix/alpha-index-layout`)
