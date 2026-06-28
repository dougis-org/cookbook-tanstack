## Context

- Relevant architecture: `src/lib/tier-entitlements.ts` is the single source of truth for all tier limit values and boolean capabilities. `src/hooks/useTierEntitlements.ts` is a thin client-side adapter over it. `hasAtLeastTier` lives in `src/types/user.ts` and handles admin bypass and tier ranking.
- Dependencies: `hasAtLeastTier` from `src/types/user.ts`, `UserTier` type from same file.
- Interfaces/contracts touched: the three named boolean exports (`canCreatePrivate`, `canUsePrivateRecipeNotes`, `canImport`) and the `useTierEntitlements` hook's return shape. Both remain structurally unchanged from the caller's perspective.

## Goals / Non-Goals

### Goals

- Make the minimum required tier for each boolean capability declarative (data), not procedural (code)
- Introduce a typed generic `can()` helper so future capabilities are one-line additions
- Preserve all existing named exports as the stable public API
- Zero test modifications required

### Non-Goals

- Migrating call sites from wrappers to `can()` directly
- Touching limit-based entitlements (`TIER_LIMITS`, `getRecipeLimit`, `getCookbookLimit`, `showUserAds`)
- Runtime or database-backed capability configuration

## Decisions

### Decision 1: `CAPABILITY_TIERS` as `as const satisfies Record<string, UserTier>`

- Chosen: Declare `CAPABILITY_TIERS` with `as const satisfies Record<string, UserTier>`.
- Alternatives considered: plain object with explicit type annotation; runtime `Map<string, UserTier>`.
- Rationale: `as const` narrows key literals to a union (`'createPrivate' | 'privateRecipeNotes' | 'import'`), making `can()` parameter type-safe. `satisfies Record<string, UserTier>` validates values against `UserTier` at compile time without widening the type. This means typos in `can()` call sites are caught by TypeScript, and invalid tier strings are rejected.
- Trade-offs: Slightly unusual TypeScript pattern — `satisfies` is TS 4.9+. Project already targets modern TS (strict mode), so no version concern.

### Decision 2: `can()` signature and placement

- Chosen: `export function can(capability: keyof typeof CAPABILITY_TIERS, tier: string | null | undefined): boolean` — placed in `src/lib/tier-entitlements.ts`, exported.
- Alternatives considered: unexported (internal only); placed in a new file; accepting `EntitlementTier` instead of `string | null | undefined`.
- Rationale: Exporting allows hooks and future callers to use it directly. Keeping it in the same file avoids splitting related logic. Using `string | null | undefined` matches the existing wrapper signatures so wrappers remain exact drop-in delegations.
- Trade-offs: Exporting `can()` exposes it as public API. Acceptable — it is a well-typed, general-purpose helper with no hidden invariants.

### Decision 3: Named wrappers become one-line delegations

- Chosen: Each wrapper calls `can()` with the corresponding key: `canCreatePrivate(tier) => can('createPrivate', tier)`.
- Alternatives considered: Removing wrappers entirely (breaking change); keeping duplicate logic.
- Rationale: Backwards compatibility with all existing call sites and tests. The wrapper is now so thin that drift is structurally impossible — there is no logic to diverge.
- Trade-offs: Two layers of indirection (wrapper → can → hasAtLeastTier). Negligible for this use case.

### Decision 4: Hook internal update (cosmetic)

- Chosen: `useTierEntitlements` switches from calling named wrappers to calling `can()` directly for the boolean fields.
- Alternatives considered: Leave hook unchanged (also valid since wrappers are preserved).
- Rationale: Demonstrates the new pattern in the primary client-side consumer and keeps the hook consistent with the "one source of truth" intent of the refactor.
- Trade-offs: Pure cosmetic — no behaviour change. Slightly increases the hook's direct dependency on `CAPABILITY_TIERS`.

## Proposal to Design Mapping

