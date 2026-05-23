# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/brand-logo-refactor` then immediately `git push -u origin feat/brand-logo-refactor`

## Execution

- [x] **Task 1 — Implement `<LogoMark>` React component:**
  - Create `src/components/ui/LogoMark.tsx` rendering the custom Open Book + Steam SVG dynamically with Lucide-style parameters.
  - Create unit tests at `src/components/ui/__tests__/LogoMark.test.tsx` to verify correct rendering of the SVG, custom `size` scaling, and CSS classes propagation.
- [x] **Task 2 — Update landing page hero icon:**
  - Modify `src/routes/index.tsx` to replace `<ChefHat className="w-24 h-24 md:w-32 md:h-32 text-[var(--theme-accent)]" />` with the custom `<LogoMark className="w-24 h-24 md:w-32 md:h-32 text-[var(--theme-accent)]" size="auto" />` or responsive equivalent properties.
  - Verify that the Playwright E2E tests for the landing page (`src/e2e/home-page-revamp.spec.ts`) compile and pass successfully.
- [x] **Task 3 — Rebrand chrome navigation headers:**
  - Modify `src/components/Header.tsx` brand link to replace `<ChefHat className="w-8 h-8 text-[var(--theme-accent)]" />` with `<LogoMark size={32} className="text-[var(--theme-accent)]" />`.
  - Modify mobile drawer header inside `src/components/Header.tsx` to replace `<ChefHat className="w-6 h-6 text-[var(--theme-accent)]" />` with `<LogoMark size={24} className="text-[var(--theme-accent)]" />`.
  - Verify all Header unit tests in `src/components/__tests__/Header.test.tsx` compile and pass.

Suggested start-of-work commands: `git checkout main` → `git pull --ff-only` → `git checkout -b feat/brand-logo-refactor` → `git push -u origin feat/brand-logo-refactor`

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run production build: `npm run build`
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation] passed successfully

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — run `npm run test`; all tests must pass
- **Integration tests** — run `npm run test`; all tests must pass
- **Regression / E2E tests** — run `npm run test:e2e`; all tests must pass
- **Build** — run `npm run build`; build must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from working branch `feat/brand-logo-refactor` to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] Enable auto-merge: `gh pr merge --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

The comment and CI resolution loops are iterative: address → validate locally → push → wait 180 seconds → re-check → poll for merge → repeat until the PR merges.

Ownership metadata:

- Implementer: Antigravity AI
- Reviewer(s): Doug Hubbard
- Required approvals: 1 approval from a repository maintainer

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the `main` branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/brand-logo-refactor/` to `openspec/changes/archive/YYYY-MM-DD-brand-logo-refactor/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-brand-logo-refactor/` exists and `openspec/changes/brand-logo-refactor/` is gone
- [ ] Commit and push the archive to the `main` branch in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d feat/brand-logo-refactor`

Required cleanup after archive: `git fetch --prune` and `git branch -d feat/brand-logo-refactor`
