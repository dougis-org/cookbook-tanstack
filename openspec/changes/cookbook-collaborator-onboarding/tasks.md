# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/cookbook-collaborator-onboarding` then immediately `git push -u origin feat/cookbook-collaborator-onboarding`

## Execution

- [x] **Task 1: Update Collaborator Schema**
  - Add the `onboarded` boolean field (with type annotations and schema defaults `default: false`) to `src/db/models/collaborator.ts`.
  - Update collaborator schema unit tests (`src/db/models/__tests__/collaborator.test.ts`) to verify that the `onboarded` field defaults to `false`.
  - *Verification command*: `npm run test src/db/models/__tests__/collaborator.test.ts`
- [x] **Task 2: Implement tRPC API updates**
  - Expose `onboarded` status within the `fetchCollaboratorsWithUsers` aggregation helper and the returned structure of `cookbooks.byId` in `src/server/trpc/routers/cookbooks.ts`.
  - Implement `cookbooks.onboardCollaborator` mutation procedure allowing a logged-in collaborator to update their onboarding flag to `true`.
  - Add integration tests in `src/server/trpc/routers/__tests__/cookbooks.test.ts` verifying mutation access controls and correct state changes.
  - *Verification command*: `npm run test src/server/trpc/routers/__tests__/cookbooks.test.ts`
- [x] **Task 3: Build Onboarding Modal UI**
  - Create the `OnboardingModal` component in `src/routes/cookbooks.$cookbookId.tsx` utilizing the established `DialogOverlay` template.
  - Design premium role cards displaying Viewer vs Editor capabilities using Tailwind 4 utility styles and theme variables.
  - Build robust loading and disabled states into the acknowledgment action button.
- [x] **Task 4: Integrate Onboarding Modal to detail page**
  - Connect the modal display trigger conditionally when the current user is a collaborator and `onboarded` resolves to `false`.
  - Connect the mutation handler to the confirmation CTA, invalidating query caches on success to reactive-dismiss the modal.
  - Add frontend UI unit tests in `src/components/cookbooks/__tests__/CookbookDetail.test.tsx` asserting correct copy is displayed per role.
  - *Verification command*: `npm run test src/components/cookbooks/__tests__/CookbookDetail.test.tsx`

Suggested start-of-work commands: `git checkout main` → `git pull --ff-only` → `git checkout -b feat/cookbook-collaborator-onboarding` → `git push -u origin feat/cookbook-collaborator-onboarding`

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] Run unit/integration tests
- [x] Run E2E tests (if applicable)
- [x] Run type checks
- [x] Run build
- [x] Run security/code quality checks required by project standards
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

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from working branch to `main`. **The PR body MUST explicitly state "Closes #459".**
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved to allow the process to progress. Follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously using `gh pr checks <PR-URL> --json isRequired,state`; when any **required (blocking)** CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all required checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

The comment and CI resolution loops are iterative: address → validate locally → push → wait 180 seconds → re-check → poll for merge → repeat until the PR merges.

Ownership metadata:

- Implementer: Antigravity AI
- Reviewer(s): @dougis (PR Reviewer)
- Required approvals: 1 review approval from @dougis

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/cookbook-collaborator-onboarding/` to `openspec/changes/archive/2026-06-02-cookbook-collaborator-onboarding/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/2026-06-02-cookbook-collaborator-onboarding/` exists and `openspec/changes/cookbook-collaborator-onboarding/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-2026-06-02-cookbook-collaborator-onboarding` then `git push -u origin doc/archive-2026-06-02-cookbook-collaborator-onboarding`
- [ ] Open a PR from `doc/archive-2026-06-02-cookbook-collaborator-onboarding` to `main` with title `docs: archive cookbook-collaborator-onboarding (2026-06-02)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/cookbook-collaborator-onboarding doc/archive-2026-06-02-cookbook-collaborator-onboarding`

Required cleanup after archive: `git fetch --prune` and `git branch -d feat/cookbook-collaborator-onboarding doc/archive-2026-06-02-cookbook-collaborator-onboarding`
