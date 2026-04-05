## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/cookbook-alpha-index` then immediately `git push -u origin feat/cookbook-alpha-index`

## Execution

### Refactor: RecipePageRow (rename TocRecipeItem, remove dotted leader)

- [x] **RED** — Write failing tests in `src/components/cookbooks/__tests__/CookbookStandaloneLayout.test.tsx` verifying that `RecipePageRow` renders index number, recipe name, and page number, and does NOT render a dotted-leader element (no `border-dotted` class in output)
- [x] **GREEN** — In `src/components/cookbooks/CookbookStandaloneLayout.tsx`, rename `TocRecipeItem` to `RecipePageRow`, export it, and remove the dotted leader `<span>` (`flex-1 border-b border-dotted`)
- [x] Update `CookbookTocList` to call `RecipePageRow` in place of `TocRecipeItem`; update any existing TOC tests that referenced `TocRecipeItem` or asserted the dotted leader's presence
- [x] **VERIFY** — `npx vitest run src/components/cookbooks/__tests__/` — all pass

### Refactor: CookbookPageHeader subtitle prop

- [x] **RED** — Add/update test asserting that `CookbookPageHeader` renders a custom `subtitle` when provided, and defaults to `"Table of Contents"` when omitted
- [x] **GREEN** — Add `subtitle?: string` prop to `CookbookPageHeader` in `src/components/cookbooks/CookbookStandaloneLayout.tsx`; default to `"Table of Contents"`; render in place of the hardcoded string
- [x] Update call sites in `src/routes/cookbooks.$cookbookId_.toc.tsx` and `src/routes/cookbooks.$cookbookId_.print.tsx` to pass `subtitle="Table of Contents"` explicitly
- [x] **VERIFY** — `npx vitest run src/components/cookbooks/__tests__/` — all pass

### Feature: CookbookAlphaIndex component

- [x] **RED** — Write failing tests in `src/components/cookbooks/__tests__/CookbookAlphaIndex.test.tsx` covering:
  - Recipes are sorted A–Z and grouped under correct letter headers
  - Page numbers match `buildPageMap()` output for the same display-ordered input
  - Recipes starting with a digit or non-letter character appear under `#`
  - Empty recipes array renders nothing
  - Recipe entries are not anchor/Link elements (plain text)
- [x] **GREEN** — Add `CookbookAlphaIndex` to `src/components/cookbooks/CookbookStandaloneLayout.tsx`:
  - Accepts `recipes: { id: string; name: string }[]` (display-ordered)
  - Calls `buildPageMap(recipes)` for page numbers
  - Sorts alphabetically by `name`, groups by `name[0].toUpperCase()` (`#` fallback for non-letters)
  - Renders letter section headers (styled like TOC chapter headings) and `RecipePageRow` rows (plain `<div>`, no `<Link>`)
  - Export `CookbookAlphaIndex` from `CookbookStandaloneLayout.tsx`
- [x] **REFACTOR** — Review for duplication with `CookbookTocList` grouping logic; simplify if possible while keeping all tests green
- [x] **VERIFY** — `npx vitest run src/components/cookbooks/__tests__/CookbookAlphaIndex.test.tsx` — all pass

### Feature: Wire CookbookAlphaIndex into print route

- [x] **RED** — Add/update test for `src/routes/cookbooks.$cookbookId_.print.tsx` (or its E2E equivalent) asserting that the alphabetical index section renders after all recipe content when `recipes.length > 0`, and is absent when `recipes.length === 0`
- [x] **GREEN** — In `src/routes/cookbooks.$cookbookId_.print.tsx`, import `CookbookAlphaIndex` and append `<CookbookAlphaIndex recipes={recipes} />` after the last recipe section block, guarded by `recipes.length > 0`
- [x] **VERIFY** — `npx vitest run src/routes/` (if route-level tests exist) — all pass

### Security & code quality

