# F09 — Pricing page v2 (toggle, emphasis, FAQ)

## Context

`src/routes/pricing.tsx` today renders 4 tier cards and stops. There's:

- No monthly/annual toggle (both prices shown side-by-side, harder to scan)
- No "most popular" visual emphasis
- No FAQ, no reassurance row, no money-back guarantee
- No "current plan" highlight beyond a small badge

Reference mock: `funnel-mocks.html` → "F9 — Pricing v2" artboard.

## Acceptance criteria

- [ ] **Annual/monthly toggle** at top, defaulting to **annual** (since it's the discounted option). Toggling rewrites every tier card's price line live.
- [ ] When monthly is selected, show `$X.XX/mo` directly. When annual is selected, show `$X.XX/mo` *with* "Billed annually · $YY/yr" caption beneath.
- [ ] "Save 2 months" tag next to the toggle when annual is active.
- [ ] **Most popular emphasis** on Prep Cook (the cheapest paid tier): elevated card with accent ring + a "Most popular" pill at the top edge + accent-fill CTA.
- [ ] **Current plan**: badge unchanged, but the card's CTA becomes "Current plan" disabled.
- [ ] **Reassurance row** below the cards, 3 columns: "Cancel anytime", "30-day money-back guarantee", "Your recipes are yours" (export-anytime promise).
- [ ] **FAQ accordion** below, 4–6 items: cancellation, downgrade behavior, refunds, sponsored content explanation, family/team plans (if applicable), refund policy.
- [ ] First FAQ item open by default.

## Where to start

- `src/routes/pricing.tsx` — the file to rewrite
- `src/lib/tier-entitlements.ts` — `TIER_PRICING` already has `annual` and `monthly`
- Reference mock: `funnel-mocks/PricingV2.jsx` in the design-system project
- Reference component: design system has a `<TierCard>` reference at `design-system/components/TierCard.jsx` — extend, don't replace

## Constraints

- Theme tokens only.
- No emoji. Use `✓` (U+2713) for feature checkmarks — already the codebase convention.
- Lucide icons for the reassurance row (e.g. `ShieldCheck`, `RefreshCw`, `Download`).
- Brand name is **My CookBooks**.

## Out of scope

- Stripe checkout wiring (F01) — CTAs can be wired later; for this PR, they navigate to `/change-tier` and rely on F01.
- Changing the tier structure (separate strategic call; this PR keeps all 4 tiers as-is).

@claude please open a PR. Include a Vitest test confirming the toggle correctly updates all 4 tier prices in monthly and annual modes.