- Proposal element: `CAPABILITY_TIERS` map as data-driven source of truth
  - Design decision: Decision 1 (`as const satisfies`)
  - Validation approach: TypeScript compilation; spec test verifying map contains all three keys with correct tier values

- Proposal element: Generic `can()` helper
  - Design decision: Decision 2 (signature + placement)
  - Validation approach: Existing wrapper tests pass through `can()`; new unit test exercises `can()` directly with known inputs

- Proposal element: Named wrappers preserved as stable public API
  - Design decision: Decision 3 (one-line delegation)
  - Validation approach: All existing `tier-entitlements.test.ts` tests pass without modification

- Proposal element: Hook updated to use new pattern internally
  - Design decision: Decision 4 (cosmetic hook update)
  - Validation approach: All existing `useTierEntitlements.test.ts` tests pass without modification

## Functional Requirements Mapping

- Requirement: `CAPABILITY_TIERS` exported map with three keys and correct tier values
  - Design element: Decision 1
  - Acceptance criteria reference: specs/capability-map.md
  - Testability notes: direct object assertion in unit test

- Requirement: `can(capability, tier)` returns correct boolean for all tier/capability combos
  - Design element: Decision 2
  - Acceptance criteria reference: specs/can-helper.md
  - Testability notes: parameterized test across all five tiers × three capabilities

- Requirement: Existing named wrappers delegate to `can()` and produce identical results
  - Design element: Decision 3
  - Acceptance criteria reference: existing tests (no modification needed)
  - Testability notes: existing test suite is the validation; no new tests needed for wrappers

- Requirement: Adding a new capability requires only one line in `CAPABILITY_TIERS`
  - Design element: Decisions 1 + 2 combined
  - Acceptance criteria reference: specs/capability-map.md — "developer ergonomics" criterion
  - Testability notes: demonstrated by the implementation itself; code review verification

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No behaviour regression in any tier-gated feature
  - Design element: Wrapper delegation (Decision 3) preserves exact semantics
  - Acceptance criteria reference: full test suite pass
  - Testability notes: `npm run test` green; no test modifications required

- Requirement category: operability
  - Requirement: TypeScript catches invalid capability names at compile time
  - Design element: `keyof typeof CAPABILITY_TIERS` on `can()` parameter (Decision 2)
  - Acceptance criteria reference: specs/can-helper.md type-safety criterion
  - Testability notes: `tsc --noEmit` passes; intentional typo in test branch would produce TS error

## Risks / Trade-offs

- Risk/trade-off: Developer adds new capability to `CAPABILITY_TIERS` but forgets to add a named wrapper (if one is expected)
  - Impact: No runtime breakage — `can()` works without a wrapper. Just a missing convenience export.
  - Mitigation: Document in `docs/user-tier-feature-sets.md` that wrappers are optional; `can()` is the primary API going forward.

- Risk/trade-off: Test suite imports `CAPABILITY_TIERS` or `can` and those symbols don't yet exist
  - Impact: Compilation failure until implementation lands
  - Mitigation: TDD — write tests first, confirm they fail, then implement.

## Rollback / Mitigation

- Rollback trigger: Any test failure in `tier-entitlements.test.ts` or `useTierEntitlements.test.ts` after implementation.
- Rollback steps: Revert `src/lib/tier-entitlements.ts` and `src/hooks/useTierEntitlements.ts` to pre-change state; no database or API surface changes, so no migration needed.
- Data migration considerations: None — purely a code refactor.
- Verification after rollback: `npm run test` passes, TypeScript compiles.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check before requesting re-review.
- If security checks fail: Do not merge. This refactor touches no auth/session/network code, so a security failure indicates a pre-existing issue to triage separately.
- If required reviews are blocked/stale: Wait up to 48 hours, then re-request review or ping the reviewer. Do not merge without required approvals.
- Escalation path and timeout: After 48 hours of no reviewer response, escalate to repo owner (@dougis).

## Open Questions

No open questions. Design is fully specified by the issue acceptance criteria and the existing codebase shape.
