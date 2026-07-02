# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/recipe-notes-upgrade-nudge` then immediately `git push -u origin feat/recipe-notes-upgrade-nudge`

## Execution

### Task 1 — Write failing tests first (TDD)

Create `src/components/recipes/__tests__/RecipeNotesUpgradeNudge.test.tsx` with test cases covering all three state values before writing any implementation. Tests must fail at this point (component does not exist yet).

- [x] Test: `state="anonymous"` renders copy "Login or register to save private notes on any recipe." and `<a href="/auth/login">` with accessible name "Login"
- [x] Test: `state="below-tier"` renders copy "Private notes are part of Sous Chef. Upgrade to add notes to any recipe you can view." and `<a href="/pricing">` with accessible name "Upgrade"
- [x] Test: `state="hidden-by-downgrade"` renders copy "Your notes are saved. Upgrade to Sous Chef to see and edit them again." and `<a href="/pricing">` with accessible name "Upgrade"
- [x] Confirm tests fail: `npx vitest run src/components/recipes/__tests__/RecipeNotesUpgradeNudge.test.tsx`

### Task 2 — Implement `RecipeNotesUpgradeNudge`

Create `src/components/recipes/RecipeNotesUpgradeNudge.tsx`:

- [x] Default export `RecipeNotesUpgradeNudge`
- [x] Props: `{ state: 'anonymous' | 'below-tier' | 'hidden-by-downgrade' }`
- [x] Import `Lock` from `lucide-react`
- [x] Import `Link` from `@tanstack/react-router`
- [x] Inline strip layout: `Lock` icon (16px) + copy + CTA in a single row
- [x] Container classname includes `up-card`; copy element includes `up-body`; CTA link includes `up-cta`
- [x] State `anonymous`: copy as specified, CTA "Login" → `/auth/login`
- [x] State `below-tier`: copy as specified, CTA "Upgrade" → `/pricing`
- [x] State `hidden-by-downgrade`: copy as specified, CTA "Upgrade" → `/pricing`
- [x] All colors use `var(--theme-*)` tokens; no hard-coded hex values
- [x] No emoji; Title Case on CTA labels

### Task 3 — Confirm tests pass

- [x] `npx vitest run src/components/recipes/__tests__/RecipeNotesUpgradeNudge.test.tsx`
- [x] All three state tests pass

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit tests: `npm run test`
- [x] Run type check: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] All three `RecipeNotesUpgradeNudge` test scenarios pass
- [x] No TypeScript errors in new files
- [x] No hard-coded color values (grep check: no `slate-`, `cyan-`, `teal-` in new component)
- [x] All tasks marked complete

## Remote push validation

**Full path** (component + test files are non-`.md`):

- **Unit tests** — `npm run test` — all must pass
- **Build** — `npm run build` — must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `feat/recipe-notes-upgrade-nudge` and push to remote
- [x] Open PR from `feat/recipe-notes-upgrade-nudge` to `main`. PR body **MUST** include `Closes #496`.
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [x] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before anything else
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address every unresolved thread, commit, run [Remote push validation], push, wait 180 seconds
  3. **CI check failures** — only after all comments resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix failing required checks, commit, push, wait 180 seconds; restart loop from step 1

Ownership metadata:

- Implementer: —
- Reviewer(s): —
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Sync approved spec delta: copy `openspec/changes/recipe-notes-upgrade-nudge/specs/recipe-notes-upgrade-nudge/spec.md` to `openspec/specs/recipe-notes-upgrade-nudge/spec.md`; update relative links (`../../design.md` → `../../changes/archive/YYYY-MM-DD-recipe-notes-upgrade-nudge/design.md`, same for `tasks.md`)
- [x] Archive the change: move `openspec/changes/recipe-notes-upgrade-nudge/` to `openspec/changes/archive/YYYY-MM-DD-recipe-notes-upgrade-nudge/` — stage both the copy and the deletion in a **single commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-recipe-notes-upgrade-nudge/` exists and `openspec/changes/recipe-notes-upgrade-nudge/` is gone
- [x] Create doc branch: `git checkout -b doc/archive-YYYY-MM-DD-recipe-notes-upgrade-nudge` then `git push -u origin doc/archive-YYYY-MM-DD-recipe-notes-upgrade-nudge`
- [x] Open PR from doc branch to `main` with title `docs: archive recipe-notes-upgrade-nudge (YYYY-MM-DD)` — do NOT push directly to `main`
- [x] Enable auto-merge on doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [x] Monitor doc PR until merged; address any comments and CI failures
- [x] Prune merged local branches: `git fetch --prune` and `git branch -D feat/recipe-notes-upgrade-nudge doc/archive-YYYY-MM-DD-recipe-notes-upgrade-nudge`
