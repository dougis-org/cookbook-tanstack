## GitHub Issues

- #387

## Why

- Problem statement: Tier enforcement logic is scattered — ad eligibility lives in `src/lib/ad-policy.ts`, tier types live in `src/types/user.ts`, and numeric limits exist nowhere in code. Every enforcement layer (mutations, routes, UI) will need to reinvent these values independently, causing drift from the feature matrix.
- Why now: Issue #387 is a prerequisite for all downstream tier enforcement issues. Nothing can enforce limits safely until a single authoritative module exists.
- Business/user impact: Without this, limit enforcement is either absent or duplicated across layers. Duplication means divergence — free users may exceed their tier limits or paid features may be accidentally unlocked.

## Problem Space

- Current behavior: `src/types/user.ts` has `UserTier`, `TIER_RANK`, and `hasAtLeastTier`. `src/lib/ad-policy.ts` has `isAdEligible(role, session)` which reimplements its own tier check inline. No module owns numeric limits (recipes, cookbooks) or boolean capabilities (private content, import).
- Desired behavior: A single `src/lib/tier-entitlements.ts` owns all entitlement constants and pure-function helpers. `ad-policy.ts` delegates its tier check to `showUserAds()` from the new module. All future enforcement layers import from one place.
- Constraints: `UserTier` and `hasAtLeastTier` in `src/types/user.ts` must not be duplicated. `anonymous` is not a `UserTier` (no account exists) — it requires a wider local `EntitlementTier` union scoped to this module.
- Assumptions: `docs/user-tier-feature-sets.md` is the canonical source of truth for all limit values and capability flags. Any change to those values must update that doc first.
- Edge cases considered: Anonymous users (no session) need representation in `TIER_LIMITS`; `UserTier` intentionally excludes `anonymous`. The `isAdEligible` rename to `isPageAdEligible` must be backward-compatible within the same file.

## Scope

### In Scope

- Create `src/lib/tier-entitlements.ts` with `EntitlementTier`, `TIER_LIMITS`, `showUserAds`, `canCreatePrivate`, `canImport`, `getRecipeLimit`, `getCookbookLimit`
- Rename `isAdEligible` → `isPageAdEligible` in `src/lib/ad-policy.ts`
- Refactor `isPageAdEligible` to call `showUserAds` for its tier gate
- Update all callers of `isAdEligible`: `src/components/layout/PageLayout.tsx`, `src/lib/__tests__/ad-policy.test.ts`, `src/lib/__tests__/google-adsense-contract.test.ts`
- Unit tests for all helpers in `tier-entitlements.ts` covering every tier value

### Out of Scope

- Enforcement of limits in mutations, tRPC routes, or UI (downstream issues)
- Changes to `UserTier` or `hasAtLeastTier` in `src/types/user.ts`
- Any UI component changes beyond updating the renamed import

## What Changes

- New file: `src/lib/tier-entitlements.ts`
- New file: `src/lib/__tests__/tier-entitlements.test.ts`
- Modified: `src/lib/ad-policy.ts` — rename export, delegate tier check to `showUserAds`
- Modified: `src/lib/__tests__/ad-policy.test.ts` — update import and describe block
- Modified: `src/lib/__tests__/google-adsense-contract.test.ts` — update string assertion
- Modified: `src/components/layout/PageLayout.tsx` — update import name

## Risks

- Risk: Rename of `isAdEligible` breaks a caller not found by grep
  - Impact: Runtime error, ads shown incorrectly
  - Mitigation: TypeScript compile check catches all callers; grep confirms grep results above are exhaustive
- Risk: `showUserAds` logic diverges from old inline check in `isAdEligible`
  - Impact: Ad display regression
  - Mitigation: Existing `ad-policy.test.ts` suite covers the behavior; tests must remain green

## Open Questions

No unresolved ambiguity. All decisions confirmed in explore session:
- `anonymous` uses wider `EntitlementTier` union (not added to `UserTier`)
- Rename: `isAdEligible` → `isPageAdEligible`, new helper named `showUserAds`
- File name: `tier-entitlements.ts`
- `showUserAds` becomes the pure tier gate; `isPageAdEligible` remains the two-gate (page role + tier) check

## Non-Goals

- Adding new tier capabilities beyond what `docs/user-tier-feature-sets.md` defines
- Runtime tier validation or middleware
- Any database interaction in the entitlements module

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
