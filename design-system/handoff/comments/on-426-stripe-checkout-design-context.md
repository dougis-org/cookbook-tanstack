# Comment to add on #426 — design context for Stripe Checkout (was F01)

> **How to use this**: open https://github.com/dougis-org/cookbook-tanstack/issues/426,
> click "Comment", paste this block, post.

---

Design context from the May 2026 UX audit. The audit identified Stripe Checkout as the **single Fatal-severity** funnel break: until this lands, the whole funnel ends at `/change-tier` reading "Plan changes coming soon."

The pre-existing Stripe issue family (#426 checkout, #427 upgrade, #428 downgrade, #429 portal, #431 dunning) already covers the implementation work. This comment adds the design-system constraints + UX expectations the audit surfaced.

## UX expectations for the checkout entry point

Wherever a paid-tier card on `/pricing` becomes the trigger for Checkout:

- [ ] Click "Upgrade" on a tier card → tRPC mutation `billing.createCheckoutSession({ tier, billingPeriod })` → redirect to Stripe Checkout
- [ ] On success: redirect to `/account?upgrade=success`, show a one-time success banner (use existing toast/banner pattern), confirm new tier in the usage card
- [ ] On cancel: redirect back to `/pricing` with no tier change, no error banner
- [ ] Failed payment → handled by #431 dunning flow
- [ ] Loading state on the tier-card CTA during session creation — disable the button, swap label to "Redirecting…"

## Design constraints (apply to any new UI this adds)

- All colors via `var(--theme-*)` tokens.
- **No emoji** (use Lucide icons, including for the success banner — `CheckCircle2`).
- Brand name **My CookBooks** anywhere it appears.
- Success page lives at `/account?upgrade=success` rather than a separate route — the user is already familiar with `/account` and the usage card immediately confirms the new limits.

## Touch points with other audit findings

- **#430 (F09)** Pricing v2 — the entry surface. Tier card CTAs must call into this flow.
- **#451 (F07)** Account upgrade CTA — same entry surface from `/account`.
- **#449 (F05)** Paywall nudges — wall modal's primary CTA calls into this flow.
- **#450 (F06)** Dashboard contextual nudge — same.

All four entry surfaces should use the same `billing.createCheckoutSession` mutation, never a hand-rolled redirect.

## Reference

- `design-system/CLAUDE.md` — brand voice, color/type rules
- `design-system/funnel-mocks/PricingV2.jsx` — visual reference for the source surfaces
