## GitHub Issues

- dougis-org/cookbook-tanstack#451

## Why

- **Problem statement**: The current `/account` page only offers a small, low-contrast `14px` underlined text link reading "View pricing plans" as the upgrade CTA. This is extremely easy for users to miss and doesn't feel like a primary action for high-intent visitors.
- **Why now**: The May 2026 UX audit highlighted that the subscription funnel is severely broken, with no clear path for users to initiate upgrades directly from their account page where they see their resource usage.
- **Business/user impact**: Upgrading the account page CTA to a prominent, context-aware primary button will directly improve trial-to-paid conversion rates and provide a much smoother UX for users bumping into tier limits.

## Problem Space

- **Current behavior**: 
  - A user visiting `/account` sees their current tier and resource progress bars.
  - At the bottom of the section, there is a simple text link pointing to `/pricing`.
  - There is no dynamic targeting of the "next tier" pricing or name inside the CTA.
- **Desired behavior**:
  - The small text link is replaced by a primary action button dynamically tailored to the user's `nextTier` (e.g., "Upgrade to Prep Cook — $2.99/mo").
  - The CTA button links to `/pricing` with a search parameter `?focus={nextTier}` to highlight that tier card (out of scope for visual highlights, but route support must be in place).
  - A secondary "Compare all plans →" text link is added below the button.
  - If the user is already on the top plan (`executive-chef`), they see a friendly "You're on the top plan" message and no upgrade button.
  - The CTA section is moved above the "Next tier preview" panel so the eye lands on it immediately after the usage bars.
- **Constraints**:
  - Theme system tokens only (no hardcoded colors).
  - No emoji (use Lucide icons if needed).
  - Use exact button styles present elsewhere in the codebase.
- **Assumptions**:
  - The pricing data in `src/lib/tier-entitlements.ts` (`TIER_PRICING`) is the single source of truth for tier prices.
  - Users visiting `/account` are already authenticated (enforced by the existing `requireAuth` route guard).
- **Edge cases considered**:
  - User has no unrecognized tier: `EntitlementTier` defaults to `home-cook`, preventing crashes.
  - Top plan reached: Hide the CTA button and show "You're on the top plan" text block.

## Scope

### In Scope

- Replacing the "View pricing plans" text link with a primary CTA button in `src/routes/account.tsx`.
- Dynamically deriving the next tier name, monthly price, and displaying it in the button text.
- Adding a secondary "Compare all plans →" link below the primary button.
- Positioning the CTA button and secondary link above the next tier preview block.
- Supporting top-tier state by displaying "You're on the top plan" when `tier === 'executive-chef'`.
- Adding search parameter validation (`?focus=`) to the `/pricing` route in `src/routes/pricing.tsx` to support the incoming query param without TypeScript or Router issues.
- Adding unit/integration tests in `src/routes/__tests__/-account.test.tsx` to verify all states (regular upgrade button, top tier state, pricing link).

### Out of Scope

- Implementing the actual visual styling of the highlighted tier card on the `/pricing` page based on the `?focus=` parameter.
- Stripe checkout implementation itself (belongs to F01 / #426).

## What Changes

- `src/routes/account.tsx`: Update the next tier/CTA rendering logic and element layout ordering.
- `src/routes/pricing.tsx`: Implement `validateSearch` for the `focus` parameter.
- `src/routes/__tests__/-account.test.tsx`: Add and update test assertions for the CTA button, secondary link, next-tier preview ordering, and top tier state.

## Risks

- **Risk**: User tier logic mismatch on next plan derivation.
  - **Impact**: Displaying incorrect upgrade tier or price.
  - **Mitigation**: Rely strictly on existing `TIER_PRICING`, `TIER_ORDER`, and `TIER_DISPLAY_NAMES` helpers from `src/lib/tier-entitlements.ts` to ensure consistency.
- **Risk**: Router compilation/run error on unvalidated query param.
  - **Impact**: App crashes or compile errors when clicking the upgrade link.
  - **Mitigation**: Implement `validateSearch` in `src/routes/pricing.tsx` to explicitly validate the incoming `focus` search parameter.

## Open Questions

No unresolved ambiguity exists. The UX audit guidelines, technical files, and constraints are fully defined.

## Non-Goals

- Modifying the styling or logic of `/pricing` tier cards.
- Adding billing system endpoints or tRPC session mutations (these belong to #426).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
