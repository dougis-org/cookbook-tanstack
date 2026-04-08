# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/optimize-print-heading-density` then immediately `git push -u origin feat/optimize-print-heading-density`

## Execution

- [x] **Step 1 — Define failing recipe heading tests first:** extend `src/components/recipes/__tests__/RecipeDetail.test.tsx` with assertions for print-heading density classes/hooks on recipe section headings and confirm the new tests fail before implementation.
- [x] **Step 2 — Define failing cookbook heading tests first:** extend `src/components/cookbooks/__tests__/CookbookStandaloneLayout.test.tsx` and any other directly relevant print-facing component tests so cookbook title, chapter, and alphabetical index headings are covered by failing print-density assertions.
- [x] **Step 3 — Implement shared print-heading density pattern:** add the reusable print-heading density treatment in the relevant print-facing components and/or `src/styles/print.css`, keeping the behavior print-only and tiered by heading level.
- [x] **Step 4 — Apply recipe print-heading updates:** update `src/components/recipes/RecipeDetail.tsx` so existing print-facing recipe section headings use the shared pattern without adding a new Notes heading or changing screen behavior.
- [x] **Step 5 — Apply cookbook print-heading updates:** update `src/components/cookbooks/CookbookStandaloneLayout.tsx` and any directly related print-facing cookbook surfaces so cookbook title, chapter headings, and alphabetical index heading use the appropriate shared density tiers.
- [x] **Step 6 — Review scope and simplicity:** confirm the implementation avoids global `h1`-`h6` print resets, avoids unrelated print-layout changes, and does not duplicate styling unnecessarily.

Suggested start-of-work commands: `git checkout main` → `git pull --ff-only` → `git checkout -b feat/optimize-print-heading-density` → `git push -u origin feat/optimize-print-heading-density`

## Validation

- [x] Run targeted unit/integration tests for print-facing recipe and cookbook components
- [x] Run broader unit test coverage for any affected component suites: `npm run test`
- [x] Run targeted regression / E2E coverage for cookbook print behavior: `npx playwright test src/e2e/cookbooks-print.spec.ts`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] Run security/code quality checks required by project standards, including Codacy if available for the touched files
- [ ] Manually verify print preview for a representative cookbook print route to confirm headings are denser but still readable
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run any impacted component/integration suites for recipe and cookbook print surfaces; all tests must pass
- **Regression / E2E tests** — run `npx playwright test src/e2e/cookbooks-print.spec.ts`; tests must pass
- **Build** — run `npm run build`; build must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

Use the project's documented commands for each of the above (see `AGENTS.md` and `docs/standards/`).

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from working branch to `main`
- [x] Wait for 120 seconds for the Agentic reviewers to post their comments
- [x] **Monitor PR comments** — when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; repeat until no unresolved comments remain
- [x] Enable auto-merge once no blocking review comments remain
- [x] **Monitor CI checks** — when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; repeat until all checks pass
- [x] Wait for the PR to merge — **never force-merge**; if a human force-merges, continue to Post-Merge

Ownership metadata:

- Implementer: Codex agent
- Reviewer(s): repository maintainer and any required CODEOWNERS reviewers
- Required approvals: explicit human approval of `proposal.md`, then standard PR approvals required by repository settings

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate or document as unrelated → commit → validate locally → push → re-scan/review
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change
- [x] Sync approved spec deltas into `openspec/specs/` (global spec)
- [x] Archive the change: move `openspec/changes/optimize-print-heading-density/` to `openspec/changes/archive/YYYY-MM-DD-optimize-print-heading-density/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-optimize-print-heading-density/` exists and `openspec/changes/optimize-print-heading-density/` is gone
- [x] Commit and push the archive to the default branch in one commit
- [x] Prune merged local feature branches: `git fetch --prune` and `git branch -d feat/optimize-print-heading-density`

Required cleanup after archive: `git fetch --prune` and `git branch -d feat/optimize-print-heading-density`
