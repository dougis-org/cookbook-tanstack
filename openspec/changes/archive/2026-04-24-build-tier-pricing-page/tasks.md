# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/tier-pricing-page` then immediately `git push -u origin feat/tier-pricing-page`

## Execution

### 1. Add `TIER_DESCRIPTIONS` to entitlement module

- [x] Add `TIER_DESCRIPTIONS: Record<EntitlementTier, string>` export to `src/lib/tier-entitlements.ts` with 1–2 sentence product copy per tier
- [x] Verify: `npx vitest run src/lib/__tests__/tier-entitlements.test.ts` passes (add test that all `EntitlementTier` keys have non-empty description)

### 2. Extract shared count helper in `_helpers.ts`

- [x] Add `countUserContent(userId: string): Promise<{ recipeCount: number; cookbookCount: number }>` to `src/server/trpc/routers/_helpers.ts`
  - Query: `Recipe.countDocuments({ userId, hiddenByTier: { $ne: true } })` and `Cookbook.countDocuments({ userId, hiddenByTier: { $ne: true } })`
- [x] Update `enforceContentLimit` in `_helpers.ts` to call `countUserContent` for the respective resource (or share the predicate pattern — keep DRY)
- [x] Verify: `npx vitest run src/server/trpc/routers/__tests__/helpers.test.ts` still passes

### 3. Create `usage.ts` tRPC router

- [x] Write tests first in `src/server/trpc/routers/__tests__/usage.test.ts` covering:
  - `getOwned` returns `{ recipeCount, cookbookCount }` for authenticated user
  - `getOwned` excludes `hiddenByTier: true` documents
  - `getOwned` returns `{ recipeCount: 0, cookbookCount: 0 }` for user with no content
  - `getOwned` throws `UNAUTHORIZED` for unauthenticated call
- [x] Implement `src/server/trpc/routers/usage.ts`:
  - Protected procedure `getOwned`
  - Calls `countUserContent(ctx.user.id)` from `_helpers.ts`
  - Returns `{ recipeCount: number, cookbookCount: number }`
- [x] Register `usage` router in `src/server/trpc/root.ts`: `usage: usageRouter`
- [x] Verify: `npx vitest run src/server/trpc/routers/__tests__/usage.test.ts` passes

### 4. Create `/upgrade` stub route

- [x] Create `src/routes/upgrade.tsx`:
  - `createFileRoute('/upgrade')` with `UpgradePage` component
  - Renders `PageLayout` with `role="authenticated-task"` (no ads)
  - Shows "Upgrade plans coming soon" message
  - Includes `<Link to="/pricing">View pricing</Link>`
- [x] Verify: route renders without TypeScript errors (`npx tsc --noEmit`)

### 5. Create `/pricing` route

- [x] Write tests first in `src/routes/__tests__/-pricing.test.tsx` covering:
  - All 5 tier names visible
  - Correct recipe and cookbook limits for each tier (from `TIER_LIMITS`)
  - Anonymous session: no tier highlighted, both `AdSlot` components present
  - Home Cook session: home-cook card highlighted, both `AdSlot` components present
  - Sous Chef session: sous-chef card highlighted, no `AdSlot` components
  - Executive Chef card has no upgrade CTA
  - Non-executive tier cards link to `/upgrade`
  - Anonymous visitor CTAs link to `/auth/register` (sign-up path)
  - Tier descriptions visible (non-empty)
- [x] Implement `src/routes/pricing.tsx`:
  - `createFileRoute('/pricing')` with `PricingPage` component
  - `AdSlot` components placed explicitly above and below tier card grid (conditional on `isPageAdEligible`)
  - Tier cards derived from `TIER_LIMITS`, `canCreatePrivate`, `canImport`, `TIER_DESCRIPTIONS`
  - Current tier detected via `useAuth()` → `session?.user?.tier`; null-safe with no highlight fallback
  - CTA logic: `tier === 'executive-chef'` → top-tier message; `session === null` → sign-up link; else → `/upgrade` link
- [x] Verify: `npx vitest run src/routes/__tests__/-pricing.test.tsx` passes

### 6. Update account page with tier section

- [x] Write tests first in `src/routes/__tests__/-account.test.tsx` covering:
  - Tier name and description rendered for Home Cook session
  - Recipe progress bar shows correct count vs. limit
  - Cookbook progress bar shows correct count vs. limit
  - Next-tier preview present for non-executive-chef tiers
  - No next-tier preview for Executive Chef
  - Link to `/pricing` present
  - "coming soon" stub text absent
  - Loading state shows skeleton/spinner while `usage.getOwned` is pending
  - Graceful degradation if `usage.getOwned` errors
- [x] Update `src/routes/account.tsx`:
  - Replace stub content with tier section
  - Call `trpc.usage.getOwned.queryOptions()` with `useQuery` for counts
  - Render tier name from `session.user.tier` (via `useAuth`)
  - Render recipe and cookbook progress bars using `TIER_LIMITS[tier]` as denominator
  - Render next-tier section: find next tier above current in tier order; show its limits and name; skip for Executive Chef
  - Link to `/pricing`
  - Graceful loading and error states
- [x] Verify: `npx vitest run src/routes/__tests__/-account.test.tsx` passes

## Validation

- [x] `npx vitest run` — all unit/integration tests pass
- [x] `npm run build` — TypeScript compiles with no errors
- [x] `npx tsc --noEmit` — strict type check passes
- [x] `npm run test:e2e` — E2E suite passes (no E2E coverage required for new paths)
- [x] All execution sub-tasks above checked off

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npx vitest run`; all tests must pass
- **Integration tests** — included in `npx vitest run` (node environment tests)
- **Build** — `npm run build`; must succeed with no errors
- **Type check** — `npx tsc --noEmit`; must pass
- If **ANY** of the above fail, iterate and fix before pushing

## PR and Merge

- [x] Run required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to `feat/tier-pricing-page` and push to remote
- [x] Open PR from `feat/tier-pricing-page` to `main`
- [x] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [x] Enable auto-merge: `gh pr merge --auto --merge`
- [x] **Monitor PR comments** — poll autonomously; address comments, commit fixes, follow remote push validation steps, push, wait 180s, repeat until no unresolved comments
- [x] **Monitor CI checks** — poll autonomously; diagnose failures, fix, commit, follow remote push validation steps, push, wait 180s, repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify user; **never force-merge**

Ownership metadata:

- Implementer: Claude Code agent
- Reviewer(s): dougis (auto-assigned)
- Required approvals: 1

Blocking resolution flow:

- CI failure → diagnose → fix → `npx vitest run` + `npm run build` → commit → push → re-check
- Security finding → remediate → commit → push → re-scan
- Review comment → address → commit → `npx vitest run` → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify `src/routes/pricing.tsx`, `src/routes/upgrade.tsx`, `src/server/trpc/routers/usage.ts`, and account page tier section appear on `main`
- [x] Mark all remaining tasks as complete
- [x] No documentation updates required beyond code changes
- [x] Sync approved spec deltas: copy `openspec/changes/build-tier-pricing-page/specs/*.md` into `openspec/specs/` (create dir if needed)
- [x] Archive the change: move `openspec/changes/build-tier-pricing-page/` to `openspec/changes/archive/YYYY-MM-DD-build-tier-pricing-page/` — stage both copy and deletion in **one commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-build-tier-pricing-page/` exists and `openspec/changes/build-tier-pricing-page/` is gone
- [x] Commit and push archive to `main` in one commit
- [x] Prune merged branch: `git fetch --prune` and `git branch -d feat/tier-pricing-page`
