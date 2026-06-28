## GitHub Issues

- #538

## Why

- Problem statement: Boolean tier-capability functions in `src/lib/tier-entitlements.ts` are structurally identical — each is a one-liner wrapping `hasAtLeastTier` with a hardcoded tier string. Adding a new tier-gated feature today requires writing a new exported function, which is mechanical noise masquerading as logic.
- Why now: Issue #491 (Private Recipe Notes helper) is implemented, satisfying the stated prerequisite. This is the right moment to lock in the pattern before more capabilities are added.
- Business/user impact: Developer-experience improvement. Reduces the cost of adding future tier-gated features from "write a new function + update the hook" to "add one line to a map."

## Problem Space

- Current behavior: Each tier-gated boolean capability is a named export (`canCreatePrivate`, `canUsePrivateRecipeNotes`, `canImport`). The minimum required tier is buried inside each function body rather than surfaced as data.
- Desired behavior: Minimum required tiers are declared in a single `CAPABILITY_TIERS` map. A generic `can(capability, tier)` function handles all boolean capability checks. Named wrapper exports remain for backwards compatibility, delegating to `can()`.
- Constraints: All existing call sites must continue to compile and behave identically without modification. All existing tests must pass without modification.
- Assumptions: Only `hasAtLeastTier`-style boolean functions belong in `CAPABILITY_TIERS`. Non-boolean entitlements (`TIER_LIMITS`, `showUserAds`, `getRecipeLimit`, `getCookbookLimit`) are out of scope.
- Edge cases considered: `null` and `undefined` tier inputs — already handled by `hasAtLeastTier`, so `can()` inherits that behaviour by delegation.

## Scope

### In Scope

- Add `CAPABILITY_TIERS` constant to `src/lib/tier-entitlements.ts`
- Add generic `can()` helper function in the same file
- Rewire `canCreatePrivate`, `canUsePrivateRecipeNotes`, `canImport` as thin wrappers around `can()`
- Update `src/hooks/useTierEntitlements.ts` to use `can()` internally (cosmetic, no behaviour change)
- Update `docs/user-tier-feature-sets.md` Implementation table to reflect `CAPABILITY_TIERS` as the source of truth for boolean gates

### Out of Scope

- Migrating existing call sites from named wrappers to `can()` directly
- Changing `TIER_LIMITS`, `showUserAds`, `getRecipeLimit`, `getCookbookLimit` — these are not boolean tier capabilities
- Any new tier-gated features
- Changes to tRPC routers, route guards, or server enforcement logic

## What Changes

- `src/lib/tier-entitlements.ts`: new `CAPABILITY_TIERS` map, new `can()` function, wrappers rewired
- `src/hooks/useTierEntitlements.ts`: internal calls switch from named wrappers to `can()` (optional cosmetic improvement)
- `docs/user-tier-feature-sets.md`: Implementation section updated to name `CAPABILITY_TIERS` as source of truth

## Risks

- Risk: Wrapper semantics diverge from `can()` if someone edits a wrapper without updating the map.
  - Impact: Low — the map is now the source of truth; wrappers are one-liners with no logic to drift.
  - Mitigation: TypeScript `satisfies Record<string, UserTier>` on `CAPABILITY_TIERS` ensures keys and values are type-checked at compile time.

- Risk: Tests that import named wrappers break.
  - Impact: None — named exports remain unchanged; tests need no modification.
  - Mitigation: Verified existing test suite imports only the named exports.

## Open Questions

No unresolved ambiguity exists. Issue #538 specifies exact API shape, acceptance criteria, and out-of-scope boundaries. Named wrapper exports are explicitly preserved as the stable public API.

## Non-Goals

- Forcing all callers to migrate to `can()` — the named wrappers are the stable public surface
- Introducing a plugin system or registry for capabilities
- Runtime capability configuration (this is compile-time configuration only)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
