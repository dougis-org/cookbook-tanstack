## 1. Preparation

- [x] 1.1 Checkout `main` and pull with fast-forward only: `git checkout main && git pull --ff-only`
- [x] 1.2 Create feature branch: `git checkout -b feat/auto-trigger-cookbook-print`
- [x] 1.3 Push branch to remote immediately: `git push -u origin feat/auto-trigger-cookbook-print`

## 2. Route: Add search param schema and auto-trigger

- [x] 2.1 In `src/routes/cookbooks.$cookbookId_.print.tsx`, add a `validateSearch` schema to the `Route` definition that accepts an optional `displayonly` string param (TanStack Router search schema)
- [x] 2.2 In `CookbookPrintPage`, read `displayonly` via `Route.useSearch()` and derive a `displayOnly` boolean (`displayonly === '1'`)
- [x] 2.3 Add a `hasPrinted` ref (`useRef(false)`) to prevent re-trigger after dialog dismiss
- [x] 2.4 Add a `useEffect` with deps `[isLoading, printData, displayOnly]` that calls `window.print()` when `!isLoading && !!printData && !displayOnly && !hasPrinted.current`, setting `hasPrinted.current = true` before calling

## 3. E2E tests: patch existing tests

- [x] 3.1 In `src/e2e/cookbooks-print.spec.ts`, update all existing `gotoAndWaitForHydration` calls that navigate to `/cookbooks/:id/print` to append `?displayonly=1`, so the auto-trigger does not fire and block test assertions

## 4. E2E tests: new auto-trigger coverage

- [x] 4.1 Add a new test that intercepts `window.print` via `page.addInitScript` (sets `window.__printCalled = false; window.print = () => { window.__printCalled = true }`), navigates to the print route without `?displayonly=1`, waits for hydration, and asserts `window.__printCalled === true`
- [x] 4.2 Add a test that uses the same `addInitScript` approach, navigates to the route with `?displayonly=1`, and asserts `window.__printCalled === false`

## 5. Validation

- [x] 5.1 Run TypeScript type-check: `npx tsc --noEmit` — confirm no new errors
- [x] 5.2 Run unit tests: `npm run test` — confirm all pass
- [x] 5.3 Run E2E tests: `npm run test:e2e` — confirm all pass, including new auto-trigger tests
- [x] 5.4 Manually verify in browser: navigate to a cookbook print route and confirm the print dialog opens automatically; dismiss and confirm the Print button re-triggers it; navigate with `?displayonly=1` and confirm no dialog

## 6. PR and Merge

- [x] 6.1 Commit all changes with a clear message referencing issue #231
- [x] 6.2 Push to remote: `git push`
- [x] 6.3 Open PR to `main`; reference issue #231 in the description; enable auto-merge
- [ ] 6.4 Monitor CI — if checks fail: diagnose, fix, commit, push, repeat until all green
- [ ] 6.5 Address any review comments: commit fixes, push, repeat until no blocking comments remain

## 7. Post-Merge

- [ ] 7.1 Checkout `main` and pull: `git checkout main && git pull --ff-only`
- [ ] 7.2 Verify merged changes appear on `main`
- [ ] 7.3 Sync approved spec deltas to `openspec/specs/`:
  - Copy `openspec/changes/auto-trigger-cookbook-print/specs/cookbook-print-auto-trigger/spec.md` → `openspec/specs/cookbook-print-auto-trigger/spec.md`
  - Merge ADDED requirements from `openspec/changes/auto-trigger-cookbook-print/specs/cookbook-print-view/spec.md` into `openspec/specs/cookbook-print-view/spec.md`
- [ ] 7.4 Archive the change as a single atomic commit: copy `openspec/changes/auto-trigger-cookbook-print/` → `openspec/archive/auto-trigger-cookbook-print/`, delete `openspec/changes/auto-trigger-cookbook-print/`, commit and push to `main`
- [ ] 7.5 Delete local feature branch: `git branch -d feat/auto-trigger-cookbook-print`
