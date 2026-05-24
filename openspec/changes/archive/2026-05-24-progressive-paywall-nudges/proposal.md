## GitHub Issues

- #449

## Why

- **Problem statement**: Currently, users are not alerted about their recipe and cookbook plan limits until they hit them directly. The UI immediately disables the new recipe flow and presents a tier wall without progressive warnings. This sudden blockage acts as a harsh barrier rather than an encouraging upgrade signal.
- **Why now**: Introducing progressive paywall nudges creates a smooth conversion funnel, preparing the user for upgrades as they approach their limit and aligning with UX best practices identified in the May 2026 UX audit.
- **Business/user impact**: Users get a better experience (planning capacity ahead of time), and the conversion rates improve as users are presented with elegant, contextual payment triggers.

## Problem Space

- **Current behavior**: When `myRecipeCount >= recipeLimit`, the "+ New Recipe" button is disabled and the inline `TierWall` warning is rendered, but no ahead-of-time soft or loud notifications are shown.
- **Desired behavior**:
  - **70%–89% limit**: Inline soft warning, dismissable for the session using `sessionStorage`.
  - **90%–99% limit**: Persistent loud warning banner with a progress bar and upgrade CTA.
  - **100% limit**: Hard wall blocking recipe creation with a comparison row in the modal `TierWall`.
- **Constraints**:
  - Theme variables only (use `--theme-warning` for the loud banner, `--theme-error` for the wall).
  - No emojis in UI text (use Lucide React icons instead).
  - Use exact pricing from `TIER_PRICING` and tier configurations in `src/lib/tier-entitlements.ts`.
- **Assumptions**:
  - The limits are dynamic and calculated per user session.
  - The `sessionStorage` key is unique to the count category (e.g. `recipe`).
- **Edge cases considered**:
  - Highest tier `executive-chef` having no next tier (hide upgrade CTA).
  - User not logged in (hide nudges).

## Scope

### In Scope

- Creation of `src/lib/nudgeCopy.ts` to centralize A/B testable/localizable copy.
- Creation of `src/components/ui/UsageNudge.tsx` shared component for 70% (soft) and 90% (loud) thresholds.
- Updating `src/components/ui/TierWall.tsx` to add "Today vs Next Tier" comparison matrix when limit is reached.
- Updating `src/routes/recipes/index.tsx` to render the `<UsageNudge>` inline.
- Updating `src/routes/recipes/new.tsx` to enforce the 100% modal wall block and render inline warning nudges below limit.
- Comprehensive unit tests using Vitest.

### Out of Scope

- Cookbook count nudges (handled in a follow-up issue).
- Redesigning the home dashboard usage card (F06 covers this).
- Dunning or payment handling itself (covered in separate issues).

## What Changes

- **New Files**:
  - `src/lib/nudgeCopy.ts`
  - `src/components/ui/UsageNudge.tsx`
  - `src/components/ui/__tests__/UsageNudge.test.tsx`
- **Modified Files**:
  - `src/components/ui/TierWall.tsx`
  - `src/routes/recipes/index.tsx`
  - `src/routes/recipes/new.tsx`
  - `src/components/ui/__tests__/TierWall.test.tsx`

## Risks

- **Risk**: User session storage gets polluted or out of sync.
  - **Impact**: Soft nudge might not reappear when expected or stay permanently dismissed.
  - **Mitigation**: Use session-only storage (`sessionStorage`) and simple string flags.
- **Risk**: Hard wall blocking form rendering causes navigation loops.
  - **Impact**: User gets stuck.
  - **Mitigation**: Ensure "Not now" button cleanly redirects back to `/recipes`.

## Open Questions

- None. The scope is fully aligned with the handoff specifications in `design-system/handoff/issues/F05-paywall-nudges.md`.

## Non-Goals

- Changing the backend MongoDB limits or connection rules.
- Integrating Stripe APIs directly in these UI visual elements (which is handled by F01/issue 426).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`, `specs/**/*.md`, and `tasks.md` before implementation starts.
