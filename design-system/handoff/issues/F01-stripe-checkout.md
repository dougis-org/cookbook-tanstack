# F01 — Wire Stripe Checkout into /change-tier

## Context

Today `src/routes/change-tier.tsx` renders the static text "Plan changes coming soon" — there is no path from "I want to pay" to "I have paid." Stripe is already a dependency (`src/lib/stripe.ts` exists) and `user.tier` is the source of truth for entitlements.

The UX audit (see `design-system/../ux-audit.html` once committed, or `docs/ux-audit-2026-05.md` if mirrored in-repo) flags this as the single Fatal-severity issue: every other recommendation is downstream of fixing it.

## Acceptance criteria

- [ ] From `/pricing`, clicking "Upgrade" on a paid tier card creates a Stripe Checkout Session and redirects to it.
- [ ] On successful payment, the Stripe webhook updates `user.tier` to the purchased tier.
- [ ] The user is redirected back to `/account` with a success flash message.
- [ ] Both annual and monthly prices are supported — separate Stripe Price IDs per tier × billing period.
- [ ] `/change-tier` now provides at minimum a "Manage subscription" link to the Stripe Customer Portal for active subscribers.
- [ ] Cancel returns the user to `/pricing` with no tier change.
- [ ] `useTierEntitlements()` reflects the new tier immediately (refetch or session refresh).
- [ ] Tier downgrades trigger the existing `reconcile-user-content.ts` flow.

## Where to start

- `src/routes/change-tier.tsx` — the page that needs to do something
- `src/routes/pricing.tsx` — wire each tier card's CTA to a new tRPC mutation `billing.createCheckoutSession({ tier, billingPeriod })`
- `src/lib/stripe.ts` — extend to support checkout sessions + webhook signature verification
- `src/routes/api/` — add `webhook/stripe.ts` route to receive `checkout.session.completed` and `customer.subscription.{updated,deleted}` events
- `src/lib/tier-entitlements.ts` — `TIER_PRICING` needs Stripe `priceId` fields alongside the dollar amounts

## Constraints

- Theme tokens only — every surface uses `var(--theme-*)`, no hard-coded hex.
- No emoji (use Lucide icons).
- Brand name is **My CookBooks** (capital C + capital B, joined).
- Follow the existing tRPC pattern — all server-side enforcement stays in routers.
- Tests-first per `AGENTS.md`: a Vitest mutation test + a Playwright e2e that walks an account from Home Cook → Stripe test card → Prep Cook.

## Out of scope (do NOT do in this PR)

- Tier restructure / pricing changes (see F02, F09)
- Dashboard or paywall-nudge work (see F06, F05)

@claude please pick this up. Open a PR against `main` with the Stripe integration scoped to checkout + webhook + portal link only. Use Stripe test mode and document the env vars in `.env.example`.
