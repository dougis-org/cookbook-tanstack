# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/move-recipe-notes-after-instructions`
  then immediately
  `git push -u origin feat/move-recipe-notes-after-instructions`

## Execution

- [x] Add or update failing component tests in
  `src/components/recipes/__tests__/RecipeDetail.test.tsx` that assert:
  - notes render with a `Notes` heading when present
  - the `Notes` section appears after `Instructions`
  - the `Notes` section appears before `Nutrition` when nutrition data exists
  - no empty `Notes` section renders when notes are absent
- [x] Update `src/components/recipes/RecipeDetail.tsx` so notes render
  as a dedicated section after instructions and before nutrition
- [x] Review the `RecipeDetail` markup for duplication or unnecessary
  wrapper complexity while keeping the change minimal
- [x] Confirm the implementation still relies on the shared
  `RecipeDetail` component used by both
  `src/routes/recipes/$recipeId.tsx` and
  `src/routes/cookbooks.$cookbookId_.print.tsx`

Suggested start-of-work commands: `git checkout main` →
`git pull --ff-only` →
`git checkout -b feat/move-recipe-notes-after-instructions` →
`git push -u origin feat/move-recipe-notes-after-instructions`

## Validation

- [x] Run unit/integration tests: `npm run test -- src/components/recipes/__tests__/RecipeDetail.test.tsx`
- [x] Run targeted route/detail regression tests if needed after implementation changes
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] Run security/code quality checks required by project standards if
  the scope expands beyond a presentation-only component change
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to
a PR):

- **Unit tests** — run
  `npm run test -- src/components/recipes/__tests__/RecipeDetail.test.tsx`;
  the updated component tests must pass
- **Integration tests** — no separate integration suite is expected
  for this slice unless implementation expands
- **Regression / E2E tests** — run only if the implementation or review
  uncovers route-level behavior that component tests do not sufficiently
  cover
- **Build** — run `npm run build`; build must succeed with no errors
- If **ANY** of the above fail, iterate and address the failure before pushing

Use the repository-standard commands documented in `AGENTS.md` and `docs/standards/`.

## PR and Merge

- [ ] Run the required pre-PR self-review from `.codex/skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `feat/move-recipe-notes-after-instructions` to `main`
- [ ] Wait for 120 seconds for the Agentic reviewers to post their comments
- [ ] **Monitor PR comments** — when comments appear, address them,
  commit fixes, follow all steps in [Remote push validation], then push
  to the same working branch; repeat until no unresolved comments remain
- [ ] Enable auto-merge once no blocking review comments remain
- [ ] **Monitor CI checks** — when any CI check fails, diagnose and fix
  the failure, commit fixes, follow all steps in [Remote push
  validation], then push to the same working branch; repeat until all
  checks pass
- [ ] Wait for the PR to merge — never force-merge; if a human force-merges, continue to Post-Merge

The comment and CI resolution loops are iterative: address → validate
locally → push → sleep for 120 seconds → re-check → repeat until the PR
is fully clean. If a human force-merges before the PR is clean, proceed
directly to Post-Merge steps.

Ownership metadata:

- Implementer: Codex agent working with the requester
- Reviewer(s): requester plus any required repository reviewers
- Required approvals: at least one explicit human approval before apply/merge

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → confirm relevance for this presentation-only
  change, remediate if valid, then validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change, if any
- [ ] Sync approved spec deltas into `openspec/specs/`
- [ ] Archive the change: move
  `openspec/changes/move-recipe-notes-after-instructions/` to
  `openspec/changes/archive/YYYY-MM-DD-move-recipe-notes-after-instructions/`
  and stage both the new location and the deletion of the old location
  in a single commit
- [ ] Confirm
  `openspec/changes/archive/YYYY-MM-DD-move-recipe-notes-after-instructions/`
  exists and `openspec/changes/move-recipe-notes-after-instructions/`
  is gone
- [ ] Commit and push the archive to `main` in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d feat/move-recipe-notes-after-instructions`

Required cleanup after archive: `git fetch --prune` and `git branch -d feat/move-recipe-notes-after-instructions`
