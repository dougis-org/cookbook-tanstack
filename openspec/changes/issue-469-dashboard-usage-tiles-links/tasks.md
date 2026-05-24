# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b issue-469-dashboard-usage-tiles-links` then immediately `git push -u origin issue-469-dashboard-usage-tiles-links`

## Execution

- [x] Implement whole-tile link wrappers for Recipes and Cookbooks usage cards in `src/routes/home.tsx`.
- [x] Preserve Discovery links in `src/routes/home.tsx` unchanged.
- [x] Keep scope free of analytics instrumentation (no tracking imports/hooks/events).
- [x] Add/update home route tests in `src/routes/__tests__/-home.test.tsx` for:
  - [x] Recipes usage tile link target `/recipes`
  - [x] Cookbooks usage tile link target `/cookbooks`
  - [x] Discovery links still present
- [x] Review updated markup for semantic link structure and keyboard focus-visible affordances.
- [x] Review for duplication and unnecessary complexity.
- [x] Confirm acceptance criteria in `openspec/changes/issue-469-dashboard-usage-tiles-links/specs/home-dashboard-navigation/spec.md` are covered.

Suggested start-of-work commands: `git checkout main` → `git pull --ff-only` → `git checkout -b issue-469-dashboard-usage-tiles-links` → `git push -u origin issue-469-dashboard-usage-tiles-links`

## Validation

- [x] Run targeted unit/integration tests for home route:
  - [x] `npx vitest run src/routes/__tests__/-home.test.tsx`
- [x] Run broader unit/integration test suite:
  - [x] `npm run test`
- [x] Run E2E tests (if applicable to dashboard nav changes):
  - [x] `npm run test:e2e`
- [ ] Run type checks:
- [x] Run type checks:
  - [x] `npx tsc --noEmit`
- [x] Run build:
  - [x] `npm run build`
- [x] Run required security/code quality checks per project standards (Codacy/Snyk as applicable).
- [x] All completed tasks marked as complete.
- [x] All steps in [Remote push validation].

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — run the project's unit test suite; all tests must pass.
- **Integration tests** — run the project's integration test suite; all tests must pass.
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass.
- **Build** — run the project's build script; build must succeed with no errors.
- If **ANY** of the above fail, iterate and address the failure before pushing.

Use the project's documented commands for each of the above (see `README.md`, `CLAUDE.md`, and `AGENTS.md`).

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing.
- [ ] Commit all changes to the working branch and push to remote.
- [ ] Open PR from working branch to `main`.
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments.
- [ ] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`.
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation], push to the same branch, wait 180 seconds, and repeat until no unresolved comments remain.
- [ ] **Monitor CI checks** — poll check status autonomously; when any check fails, diagnose and fix, commit, follow all steps in [Remote push validation], push, wait 180 seconds, and repeat until all checks pass.
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED`, proceed to Post-Merge; if `CLOSED`, exit and notify the user.

The comment and CI resolution loops are iterative: address → validate locally → push → wait 180 seconds → re-check → poll for merge → repeat until merged.

Ownership metadata:

- Implementer: GitHub Copilot coding agent
- Reviewer(s): Repository maintainers/reviewers assigned in PR
- Required approvals: At least one maintainer approval plus passing required checks

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`.
- [ ] Mark all remaining tasks as complete (`- [x]`).
- [ ] Update repository documentation impacted by the change.
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec).
- [ ] Archive the change by moving `openspec/changes/issue-469-dashboard-usage-tiles-links/` to `openspec/changes/archive/YYYY-MM-DD-issue-469-dashboard-usage-tiles-links/` and stage both add+delete in a single commit.
- [ ] Confirm archived directory exists and original change directory is removed.
- [ ] Commit and push the archive to `main` in one commit.
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d issue-469-dashboard-usage-tiles-links`.

Required cleanup after archive: `git fetch --prune` and `git branch -d issue-469-dashboard-usage-tiles-links`
