## GitHub Issues

- #409 (reconcileUserContent: downgrade coercion and upgrade restoration)
- #392 (parent — Add downgrade behavior: content visibility coercion and over-limit hiding)
- #411 (admin UI downgrade warning — consumes return counts for dynamic message)

## Why

- **Problem statement**: When a user's tier changes, their existing content may violate the new tier's rules (private visibility, count limits). The `reconcileUserContent` function does not exist yet — it must be implemented to handle tier-change side effects atomically.

- **Why now**: Issues #387, #388, #389, #390 (entitlements, limits, hiddenByTier schema) are all closed. The prerequisites are complete. The admin.setTier mutation can now be enhanced to call the reconciliation function. #411 (admin UI) is waiting on the return counts from this function.

- **Business/user impact**: Users downgrading lose access to excess content (oldest preserved). Private content becomes public on downgrade to public-only tiers. Users upgrading have hidden content restored automatically. Admins see accurate counts before confirming a downgrade.

## Problem Space

- **Current behavior**: `admin.setTier` updates the user's tier field but does not reconcile content. A user downgraded from `sous-chef` to `prep-cook` retains private recipes and cookbooks they can no longer create — and their visible content is not reined in to the new tier's limits.

- **Desired behavior**:
  - Upgrade: all user recipes and cookbooks get `hiddenByTier: false`
  - Downgrade to public-only tier: all private docs become public (`isPublic: true`)
  - Downgrade with over-limit content: oldest N by `createdAt ASC` stay visible, rest get `hiddenByTier: true`
  - `visibilityFilter()` in `_helpers.ts` must exclude `hiddenByTier: true` docs even for their owner (so hidden content is invisible to everyone, including the owner)

- **Constraints**:
  - Use MongoDB multi-document transactions via `mongoose.startSession().withTransaction()`
  - Partial failure rolls back all changes
  - Admin-triggered tier changes affect the user's content (no admin bypass in the reconciliation function itself)
  - Subscription webhook entry point is future work — design for it but don't implement it yet

- **Assumptions**:
  - `Recipe` and `Cookbook` models have `hiddenByTier` field with middleware auto-excluding soft-deleted docs
  - `TIER_RANK` and `TIER_LIMITS` are the source of truth for tier ranking and content limits
  - `canCreatePrivate(tier)` correctly reflects whether a tier can have private content
  - There is no Stripe/subscription infrastructure yet — the webhook entry point is greenfield

- **Edge cases considered**:
  - Same-tier change (no-op): `admin.setTier` already returns early if `currentTier === input.tier`
  - Downgrade to tier with same limits (e.g., `prep-cook → home-cook`): only count limits apply, no private→public coercion
  - Zero content: function completes successfully with all counts at 0
  - User with exactly N items (limit boundary): no items hidden, all counts 0 for hidden

## Scope

### In Scope

1. **`src/lib/reconcile-user-content.ts`** (new domain service)
   - `reconcileUserContent(userId, oldTier, newTier)` function
   - Upgrade: set `hiddenByTier: false` on all user recipes and cookbooks
   - Downgrade:
     - Private→public coercion when `!canCreatePrivate(newTier)`
     - Count limit enforcement (oldest N visible, rest `hiddenByTier: true`)
   - Returns `{ recipesUpdated, cookbooksUpdated, recipesHidden, cookbooksHidden, madePublic }`
   - Two separate transactions (one for recipes, one for cookbooks)
   - Mongoose session-based transactions with rollback on failure

2. **`src/server/trpc/routers/_helpers.ts`** (`visibilityFilter` fix)
   - Update filter to exclude `hiddenByTier: true` docs even for the owning user
   - Change from `{ $or: [{ isPublic: true }, { userId }] }` to include `hiddenByTier: { $ne: true }` in both branches

3. **`src/server/trpc/routers/admin.ts`** (`admin.setTier` mutation)
   - Call `reconcileUserContent` after tier is updated in the database
   - Pass `currentTier` (pre-change) and `input.tier` (post-change) to the function

4. **`src/lib/__tests__/reconcile-user-content.test.ts`** (new test file)
   - Test upgrade: all docs get `hiddenByTier: false`
   - Test downgrade coercion: private docs become public when new tier can't have private
   - Test downgrade limit: oldest N stay visible, rest hidden
   - Test downgrade both: coercion + limit together
   - Test transaction rollback on partial failure
   - Test visibilityFilter excludes owner-hidden docs

### Out of Scope

- Subscription webhook entry point (greenfield, separate effort)
- Any changes to the public-facing recipe/cookbook UI beyond visibility filtering
- Changes to tier entitlements logic (`canCreatePrivate`, `TIER_LIMITS`, etc.)
- Migration of existing content (handled by one-time migration script in `scripts/migrate-hidden-by-tier.ts`)

## What Changes

1. **New file**: `src/lib/reconcile-user-content.ts` — the core reconciliation service
2. **Modified file**: `src/server/trpc/routers/_helpers.ts` — `visibilityFilter()` updated to exclude owner-hidden docs
3. **Modified file**: `src/server/trpc/routers/admin.ts` — `admin.setTier` calls reconciliation after tier write
4. **New file**: `src/lib/__tests__/reconcile-user-content.test.ts` — unit tests for the reconciliation function

## Risks

- **Risk**: `visibilityFilter` change breaks existing queries that depend on owners seeing their own hidden docs
  - **Impact**: Users could lose access to content they expect to see (but should be hidden per spec)
  - **Mitigation**: The change is spec-required (#392 acceptance criteria). Test coverage in the new test file confirms expected behavior. The admin UI (#411) and subscription flow also depend on this semantics.
- **Risk**: Transaction failure leaves partial state
  - **Impact**: Some docs updated, some not — inconsistent user experience
  - **Mitigation**: `withTransaction` ensures atomicity. On failure, all changes roll back and error is propagated. Caller (admin mutation) returns error to admin.
- **Risk**: `hiddenByTier` docs accumulate over repeated tier changes (downgrade → upgrade → downgrade)
  - **Impact**: Docs repeatedly set/unset `hiddenByTier`, extra updates
  - **Mitigation**: Upgrade always sets `hiddenByTier: false` regardless of prior state. Idempotent writes minimize impact.

## Open Questions

- **Question**: Should `reconcileUserContent` be called inside the same transaction as the tier write in `admin.setTier`, or separately?
  - **Needed from**: Architecture decision
  - **Blocker for apply**: No — separate transactions is acceptable per user's confirmation (point 1)

## Non-Goals

- Implementing subscription webhook entry point (future work)
- Modifying the tier entitlement system (`TIER_LIMITS`, `canCreatePrivate` logic)
- Changing the soft-delete behavior for recipes/cookbooks
- UI changes beyond the visibility filter (covered separately by #411)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.