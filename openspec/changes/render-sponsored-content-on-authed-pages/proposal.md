## GitHub Issues

- #447

## Why

- **Problem statement:** Home Cook users never see ads on the pages they actually use (`/home`, `/recipes`, `/recipes/:id`, `/cookbooks`, `/cookbooks/:id`, `/categories/:id`). The `AD_ENABLED_ROLES` in `src/lib/ad-policy.ts` only includes `public-marketing` and `public-content`, so authenticated pages are ad-invisible. The Prep Cook tier ($27.99/yr) sells "no ads" as its value proposition — but users have never experienced the friction it removes, making the upgrade meaningless.

- **Why now:** This is the single largest conversion lever available for driving Prep Cook upgrades. See `design-system/funnel-mocks.html` for the full funnel context and `design-system/ad-placement-mocks.html` for the three placement specifications.

- **Business/user impact:** Without ads on authenticated pages, free-tier users have zero friction from the product. The upgrade pitch "remove sponsors" is hollow. Rendering sponsored content on authenticated pages creates a real Pain Point for home-cook users, making the Prep Cook upgrade meaningful.

## Problem Space

- **Current behavior:**
  - `AD_ENABLED_ROLES = ['public-marketing', 'public-content']`
  - Ads render only on public marketing (e.g., `/pricing`) and public content pages (e.g., `/recipes`, `/cookbooks`) for anonymous users
  - Authenticated pages (`/home`, `/recipes/:id`, `/cookbooks/:id`) show no ad slots at all — the `AdSlot` component returns `null` because neither `authenticated-home` nor `authenticated-task` are in `AD_ENABLED_ROLES`
  - `PageLayout` renders `AdSlot` at `top` and `bottom` positions only — no right rail

- **Desired behavior:**
  - Home Cook and anonymous users see sponsored content on all pages they use: `/home`, `/recipes`, `/recipes/:id`, `/cookbooks`, `/cookbooks/:id`, `/categories/:id`
  - Ad slots render as a persistent right rail on list and detail pages; as a top slot on `/home`
  - Paid users (Prep Cook and above) and admins see no ad slots — `isPageAdEligible` gates them out
  - All ad containers use `.up-*` class family (`.up-card`, `.up-media`, `.up-body`, `.up-cta`) — verified not blocked by uBlock Origin, AdGuard, or Brave cosmetic filters

- **Constraints:**
  - Adblock-safe class naming: `.up-*` prefix only. The following families are blocked: `.ad-*`, `[data-ad]`, `[id*="ad-"]`, `.sponsor-*`, `.sponsored-*`, `.promo-*`, `.banner-*`, `.adv-*`, `.adsbygoogle`
  - Theme tokens only — no hard-coded hex values
  - No emoji — Lucide carries icon load
  - FTC-compliant labeling: "SPONSORED" eyebrow using `::before` pseudo-element
  - First deploy renders only static upgrade affordance (`.up-card` with "Remove sponsors → Prep Cook · $X.XX/mo"), gated behind `VITE_ADSENSE_ENABLED` env flag
  - Real Google AdSense wired but gated independently from static card

- **Assumptions:**
  - `/home` can accommodate a top slot between page title and Quick Actions section
  - `/recipes` and `/cookbooks` listing pages can accommodate a right rail alongside their content grid
  - Recipe detail, cookbook detail, and category detail pages can accommodate a sticky right rail alongside their single-column content
  - Responsive behavior: right rail collapses below `lg` breakpoint

- **Edge cases considered:**
  - Admins always excluded via `isPageAdEligible` — `session.user.isAdmin` returns false early
  - Prep Cook and above: `showUserAds(tier)` returns false → `isPageAdEligible` returns false → no DOM insertion
  - Unauthenticated users on public pages: `session === null`, `showUserAds('anonymous')` returns true → eligible
  - `VITE_ADSENSE_ENABLED` unset or false: `SponsorSlot` static upgrade card renders instead of real AdSense
  - Dev environment: `!import.meta.env.PROD` returns null regardless of flag

## Scope

### In Scope

