# Comment to add on #430 — design context for pricing page v2

> **How to use this**: open https://github.com/dougis-org/cookbook-tanstack/issues/430,
> click "Comment", paste this block, post. Then close #453 with a comment pointing here.

---

Design context from the May 2026 UX audit — supplements the existing task list, doesn't replace it.

## Fidelity reference

A mock of the proposed page is in the design-system project:
`design-system/funnel-mocks/PricingV2.jsx` — open `funnel-mocks.html` to view it interactively.

## Additions to the task list

Beyond the existing tasks, the audit identified these specific UX improvements worth implementing:

- [ ] **"Most popular" emphasis on Prep Cook** (not Sous Chef). Rationale: Prep Cook ($2.99/mo) is the cheapest paid tier — its job is to make the first paid step feel obvious. Sous Chef is the "growth" tier; users get there after they've already converted. The mock places the popular flag + accent ring + elevated card on Prep Cook.
- [ ] **Reassurance row** below the tier cards (3 columns): *Cancel anytime · 30-day money-back guarantee · Your recipes are yours (export anytime)*. Each with a small Lucide icon and a one-line caption.
- [ ] **FAQ accordion** below the reassurance row, 4–6 items. First open by default. Required items: cancellation, downgrade behaviour, refund policy, why sponsored content on free plan. Note the downgrade behavior should match #428.

## Design-system rules to follow

- All colors via `var(--theme-*)` tokens — no hard-coded hex. The four themes must all read legibly.
- **No emoji.** The Unicode checkmark `✓` is allowed for feature checkmarks (already a codebase convention).
- Brand name in any copy is **My CookBooks** (capital C, capital B, joined).
- Lucide icons for the reassurance row (e.g. `ShieldCheck`, `RefreshCw`, `Download`).
- Annual toggle: **default to annual** (matches existing task) + show "Save 2 months" tag.
- When annual is selected, render `$X.XX/mo` as the headline price *with* a "Billed annually · $YY/yr" caption below — easier to scan than two prices side-by-side.

## Reference

- `design-system/CLAUDE.md` in the repo — brand voice, color/type rules.
- `design-system/funnel-mocks/PricingV2.jsx` — the visual reference at fidelity.
- `design-system/components/TierCard.jsx` — existing reference component to extend, not replace.

---

**Closes #453** (which duplicated this issue — the audit context is now folded in here).
