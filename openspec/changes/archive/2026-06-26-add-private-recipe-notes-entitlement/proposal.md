## GitHub Issues

- dougis-org/cookbook-tanstack#491

## Why

- Problem statement: The codebase has no single source of truth for which tiers can access Private Recipe Notes (per-user private notes on recipes, distinct from the public `note` field). Without a named helper, callers would inline `hasAtLeastTier` with no shared label or discoverability.
- Why now: Issue #491 is a prerequisite for issues #492 and #494 (server enforcement and UI). Those cannot proceed until this helper exists.
- Business/user impact: Private Recipe Notes is a Sous Chef+ feature. Without an entitlement helper, enforcement logic would be duplicated or absent, creating a risk of unauthorized access or inconsistent gating.

## Problem Space

- Current behavior: `src/lib/tier-entitlements.ts` has `canCreatePrivate` (private recipes/cookbooks, `sous-chef`+) and `canImport` (`executive-chef`+), but no helper for Private Recipe Notes.
- Desired behavior: A `canUsePrivateRecipeNotes(tier)` helper lives in `tier-entitlements.ts` so every layer (server, UI, tests) calls the same function.
- Constraints: Must follow the existing `canCreatePrivate` / `canImport` function signature (`tier: string | null | undefined`): boolean). Must use `hasAtLeastTier` internally. Threshold is `sous-chef`.
- Assumptions: Private Recipe Notes is intentionally gated at the same tier as private recipes/cookbooks (`sous-chef`). The two features are distinct; the shared threshold is a product decision, not an accident.
- Edge cases considered: `null` and `undefined` tier values must return `false`. The `anonymous` virtual tier must return `false`.

## Scope

### In Scope

- Add `canUsePrivateRecipeNotes(tier: string | null | undefined): boolean` to `src/lib/tier-entitlements.ts`
- Unit tests for all five named tiers plus `null` and `undefined` in `src/lib/__tests__/tier-entitlements.test.ts`
- Update `docs/user-tier-feature-sets.md` to list "Private Recipe Notes" under Sous Chef and Executive Chef, explicitly distinguishing it from the public `note` field

### Out of Scope

- Server-side enforcement (tracked in #492)
- UI affordances and upgrade prompts (tracked in #494)
- Any changes to the Recipe document schema or the public `note` field

## What Changes

- `src/lib/tier-entitlements.ts`: add one exported function `canUsePrivateRecipeNotes`
- `src/lib/__tests__/tier-entitlements.test.ts`: add one `describe` block with 7 test cases
- `docs/user-tier-feature-sets.md`: add "Private Recipe Notes" entry under Sous Chef and Executive Chef sections, with a clarifying note about the public `note` field distinction

## Risks

- Risk: Naming confusion between private recipe notes and the existing public `note` field on Recipe documents.
  - Impact: Callers pick the wrong concept; notes are exposed when they shouldn't be.
  - Mitigation: Docs update explicitly names both fields and their distinction. Function name `canUsePrivateRecipeNotes` is distinct from any existing helper.

- Risk: Future tier threshold change (e.g., lowering to `prep-cook`) requires updating this helper and cascading to callers.
  - Impact: Low — single source of truth means one edit propagates everywhere.
  - Mitigation: None needed beyond the existing entitlement pattern.

## Open Questions

No unresolved ambiguity exists. The tier threshold (`sous-chef`), function signature, file location, test cases, and docs target are all confirmed by the issue and existing codebase conventions.

## Non-Goals

- Do not implement, scaffold, or stub any Private Recipe Notes data model, schema, or UI
- Do not modify the public `note` field or any existing Recipe document structure
- Do not add the helper to the client-side `useTierEntitlements` hook (that is part of the UI work in #494)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
