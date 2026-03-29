## 1. Preparation

- [x] 1.1 Checkout `main` and pull with fast-forward only (`git checkout main && git pull --ff-only`)
- [x] 1.2 Create working branch `add-recipe-print-button` from `main` and push to remote (`git checkout -b add-recipe-print-button && git push -u origin add-recipe-print-button`)

## 2. RED — Write Failing Tests

- [x] 2.1 Create `src/components/ui/__tests__/PrintButton.test.tsx` — tests for: renders with Printer icon + "Print" label, click calls `window.print()`, carries `print:hidden` class (all tests fail — component does not exist yet)
- [x] 2.2 Add tests to recipe detail test file covering: Print button present for owner (alongside Edit), Print button present for non-owner (no Edit), Print button absent from printed output (`print:hidden` on wrapper)
- [x] 2.3 Add/update tests in `CookbookStandaloneLayout.test.tsx` covering: print button present and calls `window.print()` on click (should still pass or fail gracefully after refactor)
- [x] 2.4 Run `npm run test` — confirm new tests fail for expected reasons, existing tests still pass

## 3. GREEN — Implement

- [x] 3.1 Create `src/components/ui/PrintButton.tsx` — button that calls `window.print()`, renders `Printer` icon + "Print" label, carries `print:hidden` class, styled consistently with existing action buttons
- [x] 3.2 Update `src/routes/recipes/$recipeId.tsx` — pass `actions` as a `print:hidden` flex group containing `<PrintButton />` always and `<Link>Edit Recipe</Link>` conditionally (if `isOwner`)
- [x] 3.3 Update `src/components/cookbooks/CookbookStandaloneLayout.tsx` — replace inline print button JSX in `CookbookPageChrome` with `<PrintButton />`
- [x] 3.4 Run `npm run test` — confirm all tests now pass

## 4. REFACTOR — Reduce Complexity and Duplication

- [x] 4.1 Review `PrintButton.tsx` — verify no unnecessary abstraction, props interface is minimal, no dead code
- [x] 4.2 Review `$recipeId.tsx` action group — verify the flex wrapper is clean, no leftover inline print-related JSX
- [x] 4.3 Review `CookbookStandaloneLayout.tsx` — confirm all inline print button code is removed, no duplication remains
- [x] 4.4 Run `npm run test` — all tests still pass after refactor

## 5. Validation

- [x] 5.1 Run `npx tsc --noEmit` — TypeScript compilation clean
- [x] 5.2 Run `npm run test` — all unit/integration tests pass
- [x] 5.3 Run `npm run test:e2e` — all E2E tests pass
- [ ] 5.4 Run Codacy analysis if available — fix any critical/high findings before proceeding
- [ ] 5.5 Manually verify: Print + Edit visible for owner on `/recipes/:recipeId`, Print only for non-owner
- [ ] 5.6 Manually verify: cookbook standalone page print button still works

## 6. PR and Merge

- [x] 6.1 Commit all changes and push to `add-recipe-print-button` branch
- [x] 6.2 Open PR from `add-recipe-print-button` → `main` referencing issue #221; enable auto-merge immediately
- [ ] 6.3 Monitor CI — on failure: diagnose, fix, run `npm run test && npm run test:e2e` locally, commit, push; repeat until all checks green
- [ ] 6.4 Monitor review comments — for each comment: address, run affected tests locally, commit fix, push; repeat until no blocking comments remain
- [ ] 6.5 Confirm PR merges (auto-merge or human merge)

## 7. Post-Merge

- [ ] 7.1 Checkout `main` and pull; verify merged changes appear
- [ ] 7.2 Sync spec delta: copy `openspec/changes/add-recipe-print-button/specs/recipe-print-button/spec.md` to `openspec/specs/recipe-print-button/spec.md`
- [ ] 7.3 Archive change: copy `openspec/changes/add-recipe-print-button/` to `openspec/archive/` and delete original in a single atomic commit, push to `main`
- [ ] 7.4 Prune local branch (`git branch -d add-recipe-print-button`)
