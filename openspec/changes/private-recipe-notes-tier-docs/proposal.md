## GitHub Issues

- #500

## Why

- Problem statement: The tier documentation and pricing page are incomplete with respect to Private Recipe Notes. The `docs/user-tier-feature-sets.md` feature matrix and upper-tier sections correctly document the feature, but the Home Cook and Prep Cook narrative sections do not explicitly state that private recipe notes are excluded. The pricing page tier cards list private recipe availability and import but omit private recipe notes entirely.
- Why now: The Private Recipe Notes entitlement was added to `CAPABILITY_TIERS` in `tier-entitlements.ts` and the server/client enforcement is in place. The documentation should be kept in sync so pricing and tier comparisons accurately reflect the full feature set.
- Business/user impact: Users comparing tiers on the pricing page cannot see Private Recipe Notes as a differentiator. Documentation gaps can lead to support confusion about what Home Cook and Prep Cook include.

## Problem Space

- Current behavior: `docs/user-tier-feature-sets.md` Home Cook and Prep Cook sections list content restrictions (no private recipes, no import) but do not mention private recipe notes. The pricing page tier cards show three feature rows (private recipes, import, ads) with no row for private recipe notes.
- Desired behavior: Home Cook and Prep Cook sections each add one sentence noting private recipe notes are not included. The pricing page tier cards show a Private Recipe Notes row driven by the existing `can()` entitlement helper.
- Constraints: No tier limits or entitlement logic changes — this is documentation and UI copy only. The `can('privateRecipeNotes', tier)` key already exists in `CAPABILITY_TIERS`.
- Assumptions: The `pricing.tsx` tier card is the only non-hook, non-server location that calls the wrapper functions (`canCreatePrivate`, `canImport`) directly — confirmed by grep. All other callers use `useTierEntitlements` hook or server enforcement.
- Edge cases considered: The feature matrix row (line 42) and Sous Chef/Executive Chef narrative sections already correctly document Private Recipe Notes — only the Home Cook/Prep Cook narratives and the pricing card need updating.

## Scope

### In Scope

- Add one sentence to the Home Cook section of `docs/user-tier-feature-sets.md`
- Add one sentence to the Prep Cook section of `docs/user-tier-feature-sets.md`
- Refactor `src/routes/pricing.tsx` to import `can` instead of `canCreatePrivate`/`canImport`
- Add a Private Recipe Notes feature row to the pricing page tier card

### Out of Scope

- Changes to entitlement logic, tier limits, or CAPABILITY_TIERS
- Marketing copy beyond the existing tier doc
- Changes to server routers, the hook, or any other caller of the wrapper functions
- Removing or deprecating the `canCreatePrivate`/`canImport` wrapper functions (used broadly elsewhere)

## What Changes

- `docs/user-tier-feature-sets.md`: two sentence additions (Home Cook and Prep Cook sections)
- `src/routes/pricing.tsx`: replace `canCreatePrivate`/`canImport` imports with `can`; update three JSX lines to use `can('createPrivate', tier)`, `can('import', tier)`, and add `can('privateRecipeNotes', tier)`

## Risks

- Risk: Pricing page visual regression if the new row breaks the card layout.
  - Impact: Low — one `<p>` element added to a list of identical `<p>` elements.
  - Mitigation: Verify card renders correctly across all five tiers after change.
- Risk: Type error if `can()` is called with a capability key not present in `CAPABILITY_TIERS`.
  - Impact: Low — TypeScript enforces `keyof typeof CAPABILITY_TIERS` at compile time.
  - Mitigation: None needed; compiler catches this.

## Open Questions

No unresolved ambiguity exists. The decision to use `can()` in `pricing.tsx` rather than adding a third wrapper was made during exploration and is captured in this proposal. All acceptance criteria from issue #500 map directly to the in-scope changes above.

## Non-Goals

- Changing which tiers have access to Private Recipe Notes
- Updating server-side enforcement (already correct)
- Modifying the `useTierEntitlements` hook (already exposes `canUsePrivateNotes` or equivalent if needed)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
