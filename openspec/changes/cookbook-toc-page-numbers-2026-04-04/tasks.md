## 1. Preparation

- [x] 1.1 Checkout `main` and pull with fast-forward only: `git checkout main && git pull --ff-only`
- [x] 1.2 Create working branch: `git checkout -b feat/cookbook-toc-page-numbers`
- [x] 1.3 Push branch to remote immediately: `git push -u origin feat/cookbook-toc-page-numbers`

## 2. Shared Utility

- [x] 2.1 Create `src/lib/cookbookPages.ts` exporting `buildPageMap(recipes: { id: string }[]): Map<string, number>` using flat 1-page-per-recipe heuristic
- [x] 2.2 Write unit tests in `src/lib/__tests__/cookbookPages.test.ts` covering: first recipe → page 1, sequential numbering, empty input, correct entry count

## 3. Component Updates

- [x] 3.1 Update `TocRecipeItem` in `src/components/cookbooks/CookbookStandaloneLayout.tsx` to accept a `pageNumber: number` prop
- [x] 3.2 Add dotted leader `<span>` (flex-1, border-dotted bottom) between recipe name and page number in `TocRecipeItem`
- [x] 3.3 Render page number as `pg {pageNumber}` with screen styles `text-gray-500 text-xs tabular-nums` and print overrides `print:text-black print:text-sm`
- [x] 3.4 Add `print:hidden` to `RecipeTimeSpan` within `TocRecipeItem` so time is hidden in print output
- [x] 3.5 Update `CookbookTocList` to call `buildPageMap(recipes)` and pass `pageNumber` to each `TocRecipeItem` (both flat list and chapter-grouped branches)

## 4. Validation

- [x] 4.1 Run unit tests: `npm run test` — all pass including new `cookbookPages.test.ts`
- [x] 4.2 Run E2E tests: `npm run test:e2e` — all pass
- [ ] 4.3 Start dev server (`npm run dev`) and open a cookbook TOC in browser — confirm page numbers appear dimmed on the right of each entry
- [ ] 4.4 Open browser print preview for the TOC — confirm dotted leaders, right-aligned page numbers, no prep/cook time visible
- [ ] 4.5 Verify `pg 1` appears on the first recipe and numbers increment sequentially
- [ ] 4.6 Test with a cookbook that has chapters — confirm page numbers are correct across chapter groups

## 5. PR and Merge

- [x] 5.1 Run pre-PR self-check: invoke the `pr-review-toolkit:code-reviewer` sub-agent on all changed files (`src/lib/cookbookPages.ts`, `src/lib/__tests__/cookbookPages.test.ts`, `src/components/cookbooks/CookbookStandaloneLayout.tsx`) — address any high-priority findings before proceeding
- [ ] 5.2 Commit all changes with a descriptive message referencing issue #191
- [ ] 5.3 Push to remote: `git push`
- [ ] 5.4 Open PR targeting `main` with title referencing issue #191; enable auto-merge
- [ ] 5.5 Monitor CI — diagnose and fix any failures, push fixes, repeat until all checks pass
- [ ] 5.6 Address any review comments, push fixes, repeat until no unresolved comments remain
- [ ] 5.7 Confirm auto-merge completes (or merge manually once all gates are green and no blocking comments remain)

## 6. Post-Merge

- [ ] 6.1 Checkout `main` and pull: `git checkout main && git pull --ff-only`
- [ ] 6.2 Verify the merged changes appear on `main`
- [ ] 6.3 Sync approved spec deltas to canonical locations:
  - Copy `openspec/changes/cookbook-toc-page-numbers-2026-04-04/specs/cookbook-page-map/spec.md` → `openspec/specs/cookbook-page-map/spec.md`
  - Merge `openspec/changes/cookbook-toc-page-numbers-2026-04-04/specs/cookbook-toc-print-layout/spec.md` MODIFIED/ADDED sections into `openspec/specs/cookbook-toc-print-layout/spec.md`
- [ ] 6.4 Archive the change as a single atomic commit: copy `openspec/changes/cookbook-toc-page-numbers-2026-04-04/` → `openspec/archive/cookbook-toc-page-numbers-2026-04-04/` and delete the original — commit and push together
- [ ] 6.5 Delete the local feature branch: `git branch -d feat/cookbook-toc-page-numbers`
