## GitHub Issues

- #411

## Why

- **Problem statement**: The admin panel's tier change confirmation dialog shows no warning about content impact when downgrading a user's tier. Admins may not realize that downgrading will make private content public and hide excess content.
- **Why now**: Issue #392 defines downgrade behavior for user content. Issue #409 implements the reconciliation side effects. Issue #411 is the final piece — showing the admin a warning before the downgrade is applied.
- **Business/user impact**: Protects admin awareness; prevents accidental downgrades with unintended content exposure.

## Problem Space

- **Current behavior**: Confirmation dialog at `src/routes/admin/users.tsx` only displays "Change user@example.com from Home Cook to Prep Cook?" No content impact warning.
- **Desired behavior**: When downgrading (TIER_RANK decreases), show a static warning: "⚠️ This will make all private recipes and cookbooks public, and hide any content over the new tier's limit. Your oldest content is preserved first."
- **Constraints**:
  - Must not block the confirmation flow
  - Warning must not require additional API calls (static text acceptable per issue)
  - Must work with existing `TIER_RANK` from `@/types/user`
- **Assumptions**:
  - TIER_RANK order is the correct signal for downgrade detection
  - Static warning is acceptable for v1 (dynamic counts via #409 return values are future work)
- **Edge cases considered**:
  - Same tier selected → no pending change, no modal
  - Upgrade (TIER_RANK increases) → no warning shown
  - Admin downgrading themselves → prevented at `admin.setTier` server-side (already handled)
  - User with no content → warning still shown (text is static, no counts)

## Scope

### In Scope

- Add downgrade warning to confirmation modal in `src/routes/admin/users.tsx`
- Compute `isDowngrade` using `TIER_RANK[fromTier] > TIER_RANK[toTier]`
- Conditional render of warning block when `isDowngrade === true`
- Unit tests for warning visibility on downgrade vs upgrade path

### Out of Scope

- Dynamic content counts in warning (deferred to follow-up work)
- Changes to `admin.setTier` backend
- Changes to `reconcileUserContent`
- Pre-check endpoint for content impact
- Post-change summary after tier change

## What Changes

1. **UI change** in `src/routes/admin/users.tsx`:
   - Import `TIER_RANK` from `@/types/user`
   - Add `isDowngrade` computation in modal render
   - Add warning `<div>` with amber styling, conditional on `isDowngrade`
2. **Tests** in `src/routes/admin/__tests__/users.test.tsx`:
   - Test: warning visible when selecting lower tier (e.g., home-cook → prep-cook)
   - Test: warning absent when selecting higher tier (e.g., prep-cook → sous-chef)

## Risks

- **Risk**: Warning text becomes inaccurate if tier behavior changes
  - **Impact**: Low — static text is generic enough to remain valid across tier changes
  - **Mitigation**: Document the dependency in code comment; test verifies warning renders on downgrade

## Open Questions

- **Question**: Is static warning acceptable for closing #411?
  - **Needed from**: User confirmation
  - **Blocker for apply**: No — issue explicitly endorses static text as first pass

## Non-Goals

- Implementing dynamic content counts before downgrade confirmation
- Modifying backend `admin.setTier` or reconciliation logic
- Adding pre-check endpoint for content impact preview
- Post-tier-change summary dialog

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.