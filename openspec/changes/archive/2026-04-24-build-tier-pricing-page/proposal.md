## GitHub Issues

- #393

## Why

- Problem statement: Users have no way to compare tiers, understand limits, or initiate an upgrade. The tier enforcement layer (#387, #388–#390, #398) is in place but there is no public surface explaining what each tier offers or how to move up.
- Why now: Server-side enforcement is live. Without a pricing page users hit silent `FORBIDDEN` errors with no explanation or path forward. The tier-wall component (#391) needs a destination to link to.
- Business/user impact: Conversion and upgrade friction — users who want more capacity cannot self-serve. Informed users convert at higher rates.

## Problem Space

- Current behavior: No `/pricing` route exists. Account page is a stub ("coming soon"). Users have no visibility into their tier, usage counts, or upgrade options.
- Desired behavior: `/pricing` shows a tier comparison table (derived from `TIER_LIMITS` and capability helpers). Account page shows current tier, usage vs. limit, and links to `/pricing`. An `/upgrade` stub route captures the upgrade intent destination.
- Constraints:
  - Tier table data must come from `src/lib/tier-entitlements.ts` (`TIER_LIMITS`, `canCreatePrivate`, `canImport`, `showUserAds`) — no hardcoded JSX values.
  - Payment/upgrade flow is NOT implemented; CTAs link to `/upgrade` stub only.
  - Ad slots follow existing `isPageAdEligible` policy — `/pricing` uses `public-marketing` role; ads appear above and below the tier card group.
  - Usage counts require a new `usage` tRPC router (not folded into existing routers) for extensibility.
- Assumptions:
  - `session.user.tier` is available client-side via `useAuth()` — no extra fetch needed to highlight current tier on `/pricing`.
  - Executive Chef is the top tier; its CTA reads "You're at the top tier" with no action.
  - Anonymous visitors on `/pricing` see a "Get started free" CTA linking to `/auth/sign-up`.
  - All logged-in tiers (including Executive Chef) see the usage section on the account page.
- Edge cases considered:
  - Unauthenticated visit to `/pricing` — table renders without highlighting; no error.
  - User with unknown/missing tier — defaults to `home-cook` (consistent with `isPageAdEligible` and `enforceContentLimit`).
  - Executive Chef on account page — shows counts vs. limits even at max tier.

## Scope

### In Scope

- New `src/routes/pricing.tsx` — public tier comparison page with ad slots above/below card group
- New `src/routes/upgrade.tsx` — stub route ("Upgrade coming soon") as CTA destination
- New `src/server/trpc/routers/usage.ts` — `getOwned` protected query returning `{ recipeCount, cookbookCount }`
- Wire `usage` router into `src/server/trpc/root.ts`
- Update `src/routes/account.tsx` — add tier info section: current tier, usage bar, next-tier preview, link to `/pricing`
- Tier description copy (1–2 sentence product descriptions per tier, used on pricing and account pages)
- Unit tests for `usage.getOwned` router
- Unit tests for pricing page (tier table renders, ad slots conditional on session, current tier highlighted)
- Unit tests for account page tier section (usage counts render, link to `/pricing` present)

### Out of Scope

- Payment processing or actual upgrade flow
- Tier-wall component (#391 — separate issue, ships independently)
- Any changes to `TIER_LIMITS` or entitlement helpers
- Admin tools for tier management

## What Changes

- `src/routes/pricing.tsx` — new file
- `src/routes/upgrade.tsx` — new file (stub)
- `src/server/trpc/routers/usage.ts` — new file
- `src/server/trpc/routers/__tests__/usage.test.ts` — new file
- `src/server/trpc/root.ts` — add `usage` router
- `src/routes/account.tsx` — replace stub with tier + usage section
- `src/routes/__tests__/-pricing.test.tsx` — new file
- `src/routes/__tests__/-account.test.tsx` — new or expanded file

## Risks

- Risk: `session.user.tier` not populated for some auth flows (e.g., OAuth, email verification edge cases)
  - Impact: Current tier not highlighted on `/pricing`; account page defaults to `home-cook` limits
  - Mitigation: Consistent with existing `isPageAdEligible` default — acceptable degradation; add null guard

- Risk: `usage.getOwned` count diverges from `enforceContentLimit` count (different query logic)
  - Impact: Account page shows different count than enforcement reality
  - Mitigation: Extract shared count logic into `_helpers.ts` used by both; test both callers

- Risk: Tier card layout breaks on small screens with 5 columns
  - Impact: Visual regression on mobile
  - Mitigation: Use responsive grid (2-col mobile → 3-col tablet → 5-col desktop); cover in design

## Open Questions

No unresolved ambiguity — all decisions confirmed during exploration:
- `/pricing` data source: static from `TIER_LIMITS` ✓
- Usage query: single `usage.ts` router with `getOwned` ✓
- #391 relationship: ships independently ✓
- Ad placement: above and below the tier card group ✓
- Upgrade CTA: `/upgrade` stub route ✓
- Usage section scope: all logged-in tiers including Executive Chef ✓

## Non-Goals

- Implementing payment or subscription management
- Building the tier-wall component (tracked in #391)
- Changing tier limits or eligibility rules
- Server-side rendering of usage counts (client fetch via tRPC is sufficient)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
