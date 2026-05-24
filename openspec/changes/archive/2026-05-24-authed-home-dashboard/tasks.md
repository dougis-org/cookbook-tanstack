# Tasks

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** `git checkout -b feat-authed-home-dashboard` then immediately `git push -u origin feat-authed-home-dashboard`

## Execution

### Task 1 — Integrate Auth and Entitlements hooks on /home

- [ ] Import `useAuth` and `useTierEntitlements` in `src/routes/home.tsx`.
- [ ] Retrieve logged-in session, user name (`firstName` extraction), and tier capability limits/entitlements.
- [ ] Display welcoming greeting line showing `Welcome back, {firstName}` and today's formatted date (e.g. `Sunday, May 24, 2026`).

### Task 2 — Implement the Usage Card Section

- [ ] Define the `ProgressBar` sub-component inline or import it to ensure parity with `src/routes/account.tsx`.
- [ ] Add tRPC query `trpc.usage.getOwned.useQuery()` to fetch current recipe and cookbook counts.
- [ ] Implement the three-column usage section:
  - Recipes: current recipe count vs plan limit (with `ProgressBar`).
  - Cookbooks: current cookbook count vs plan limit (with `ProgressBar`).
  - This Month: count of user recipes saved in the current calendar month (calculated client-side from fetched user recipes) with no progress bar.
  - Caption: Render the plan display name as a caption under each block.

### Task 3 — Update the Quick Actions Row

- [ ] Import Lucide icons `Plus`, `Download`, and `Lock`.
- [ ] Restrict the `Import Recipe` link if `canImport` is false:
  - Add lock indicator or `"Executive Chef"` tier badge.
  - Disable navigation to `/recipes/import` and style with disabled look.

### Task 4 — Implement the Recently Saved Section

- [ ] Query `trpc.recipes.list.useQuery` for the user's top 4 most recently saved recipes (sorted by `newest`, `userId` filtered, `pageSize` set to 4).
- [ ] Display an elegant horizontal/grid of `RecipeCard` components mapping to `/recipes/$recipeId`.
- [ ] Add a `View all →` text link pointing to `/recipes`.
- [ ] Add a visual empty state layout when the user has `0` saved recipes.

### Task 5 — Implement the Contextual Upgrade Nudge

- [ ] Create conditional logic checking if:
  - Cookbook limit is reached, or
  - Recipes are $\ge 80\%$ of plan limit, or
  - LocalStorage `last_paid_action_attempt` timestamp is within the last 7 days.
- [ ] Render the nudge banner card at the bottom of `/home` only when at least one condition resolves.
- [ ] Populate copy and CTAs dynamically:
  - Cookbook limit: *"Ready to build a second cookbook? Upgrade to Prep Cook."*
  - Recipe approaching: *"Running out of room? Upgrade to Prep Cook to save up to 100 recipes."*
  - Recent attempt: *"Unlock premium capabilities with Prep Cook."*
  - CTA Button: *"Upgrade — $2.99/mo"* linking to `/pricing`.

### Task 6 — Write Tests for Nudge Logic

- [ ] Create unit tests in `src/routes/__tests__/home.test.tsx` verifying that:
  - The greeting uses `firstName` and renders today's date correctly.
  - Quick Actions lock triggers correctly based on tier rank.
  - Contextual nudge renders appropriate copy under all three warning threshold states.
  - Nudge is hidden if no thresholds are met.

Suggested start-of-work commands: `git checkout main` → `git pull --ff-only` → `git checkout -b feat-authed-home-dashboard` → `git push -u origin feat-authed-home-dashboard`

## Validation

- [ ] Run Vitest suite: `npm run test` or `npx vitest run src/routes/__tests__/home.test.tsx`
- [ ] Verify TypeScript compiles with no errors: `npx tsc --noEmit`
- [ ] Run full build: `npm run build`
- [ ] Verify UI flows with local dev server (`npm run dev`) manually
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — run `npm run test`; all tests must pass
- **Integration tests** — run `npm run test`; all tests must pass
- **Regression / E2E tests** — run `npm run test:e2e`; all tests must pass
- **Build** — run `npm run build`; build must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure

Use the project's documented commands for each of the above.

## PR and Merge

- [ ] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to the working branch and push to remote:
  ```bash
  git add .
  git commit -m "feat(home): convert authed home to personalized dashboard with usage metrics & contextual nudges (#450)"
  git push
  ```
- [ ] Open PR from working branch to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

Ownership metadata:

- Implementer: Antigravity AI
- Reviewer(s): Codebase Maintainers
- Required approvals: 1 approval from a human contributor

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (like `README.md` or `AGENTS.md`) if necessary
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/authed-home-dashboard/` to `openspec/changes/archive/2026-05-24-authed-home-dashboard/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately:
  ```bash
  git add openspec/changes/archive/2026-05-24-authed-home-dashboard/ openspec/changes/authed-home-dashboard/
  git commit -m "chore(openspec): archive completed authed-home-dashboard change"
  ```
- [ ] Confirm `openspec/changes/archive/2026-05-24-authed-home-dashboard/` exists and `openspec/changes/authed-home-dashboard/` is gone
- [ ] Commit and push the archive to the default branch in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d feat-authed-home-dashboard`

Required cleanup after archive: `git fetch --prune` and `git branch -d feat-authed-home-dashboard`
