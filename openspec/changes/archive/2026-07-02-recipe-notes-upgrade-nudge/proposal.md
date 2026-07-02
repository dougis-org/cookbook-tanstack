## GitHub Issues

- #496

## Why

- Problem statement: Users who are anonymous, below Sous Chef tier, or have been downgraded currently see no UI where the Private Recipe Notes section would appear. Without a nudge, the feature is invisible — users don't know it exists or how to access it.
- Why now: The `privateRecipeNotes` tRPC router already signals downgrade state (`{ hasNote: true, note: null }`). The server contract is complete; the missing piece is the UI surface that consumes it.
- Business/user impact: Users who downgraded retain their notes — they just can't see them. An upgrade nudge recovers potential re-subscriptions. For anonymous/below-tier users it is a conversion surface for Sous Chef.

## Problem Space

- Current behavior: No component renders in the notes slot for unentitled users. The feature is silent.
- Desired behavior: An inline strip occupies the notes slot when the caller is unentitled, with state-appropriate copy and a single CTA.
- Constraints: Must not render note content for unentitled callers (per `do-not-reveal-note-text-to-unauthorized-tiers` decision). Classnames must be adblock-safe (no `.ad-*`, `.promo-*`, `.sponsor-*`). Uses design-system tokens (`var(--theme-*)`), Lucide icons, no emoji, Title Case CTAs.
- Assumptions: Parent component determines which state to pass based on `privateRecipeNotes.get` response and auth status. This component is purely presentational.
- Edge cases considered: `hidden-by-downgrade` copy must never hint at note content — only acknowledges a note exists.

## Scope

### In Scope

- New component `src/components/recipes/RecipeNotesUpgradeNudge.tsx` (default export)
- Unit tests covering all three `state` values: correct copy and correct link href
- Adblock-safe classnames: `.up-card`, `.up-body`, `.up-cta`

### Out of Scope

- Route wiring (wiring into `RecipeDetail` is a separate concern)
- tRPC query logic (parent resolves state before passing props)
- Any note read/write functionality

## What Changes

- New file: `src/components/recipes/RecipeNotesUpgradeNudge.tsx`
- New file: `src/components/recipes/__tests__/RecipeNotesUpgradeNudge.test.tsx`

## Risks

- Risk: Copy diverges from issue spec if iterated without updating spec
  - Impact: Low — component is self-contained and testable
  - Mitigation: Tests assert exact copy strings; any future copy change requires test update

- Risk: Adblock filters evolve and new class names get caught
  - Impact: Low — `.up-*` is already established in the design system guidance
  - Mitigation: Use `.up-*` prefix consistently per design system rules

## Open Questions

No unresolved ambiguity. All design decisions were confirmed during exploration:
- Visual weight: inline strip (matches `TierWall` inline)
- Icon: `Lock` (Lucide)
- CTA: single button per state
- Anonymous CTA: Login → `/auth/login`
- Below-tier and downgrade CTA: Upgrade → `/pricing`
- Component location: `src/components/recipes/`

## Non-Goals

- Wiring the nudge into `RecipeDetail` or any route
- Adding tier-checking logic inside the component (state comes from parent)
- Supporting a modal or full-page variant

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
