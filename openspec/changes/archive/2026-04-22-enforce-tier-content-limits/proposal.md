## GitHub Issues

- #388
- #387 (prerequisite — completed)

## Why

- Problem statement: `recipes.create` and `cookbooks.create` tRPC mutations accept any authenticated request without checking the user's tier content limits, so any user can create unlimited recipes and cookbooks regardless of their subscription tier.
- Why now: The tier entitlements module (#387) shipped and provides `TIER_LIMITS` constants. Server-side enforcement is the immediate next step in the tier rollout.
- Business/user impact: Without enforcement, paid tier limits are bypassable by any authenticated user. Enforcing limits server-side is required before exposing upgrade prompts to users.

## Problem Space

- Current behavior: `recipes.create` and `cookbooks.create` save documents with no count check. Any user with a valid session can create unlimited content.
- Desired behavior: Before saving, each mutation counts the user's active (non-deleted, non-hidden) documents, compares against the tier limit, and throws `FORBIDDEN` if at or over limit. Admins bypass all limits.
- Constraints:
  - Race condition tolerance: one over-limit document is acceptable; no transactions or distributed locks required.
  - `hiddenByTier: true` documents must not count against the active limit (they are suppressed by downgrade logic, not the user's active content).
  - The `home-cook` tier is the default for users with no tier set.
- Assumptions:
  - `ctx.user.tier` is `null | undefined` for users who have not been through the migration; defaulting to `home-cook` is safe and conservative.
  - `ctx.user.isAdmin` is `false` by default; a missing field should be treated as `false`.
  - Recipe soft-delete middleware already excludes `deleted: true` from `countDocuments` — no additional handling needed.
  - Cookbooks are not soft-deleted; no equivalent middleware needed.
- Edge cases considered:
  - User at exact limit → FORBIDDEN (not over-limit+1)
  - User with `hiddenByTier: true` documents that push stored count over limit → active count excludes hidden docs, so not blocked
  - Admin with tier below limit → admin bypass takes precedence

## Scope

### In Scope

- Add `hiddenByTier: Boolean` (default `false`) to `Recipe` and `Cookbook` Mongoose models and TypeScript interfaces
- Add `enforceContentLimit` helper to `src/server/trpc/routers/_helpers.ts`
- Enforce limit in `recipes.create` and `cookbooks.create` mutations
- Include `hiddenByTier` in response payloads for `recipes.list`, `recipes.get`, `cookbooks.list`, `cookbooks.get` (so UI can render greyed-out state in #392)
- Migration script `scripts/migrate-hidden-by-tier.ts` — idempotent backfill of `hiddenByTier: false` on existing Recipe and Cookbook documents
- Add `db:migrate-hidden-by-tier` npm script
- Refactor `makeAuthCaller` in `src/server/trpc/routers/__tests__/test-helpers.ts` to accept `{ email?, tier?, isAdmin? }` options object; delete the duplicate local definition in `recipes.test.ts`
- Tests for all enforcement paths

### Out of Scope

- UI for showing greyed-out hidden content (tracked in #392)
- Downgrade logic that sets `hiddenByTier: true` on excess documents (tracked in #392)
- Enforcement in any mutation other than `recipes.create` and `cookbooks.create`
- Frontend limit-check feedback (upgrade prompts, error toasts)

## What Changes

- `src/db/models/recipe.ts` — add `hiddenByTier` to `IRecipe` interface and schema
- `src/db/models/cookbook.ts` — add `hiddenByTier` to `ICookbook` interface and schema
- `src/server/trpc/routers/_helpers.ts` — add `enforceContentLimit(userId, tier, isAdmin, resource)`
- `src/server/trpc/routers/recipes.ts` — call `enforceContentLimit` in `create` mutation; include `hiddenByTier` in list/get responses
- `src/server/trpc/routers/cookbooks.ts` — call `enforceContentLimit` in `create` mutation; include `hiddenByTier` in list/get responses
- `src/server/trpc/routers/__tests__/test-helpers.ts` — refactor `makeAuthCaller` signature
- `src/server/trpc/routers/__tests__/recipes.test.ts` — remove local `makeAuthCaller`, import shared, add tier enforcement tests
- `src/server/trpc/routers/__tests__/cookbooks.test.ts` — add tier enforcement tests
- `scripts/migrate-hidden-by-tier.ts` — new migration script
- `package.json` — add `db:migrate-hidden-by-tier` script

## Risks

- Risk: `countDocuments` with soft-delete middleware on Recipe auto-injects `deleted: { $ne: true }`. If this middleware changes, counts may become inconsistent.
  - Impact: Low — middleware is well-tested and stable.
  - Mitigation: Document the dependency in `enforceContentLimit` with a comment.
- Risk: Defaulting missing `tier` to `home-cook` at enforcement time rather than at context creation means the default is applied in two places if context ever normalizes tier.
  - Impact: Low for now — context does not normalize tier.
  - Mitigation: Apply default in `enforceContentLimit` and add a comment to that effect.
- Risk: Race condition — two concurrent creates near the limit could both pass the count check.
  - Impact: Accepted per issue spec. One over-limit document is tolerable.
  - Mitigation: None required.

## Open Questions

No unresolved ambiguity. All design decisions confirmed during exploration:
- Shared helper (Option B) confirmed.
- `hiddenByTier` excluded from count but included in response payload confirmed.
- Migration in `scripts/` following `migrate-user-tiers.ts` pattern confirmed.
- `makeAuthCaller` refactored to options object, recipes.test.ts local definition deleted.

## Non-Goals

- Enforcing limits on content edits or visibility changes
- Enforcing limits at the database layer (indexes, triggers)
- Real-time limit tracking or quota dashboards
- Automatic upgrade prompts (UI concern)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
