## Context

- **Relevant architecture**: Admin panel at `src/routes/admin/users.tsx` implements tier change flow via `pending` state, `setTierMutation`, and a modal dialog.
- **Dependencies**:
  - `TIER_RANK` from `src/types/user.ts` — numeric tier ordering (home-cook=0, prep-cook=1, sous-chef=2, executive-chef=3)
  - `canCreatePrivate` from `src/lib/tier-entitlements.ts` — determines if tier can have private content
  - Existing `reconcileUserContent` in `src/lib/reconcile-user-content.ts` — runs after `setTier` mutation
- **Interfaces/contracts touched**:
  - `PendingChange` interface (unchanged — just consumes its fields)
  - Modal JSX render (adds conditional warning block)

## Goals / Non-Goals

### Goals

- Show static warning in downgrade confirmation modal
- Use `TIER_RANK` to detect downgrade direction
- Keep confirmation flow functional (warning is additive, not blocking)
- Cover with unit tests for downgrade vs upgrade paths

### Non-Goals

- Dynamic content counts in warning
- New API endpoints for pre-check
- Modifying backend reconciliation logic
- Changes to `admin.setTier` mutation

## Decisions

### Decision 1: Use `TIER_RANK` comparison to detect downgrade

- **Chosen**: `isDowngrade = TIER_RANK[fromTier] > TIER_RANK[toTier]`
- **Alternatives considered**:
  - `canCreatePrivate` check — only signals when content visibility changes, not all downgrades
  - Hardcoded tier string comparison — fragile, harder to maintain
- **Rationale**: `TIER_RANK` is already in use for tier comparisons (`reconcileUserContent` uses it). Numeric comparison is clear and deterministic.
- **Trade-offs**: Only detects rank-based direction; doesn't distinguish "content-affecting downgrade" vs "limit-only downgrade". Acceptable for v1.

### Decision 2: Static warning text

- **Chosen**: Hardcoded message without dynamic counts
- **Alternatives considered**:
  - Query `usage.getOwned` before dialog — adds latency, requires new endpoint for admin viewing other user's data
  - Post-change summary using `reconcileUserContent` return — different UX (after vs before)
- **Rationale**: Issue #411 explicitly endorses static text as acceptable first pass. No additional network requests or endpoint changes.
- **Trade-offs**: Generic message doesn't reflect actual content state. Follow-up work (Issue #409 follow-on) could add dynamic counts later.

### Decision 3: Warning placement and styling

- **Chosen**: Amber-tinted block inside modal, between the tier-change text and the action buttons
- **Alternatives considered**:
  - Inline with the tier description paragraph — less scannable
  - Red/error styling — too alarming, downgrade is confirmable but not catastrophic
- **Rationale**: Amber/yellow conveys "caution" not "error", matches typical warning semantics. Placement before buttons gives visibility before action commitment.

## Proposal to Design Mapping

| Proposal Element | Design Decision | Validation |
|-----------------|-----------------|------------|
| Add downgrade warning to modal | Conditional render via `isDowngrade` computed from `TIER_RANK` comparison | Unit test |
| Static warning text | Hardcoded message matching issue spec language | Visual verification |
| TIER_RANK for downgrade detection | Decision 1 above | Unit test covering both upgrade and downgrade paths |
| No additional API calls | No new endpoints, no `usage.getOwned` calls | Test suite passes without network calls |

## Functional Requirements Mapping

- **Requirement**: Downgrade confirmation shows warning (static or dynamic)
  - **Design element**: `isDowngrade` computed in modal render, warning block conditional
  - **Acceptance criteria reference**: #411 acceptance criteria
  - **Testability notes**: Test that warning renders when selecting lower tier; test that warning does not render when selecting higher tier

- **Requirement**: Warning matches intent of spec message
  - **Design element**: Static message text per issue spec
  - **Acceptance criteria reference**: #411 acceptance criteria
  - **Testability notes**: Verify exact text content of warning element

- **Requirement**: Confirmation remains functional after adding warning
  - **Design element**: Warning is additive, buttons unchanged, `handleConfirm`/`handleCancel` unchanged
  - **Acceptance criteria reference**: #411 acceptance criteria
  - **Testability notes**: Existing "Confirm calls setTier" and "Cancel closes modal" tests remain passing

## Non-Functional Requirements Mapping

- **Requirement category**: performance
  - **Requirement**: No additional network requests
  - **Design element**: Static warning, no `usage.getOwned` or pre-check endpoint
  - **Acceptance criteria reference**: N/A
  - **Testability notes**: No network spy/mock needed in tests

- **Requirement category**: maintainability
  - **Requirement**: Easy to update warning text if tier behavior changes
  - **Design element**: Single const string in component; no external config
  - **Acceptance criteria reference**: N/A
  - **Testability notes**: Text change verifiable via single test update

## Risks / Trade-offs

- **Risk**: Warning text becomes stale if tier behavior changes
  - **Impact**: Low — static text is generic; code comment documents the relationship
  - **Mitigation**: Test coverage ensures warning renders when expected; text review on tier changes

- **Risk**: Static warning doesn't reflect actual content counts
  - **Impact**: Low — issue explicitly accepts static as v1; dynamic counts are follow-on
  - **Mitigation**: Document limitation in `tasks.md` as potential follow-on work

- **Trade-off**: Adding UI without backend changes
  - **Rationale**: Separates concerns; UI warning independent of reconciliation implementation
  - **Impact**: Positive — simpler review, faster to ship

## Rollback / Mitigation

- **Rollback trigger**: Tests fail after merge, or visual regression reported
- **Rollback steps**: Revert changes to `src/routes/admin/users.tsx` and `src/routes/admin/__tests__/users.test.tsx`; remove warning block
- **Data migration considerations**: None — UI-only change
- **Verification after rollback**: Existing test suite passes; modal renders without warning

## Operational Blocking Policy

- **If CI checks fail**: Block merge until unit tests pass
- **If security checks fail**: N/A — no security-sensitive changes
- **If required reviews are blocked/stale**: Follow repo's PR merge policy (auto-merge if checks pass + no unresolved comments)
- **Escalation path and timeout**: N/A for this change — small UI addition with existing patterns

## Open Questions

- None — issue #411 provides clear scope and the static warning path is explicitly endorsed