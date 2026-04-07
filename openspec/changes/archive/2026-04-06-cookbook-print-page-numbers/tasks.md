# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:**
  `git checkout -b feat/cookbook-print-page-numbers` then immediately
  `git push -u origin feat/cookbook-print-page-numbers`

## Execution

- [x] **Update `CookbookStandaloneLayout.tsx`** — Change
  `pg {pageNumber}` → `#{pageNumber}` in `TocRecipeItem` (line ~78) and
  `RecipePageRow` (line ~44)
  - File: `src/components/cookbooks/CookbookStandaloneLayout.tsx`
- [x] **Update print route** — Import `buildPageMap` from
  `@/lib/cookbookPages`; call `buildPageMap(recipes)` after the loading
  guard; render `#N` footer div inside each `.cookbook-recipe-section`
  - File: `src/routes/cookbooks.$cookbookId_.print.tsx`
- [x] **Write/update unit tests** — Cover: TOC rows render `#N`, index rows
  render `#N`, print page recipe sections render `#N`, missing-page-map-entry
  renders nothing without error
  - Files: test files alongside `CookbookStandaloneLayout` and print route, or their existing test files if present

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e`
- [x] Run type check: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] Visual check: open
  `http://localhost:3000/cookbooks/<id>/print?displayonly=1` and confirm
  `#1`, `#2`, … labels appear at the bottom of each recipe section in muted
  gray
- [x] Visual check: confirm TOC rows and index rows show `#N` (no `pg` prefix)
- [x] All completed tasks marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass
- **E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [x] Commit all changes to `feat/cookbook-print-page-numbers` and push to remote
- [x] Open PR from `feat/cookbook-print-page-numbers` to `main` — close GitHub issue #246 in the PR description
- [x] Wait 120 seconds for agentic reviewers to post comments
- [x] **Monitor PR comments** — address, commit fixes, validate locally
  (Remote push validation), push; repeat until no unresolved comments remain
- [x] Enable auto-merge once no blocking review comments remain
- [x] **Monitor CI checks** — diagnose any failure, fix, validate locally, push; repeat until all checks pass
- [x] Wait for PR to merge — never force-merge

Ownership metadata:

- Implementer: Doug Hubbard
- Reviewer(s): auto-review bots + Doug
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Sync approved spec deltas into `openspec/specs/` (global spec)
- [x] Archive the change: move `openspec/changes/cookbook-print-page-numbers/`
  to `openspec/changes/archive/YYYY-MM-DD-cookbook-print-page-numbers/` and
  stage both copy and deletion in a **single commit**
- [x] Confirm
  `openspec/changes/archive/YYYY-MM-DD-cookbook-print-page-numbers/` exists
  and `openspec/changes/cookbook-print-page-numbers/` is gone
- [x] Commit and push the archive to `main` in one commit
- [x] Prune merged local branch: `git fetch --prune` and
  `git branch -d feat/cookbook-print-page-numbers`
