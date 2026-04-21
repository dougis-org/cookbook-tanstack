# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/tier-entitlements` then immediately `git push -u origin feat/tier-entitlements`

## Execution

### Task 1 — Create `src/lib/tier-entitlements.ts`

- [x] Create `src/lib/tier-entitlements.ts` with:
  - File-level comment referencing `docs/user-tier-feature-sets.md` as the source of truth
  - `export type EntitlementTier = UserTier | 'anonymous'` (import `UserTier` from `@/types/user`)
  - `export const TIER_LIMITS: Record<EntitlementTier, { recipes: number; cookbooks: number }>` with all five tiers
  - `export function getRecipeLimit(tier: EntitlementTier): number`
  - `export function getCookbookLimit(tier: EntitlementTier): number`
  - `export function showUserAds(tier: EntitlementTier): boolean` — `true` for `anonymous` and `home-cook`
  - `export function canCreatePrivate(tier: EntitlementTier): boolean` — delegates to `hasAtLeastTier`
  - `export function canImport(tier: EntitlementTier): boolean` — delegates to `hasAtLeastTier`

### Task 2 — Write unit tests for `tier-entitlements.ts`

- [x] Create `src/lib/__tests__/tier-entitlements.test.ts`
- [x] Cover all five tier values for each helper: `TIER_LIMITS`, `getRecipeLimit`, `getCookbookLimit`, `showUserAds`, `canCreatePrivate`, `canImport`
- [x] Run: `npx vitest run src/lib/__tests__/tier-entitlements.test.ts` — must pass

### Task 3 — Refactor `src/lib/ad-policy.ts`

- [x] Import `showUserAds` from `@/lib/tier-entitlements`
- [x] Rename `isAdEligible` → `isPageAdEligible`
- [x] Replace inline `!hasAtLeastTier(session.user, 'prep-cook')` tier check with `showUserAds(tier)` call
  - Derive tier from session: `(session.user.tier ?? 'home-cook') as EntitlementTier`
  - Anonymous (no session): pass `'anonymous'` to `showUserAds`
- [x] Remove now-unused `hasAtLeastTier` import if no longer needed
- [x] Run: `npx vitest run src/lib/__tests__/ad-policy.test.ts` — must pass unchanged

### Task 4 — Update callers of `isAdEligible`

- [x] `src/components/layout/PageLayout.tsx` — update import: `isAdEligible` → `isPageAdEligible`; update call site
- [x] `src/lib/__tests__/ad-policy.test.ts` — update import and describe block label
- [x] `src/lib/__tests__/google-adsense-contract.test.ts` — update string assertion to `'isPageAdEligible(role, session)'`
- [x] Run: `npx vitest run src/lib/__tests__/google-adsense-contract.test.ts` — must pass

### Task 5 — TypeScript and full test suite

- [x] Run: `npx tsc --noEmit` — must exit 0 with no errors
- [x] Run: `npm run test` — all tests must pass

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] All five tier values tested for every helper in `tier-entitlements.test.ts`
- [x] `isPageAdEligible` behavior parity confirmed by existing `ad-policy.test.ts` suite
- [x] Contract test passes with updated string assertion
- [x] All completed tasks marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- **Type check** — `npx tsc --noEmit` — must exit 0
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to `feat/tier-entitlements` and push to remote
- [x] Open PR from `feat/tier-entitlements` to `main`
- [x] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [x] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [x] **Monitor PR comments** — poll autonomously; address each comment, commit fixes, follow remote push validation steps, push; wait 180 seconds then repeat
- [x] **Monitor CI checks** — poll autonomously; fix failures, commit, follow remote push validation steps, push; wait 180 seconds then repeat
- [x] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — never wait for a human to report; never force-merge

Ownership metadata:

- Implementer: dougis
- Reviewer(s): auto-review (Codacy, CodeRabbit)
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → `npm run test && npm run build && npx tsc --noEmit` → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify merged changes appear on `main`
- [x] Mark all remaining tasks complete (`- [x]`)
- [x] No documentation updates required (feature matrix doc unchanged)
- [x] Sync approved spec deltas into `openspec/specs/` (global spec)
- [x] Archive the change: move `openspec/changes/tier-entitlements/` to `openspec/changes/archive/YYYY-MM-DD-tier-entitlements/` **in a single commit** — stage both the new location and the deletion of the old location together
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-tier-entitlements/` exists and `openspec/changes/tier-entitlements/` is gone
- [x] Commit and push the archive to `main` in one commit
- [x] Prune merged local branch: `git fetch --prune` and `git branch -d feat/tier-entitlements`
