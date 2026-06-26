## Context

- Relevant architecture: `src/lib/tier-entitlements.ts` is the single source of truth for tier-gated boolean capabilities. It exports `canCreatePrivate` and `canImport` as the established pattern. `hasAtLeastTier` lives in `src/types/user.ts` and handles `null`/`undefined` tier via defaulting to `home-cook`, plus admin bypass.
- Dependencies: `hasAtLeastTier` from `@/types/user` (already imported in `tier-entitlements.ts`). No new dependencies.
- Interfaces/contracts touched: `src/lib/tier-entitlements.ts` (new export), `src/lib/__tests__/tier-entitlements.test.ts` (new describe block), `docs/user-tier-feature-sets.md` (docs update).

## Goals / Non-Goals

### Goals

- Add `canUsePrivateRecipeNotes` to `tier-entitlements.ts` matching the existing helper signature and pattern
- Achieve test coverage for all five tiers plus `null` and `undefined`
- Update tier feature-set docs so Private Recipe Notes appears in Sous Chef and Executive Chef sections with a clear distinction from the public `note` field

### Non-Goals

- No data model, schema, migration, or UI changes
- No change to the `useTierEntitlements` client hook (belongs to #494)
- No server enforcement (belongs to #492)

## Decisions

### Decision 1: Reuse `hasAtLeastTier` with `{ tier }` object shape

- Chosen: `return hasAtLeastTier({ tier }, 'sous-chef')` — identical body to `canCreatePrivate`
- Alternatives considered: Inline `TIER_RANK` comparison directly; wrap `canCreatePrivate` and alias
- Rationale: `hasAtLeastTier` already handles `null`/`undefined` defaulting and admin bypass correctly. Reusing it keeps logic centralized in `src/types/user.ts`. Aliasing `canCreatePrivate` would conflate two distinct product concepts.
- Trade-offs: Both features share the `sous-chef` threshold today; if they diverge in future, each helper changes independently — which is the correct behavior.

### Decision 2: Place tests in the existing `tier-entitlements.test.ts` file

- Chosen: Add a new `describe('canUsePrivateRecipeNotes', ...)` block to `src/lib/__tests__/tier-entitlements.test.ts`
- Alternatives considered: Create a separate test file
- Rationale: All entitlement helpers are tested in one file; splitting would be inconsistent and fragment coverage reports.
- Trade-offs: File grows slightly; no structural downside given the small scope.

### Decision 3: Use `it.each` with explicit `null` and `undefined` rows

- Chosen: Include `null` and `undefined` as rows in the `it.each` table (in addition to all five named tiers)
- Alternatives considered: Test `null`/`undefined` as separate `it` cases
- Rationale: The issue explicitly requires these cases; `it.each` is the established style in the file. Keeping all cases in one table makes the boundary contract visible at a glance.
- Trade-offs: None.

### Decision 4: Docs update targets `docs/user-tier-feature-sets.md`

- Chosen: Add "Private Recipe Notes" under both Sous Chef and Executive Chef sections; add a parenthetical note distinguishing from the existing public `note` field
- Alternatives considered: Create a separate Private Recipe Notes doc
- Rationale: `docs/user-tier-feature-sets.md` is the canonical tier feature matrix; all tier features belong there.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: `canUsePrivateRecipeNotes` function at `sous-chef`+
  - Design decision: Decision 1 — use `hasAtLeastTier({ tier }, 'sous-chef')`
  - Validation approach: Unit tests for all 7 cases in `tier-entitlements.test.ts`

- Proposal element: Unit tests covering all five tiers plus `null`/`undefined`
  - Design decision: Decision 2 + 3 — `it.each` in existing test file
  - Validation approach: `npx vitest run src/lib/__tests__/tier-entitlements.test.ts`

- Proposal element: Docs listing Private Recipe Notes under Sous Chef and Executive Chef
  - Design decision: Decision 4 — update `docs/user-tier-feature-sets.md`
  - Validation approach: Manual review; CI markdown lint if configured

## Functional Requirements Mapping

- Requirement: `canUsePrivateRecipeNotes(tier)` returns `false` for anonymous, home-cook, prep-cook
  - Design element: `hasAtLeastTier({ tier }, 'sous-chef')` — ranks below sous-chef return false
  - Acceptance criteria reference: specs/tier-entitlements.md — false cases
  - Testability notes: Covered by `it.each` rows for each failing tier

- Requirement: Returns `true` for sous-chef and executive-chef
  - Design element: Same function; ranks at or above sous-chef return true
  - Acceptance criteria reference: specs/tier-entitlements.md — true cases
  - Testability notes: Covered by `it.each` rows for each passing tier

- Requirement: Returns `false` for `null` and `undefined`
  - Design element: `hasAtLeastTier` defaults unknown tier to `home-cook` which is below `sous-chef`
  - Acceptance criteria reference: specs/tier-entitlements.md — null/undefined cases
  - Testability notes: `null` and `undefined` as explicit `it.each` rows

- Requirement: Docs distinguish Private Recipe Notes from the public `note` field
  - Design element: Decision 4
  - Acceptance criteria reference: specs/docs-update.md
  - Testability notes: Human review during PR

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: No new runtime dependencies; zero bundle-size impact
  - Design element: Reuses existing `hasAtLeastTier` import already in the file
  - Acceptance criteria reference: n/a
  - Testability notes: Build output diff should show only the new function bytes

- Requirement category: reliability
  - Requirement: Consistent behavior with other entitlement helpers under the same inputs
  - Design element: Identical implementation pattern to `canCreatePrivate`
  - Acceptance criteria reference: specs/tier-entitlements.md
  - Testability notes: Side-by-side test structure makes divergence visible

## Risks / Trade-offs

- Risk/trade-off: `canCreatePrivate` and `canUsePrivateRecipeNotes` share the same threshold today
  - Impact: A reader may conflate them or assume they will always stay in sync
  - Mitigation: Both are distinct named exports; the docs clarify they are separate features. The shared threshold is coincidental.

## Rollback / Mitigation

- Rollback trigger: If the helper ships with the wrong threshold or breaks existing tests
- Rollback steps: Revert the single-function addition and the test block; the docs change is safe to revert independently
- Data migration considerations: None — pure library code, no persisted data
- Verification after rollback: `npx vitest run src/lib/__tests__/tier-entitlements.test.ts` must pass green

## Operational Blocking Policy

- If CI checks fail: Fix before merging; do not bypass with `--no-verify`
- If security checks fail: Investigate; this change introduces no new dependencies so a failure would indicate a pre-existing issue
- If required reviews are blocked/stale: Re-request review after 24h; escalate to repo maintainer after 48h
- Escalation path and timeout: Tag repo owner in PR if blocked beyond 48h

## Open Questions

No open questions. All decisions are fully resolved by the existing codebase patterns and the issue specification.
