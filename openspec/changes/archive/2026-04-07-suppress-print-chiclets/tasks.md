# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b
  feat/suppress-print-chiclets` then immediately `git push -u origin
  feat/suppress-print-chiclets`

## Execution

- [x] **Task 1 — Add `print:hidden` to chiclet wrapper in `RecipeDetail`**
  - File: `src/components/recipes/RecipeDetail.tsx`
  - Find the `<div className="flex flex-wrap gap-2 mb-4">` wrapper (~line 131) that contains `ClassificationBadge` and `TaxonomyBadges`
  - Add `print:hidden` to that className
  - Result: `<div className="flex flex-wrap gap-2 mb-4 print:hidden">`

- [x] **Task 2 — Remove dead `.classification-badge` CSS block from `print.css`**
  - File: `src/styles/print.css`
  - Delete the `.classification-badge` block (lines 38–42):

    ```css
    .classification-badge {
      background: transparent !important;
      color: #000 !important;
      border-color: #000 !important;
    }
    ```

- [x] Review for duplication and unnecessary complexity
- [x] Confirm acceptance criteria from `specs/print-suppression.md` are covered

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **E2E tests** — `npm run test:e2e` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Run the required pre-PR self-review from
  `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `feat/suppress-print-chiclets` to `main`; reference
  issue #268 in the PR description
- [x] Wait 120 seconds for agentic reviewers to post comments
- [x] **Monitor PR comments** — address, commit fixes, validate locally, push; repeat until no unresolved comments remain
- [x] Enable auto-merge once no blocking review comments remain
- [x] **Monitor CI checks** — diagnose failures, fix, validate locally, push; repeat until all checks pass
- [x] Wait for the PR to merge — **never force-merge**

Ownership metadata:

- Implementer: dougis
- Reviewer(s): agentic reviewers + dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify merged changes appear on main
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] No documentation updates required for this change
- [x] Sync approved spec deltas into `openspec/specs/`
- [x] Archive the change: move
  `openspec/changes/suppress-print-chiclets/` to
  `openspec/changes/archive/YYYY-MM-DD-suppress-print-chiclets/` in a
  single commit (copy + delete staged together)
- [x] Confirm
  `openspec/changes/archive/YYYY-MM-DD-suppress-print-chiclets/` exists
  and `openspec/changes/suppress-print-chiclets/` is gone
- [x] Commit and push the archive to main in one commit
- [x] Prune merged local feature branch: `git fetch --prune` and `git branch -d feat/suppress-print-chiclets`
