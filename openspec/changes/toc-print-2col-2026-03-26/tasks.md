## 1. Branch Setup

- [x] 1.1 Pull latest `main` and create branch `feat/toc-print-2col`

## 2. Implementation

- [x] 2.1 Add `print:max-w-4xl` to the inner container `div` in `CookbookStandalonePage` (`src/components/cookbooks/CookbookStandaloneLayout.tsx`)
- [x] 2.2 Add `print:columns-2 print:gap-8` to the flat TOC `<ol>` in `src/routes/cookbooks.$cookbookId_.toc.tsx`
- [x] 2.3 Add `print:columns-2 print:gap-8` to each chapter's `<ol>` in `src/routes/cookbooks.$cookbookId_.toc.tsx`
- [x] 2.4 Add `print:break-inside-avoid` to all `<li>` elements (both flat and chapter layouts)
- [x] 2.5 Add `print:break-after-avoid` to chapter `<h2>` elements

## 3. Validation

- [x] 3.1 Run `npm run test` — all unit and integration tests pass
- [x] 3.2 Run `npm run test:e2e` — all E2E tests pass
- [ ] 3.3 Verify print layout visually: open TOC page in browser, use print preview to confirm 2-column layout for flat and chapter-grouped cookbooks
- [ ] 3.4 Verify screen layout unchanged: single column, `max-w-2xl` on screen

## 4. PR and Merge

- [x] 4.1 Commit changes with a message referencing issue #208
- [x] 4.2 Push branch and open PR against `main` referencing issue #208
- [x] 4.3 Enable auto-merge on the PR
- [ ] 4.4 Resolve any CI failures or review comments before merge

## 5. Post-Merge

- [ ] 5.1 Sync approved spec delta to `openspec/specs/cookbook-toc-print-layout/spec.md`
- [ ] 5.2 Archive this change with `/opsx:archive`
- [ ] 5.3 Delete local branch `feat/toc-print-2col`
