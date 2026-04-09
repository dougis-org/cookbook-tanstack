# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b recipe-print-meta-compact` then immediately `git push -u origin recipe-print-meta-compact`

## Execution

- [x] **Task 1 — Write failing tests for print meta line** (TDD first)
  - File: `src/components/recipes/__tests__/RecipeDetail.test.tsx`
  - Add test: meta grid container has `print:hidden` class (FR1)
  - Add test: `data-testid="print-meta-line"` element exists with `hidden` and `print:block` classes (FR2)
  - Add test: compact line contains correct values for all non-null fields joined by ` · ` (FR3)
  - Add test: null fields are omitted — no label, no "N/A", no stray ` · ` (FR4)
  - Verify tests fail: `npx vitest run src/components/recipes/__tests__/RecipeDetail.test.tsx`

- [x] **Task 2 — Add `print:hidden` to meta grid container**
  - File: `src/components/recipes/RecipeDetail.tsx`
  - Locate the `<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 ...">`
  - Add `print:hidden` to its className

- [x] **Task 3 — Add compact `hidden print:block` meta line**
  - File: `src/components/recipes/RecipeDetail.tsx`
  - Below the grid `</div>`, add a sibling element:
    ```tsx
    <p
      data-testid="print-meta-line"
      className="hidden print:block text-sm text-gray-700 mb-8"
    >
      {[
        recipe.prepTime != null && `Prep: ${recipe.prepTime}m`,
        recipe.cookTime != null && `Cook: ${recipe.cookTime}m`,
        recipe.servings != null && `Serves: ${recipe.servings}`,
        recipe.difficulty != null && recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1),
      ]
        .filter(Boolean)
        .join(' · ')}
    </p>
    ```

- [x] **Task 4 — Verify tests pass**
  - `npx vitest run src/components/recipes/__tests__/RecipeDetail.test.tsx`
  - All new and existing tests must be green

- [x] Review for unnecessary complexity or duplication

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation] passed

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — covered by `npm run test`
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure before pushing

## PR and Merge

- [x] Run the required pre-PR self-review before committing
- [ ] Commit all changes to `recipe-print-meta-compact` and push to remote
- [ ] Open PR from `recipe-print-meta-compact` to `main` — reference `dougis-org/cookbook-tanstack#284` in the PR body
- [ ] Enable auto-merge
- [ ] Wait 120 seconds for agentic reviewers to post comments
- [ ] **Monitor PR comments** — address, commit fixes, validate locally, push; repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — diagnose failures, fix, commit, validate locally, push; repeat until all checks pass
- [ ] Wait for the PR to merge — **never force-merge**; if a human force-merges, continue to Post-Merge

Ownership metadata:

- Implementer: Doug Hubbard
- Reviewer(s): automated (Codacy, CI)
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected)
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/recipe-print-meta-compact-2026-04-09/` to `openspec/changes/archive/2026-04-09-recipe-print-meta-compact/` — stage both the new location and the deletion of the old in a **single commit**
- [ ] Confirm `openspec/changes/archive/2026-04-09-recipe-print-meta-compact/` exists and `openspec/changes/recipe-print-meta-compact-2026-04-09/` is gone
- [ ] Commit and push the archive to `main` in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d recipe-print-meta-compact`
