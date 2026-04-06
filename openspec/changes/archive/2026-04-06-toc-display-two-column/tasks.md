## 1. Preparation

- [x] 1.1 Checkout `main` and pull with fast-forward only: `git checkout main && git pull --ff-only`
- [x] 1.2 Create feature branch and push to remote: `git checkout -b feat/toc-display-two-column && git push -u origin feat/toc-display-two-column`

## 2. Implementation

- [x] 2.1 In `src/components/cookbooks/CookbookStandaloneLayout.tsx`, update `CookbookTocList` chapters path (first per-chapter `<ol>`, ~line 142): change `space-y-2 print:space-y-0 print:columns-2 print:gap-8` → `space-y-2 sm:space-y-0 sm:columns-2 sm:gap-8 print:space-y-0 print:columns-2 print:gap-8`
- [x] 2.2 Same file — update `CookbookTocList` chapters path uncategorized overflow `<ol>` (~line 155): same class string replacement
- [x] 2.3 Same file — update `CookbookTocList` flat (no-chapters) path `<ol>` (~line 172): same class string replacement
- [x] 2.4 Same file — update `CookbookAlphaIndex` flat-list `<ol>` (~line 357): same class string replacement

## 3. Validation

- [x] 3.1 Run unit tests: `npm run test` — fix any failing class-string assertions in `CookbookStandaloneLayout.test.tsx` and `CookbookAlphaIndex.test.tsx`
- [x] 3.2 Run E2E tests: `npm run test:e2e` — verify no regressions in `cookbooks-print.spec.ts`
- [x] 3.3 Run build: `npm run build` — confirm no TypeScript or Vite errors
- [ ] 3.4 Manual smoke test: view `/cookbooks/:id/toc` on a ≥640px screen and confirm 2-column layout
- [ ] 3.5 Manual smoke test: view `/cookbooks/:id/print?displayonly=1` on a ≥640px screen and confirm both TOC and Alpha Index render in 2 columns
- [ ] 3.6 Manual smoke test: view both routes on a <640px screen (or narrow browser) and confirm single-column layout

## 4. PR and Merge

- [x] 4.1 Commit all changes with a descriptive message referencing issue #260
- [x] 4.2 Push branch to remote: `git push`
- [x] 4.3 Open PR from `feat/toc-display-two-column` → `main` with auto-merge enabled
- [x] 4.4 Monitor CI — fix any failures, push fixes, repeat until all checks are green
- [x] 4.5 Address any review comments, push fixes, repeat until no blocking comments remain

## 5. Post-Merge

- [x] 5.1 Checkout `main` and pull: `git checkout main && git pull --ff-only`
- [x] 5.2 Verify merged changes appear on `main`
- [x] 5.3 Sync approved spec deltas to `openspec/specs/`: copy `openspec/changes/toc-display-two-column/specs/cookbook-toc-print-layout/spec.md` → `openspec/specs/cookbook-toc-print-layout/spec.md` and `openspec/changes/toc-display-two-column/specs/cookbook-alpha-index/spec.md` → `openspec/specs/cookbook-alpha-index/spec.md`
- [ ] 5.4 Archive the change: run `/opsx:archive toc-display-two-column` (single atomic commit: copy to `openspec/archive/` + delete `openspec/changes/toc-display-two-column/`)
- [ ] 5.5 Push archive commit to `main`
- [ ] 5.6 Prune merged local branch: `git branch -d feat/toc-display-two-column`
