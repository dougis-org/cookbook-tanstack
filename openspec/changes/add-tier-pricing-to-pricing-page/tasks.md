# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b add-tier-pricing-to-pricing-page` then immediately `git push -u origin add-tier-pricing-to-pricing-page`

## Execution

### 1. Update `src/lib/tier-entitlements.ts`

- [x] **Add `TIER_PRICING` constant** with type `{ annual: number | null; monthly: number | null }`:
  ```typescript
  export const TIER_PRICING: Record<EntitlementTier, { annual: number | null; monthly: number | null }> = {
    'home-cook': { annual: null, monthly: null },
    'prep-cook': { annual: 27.99, monthly: 2.99 },
    'sous-chef': { annual: 59.99, monthly: 5.99 },
    'executive-chef': { annual: 99.99, monthly: 9.99 },
  }
  ```
- [x] **Update `canImport()` function** to require `executive-chef` tier:
  ```typescript
  export function canImport(tier: string | null | undefined): boolean {
    return hasAtLeastTier({ tier }, 'executive-chef')
  }
  ```
- [x] **Update `TIER_DESCRIPTIONS.sous-chef`** to remove "import tools" reference:
  ```typescript
  'sous-chef': 'Unlock private recipes and room for 500 recipes and 25 cookbooks.',
  ```

**Verification:** Run `npm run typecheck` and `npm run test` — all should pass.

### 2. Update `docs/user-tier-feature-sets.md`

- [x] **Update Import Policy section** (currently line 108): Change "available only to Sous Chef and Executive Chef users" to "available only to Executive Chef users"
- [x] **Update Future Feature Placement table** (line 125-133): Change "Sous Chef and above" to "Executive Chef only" for import row

**Verification:** Read the document and confirm no remaining references to Sous Chef having import capability.

### 3. Update `src/routes/pricing.tsx`

- [x] **Add import for `TIER_PRICING`** from `@/lib/tier-entitlements`
- [x] **Update `TierCard` component** — remove `renderCTA()` function and all CTA rendering logic from the card
- [x] **Add pricing display section** to each card (below tier name/description):
  ```
  ${annual}/year  (primary, bold)
  ${monthly}/month (secondary, muted)
  [Save 2 months]  (badge, accent, paid tiers only)
  ```
  For Home Cook: show "FREE" instead of pricing rows
- [x] **Add ad status row** to each card (below feature limits):
  ```
  showUserAds(tier) ? "Ad Supported" : "No Ads"
  ```
- [x] **Add single CTA below tier grid**:
  ```tsx
  {isAnon && (
    <div className="mt-8 text-center">
      <Link
        to="/auth/register"
        className="inline-block rounded-md bg-[var(--theme-accent)] px-6 py-3 text-base font-semibold text-white hover:opacity-90"
      >
        Get Started for Free
      </Link>
    </div>
  )}
  ```
- [x] **Remove `currentTier` from `TierCardProps`** — CTA logic no longer in cards
- [x] **Simplify `TierCard` props interface** to only require `tier: EntitlementTier`

**Verification:** Run `npm run typecheck` and `npm run test` — all should pass.

### 4. Run existing tests to verify no regressions

- [x] Run `npm run test` — all unit tests pass
- [ ] Run `npm run test:e2e` — all E2E tests pass

## Validation

- [x] Run unit/integration tests: `npm run test`
- [ ] Run E2E tests (if applicable): `npm run test:e2e`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [ ] Run security/code quality checks required by project standards (Codacy if available)
- [ ] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **Integration tests** — `npm run test` — all tests must pass
- **Regression / E2E tests** — `npm run test:e2e` — all tests must pass
- **Build** — `npm run build` — build must succeed with no errors
- **Type check** — `npx tsc --noEmit` — no TypeScript errors

If **ANY** of the above fail, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [ ] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from working branch to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

The comment and CI resolution loops are iterative: address → validate locally → push → wait 180 seconds → re-check → poll for merge → repeat until the PR merges.

Ownership metadata:

- Implementer: agent
- Reviewer(s): human reviewer
- Required approvals: 1

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
- [ ] Archive the change: move `openspec/changes/add-tier-pricing-to-pricing-page/` to `openspec/changes/archive/2026-05-02-add-tier-pricing-to-pricing-page/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/2026-05-02-add-tier-pricing-to-pricing-page/` exists and `openspec/changes/add-tier-pricing-to-pricing-page/` is gone
- [ ] Commit and push the archive to the default branch in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d add-tier-pricing-to-pricing-page`

Required cleanup after archive: `git fetch --prune` and `git branch -d add-tier-pricing-to-pricing-page`