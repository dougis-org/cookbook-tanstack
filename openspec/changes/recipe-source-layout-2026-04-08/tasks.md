# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b recipe-source-layout` then immediately `git push -u origin recipe-source-layout` — branch must exist on remote before any implementation work begins

## Execution

- [x] **Task 3 — Update failing tests first (TDD):** In `src/components/recipes/__tests__/RecipeDetail.test.tsx`, update any DOM-order assertions that check source position relative to chiclets to expect source to appear *before* the chiclet wrapper
- [x] **Task 4 — Restructure header section in RecipeDetail.tsx:**
  - Wrap the `<h1>` title element and the source `<p>` block in a new inner `<div>` with classes: `flex flex-col print:flex-row print:items-baseline print:justify-between`
  - Move the source block (lines ~169–185) from its current position (after chiclets) to inside this inner wrapper, immediately after the `<h1>`
  - Add `print:hidden` to the actions wrapper div (the `<div className="shrink-0">` containing `{actions}`)
  - Keep the outer title-row `<div className="flex items-start justify-between gap-4 mb-4">` but have it contain: inner wrapper (flex-1) + actions wrapper (shrink-0 print:hidden)
- [x] **Task 5 — Verify no custom CSS introduced:** Confirm `src/styles.css` contains no new `@media print` blocks

Suggested start-of-work commands:
```
git checkout main
git pull --ff-only
git checkout -b recipe-source-layout
git push -u origin recipe-source-layout
```

Files to modify:
- `src/components/recipes/RecipeDetail.tsx` — header section restructure
- `src/components/recipes/__tests__/RecipeDetail.test.tsx` — DOM order assertions

## Validation

- [x] Run unit/integration tests: `npm run test` — all must pass
- [x] Run E2E tests: `npm run test:e2e` — all must pass
- [x] Run type check: `npx tsc --noEmit` — no errors
- [x] Run build: `npm run build` — must succeed
- [ ] Visual check: `npm run dev`, open a recipe with a source, confirm source appears directly below title on screen, before any taxonomy badges
- [ ] Visual print check: open browser print preview on a recipe with source — confirm source appears to the right of title on the same line
- [ ] All tasks marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — `npm run test` (covers integration); all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to `recipe-source-layout` and push to remote
- [x] Open PR from `recipe-source-layout` to `main`; reference issue #280 in the PR description
- [ ] Wait for 120 seconds for agentic reviewers to post their comments
- [ ] **Monitor PR comments** — address each comment, commit fixes, follow all steps in Remote push validation, push to `recipe-source-layout`; repeat until no unresolved comments remain
- [ ] Enable auto-merge once no blocking review comments remain
- [ ] **Monitor CI checks** — if any check fails, diagnose and fix, commit, follow all Remote push validation steps, push; repeat until all checks pass
- [ ] Wait for the PR to merge — **never force-merge**; if a human force-merges, continue to Post-Merge

The comment and CI resolution loops are iterative: address → validate locally → push → sleep 120 seconds → re-check → repeat until the PR is fully clean.

Ownership metadata:

- Implementer: Doug Hubbard
- Reviewer(s): agentic reviewers (CodeRabbit, Codacy) + human
- Required approvals: 1 human approval + CI green

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected for this change)
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/recipe-source-layout-2026-04-08/` to `openspec/changes/archive/2026-04-08-recipe-source-layout/` — stage both the new location and the deletion of the old location in a **single commit**
- [ ] Confirm `openspec/changes/archive/2026-04-08-recipe-source-layout/` exists and `openspec/changes/recipe-source-layout-2026-04-08/` is gone
- [ ] Commit and push the archive to `main` in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d recipe-source-layout`
