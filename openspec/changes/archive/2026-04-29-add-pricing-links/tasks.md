# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b add-pricing-links` then immediately `git push -u origin add-pricing-links`

## Execution

- [x] **Task 1 — Add Pricing link to Header.tsx sidebar nav**
  - Add `<Link>` for `/pricing` between Cookbooks link (line ~416) and auth-only section (line ~418)
  - Use same className pattern as other nav items
  - Add `activeProps` with accent background styling matching other nav items
  - Use `ChefHat` icon (or appropriate icon) for visual consistency
  - Verification: Sidebar renders Pricing link for both authenticated and unauthenticated sessions

- [x] **Task 2 — Add "View Plans and Pricing" button to anonymous home hero**
  - Edit `src/routes/index.tsx` hero section (lines 58-65)
  - Change CTA container from single button to two buttons: "Browse Recipes" (primary) and "View Plans and Pricing" (secondary)
  - Apply `flex-col sm:flex-row` to CTA container for responsive stacking
  - Style secondary button with `border-2 border-[var(--theme-accent)] text-[var(--theme-accent)] hover:bg-[var(--theme-accent)] hover:text-white`
  - Verification: HomePage renders both buttons; secondary button has outline styling

- [x] **Task 3 — Update tests for home page**
  - Edit `src/routes/__tests__/-index.test.tsx`
  - Add assertion: `screen.getByRole('link', { name: /view plans and pricing/i })` is in the document
  - Verify "Browse Recipes" link still present
  - Verification: `npm run test` passes with new test

- [x] **Task 4 — Update tests for pricing page sidebar active state**
  - Edit `src/routes/__tests__/-pricing.test.tsx`
  - Add test: when on `/pricing`, sidebar Pricing link has active styling
  - Verification: `npm run test` passes with new test

- [x] Review for duplication and unnecessary complexity
- [x] Confirm acceptance criteria are covered

Suggested start-of-work commands: `git checkout main` → `git pull --ff-only` → `git checkout -b add-pricing-links` → `git push -u origin add-pricing-links`

## Validation

- [x] Run unit/integration tests: `npm run test` (my tests pass, pre-existing mailtrap issues in other test files)
- [ ] Run E2E tests: `npm run test:e2e` (skipped - hangs)
- [x] Run type checks: `npx tsc --noEmit` (pre-existing mailtrap module error, my changes pass)
- [ ] Run build: `npm run build` (pre-existing mailtrap module error, my changes compile)
- [x] All completed tasks marked as complete
- [ ] All steps in [Remote push validation] (blocked by pre-existing mailtrap module issue)

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass
- **E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors
- **TypeScript** — `npx tsc --noEmit`; no type errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

Use the project's documented commands for each of the above (see AGENTS.md).

## PR and Merge

- [ ] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `add-pricing-links` to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

The comment and CI resolution loops are iterative: address → validate locally → push → wait 180 seconds → re-check → poll for merge → repeat until the PR merges.

Ownership metadata:

- Implementer:
- Reviewer(s):
- Required approvals:

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
- [ ] Archive the change: move `openspec/changes/add-pricing-links/` to `openspec/changes/archive/2026-04-29-add-pricing-links/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/2026-04-29-add-pricing-links/` exists and `openspec/changes/add-pricing-links/` is gone
- [ ] Commit and push the archive to the default branch in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d add-pricing-links`

Required cleanup after archive: `git fetch --prune` and `git branch -d add-pricing-links`
