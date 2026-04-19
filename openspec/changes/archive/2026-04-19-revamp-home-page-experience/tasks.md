# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feature/revamp-home-page-experience`
  then immediately `git push -u origin feature/revamp-home-page-experience`
- [x] Review `openspec/changes/revamp-home-page-experience/proposal.md`,
  `openspec/changes/revamp-home-page-experience/design.md`, and
  `openspec/changes/revamp-home-page-experience/specs/**/*.md`.
- [x] Confirm GitHub issues #346 and #359 are linked in the PR description.
- [x] Confirm no active OpenSpec scope changes are needed before implementation starts.

## Execution

- [x] Add focused tests for `/` route behavior before implementation:
  - [x] anonymous visitors remain on public landing page;
  - [x] authenticated users redirect to `/home`;
  - [x] anonymous public landing page does not render create/import CTAs;
  - [x] public landing page does not include technology-stack marketing copy.
- [x] Add focused tests for `/home` before implementation:
  - [x] anonymous visitors are redirected through auth guard;
  - [x] authenticated users see workflow shortcuts;
  - [x] authenticated users see global discovery links or sections.
- [x] Add focused tests for ad eligibility before implementation:
  - [x] anonymous viewer on ad-enabled public role is ad-eligible;
  - [x] `home-cook` non-admin viewer on ad-enabled role is ad-eligible;
  - [x] `prep-cook`, `sous-chef`, and `executive-chef` viewers are not ad-eligible;
  - [x] admin viewer is not ad-eligible;
  - [x] auth/task/admin/account/profile/print roles are not ad-eligible.
- [x] Refactor or add page-role/ad-policy code in a small, typed module.
- [x] Update `src/routes/index.tsx` so `/` is anonymous-focused and redirects authenticated users to `/home`.
- [x] Add `src/routes/home.tsx` as an authenticated route using existing auth guard patterns.
- [x] Build `/home` with flexible sections for workflow shortcuts and global discovery, avoiding brittle
  assumptions about future page design.
- [x] Add provider-neutral ad slot groundwork or layout hooks controlled by the shared ad policy.
- [x] Preserve anonymous browsing of public recipes, cookbooks, and categories.
- [x] Review for duplication and unnecessary complexity.
- [x] Confirm acceptance criteria are covered by tests and implementation.

Suggested start-of-work commands:

`git checkout main` → `git pull --ff-only` → `git checkout -b feature/revamp-home-page-experience` →
`git push -u origin feature/revamp-home-page-experience`

## Validation

- [x] Run unit/integration tests with `npm run test`.
- [x] Run E2E tests with `npm run test:e2e`.
- [x] Run type checks with `npx tsc --noEmit`.
- [x] Run build with `npm run build`.
- [x] Run Codacy analysis if available and required by `docs/standards/analysis-and-security.md`.
- [x] Run Snyk only if new dependencies are added.
- [x] Run markdown lint/fix on edited `.md` files if markdown files change during implementation.
- [x] All completed tasks marked as complete.
- [x] All steps in [Remote push validation].

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- [x] **Unit tests** — run `npm run test`; all tests must pass.
- [x] **Integration tests** — run any route/component integration coverage included in `npm run test`; all tests must pass.
- [x] **Regression / E2E tests** — run `npm run test:e2e`; all tests must pass.
- [x] **Build** — run `npm run build`; build must succeed with no errors.
- [x] **Type check** — run `npx tsc --noEmit`; type checking must succeed.
- If **ANY** of the above fail, iterate and address the failure before pushing.

Use the project's documented commands in `CONTRIBUTING.md` and `docs/standards/`.

## PR and Merge

- [x] Run the required pre-PR self-review from
  `.github/openspec-shared/.codex/skills/openspec-apply-change/SKILL.md` before committing.
- [x] Commit all changes to the working branch and push to remote.
- [x] Open PR from working branch to `main`.
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments.
- [x] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`.
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them,
  commit fixes, follow all steps in [Remote push validation], then push to the same working branch; wait
  180 seconds then repeat until no unresolved comments remain.
- [x] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix
  the failure, commit fixes, follow all steps in [Remote push validation], then push to the same working
  branch; wait 180 seconds then repeat until all checks pass.
- [x] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is
  `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user. Never wait for a human to report
  the merge; never force-merge.

The comment and CI resolution loops are iterative: address → validate locally → push → wait 180 seconds →
re-check → poll for merge → repeat until the PR merges.

Ownership metadata:

- Implementer: Codex or assigned implementer during apply phase.
- Reviewer(s): repository maintainers.
- Required approvals: repository branch protection and required review policy.

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks.
- Security finding → remediate → commit → validate locally → push → re-scan.
- Review comment → address → commit → validate locally → push → confirm resolved.

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`.
- [x] Verify the merged changes appear on the default branch.
- [x] Mark all remaining tasks as complete (`- [x]`).
- [x] Update repository documentation impacted by the change.
- [x] Sync approved spec deltas into `openspec/specs/` (global spec).
- [x] Archive the change: move `openspec/changes/revamp-home-page-experience/` to
  `openspec/changes/archive/YYYY-MM-DD-revamp-home-page-experience/` and stage both the new location and
  the deletion of the old location in a single commit. Do not commit the copy and delete separately.
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-revamp-home-page-experience/` exists and
  `openspec/changes/revamp-home-page-experience/` is gone.
- [x] Commit and push the archive to the default branch in one commit.
- [x] Prune merged local feature branches: `git fetch --prune` and `git branch -d feature/revamp-home-page-experience`.

Required cleanup after archive: `git fetch --prune` and `git branch -d feature/revamp-home-page-experience`.
