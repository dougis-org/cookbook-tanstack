## GitHub Issues

- dougis-org/cookbook-tanstack#282

## Why

- **Problem statement:** The application has a single flat user type. There is no way to differentiate between free users, paid/upgraded users, or administrators. Features requiring gating by capability tier cannot be built without this foundation.
- **Why now:** Issue #282 identifies this as the prerequisite for all tier-gated features. The auth layer (Better-Auth) and route guard stubs (`requireTier`, `tier-limit-reached`) are already in place, making this the right moment to close the gap.
- **Business/user impact:** Enables the product to offer differentiated feature sets across four culinary-themed tiers. Enables internal administration via the `isAdmin` flag without requiring a full admin UI yet.

## Problem Space

- **Current behavior:** All authenticated users are equivalent — no tier, no admin flag. The `user` collection in MongoDB contains only Better-Auth default fields. The `requireTier()` guard in `auth-guard.ts` is a stub with no enforcement.
- **Desired behavior:** Every user document carries a `tier` field (defaulting to `'home-cook'`) and an `isAdmin` boolean (defaulting to `false`). The session exposes these fields. Route guards and tRPC procedures can enforce tier requirements. Existing users are migrated to `'executive-chef'`. The `doug@dougis.com` account is flagged as admin.
- **Constraints:**
  - Better-Auth manages the `user` collection — changes must go through its `additionalFields` API, not a Mongoose model.
  - No admin UI or tier-change endpoints are in scope; the migration script is the only write path for this change.
  - TypeScript strict mode is enforced; all new types must satisfy `noUnusedLocals` and `noUnusedParameters`.
- **Assumptions:**
  - Better-Auth 1.x `additionalFields` types flow through `auth.api.getSession()` automatically, making `ctx.user.tier` and `ctx.user.isAdmin` type-safe without changes to `context.ts`.
  - Existing users without a `tier` field should be treated as `'home-cook'` at runtime until the migration script is run.
  - `isAdmin: true` bypasses tier checks entirely (admins always pass `requireTier`).
- **Edge cases considered:**
  - Users created before migration run: `tier` will be `undefined` in the document; code must handle this as `'home-cook'`.
  - Migration is idempotent — safe to re-run.
  - `requireTier` uses "at least this tier" semantics, not exact match.

## Scope

### In Scope

- `UserTier` string union type and `TIER_RANK` ordinal map in `src/types/user.ts`
- `hasAtLeastTier(user, requiredTier)` helper (admins always pass)
- Better-Auth `additionalFields` config for `tier` and `isAdmin` in `src/lib/auth.ts`
- Auth client update for type-safe `useSession()` exposure of `tier` and `isAdmin`
- `requireTier(tier)` route guard implementation in `src/lib/auth-guard.ts`
- `requireAdmin()` route guard stub in `src/lib/auth-guard.ts`
- `tierProcedure(tier)` tRPC helper in `src/server/trpc/init.ts`
- `adminProcedure` tRPC helper stub in `src/server/trpc/init.ts`
- `UserDocument` interface update in `src/server/trpc/routers/users.ts`
- Migration script `scripts/migrate-user-tiers.ts` with `npm run db:migrate-tiers`

### Out of Scope

- Admin UI for managing user tiers (#330)
- tRPC endpoints for changing user tier (#331)
- Subscription/payment integration (#332)
- Email notifications for tier changes (#333)
- Feature gate matrix defining what each tier unlocks (#334)
- Any UI surfacing tier information to the end user

## What Changes

- **New file:** `src/types/user.ts` — `UserTier`, `TIER_RANK`, `hasAtLeastTier`
- **Modified:** `src/lib/auth.ts` — add `user.additionalFields` for `tier` and `isAdmin`
- **Modified:** `src/lib/auth-client.ts` — declare `tier` and `isAdmin` for client-side type safety
- **Modified:** `src/lib/auth-guard.ts` — implement `requireTier()`, add `requireAdmin()` stub
- **Modified:** `src/server/trpc/init.ts` — add `tierProcedure()` and `adminProcedure` stub
- **Modified:** `src/server/trpc/routers/users.ts` — extend `UserDocument` with `tier` and `isAdmin`
- **New file:** `scripts/migrate-user-tiers.ts` — one-time migration, idempotent
- **Modified:** `package.json` — add `db:migrate-tiers` script

## Risks

- **Risk:** Better-Auth `additionalFields` TypeScript inference may not flow through `getSession()` automatically.
  - **Impact:** `ctx.user.tier` would be `unknown` or missing, breaking type-safe enforcement.
  - **Mitigation:** Verify types in a focused spike during implementation; add explicit type assertions in `context.ts` if needed.

- **Risk:** Existing users hit tier-gated routes before the migration script is run.
  - **Impact:** They would be treated as `'home-cook'` and denied access to features they should have.
  - **Mitigation:** Migration script is documented as required post-deploy step; `hasAtLeastTier` treats `undefined` tier as `'home-cook'` explicitly.

- **Risk:** Migration script accidentally overwrites a manually-set tier in future.
  - **Impact:** Data loss if run after tier-change endpoints are live.
  - **Mitigation:** Script uses `$set` only where field is missing (use `$setOnInsert` or check for existence). Add a `--force` flag for intentional overwrites. Document this constraint clearly.

## Open Questions

No unresolved ambiguity remains. All decisions from the explore session are captured:
- Tier model: Option C (string enum + `TIER_RANK` map) ✓
- Semantics: "at least this tier" with admin bypass ✓
- Existing users: migrate to `'executive-chef'` ✓
- Admin flag: `doug@dougis.com` set to `isAdmin: true` ✓
- Enforcement: both route level (`beforeLoad`) and tRPC procedure level ✓

## Non-Goals

- This change does not define what features are gated at each tier (see spike #334)
- This change does not build any user-facing UI for tiers
- This change does not establish a payment or subscription mechanism
- This change does not implement the full admin management framework

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
