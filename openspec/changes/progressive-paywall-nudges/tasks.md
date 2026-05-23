# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b progressive-paywall-nudges` then immediately `git push -u origin progressive-paywall-nudges`

## Execution

- [x] **Task 1 — Implement copy strings helper:**
  - [x] Create file `src/lib/nudgeCopy.ts`
  - [x] Export copy functions/constants for `soft`, `loud`, and `wall` notifications as specified in design doc.
  - [x] Verify code formats cleanly and has no typescript errors.
- [x] **Task 2 — Implement shared warning component:**
  - [x] Create file `src/components/ui/UsageNudge.tsx`
  - [x] Implement ratio calculations (`count / limit`), theme-warning persistent layout with progress bar, and session-dismissable soft overlay with `sessionStorage` lookup.
  - [x] Assert that highest-tier users (no next tier) hide CTA button.
- [x] **Task 3 — Implement TierWall upgrades:**
  - [x] Modify `src/components/ui/TierWall.tsx`.
  - [x] Inject comparison matrix showing current plan benefits vs next plan benefits dynamically retrieved from `TIER_PRICING` and `TIER_LIMITS` when `reason === 'count-limit'` and `display === 'modal'`.
- [x] **Task 4 — Mount nudge on main list page:**
  - [x] Modify `src/routes/recipes/index.tsx`.
  - [x] Import and place `<UsageNudge count={myRecipeCount} limit={recipeLimit} resourceName="recipe" />` directly beneath `<PageLayout>` header section.
- [x] **Task 5 — Enforce limit-check and blockage on form page:**
  - [x] Modify `src/routes/recipes/new.tsx`.
  - [x] Run limit queries on page mount, immediately overlay modal `<TierWall reason="count-limit" display="modal" onDismiss={() => navigate({ to: '/recipes' })} />` if `myRecipeCount >= recipeLimit`.
  - [x] Render `<UsageNudge>` inline if the user has warning levels but is below 100%.

Suggested start-of-work commands: `git checkout main` → `git pull --ff-only` → `git checkout -b progressive-paywall-nudges` → `git push -u origin progressive-paywall-nudges`

## Validation

- [x] Run unit/integration tests
- [x] Run E2E tests (if applicable)
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] Run security/code quality checks required by project standards
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` (Vitest); all tests must pass
- **Integration/E2E tests** — `npm run test:e2e` (Playwright); all tests must pass
- **Build** — `npm run build`; build must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

Use the project's documented commands for each of the above (see project README or CLAUDE.md / AGENTS.md).

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from working branch `progressive-paywall-nudges` to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

The comment and CI resolution loops are iterative: address → validate locally → push → wait 180 seconds → re-check → poll for merge → repeat until the PR merges.

Ownership metadata:

- Implementer: Antigravity AI
- Reviewer(s): Doug (Human Maintainer)
- Required approvals: 1 approval from human reviewer

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
- [ ] Archive the change: move `openspec/changes/progressive-paywall-nudges/` to `openspec/changes/archive/2026-05-23-progressive-paywall-nudges/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/2026-05-23-progressive-paywall-nudges/` exists and `openspec/changes/progressive-paywall-nudges/` is gone
- [ ] Commit and push the archive to the default branch in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d progressive-paywall-nudges`

Required cleanup after archive: `git fetch --prune` and `git branch -d progressive-paywall-nudges`
