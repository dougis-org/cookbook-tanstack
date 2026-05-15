# F07 — Make /account's upgrade CTA a primary action

## Context

`src/routes/account.tsx` does the right thing showing tier name, usage bars, and a "Next tier preview" panel. But the only call-to-action is a 14px underlined text link reading "View pricing plans." If the user is on this page, they're already thinking about plans — the CTA should be a primary button targeted at the *specific* next tier.

## Acceptance criteria

- [ ] Replace the "View pricing plans" text link with a primary button labelled "Upgrade to {NextTierDisplayName} — ${monthlyPrice}/mo".
- [ ] Button links to `/pricing?focus={nextTier}` (so the pricing page can highlight that tier card — small follow-up scope).
- [ ] Below the button: a secondary text link "Compare all plans →" linking to `/pricing` plain.
- [ ] If the user is already on the top tier (`executive-chef`), hide the upgrade button and show "You're on the top plan" instead.
- [ ] If the user has no `nextTier` (logic already exists in this file), hide the CTA section entirely.
- [ ] Move the upgrade CTA up — above the "Next tier preview" panel, not below — so it's the first thing the eye lands on after the usage bars.

## Where to start

- `src/routes/account.tsx` lines ~115–135 (the Link + nextTier rendering)
- `src/lib/tier-entitlements.ts` for `TIER_PRICING` and `TIER_DISPLAY_NAMES`

## Constraints

- Theme tokens only.
- No emoji.
- Match button styles already used elsewhere (`bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white rounded-lg`).

## Out of scope

- Pricing page's response to the `?focus=` query param (note for later — a one-liner change to add a brief CSS highlight class to the focused tier card).
- Stripe checkout itself (F01).

@claude please open a small PR for this. Should be ~30 line change. Include a snapshot test update.
