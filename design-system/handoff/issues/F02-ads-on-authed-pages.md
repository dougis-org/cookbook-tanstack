# F02 — Render sponsored content on free-tier authed pages

## Context

The Prep Cook tier ($27.99/yr) exists to remove ads. But today, `src/lib/ad-policy.ts` only enables ads on `public-marketing` and `public-content` page roles:

```ts
const AD_ENABLED_ROLES: PageRole[] = ['public-marketing', 'public-content']
```

So Home Cook users **never see an ad on the pages they actually live on** (`/home`, `/recipes`, recipe detail). The Prep Cook upgrade sells a relief from a friction the user has never experienced.

This is the single largest conversion lever available. See `design-system/funnel-mocks.html` / `ad-placement-mocks.html` for the proposed placements (mocked at fidelity in the design system).

## Acceptance criteria

- [ ] `AD_ENABLED_ROLES` extended to include `authenticated-home` and `authenticated-task`.
- [ ] `<PageLayout>` (or wherever ad slots render) shows **one** ad slot on each of: `/home` (between page title and content), `/recipes` (between filter row and grid), `/recipes/$recipeId` (right rail, sticky rect format).
- [ ] Slot is hidden for any user where `showUserAds(tier) === false` (covers Prep Cook and above, plus admins).
- [ ] Slot has an inline upgrade affordance: "Remove sponsors → Prep Cook · $X.XX/mo" linking to `/pricing`.
- [ ] Slot is FTC-labeled: an "AD" or "SPONSORED" eyebrow.

## Critical: adblock-safe naming

**This is the most important constraint.** Browser ad-blockers (uBlock, AdGuard, Brave) cosmetically hide any element matching common selectors. Verified during mock testing that ALL of the following families are filtered:

- `.ad-*` / `[data-ad]` / `[id*="ad-"]`
- `.sponsor-*` / `.sponsored-*`
- `.promo-*` / `.banner-*`
- `.adv-*` / `.adsbygoogle`

**Use the neutral `.up-*` prefix from the reference mock**: `.up-card`, `.up-media`, `.up-body`, `.up-cta`. Or a generic feature name. Do NOT use any of the blocked families anywhere — class, id, data attribute, iframe name. If the entire revenue surface gets blocked, the Prep Cook funnel collapses.

This rule is documented in `design-system/CLAUDE.md` under "Adblock-safe classnames".

## Where to start

- `src/lib/ad-policy.ts` — extend `AD_ENABLED_ROLES`
- `src/components/layout/PageLayout.tsx` — add ad slot rendering branch
- Reference component: `design-system/components/` has the visual pattern. Implementation should be a fresh `src/components/ads/SponsorSlot.tsx` named neutrally.
- Reference mock: `ad-placement-mocks.html` in the design-system project shows three placements at fidelity.
- `src/routes/__root.tsx` — ensure each route declares the correct `role` so the policy fires.

## Constraints

- Theme tokens only.
- No emoji.
- Wire the actual ad-network (Google AdSense, per `src/lib/google-adsense.ts`) but ship gated behind an env flag so the first deploy renders only the static "upgrade" affordance in place of the real ad.

## Out of scope

- Stripe checkout (F01 — must land first)
- Pricing page redesign (F09)

@claude please implement this against `main`. Confirm in your PR description that you've tested with uBlock Origin enabled in a real browser — the slot must still render visibly. Use the `.up-*` classname family or document why you chose another neutral prefix.
