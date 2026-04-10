# Tasks

## Preparation

- [x] **Task 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Task 2 — Create and publish working branch:** `git checkout -b feat/print-layout-refactor` then immediately `git push -u origin feat/print-layout-refactor`

## Execution

### Task 3 — Create `PrintLayout` component

- [x] Create `src/components/cookbooks/PrintLayout.tsx`
- [x] Component wraps children in `<div className="bg-white text-gray-900">`
- [x] Include a comment explaining the CSS variable migration path for issue #281
- [x] Export as named export `PrintLayout`

### Task 4 — Write tests for `PrintLayout`

- [x] Create `src/components/cookbooks/__tests__/PrintLayout.test.tsx`
- [x] Test: renders children inside a `div` with `bg-white` and `text-gray-900`
- [x] Test: does not apply any `dark:` or `print:` classes itself
- [x] Run: `npx vitest run src/components/cookbooks/__tests__/PrintLayout.test.tsx`

### Task 5 — Audit and strip `print:` color variants from `CookbookStandaloneLayout.tsx`

- [x] Remove `print:bg-white print:text-black` from `CookbookStandalonePage`
- [x] Remove `print:text-black` from `TocRecipeItem` link and span elements
- [x] Remove `print:border-gray-200` from `TocRecipeItem` and `RecipePageRow` borders
- [x] Remove `print:text-black` from `RecipePageRow` span elements
- [x] Remove `print:text-black print:border-gray-300` from `CookbookTocList` chapter heading `h2`
- [x] Remove `print:text-black print:border-gray-300` from `CookbookPageHeader` header border and `h1`
- [x] Remove `print:text-gray-700` from `CookbookPageHeader` description paragraph
- [x] Remove `print:text-gray-600` from `CookbookPageHeader` subtitle paragraph
- [x] Remove `print:text-black print:border-gray-300` from `CookbookAlphaIndex` heading
- [x] Remove `print:text-black` from `CookbookAlphaIndex` letter and recipe row items
- [x] Fix `RecipeTimeSpan`: change `print:text-gray-400` to plain `text-gray-500` (current value is lighter than base — likely a bug; inside `PrintLayout` the base class is correct)
- [x] **Preserve all non-color `print:` utilities:** `print:hidden`, `print:break-inside-avoid`, `print:break-after-avoid`, `print:break-before-page`, `print:columns-2`, `print:gap-8`, `print:space-y-0`, `print:max-w-4xl`, `print:mt-0`, `print:mt-16`, `print:text-sm`, `print:text-lg`
- [x] Run: `grep -n "print:text-\|print:bg-\|print:border-" src/components/cookbooks/CookbookStandaloneLayout.tsx` — expected: zero matches (remaining `print:text-sm`/`print:text-lg` are font-size utilities preserved per spec)

### Task 6 — Update `cookbooks.$cookbookId_.toc.tsx`

- [x] Import `PrintLayout` from `@/components/cookbooks/PrintLayout`
- [x] Wrap the route's rendered output in `<PrintLayout>`
- [x] Verify the file compiles: `npx tsc --noEmit`

### Task 7 — Update `cookbooks.$cookbookId_.print.tsx`

- [x] Import `PrintLayout` from `@/components/cookbooks/PrintLayout`
- [x] Wrap the route's rendered output in `<PrintLayout>`
- [x] Verify the file compiles: `npx tsc --noEmit`

### Task 8 — Update existing tests for affected components

- [x] Review `src/components/cookbooks/__tests__/CookbookStandaloneLayout.test.tsx` — update any assertions that check for removed `print:` color classes
- [x] Review `src/components/cookbooks/__tests__/CookbookAlphaIndex.test.tsx` — same
- [x] Run: `npx vitest run src/components/cookbooks/__tests__/`

## Validation

- [x] `npm run test` — all unit/integration tests pass
- [x] `npm run test:e2e` — all E2E tests pass (including print surface)
- [x] `npx tsc --noEmit` — no TypeScript errors
- [x] `npm run build` — build succeeds
- [x] `grep -rn "print:text-\|print:bg-\|print:border-" src/components/cookbooks/CookbookStandaloneLayout.tsx` returns zero matches
- [ ] Visual check: navigate to `/cookbooks/:id/toc` and `/cookbooks/:id/print` — pages render with white background on screen
- [ ] Visual check: trigger browser print preview on `/cookbooks/:id/print` — output is black text on white background

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass
- **E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, iterate and address before pushing

## PR and Merge

- [ ] Commit all changes to `feat/print-layout-refactor` and push to remote
- [ ] Open PR from `feat/print-layout-refactor` to `main`
- [ ] Enable auto-merge after PR is opened
- [ ] Wait 120 seconds for agentic reviewers to post comments
- [ ] **Monitor PR comments** — address each comment, commit fixes, follow Remote push validation, push; repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — diagnose and fix any failure, commit, follow Remote push validation, push; repeat until all checks pass
- [ ] Wait for the PR to merge — never force-merge; if a human force-merges, continue to Post-Merge

Ownership metadata:

- Implementer: Doug Hubbard
- Reviewer(s): agentic reviewers + project lead
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → `npm run test && npm run test:e2e && npm run build` → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] No documentation updates required (CLAUDE.md print conventions are unchanged; `print:hidden` rule still applies to chrome elements)
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec) if applicable
- [ ] Archive the change: move `openspec/changes/print-layout-refactor-2026-04-10/` to `openspec/changes/archive/2026-04-10-print-layout-refactor/` — stage both the new location and the deletion of the old in **a single commit**
- [ ] Confirm `openspec/changes/archive/2026-04-10-print-layout-refactor/` exists and `openspec/changes/print-layout-refactor-2026-04-10/` is gone
- [ ] Push the archive commit to `main`
- [ ] Prune merged branch: `git fetch --prune` and `git branch -d feat/print-layout-refactor`
