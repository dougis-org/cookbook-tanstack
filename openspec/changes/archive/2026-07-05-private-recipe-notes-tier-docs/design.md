## Context

- Relevant architecture: Tier entitlements are centralized in `src/lib/tier-entitlements.ts` via `CAPABILITY_TIERS` and `can()`. The pricing page iterates over all tiers and currently calls `canCreatePrivate(tier)` and `canImport(tier)` — named wrapper functions exported from the same module. The `useTierEntitlements` hook is a thin adapter over `can()` for client-side boolean access; it is not used on the pricing page (which needs per-tier comparison, not current-user state).
- Dependencies: `src/lib/tier-entitlements.ts` already exports `can()` and has `'privateRecipeNotes': 'sous-chef'` in `CAPABILITY_TIERS`. No new entitlement logic is needed.
- Interfaces/contracts touched: `src/routes/pricing.tsx` import surface (removes two named imports, adds one); `docs/user-tier-feature-sets.md` narrative prose.

## Goals / Non-Goals

### Goals

- Pricing page tier cards accurately represent Private Recipe Notes as a differentiating feature
- Home Cook and Prep Cook documentation sections explicitly state private recipe notes are not included
- `pricing.tsx` uses the generic `can()` function instead of named wrappers, avoiding wrapper proliferation

### Non-Goals

- Modifying entitlement logic or tier assignments
- Touching server routers, the hook, emails, or reconcile — all correct and out of scope
- Removing `canCreatePrivate`/`canImport` wrapper exports (used broadly in server/email code)

## Decisions

### Decision 1: Use `can()` directly in pricing.tsx rather than adding a wrapper

- Chosen: Import `can` from `tier-entitlements.ts` in `pricing.tsx`; replace `canCreatePrivate(tier)` → `can('createPrivate', tier)`, `canImport(tier)` → `can('import', tier)`, and add `can('privateRecipeNotes', tier)`.
- Alternatives considered: Add a `canUsePrivateNotes(tier)` wrapper function alongside existing ones.
- Rationale: `pricing.tsx` is the only non-server, non-hook caller of these wrapper functions. Its role is building a per-tier comparison table — a generic, data-driven use case. Using `can()` inline is more natural here and avoids growing the wrapper API for a UI table. The wrapper functions remain in place for server routers where named semantic functions aid readability at enforcement checkpoints.
- Trade-offs: Minor inconsistency between `pricing.tsx` (uses `can()`) and server routers (use wrappers), but these are genuinely different contexts with different readability needs.

### Decision 2: Prose additions to doc sections, not table changes

- Chosen: Add one sentence to each of the Home Cook and Prep Cook narrative sections in `docs/user-tier-feature-sets.md`. Do not modify the feature matrix table (already correct at line 42).
- Alternatives considered: Also update the table row labels or add a new summary section.
- Rationale: The feature matrix already shows No/No/No/Yes/Yes for Private Recipe Notes. The gap is only in the narrative prose that lists explicit exclusions per tier. Minimal, targeted change.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: Home Cook section missing private notes exclusion
  - Design decision: Decision 2 — prose addition
  - Validation approach: Read the updated section and confirm the sentence is present
- Proposal element: Prep Cook section missing private notes exclusion
  - Design decision: Decision 2 — prose addition
  - Validation approach: Read the updated section and confirm the sentence is present
- Proposal element: Pricing page missing Private Recipe Notes row
  - Design decision: Decision 1 — use `can()`, add JSX row
  - Validation approach: Visual check of tier cards; TypeScript compilation
- Proposal element: Avoid wrapper proliferation
  - Design decision: Decision 1 — `can()` in pricing.tsx
  - Validation approach: Confirm no new wrapper function added to `tier-entitlements.ts`

## Functional Requirements Mapping

- Requirement: Home Cook section explicitly states private recipe notes are not included
  - Design element: One sentence added to `docs/user-tier-feature-sets.md` Home Cook section
  - Acceptance criteria reference: Issue #500 AC item 2
  - Testability notes: Content review; no automated test needed (documentation)
- Requirement: Prep Cook section explicitly states private recipe notes are not included
  - Design element: One sentence added to `docs/user-tier-feature-sets.md` Prep Cook section
  - Acceptance criteria reference: Issue #500 AC item 2
  - Testability notes: Content review; no automated test needed (documentation)
- Requirement: Pricing page shows Private Recipe Notes row per tier card
  - Design element: New `<p>` JSX element using `can('privateRecipeNotes', tier)`
  - Acceptance criteria reference: Issue #500 AC item 3
  - Testability notes: Existing pricing page tests should assert on tier card feature rows; a new assertion for the private notes row confirms presence
- Requirement: No tier limits change
  - Design element: No changes to `CAPABILITY_TIERS`, `TIER_LIMITS`, or any router
  - Acceptance criteria reference: Issue #500 AC item 4
  - Testability notes: Confirmed by scope — no entitlement files modified

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: TypeScript compilation must not regress
  - Design element: `can()` is typed as `(capability: keyof typeof CAPABILITY_TIERS, tier: string | null | undefined) => boolean` — all three capability keys are valid
  - Acceptance criteria reference: CI type-check pass
  - Testability notes: `npm run build` or `tsc --noEmit`

## Risks / Trade-offs

- Risk/trade-off: Visual layout change on pricing page if new row causes unexpected wrapping
  - Impact: Low — identical `<p>` element pattern already used for three existing rows
  - Mitigation: Manual visual check across all five tier cards after implementation

## Rollback / Mitigation

- Rollback trigger: CI failure or visual regression on pricing page
- Rollback steps: Revert the two changed files (`docs/user-tier-feature-sets.md`, `src/routes/pricing.tsx`) to their pre-change state via `git revert`
- Data migration considerations: None — documentation and UI copy only
- Verification after rollback: Confirm pricing page renders as before; confirm doc sections match pre-change content

## Operational Blocking Policy

- If CI checks fail: Fix the failure before merging — this change is small enough that no CI bypass is justified
- If security checks fail: Not applicable (documentation + read-only UI change, no new data flow)
- If required reviews are blocked/stale: Re-request review after 24 hours; escalate to repo owner if still blocked after 48 hours
- Escalation path and timeout: Tag `dougis` in the PR if blocked beyond 48 hours

## Open Questions

No open questions. All design decisions were resolved during exploration prior to proposal creation.