- Extend `AD_ENABLED_ROLES` in `src/lib/ad-policy.ts` to include `authenticated-home` and `authenticated-task`
- Add `right-rail` to `GoogleAdSenseSlotPosition` enum in `src/lib/google-adsense.ts`
- Add `VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID` env var for the right-rail sticky slot
- Restructure `PageLayout` to use a CSS grid `[content | rail]` layout with `lg:grid-cols-[1fr_300px]`
- Right rail is always in DOM; `AdSlot` handles its own visibility via `isPageAdEligible`
- Create `src/components/ads/SponsorSlot.tsx` — static upgrade card with `.up-card`, `.up-media`, `.up-body`, `.up-cta` class family, "SPONSORED" `::before` eyebrow, "Remove sponsors → Prep Cook · $X.XX/mo" CTA
- Wire `VITE_ADSENSE_ENABLED` into `AdSlot` — when false, renders `SponsorSlot` instead of real AdSense ins element
- Update `src/components/layout/__tests__/PageLayout.test.tsx` for grid layout and right rail behavior
- Ad slots render on: `/home`, `/recipes` (list), `/recipes/:id`, `/cookbooks` (list), `/cookbooks/:id`, `/categories/:id`

### Out of Scope

- Stripe checkout integration (F01)
- Pricing page redesign (F09)
- Any change to `showUserAds` logic or tier entitlement structure
- Ad slots on `/cookbooks/:id/toc` or `/cookbooks/:id/print` (print-focused transitional pages)
- Creating new `authenticated-list` role (listing pages stay `public-content` — they are publicly readable)

## What Changes

- **`src/lib/ad-policy.ts`:** `AD_ENABLED_ROLES` gains `authenticated-home` and `authenticated-task`
- **`src/lib/google-adsense.ts`:** `GoogleAdSenseSlotPosition` gains `right-rail`; new env var `VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID`
- **`src/components/layout/PageLayout.tsx`:** Grid layout replaces single-column; `AdSlot` gains `right-rail` position; env-gated rendering of `SponsorSlot` vs real AdSense
- **`src/components/ads/SponsorSlot.tsx` (new):** Static upgrade card component — `.up-*` classes, "SPONSORED" eyebrow via CSS `::before`, price derived from `TIER_PRICING['prep-cook'].monthly`
- **`src/components/layout/__tests__/PageLayout.test.tsx`:** Tests for grid layout, right rail rendering, `SponsorSlot` vs `AdSlot` conditional, adblock-safe class verification

## Risks

- **Risk:** Right rail grid layout breaks existing page layouts for pages with custom chrome or full-bleed content
  - **Impact:** Medium — all authenticated pages share `PageLayout` as outer shell
  - **Mitigation:** Test all authenticated routes; the grid uses `lg:` breakpoint so it only applies on wider screens; narrow viewports (mobile/tablet) get single-column treatment

- **Risk:** Adblockers expand `.up-*` to blocked families
  - **Impact:** High — revenue surface collapses silently
  - **Mitigation:** The design mock uses `.up-*` specifically to avoid all known blocked patterns. Monitor post-launch with a real browser + uBlock Origin. The class name documentation in `design-system/ad-placement-mocks.html` explicitly records the blocked-family history.

- **Risk:** `VITE_ADSENSE_ENABLED` defaulting to `true` in production causes unexpected real ad loading before launch
  - **Impact:** High — real ads could render before slot IDs are configured or while the upgrade flow is incomplete
  - **Mitigation:** Default is `false` / unset; explicit opt-in to enable real ads. The flag is clearly named as a launch gate.

- **Risk:** SponsorSlot upgrade text doesn't dynamically update when pricing changes
  - **Impact:** Low — price is read from `TIER_PRICING['prep-cook'].monthly` at render time
  - **Mitigation:** No additional mitigation needed; price is already a derived value

## Open Questions

- **Question:** Should `/cookbooks/:id/toc` (table of contents) include the right rail, or skip it since it's a print-focused transitional view?
  - **Needed from:** Decision (included this scope as consistent with `authenticated-task` — the user confirmed this)
  - **Blocker for apply:** No

- **Question:** Does the "SPONSORED" eyebrow use `::before` pseudo-element (from the mock CSS) or a real `<span>` element?
  - **Needed from:** Design confirmation (mock uses `::before` — confirmed as correct approach)
  - **Blocker for apply:** No — implementation detail, not a scope question

## Non-Goals

- Adding a `authenticated-list` role — listing pages (`/recipes`, `/cookbooks`) stay `public-content` which is semantically correct (content is publicly readable, only creation is auth-gated)
- Implementing real Google AdSense slots before `VITE_ADSENSE_ENABLED` flag is explicitly set to true
- Creating `design-system/ad-placement-mocks.html` or `design-system/funnel-mocks.html` — these already exist
- Any changes to the print layout system (`/cookbooks/:id/toc`, `/cookbooks/:id/print`)
- Modifying the pricing page (F09) to surface ad removal more prominently

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.