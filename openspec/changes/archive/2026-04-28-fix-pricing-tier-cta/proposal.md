## GitHub Issues

- #401

## Why

- Problem statement: The pricing page shows "Upgrade" on every tier a user doesn't currently own, including tiers that are lower than their current plan. Lower tiers should display "Downgrade" and the current tier should show no action button.
- Why now: The bug is visible to all logged-in users on the pricing page and creates a confusing UX where a sous-chef user is offered to "Upgrade" to a home-cook plan.
- Business/user impact: Misleading CTA labels erode trust in the pricing page and could lead users to accidentally select a lower tier thinking they are upgrading.

## Problem Space

- Current behavior: `TierCard.renderCTA()` shows "Upgrade" for any tier that is not the top tier and not anonymous, regardless of whether that tier is above or below the user's current tier. The current tier card also shows "Upgrade". The anonymous tier card is rendered as a full plan card despite not being a real subscription tier.
- Desired behavior: Tiers above the user's current tier show "Upgrade"; tiers below show "Downgrade"; the current tier shows no CTA. The anonymous tier is not rendered as a card.
- Constraints: The `/upgrade` route is a placeholder page ("coming soon"). Both upgrade and downgrade will route to the same `/change-tier` endpoint (renaming `/upgrade`). No actual billing integration is in scope.
- Assumptions: `TIER_ORDER` array index reliably represents tier rank (lowest = 0, highest = last).
- Edge cases considered:
  - Anonymous visitor: no tier card highlighted; all non-anonymous cards show "Get started free" (existing `isAnon` logic covers this).
  - Logged-in user with missing/invalid tier: already defaults to `home-cook` in `PricingPage`.
  - `executive-chef` (top tier): shows "Maximum plan" text, no link — unchanged.

## Scope

### In Scope

- Rename route `/upgrade` → `/change-tier` (file rename + `createFileRoute` path update)
- Fix `TierCard` CTA logic: Upgrade vs Downgrade vs no button based on tier position relative to current
- Remove the anonymous tier card from the pricing page display
- Remove `isCurrent` prop from `TierCardProps`; derive from comparing `tier` to `currentTier`
- Update existing tests; add new tests covering upgrade/downgrade/current-tier/anonymous-hidden scenarios
- Update `auth-guard.ts` redirect message if it references "Upgrade" (minor copy tweak)

### Out of Scope

- Actual billing or plan-change functionality behind `/change-tier`
- Removing `anonymous` from `TIER_ORDER` or `EntitlementTier` type (internal logic still uses it)
- Any changes to entitlement limits or tier definitions

## What Changes

- `src/routes/upgrade.tsx` → renamed to `src/routes/change-tier.tsx`; `createFileRoute` path updated to `/change-tier`
- `src/routes/pricing.tsx`:
  - `TierCardProps`: replace `isCurrent: boolean` with `currentTier: EntitlementTier`
  - `TierCard.renderCTA()`: new branch logic (isCurrent → null, higher → Upgrade, lower → Downgrade)
  - `PricingPage`: filter `anonymous` from `TIER_ORDER` before rendering cards; pass `currentTier` to `TierCard`
- `src/routes/__tests__/-pricing.test.tsx`: rewrite CTA tests; remove anonymous-card tests; add upgrade/downgrade/current-no-cta assertions
- `src/lib/auth-guard.ts`: update redirect message copy from "Upgrade your plan" to "Upgrade or change your plan" (optional, low priority)

## Risks

- Risk: TanStack Router route tree may not auto-update until dev server restart after file rename
  - Impact: Low — dev-time only
  - Mitigation: Note in tasks to restart dev server after rename
- Risk: Existing tests that assert `href="/upgrade"` or `name=/upgrade/i` will fail until updated
  - Impact: CI failure if tests run before update
  - Mitigation: Rename file and update tests in the same PR

## Open Questions

No unresolved ambiguity. All decisions confirmed during explore session:
1. Single `/change-tier` endpoint for both upgrades and downgrades — confirmed.
2. Current tier card: no CTA button — confirmed.
3. Anonymous tier card removed from display — confirmed.

## Non-Goals

- Building the actual change-tier/billing flow
- Removing `anonymous` from the type system
- Redesigning the pricing page layout

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