- [x] Run Codacy analysis on changed files; fix any critical or high severity findings before proceeding (`mcp__codacy__codacy_cli_analyze` or per [Analysis Standards](docs/standards/analysis-and-security.md))
- [x] No new dependencies added — Snyk scan not required; confirm no `package.json` changes

### Self-review

- [x] Re-read all changed files; verify no unused imports, no `any` types, no hardcoded strings that should be props
- [x] Confirm `RecipePageRow` is the sole row-rendering component used by both `CookbookTocList` and `CookbookAlphaIndex` (no duplication)
- [x] Confirm dotted leader is absent from both TOC and index output
- [x] Confirm `CookbookPageHeader` renders correct subtitle on both `toc` and `print` routes

## Validation

- [x] Run unit/integration tests: `npm run test` — all pass
- [x] Run E2E tests: `npm run test:e2e` — all pass
- [x] Run type check: `npx tsc --noEmit` — no errors
- [x] Run build: `npm run build` — succeeds with no errors
- [x] Run security/code quality checks per [Analysis & Security Standards](docs/standards/analysis-and-security.md)
- [ ] Manual smoke — navigate to `/cookbooks/:id/print?displayonly=1`: TOC renders without dotted leaders; alphabetical index appears at the bottom with letter groupings; page numbers in index match TOC
- [ ] Manual smoke — navigate to `/cookbooks/:id/toc`: dotted leader is gone; page numbers still display correctly
- [x] All completed tasks marked complete

## Remote push validation

Verification requirements (all must pass before pushing to the PR branch):

- **Unit tests** — `npm run test` — all tests must pass
- **E2E tests** — `npm run test:e2e` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- **Type check** — `npx tsc --noEmit` — must produce no errors

If **ANY** of the above fail, iterate and address the failure before pushing.

## PR and Merge

- [x] Commit all changes to `feat/cookbook-alpha-index` and push to remote
- [x] Open PR from `feat/cookbook-alpha-index` → `main`; reference GH issue #245 in the PR description
- [x] Wait 120 seconds for agentic reviewers to post their comments
- [x] **Monitor PR comments** — address each comment, commit fixes, follow all steps in [Remote push validation], push to the same branch; repeat until no unresolved comments remain
- [x] Enable auto-merge once no blocking review comments remain
- [x] **Monitor CI checks** — if any check fails, diagnose, fix, commit, follow all steps in [Remote push validation], push; repeat until all checks pass
- [x] Wait for the PR to merge — **never force-merge**; if a human force-merges, continue to Post-Merge

Ownership metadata:
- Implementer:
- Reviewer(s):
- Required approvals:

Blocking resolution flow:
- CI failure → fix → commit → follow [Remote push validation] → push → re-run checks
- Security finding → remediate → commit → follow [Remote push validation] → push → re-scan
- Review comment → address → commit → follow [Remote push validation] → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks complete (`- [x]`)
- [x] Update repository documentation impacted by the change (if any)
- [x] Sync approved spec deltas into `openspec/specs/`:
  - Merge `specs/cookbook-toc-print-layout/spec.md` delta into `openspec/specs/cookbook-toc-print-layout/spec.md`
  - Merge `specs/cookbook-print-view/spec.md` delta into `openspec/specs/cookbook-print-view/spec.md`
  - Create `openspec/specs/cookbook-alpha-index/spec.md` from `specs/cookbook-alpha-index/spec.md`
- [x] Archive the change: move `openspec/changes/cookbook-alpha-index/` to `openspec/changes/archive/YYYY-MM-DD-cookbook-alpha-index/` — **stage both the new location and the deletion of the original in a single commit**; do not split into two commits
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-cookbook-alpha-index/` exists and `openspec/changes/cookbook-alpha-index/` is gone
- [x] Commit and push the archive to `main` in one commit
- [x] Prune merged local branch: `git fetch --prune` and `git branch -d feat/cookbook-alpha-index`
