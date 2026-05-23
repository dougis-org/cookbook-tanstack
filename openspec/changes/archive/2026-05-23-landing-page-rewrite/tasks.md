# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/landing-page-rewrite` then immediately `git push -u origin feat/landing-page-rewrite`

## Execution

- [x] **Task 1 — Hero Redesign & Branding Cleanup:**
  - Update `src/routes/index.tsx` hero section.
  - Implement `.brand-wordmark` class on "My CookBooks" title heading.
  - Set sub-tagline to "Save every recipe. Build cookbooks. Cook from any device."
  - Verify styling complies with `design-system/CLAUDE.md`.
- [x] **Task 2 — Update Call-to-Actions & Pricing Line:**
  - Update primary CTA button text to "Start Free — No Credit Card" pointing to `/auth/register`.
  - Update secondary CTA button text to "Browse Public Recipes" pointing to `/recipes`.
  - Add pricing teaser text "Plans start at $2.99/mo. View Plans" linking to `/pricing` directly underneath the CTA buttons.
- [x] **Task 3 — Create Preview Card & Screenshot Slot:**
  - Add custom `ImageSlot` wrapper with ID `landing-screenshot` below the CTA buttons.
  - Implement placeholder card utilizing a Lucide `BookOpen` icon, elegant typography, and helpful description.
- [x] **Task 4 — Implement Verb-Led Live Feature Cards:**
  - Replace current feature list items with four new action-led cards:
    - **Save** (Lucide `Save` icon): "Capture any recipe in seconds. Title, ingredients, steps, your own notes."
    - **Organize** (Lucide `BookOpen` icon): "Sort into cookbooks. Tag by meal, course, prep. Find anything in a click."
    - **Import** (Lucide `ArrowUpRight` icon): "Bring recipes in from JSON exports or paste a URL. Available on Executive Chef."
    - **Print** (Lucide `Printer` icon): "Recipe and cookbook print layouts that look good on paper."
  - Wrap cards in `<Link to="/auth/register">` with rich hover effects.
  - Clean up imports to remove unused Lucide icons (`ChefHat`, `Search`) to avoid compilation warnings.
- [x] **Task 5 — Rewrite Playwright E2E Tests:**
  - Modify `src/e2e/home-page-revamp.spec.ts` assertions.
  - Update assertions for the new CTA strings and target URLs.
  - Verify that the screenshot card renders `image-slot[id="landing-screenshot"]`.
  - Ensure the custom logo mark is visible and has correct attributes.

Suggested start-of-work commands: `git checkout main` → `git pull --ff-only` → `git checkout -b feat/landing-page-rewrite` → `git push -u origin feat/landing-page-rewrite`

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run production build: `npm run build`
- [x] Verify styling renders cleanly across all four application themes (`dark`, `dark-greens`, `light-cool`, `light-warm`)
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` must pass cleanly.
- **Integration tests** — `npm run test` must pass cleanly.
- **Regression / E2E tests** — `npm run test:e2e` must pass cleanly.
- **Build** — `npm run build` or `npx tsc --noEmit` must succeed with no compile errors.
- If **ANY** of the above fail, you **MUST** iterate and address the failure.

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from working branch to `main`
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] Enable auto-merge: `gh pr merge --auto --merge`
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [x] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

Ownership metadata:

- Implementer: Antigravity
- Reviewer(s): Doug Hubbard (@dougis)
- Required approvals: 1 approval from @dougis or auto-merge via passing CI checks

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change
- [x] Sync approved spec deltas into `openspec/specs/` (global spec)
- [x] Archive the change: move `openspec/changes/landing-page-rewrite/` to `openspec/changes/archive/2026-05-23-landing-page-rewrite/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [x] Confirm `openspec/changes/archive/2026-05-23-landing-page-rewrite/` exists and `openspec/changes/landing-page-rewrite/` is gone
- [x] Commit and push the archive to the default branch in one commit
- [x] Prune merged local feature branches: `git fetch --prune` and `git branch -d feat/landing-page-rewrite`

Required cleanup after archive: `git fetch --prune` and `git branch -d feat/landing-page-rewrite`
