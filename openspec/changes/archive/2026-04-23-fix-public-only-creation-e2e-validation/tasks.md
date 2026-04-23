<!-- markdownlint-disable MD013 -->

# Tasks

## Preparation

- [x] Review `openspec/changes/fix-public-only-creation-e2e-validation/proposal.md`, `design.md`, `specs/cookbook-print-e2e-validation.md`, and `tests.md` before implementation.
- [x] Confirm implementation still targets a follow-up fix, not reopening `openspec/changes/archive/2026-04-21-enforce-public-only-creation/`.

## Execution

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix/public-only-creation-e2e-validation` then immediately `git push -u origin fix/public-only-creation-e2e-validation`

### Task 1: Confirm Fixture Failure Mode

- [x] Inspect `src/e2e/cookbooks-print.spec.ts` and `src/e2e/helpers/cookbooks.ts` to confirm the private print-route test creates a cookbook through default `home-cook` UI setup.
- [x] Confirm `src/lib/auth.ts` defaults new users to `home-cook`.
- [x] Confirm `src/server/trpc/routers/cookbooks.ts` coerces lower-tier cookbook creation to public.
- [x] Decide whether the smallest reliable fixture is tier/admin UI setup or direct private cookbook seeding.

### Task 2: Correct Private Cookbook Print Fixture

- [x] Update `src/e2e/cookbooks-print.spec.ts` and/or `src/e2e/helpers/*` so the private print-route scenario uses a genuinely private cookbook.
- [x] Keep the anonymous assertion for `Cookbook not found`.
- [x] Ensure the fixture does not depend on a default `home-cook` user creating private content.
- [x] Keep changes test-only unless implementation reveals a production defect.

### Task 3: Preserve Entitlement Regression Coverage

- [x] Verify existing router tests still cover restricted-tier cookbook creation coercion.
- [x] Add or adjust tests only if the fixture fix exposes an uncovered entitlement scenario.
- [x] Do not weaken public-only creation behavior for `home-cook` or `prep-cook`.

### Task 4: OpenSpec Housekeeping

- [x] If editing `openspec/changes/archive/2026-04-21-enforce-public-only-creation/tasks.md`, correct stale unchecked post-merge items without rewriting original feature history.
- [x] Run markdown formatting/linting for any edited Markdown files if the repo markdown tooling is available.

### Task 5: Review

- [x] Review for duplication and unnecessary helper complexity.
- [x] Confirm every acceptance criterion in `openspec/changes/fix-public-only-creation-e2e-validation/specs/cookbook-print-e2e-validation.md` is covered.
- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing.

Suggested start-of-work commands: `git checkout main` -> `git pull --ff-only` -> `git checkout -b fix/public-only-creation-e2e-validation` -> `git push -u origin fix/public-only-creation-e2e-validation`

## Validation

- [x] Run affected E2E spec: `CI=1 npm run test:e2e -- src/e2e/cookbooks-print.spec.ts --reporter=line`
- [x] Run focused router tests: `npm run test -- src/server/trpc/routers/__tests__/recipes.test.ts src/server/trpc/routers/__tests__/cookbooks.test.ts`
- [x] Run unit/integration tests: `npm run test`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] Run security/code quality checks required by project standards if production code or dependencies change.
- [x] All completed tasks marked as complete.
- [x] All steps in [Remote push validation].

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — run `npm run test`; all tests must pass.
- **Regression / E2E tests** — run `CI=1 npm run test:e2e -- src/e2e/cookbooks-print.spec.ts --reporter=line`; the affected spec must pass.
- **Build** — run `npm run build`; build must succeed with no errors.
- **Type check** — run `npx tsc --noEmit`; type checking must pass.
- If **ANY** of the above fail, iterate and address the failure before pushing.

## PR and Merge

- [ ] Commit all changes to the working branch and push to remote.
- [ ] Open PR from `fix/public-only-creation-e2e-validation` to `main`.
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments.
- [ ] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`.
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation], then push to the same working branch; wait 180 seconds and repeat until no unresolved comments remain.
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation], then push to the same working branch; wait 180 seconds and repeat until all checks pass.
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED`, proceed to Post-Merge; if `CLOSED`, exit and notify the user. Never force-merge.

Ownership metadata:

- Implementer: Codex
- Reviewer(s): repository maintainers and automated reviewers
- Required approvals: repository branch protection and reviewer requirements

Blocking resolution flow:

- CI failure -> diagnose failing job -> fix -> commit -> validate locally -> push -> re-run checks.
- Security finding -> remediate high/critical findings -> commit -> validate locally -> push -> re-scan.
- Review comment -> address or document rationale -> commit if needed -> validate locally -> push -> confirm resolved.

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`.
- [ ] Verify the merged changes appear on the default branch.
- [ ] Mark all remaining tasks as complete (`- [x]`).
- [ ] Update repository documentation impacted by the change.
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec).
- [ ] Archive the change: move `openspec/changes/fix-public-only-creation-e2e-validation/` to `openspec/changes/archive/YYYY-MM-DD-fix-public-only-creation-e2e-validation/` and stage both the new location and the deletion of the old location in a single commit.
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-public-only-creation-e2e-validation/` exists and `openspec/changes/fix-public-only-creation-e2e-validation/` is gone.
- [ ] Commit and push the archive to the default branch in one commit.
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d fix/public-only-creation-e2e-validation`.

Required cleanup after archive: `git fetch --prune` and `git branch -d fix/public-only-creation-e2e-validation`.
