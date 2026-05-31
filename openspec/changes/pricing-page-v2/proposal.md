## GitHub Issues

- dougis-org/cookbook-tanstack#453

## Why

- Problem statement: The current pricing page (`src/routes/pricing.tsx`) is a static display showing all 4 tiers without billing frequency options. Users cannot toggle between annual and monthly billing, there is no visual emphasis on the cheapest paid tier (Prep Cook), no Trust/Reassurance Row, and no interactive FAQ section to address pre-sales concerns.
- Why now: Improving the pricing page layout addresses a significant conversion funnel leak identified in the May 2026 UX audit, helping visitors make an informed, trust-backed buying decision.
- Business/user impact: Increases paid tier conversion rate by highlighting the value prop of the cheapest paid plan (Prep Cook), demonstrating trust and flexible cancellation, and resolving common user questions inline.

## Problem Space

- Current behavior: The pricing page renders 4 static tier cards. Pricing is presented statically with annual and monthly values side-by-side. There are no CTAs on individual cards (only a global CTA below for anonymous users). There is no "most popular" visual treatment, no reassurance guarantees, and no FAQ accordion.
- Desired behavior: 
  - Dynamic Annual/Monthly toggle at the top of the pricing page (defaulting to annual).
  - Prep Cook tier visually highlighted with a "Most popular" badge, elevated card layout, accent ring, and accent-fill CTA.
  - Toggling billing changes all pricing values dynamically: Monthly shows `$X.XX/mo` directly, whereas Annual shows `$X.XX/mo` with "Billed annually · $YY/yr" below.
  - Active/contextual CTAs inside every tier card: links to `/change-tier`, except if it is the user's active tier, which shows a disabled "Current plan" CTA button.
  - Reassurance trust row with three specific bullet points ("Cancel anytime", "30-day money-back guarantee", "Your recipes are yours").
  - An interactive FAQ Accordion with 5 key pre-sales questions, where the first question is open by default.
- Constraints:
  - Theme tokens only (all colors via `var(--theme-*)` CSS custom properties). No hardcoded hex values.
  - No emoji in copy (codebase convention allows only the Unicode checkmark `✓` for feature lines).
  - Brand name must be **My CookBooks**.
  - Lucide icons for reassurance row and accordion toggles.
- Assumptions:
  - The Stripe checkout wiring is handled separately (out of scope for this task); CTAs will safely link to `/change-tier` for plan selection.
  - The 4-tier model itself remains unchanged.
- Edge cases considered:
  - Displaying prices for free/anonymous tiers: stays `FREE` regardless of toggle.
  - Authenticated user current plan highlight: The card representing the user's current plan shows "Current plan" as a disabled CTA button instead of a link.

## Scope

### In Scope

- Dynamic Annual/Monthly billing toggle (defaults to Annual) with "Save 2 months" active badge.
- Dynamic pricing rendering on paid cards: Monthly vs Annual-equivalent monthly pricing + yearly caption.
- Prep Cook visual emphasis (elevated card, accent border/ring, top "Most popular" tag, filled CTA button).
- Context-aware CTAs on all tier cards (disabled button if current, link to `/change-tier` if not).
- 3-column reassurance row featuring Lucide icons and trust copy.
- 5-item FAQ interactive accordion (first item open by default).
- Complete Vitest unit/integration test coverage confirming toggle price updates and card state changes.

### Out of Scope

- Stripe checkout system integration (F01).
- Customizing or restructuring the user tier limits or prices themselves.

## What Changes

- `src/routes/pricing.tsx`: Complete rewrite of the route to implement toggle state, Prep Cook highlight, contextual CTAs, reassurance grid, and FAQ accordion.
- `src/routes/__tests__/-pricing.test.tsx`: Refactoring of the unit/integration tests to match the new toggle interface, dynamic math, and FAQ behaviors.

## Risks

- Risk: Accessibility and contrast issues on non-default themes (e.g. `dark-greens`, `light-warm`).
  - Impact: Hard-to-read cards or toggle buttons for users selecting secondary themes.
  - Mitigation: Rely strictly on standard semantic theme variables (`var(--theme-accent)`, `var(--theme-surface)`, `var(--theme-fg-muted)`) and perform multi-theme visual validation.
- Risk: Existing test suite breakage due to per-tier CTA changes.
  - Impact: Failing CI/CD pipeline due to broken legacy assertions.
  - Mitigation: Proactively delete outdated asserts (e.g. asserting "no links in cards") and replace them with robust assertions for the new interactive states.

## Open Questions

- Question: None. The acceptance criteria and UX audit details completely specify the requirements.
  - Needed from: N/A
  - Blocker for apply: no

## Non-Goals

- Connecting the buttons to payment processors or adding user account creation flows on this page.
- Rewriting `src/lib/tier-entitlements.ts`.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
