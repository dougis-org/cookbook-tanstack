## GitHub Issues

- #624

## Why

- Problem statement: Google AdSense/sponsor ad slots do not render on the recipe detail page (`/recipes/$recipeId`) for logged-out visitors. All three slots (top, bottom, right-rail) are silently suppressed.
- Why now: Ads are the site's revenue mechanism for non-paying tiers; the recipe detail page is the highest-traffic public page (reached via search/social), so this is a significant, ongoing revenue gap, not a cosmetic bug.
- Business/user impact: No user-visible harm (nothing broken for the visitor), but full loss of ad revenue on the site's primary content page for anonymous visitors, who are the majority of that page's traffic.

## Problem Space

- Current behavior: `src/routes/recipes/$recipeId.tsx` renders `<PageLayout>` at all three of its return branches (loading, not-found, success) without a `role` prop, so `PageLayout` defaults to `role="authenticated-task"`. In `isPageAdEligible` (`src/lib/ad-policy.ts`), when there is no session and role is `authenticated-task`, the function returns `false` unconditionally — ads are suppressed regardless of tier. Since anonymous visitors have no session, every anonymous view of a recipe page shows zero ad slots.
- Desired behavior: Recipe detail pages are public content, exactly like the recipe list page (`src/routes/recipes/index.tsx`), which already passes `role="public-content"` and shows ads correctly to anonymous visitors. Recipe detail pages should do the same, so ad eligibility for anonymous and logged-in visitors is determined by `showUserAds(tier)` (via `role="public-content"`'s anonymous-safe path) rather than being hard-suppressed by role.
- Constraints: Must not change ad-suppression behavior for authenticated users of any tier — subscription-tier-based suppression (via `showUserAds(tier)`) must continue to work exactly as it does today, unaffected by this change per `isPageAdEligible`'s existing tier resolution logic.
- Assumptions: Recipe ownership is irrelevant to ad eligibility (confirmed with requester) — a logged-in owner viewing their own recipe is subject to the same tier-based rule as any other logged-in visitor, no special-casing needed.
- Edge cases considered:
  - Loading and not-found states must also get the corrected role, since they render `<PageLayout>` independently and were also defaulting to `authenticated-task`.
  - Admins: `isPageAdEligible` already returns `false` for `session.user.isAdmin` regardless of role — unaffected by this change.
  - Paid tiers: `showUserAds(tier)` already suppresses ads for tiers configured to not show ads — unaffected by this change.

## Scope

### In Scope

- Update the three `<PageLayout>` call sites in `src/routes/recipes/$recipeId.tsx` (loading state, not-found state, success state) to pass `role="public-content"`.
- Verify/extend test coverage confirming ad slots render for anonymous visitors on the recipe detail page, and that tier-based suppression for authenticated users still functions correctly on that page.

### Out of Scope

- The reported-but-never-implemented "header banner ad" and "floating footer ad" units — confirmed during investigation that neither exists anywhere in the codebase today (only top-inline, bottom-inline, and right-rail slots exist, all scoped in `PageLayout`, none fixed/global). Filed separately as GitHub issues #658 and #659.
- Any change to `isPageAdEligible`, `showUserAds`, or the underlying ad-policy/tier-entitlement logic itself.
- Any change to `PageLayout`'s default `role` value — the fix is scoped to the call sites in `$recipeId.tsx`, not the shared component's default.

## What Changes

- `src/routes/recipes/$recipeId.tsx`: all three `<PageLayout>` usages gain `role="public-content"`.

## Risks

- Risk: Passing `role="public-content"` could unintentionally change some other role-gated behavior in `PageLayout` beyond ad eligibility.
  - Impact: Low — `PageLayout`'s `role` prop is currently only consumed by `isPageAdEligible`/`AdSlot`; no other behavior in `PageLayout` branches on `role`.
  - Mitigation: Confirm via code read of `PageLayout.tsx` before implementation that `role` has no other consumers; add/verify a regression test asserting non-ad UI (title, description, right-rail grid layout) is unchanged on the recipe detail page.

## Open Questions

None — the explore session that preceded this proposal resolved the only ambiguities (owner-vs-tier ad eligibility; scope of header/footer ad asks) with the requester directly.

## Non-Goals

- Building the header banner or floating footer ad units (tracked separately in #658, #659).
- Changing how ad eligibility is computed for any role other than the recipe detail page's.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
