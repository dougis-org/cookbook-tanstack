# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix/pricing-tier-cta` then immediately `git push -u origin fix/pricing-tier-cta`

## Execution

### rename-route: Rename `/upgrade` route to `/change-tier`

- [x] Rename `src/routes/upgrade.tsx` → `src/routes/change-tier.tsx`
- [x] Update `createFileRoute('/upgrade', ...)` → `createFileRoute('/change-tier')` inside the renamed file
- [x] Restart dev server so TanStack Router regenerates `src/routeTree.gen.ts`
- [x] Verify `src/routeTree.gen.ts` contains `/change-tier` and no longer references `/upgrade`
- [x] Verify `grep -r '"/upgrade"' src/` returns zero results

### fix-cta-logic: Update `TierCard` CTA logic in `src/routes/pricing.tsx`

- [x] Update `TierCardProps`: replace `isCurrent: boolean` with `currentTier: EntitlementTier`
- [x] In `TierCard`, derive `isCurrent` as `const isCurrent = tier === currentTier`
- [x] Rewrite `renderCTA()` with this branch order:
  1. `isTopTier` → `"Maximum plan"` text (always shown for exec-chef regardless of current)
  2. `isCurrent` → `return null`
  3. `isAnon` → `"Get started free"` link to `/auth/register`
  4. `TIER_ORDER.indexOf(tier) > TIER_ORDER.indexOf(currentTier)` → `"Upgrade"` link to `/change-tier`
  5. else → `"Downgrade"` link to `/change-tier`
- [x] Update `PricingPage` map: pass `currentTier={currentTier}` instead of `isCurrent={currentTier === tier}`

### remove-anonymous-card: Filter anonymous tier from pricing display

- [x] In `PricingPage`, filter the render loop: `TIER_ORDER.filter(t => t !== 'anonymous').map(...)`
- [x] Remove the `if (tier === "anonymous") return null` branch from `renderCTA()` (no longer reachable)

### update-tests: Rewrite `src/routes/__tests__/-pricing.test.tsx`

- [x] Update "renders all 5 tier names" → assert 4 names (remove `Anonymous`)
- [x] Update "renders non-empty tier descriptions" → `descriptions.length` to 4
- [x] Remove "highlights anonymous card for anonymous session" test (card no longer rendered)
- [x] Update "highlights home-cook card for authenticated user with missing tier" → remove assertion on `tier-card-anonymous`
- [x] Update "executive-chef card has no upgrade CTA link" → assert no `a[href="/change-tier"]` on exec card (or no link at all)
- [x] Replace "home-cook, prep-cook, sous-chef cards link to /upgrade" with tests for:
  - home-cook user: prep-cook/sous-chef/exec cards show "Upgrade" → `/change-tier`
  - sous-chef user: home-cook/prep-cook cards show "Downgrade" → `/change-tier`; exec shows "Upgrade" → `/change-tier`
  - Any tier user: current tier card has no `<a>` element
- [x] Update "non-anonymous cards link to /auth/register" → assert 3 sign-up links (exec shows "Maximum plan", no link)
- [x] Add: `tier-card-anonymous` is not in the DOM for any session state

## Validation

- [x] `npm run test` — all tests pass (1131/1131)
- [x] `npm run build` — build succeeds with no type errors
- [x] `grep -r '"/upgrade"' src/` — returns zero results
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates):

- **Unit tests** — `npm run test`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to `fix/pricing-tier-cta` and push to remote
- [x] Open PR from `fix/pricing-tier-cta` to `main` — https://github.com/dougis-org/cookbook-tanstack/pull/405
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] Enable auto-merge: `gh pr merge --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all Remote push validation steps, then push; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status; when any CI check fails, diagnose and fix, commit fixes, validate locally, push; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:

- Implementer: Claude Code
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/fix-pricing-tier-cta/` to `openspec/changes/archive/YYYY-MM-DD-fix-pricing-tier-cta/` in a **single atomic commit** (stage both the new location and deletion of old location together)
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-pricing-tier-cta/` exists and `openspec/changes/fix-pricing-tier-cta/` is gone
- [ ] Commit and push the archive commit to `main`
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d fix/pricing-tier-cta`
