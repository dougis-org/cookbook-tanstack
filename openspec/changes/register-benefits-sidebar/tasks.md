# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/register-benefits-sidebar` then immediately `git push -u origin feat/register-benefits-sidebar`

## Execution

- [x] **Task 1 — Extend AuthPageLayout structure:** Add `maxWidth` optional string property (defaulting to `"max-w-md"`) to the `AuthPageLayoutProps` interface inside `src/components/auth/AuthPageLayout.tsx` and bind it to the outer `div` element's class names.
- [x] **Task 2 — Refactor RegisterForm layout to responsive grid:** Restructure `src/components/auth/RegisterForm.tsx` to group the form and benefits sidebar in a grid using classes `grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8 items-start`.
- [x] **Task 3 — Create Benefits Sidebar element:** Build the benefits sidebar inside `src/components/auth/RegisterForm.tsx` to list the 5 benefits with Lucide check icon (`Check` or `CheckCircle2`) badges. Set it first in JSX and apply order utilities (`order-first md:order-last`) so it stacks above form on mobile and goes right on desktop.
- [x] **Task 4 — Add Legal Consent microcopy:** Insert the legal statement "By creating an account you agree to our Terms and Privacy Policy." under the submit button using styling `text-xs text-[var(--theme-fg-subtle)]` with `#` link tags and TODO comments.
- [x] **Task 5 — Route integration:** Update the route file `src/routes/auth/register.tsx` to pass `maxWidth="max-w-3xl"` into `<AuthPageLayout>`.
- [x] **Task 6 — Update RegisterForm unit tests:** Add assertions verifying that the benefits list renders properly, icons are present, and the legal links pointing to `#` exist in `src/components/auth/__tests__/RegisterForm.test.tsx`.

Suggested start-of-work commands: `git checkout main` → `git pull --ff-only` → `git checkout -b feat/register-benefits-sidebar` → `git push -u origin feat/register-benefits-sidebar`

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Review its report and apply fixes for duplication, complexity, and completeness before committing.

## Validation

- [x] Run unit/integration tests: `npm run test src/components/auth/__tests__/RegisterForm.test.tsx` and the full suite `npm run test`
- [x] Run E2E tests: `npm run test:e2e` (if applicable/configured)
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] Run security/code quality checks required by project standards (Codacy / Snyk if available)
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

Use the project's documented commands for each of the above (see project README or CLAUDE.md / AGENTS.md).

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from working branch to `main`. **The PR body MUST explicitly state "Closes #454".**
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved to allow the process to progress. Follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously using `gh pr checks --json isRequired,state`; when any **required (blocking)** CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all required checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

The comment and CI resolution loops are iterative: address → validate locally → push → wait 180 seconds → re-check → poll for merge → repeat until the PR merges.

Ownership metadata:

- Implementer: Antigravity AI
- Reviewer(s): dougis
- Required approvals: 1 approval (dougis)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the main branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/register-benefits-sidebar/` to `openspec/changes/archive/2026-05-24-register-benefits-sidebar/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/2026-05-24-register-benefits-sidebar/` exists and `openspec/changes/register-benefits-sidebar/` is gone
- [ ] Commit and push the archive to the main branch in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d feat/register-benefits-sidebar`

Required cleanup after archive: `git fetch --prune` and `git branch -d feat/register-benefits-sidebar`
