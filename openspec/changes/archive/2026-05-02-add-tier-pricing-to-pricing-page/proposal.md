## GitHub Issues

- dougis-org/cookbook-tanstack#417

## Why

- **Problem statement:** The pricing page does not display actual pricing tiers or the ad impacts of different subscription levels, making it difficult for users to understand the value proposition of paid tiers.
- **Why now:** Issue #417 explicitly requests this as a standalone deliverable. The feature matrix for tiers is already documented in `docs/user-tier-feature-sets.md` but pricing information was never added to the UI.
- **Business/user impact:** Users cannot make informed decisions about upgrading without seeing pricing. The current pricing page only shows feature limits, not cost or ad-free status.

## Problem Space

- **Current behavior:**
  - Pricing page (`src/routes/pricing.tsx`) shows tier name, description, recipe/cookbook limits, private visibility, import capability, and a per-tier CTA button.
  - No pricing information is displayed.
  - Ad impact (Ads vs No Ads) is not shown on the card.
  - Each tier card has its own CTA button (Upgrade/Downgrade/Current).

- **Desired behavior:**
  - Each tier card displays annual price (primary), monthly price (secondary), and a "Save 2 months" badge for paid tiers.
  - Each tier card shows ad status: "Ad Supported" (Home Cook) or "No Ads" (Prep Cook, Sous Chef, Executive Chef).
  - Per-tier CTA buttons are removed from all cards.
  - A single "Get Started for Free" CTA appears below the tier grid for anonymous users.
  - Sous Chef no longer has import capability (functional change to drive Executive Chef value).

- **Constraints:**
  - Cards may expand vertically to accommodate pricing rows — this is acceptable per user guidance.
  - Pricing data must be kept in sync with the tier entitlements system.
  - The "Get Started for Free" CTA only shows for anonymous (unauthenticated) users.

- **Assumptions:**
  - Pricing data is static (no dynamic pricing, no trials).
  - Annual pricing is always 10 months worth (2 months free).
  - No existing users at Sous Chef tier who would be affected by import removal (confirmed: no migrations needed).

- **Edge cases considered:**
  - Authenticated users see different state: "Get Started for Free" is hidden, current tier is highlighted.
  - Home Cook free tier shows "FREE" with no monthly equivalent.
  - Cards are still aligned in a 4-column grid (xl breakpoint), allowing vertical expansion.

## Scope

### In Scope

- Add pricing data structure to `src/lib/tier-entitlements.ts`
- Update `canImport()` logic to require `executive-chef` tier instead of `sous-chef`
- Update `TIER_DESCRIPTIONS` for `sous-chef` to remove "import tools" reference
- Update `docs/user-tier-feature-sets.md` to reflect that import requires Executive Chef
- Modify `TierCard` component in `src/routes/pricing.tsx`:
  - Add pricing display (annual primary, monthly secondary, "Save 2 months" badge)
  - Add "No Ads" / "Ad Supported" indicator
  - Remove per-tier CTA button
- Add single "Get Started for Free" CTA below tier grid (anonymous users only)
- Update `TierCardProps` interface to remove `currentTier` dependency for CTA logic

### Out of Scope

- Any changes to actual subscription/payment infrastructure (Stripe, billing logic, etc.)
- Email notifications or onboarding flows for new subscribers
- Changes to what features each tier has beyond import restriction for Sous Chef
- Tier migration scripts (not needed — no existing Sous Chef users with import capability)

## What Changes

1. **Feature entitlement change** (`src/lib/tier-entitlements.ts`):
   - `canImport(tier)` now returns true only for `executive-chef` tier (was `sous-chef`)
   - `TIER_DESCRIPTIONS.sous-chef` updated to remove "import tools" mention

2. **Feature matrix documentation** (`docs/user-tier-feature-sets.md`):
   - Import policy updated: "Recipe import is available only to Executive Chef users" (was Sous Chef and above)

3. **Pricing display** (`src/routes/pricing.tsx`):
   - New pricing data structure added (annual/monthly pricing per tier)
   - `TierCard` component updated to show pricing rows and ad status
   - CTA buttons removed from individual cards
   - Single "Get Started for Free" button added below grid for anonymous users

## Risks

- **Risk:** Pricing data in code becomes outdated if pricing changes in the future
  - **Impact:** Users see wrong prices
  - **Mitigation:** Document that pricing must be updated in both `tier-entitlements.ts` AND the feature matrix doc; consider a separate pricing config file if frequency of changes increases

- **Risk:** "Save 2 months" badge creates expectation of a specific savings amount
  - **Impact:** Minor UI inconsistency if pricing is adjusted
  - **Mitigation:** Calculate badge text dynamically from annual vs monthly, or use static badge text "Annual discount" if precision is not needed

- **Risk:** Card height expansion affects visual balance of grid
  - **Impact:** Cards may look uneven if content varies too much (free tier has no pricing)
  - **Mitigation:** Free tier card uses "FREE" placeholder to maintain similar row structure; card flex stretch handles height differences

## Open Questions

- **Question:** Should the "Save 2 months" badge show a calculated savings amount (e.g., "Save $7.89") or just say "Save 2 months"?
  - **Needed from:** Design decision
  - **Blocker for apply:** No

- **Question:** Is the annual price the one that should be emphasized (bold/large) with monthly as a secondary detail?
  - **Needed from:** Design confirmation
  - **Blocker for apply:** No

## Non-Goals

- Implementing any payment or subscription infrastructure
- Creating tier upgrade/downgrade flows beyond the CTA button
- Modifying the actual feature matrix (limits, visibility rules) except for import restriction
- Adding tier comparison tables or feature checklists beyond what is currently shown

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.