---
name: tests
description: Tests for extend-user-tiers-and-admin-flag
---

# Tests

## Overview

Test plan for the `extend-user-tiers-and-admin-flag` change. All work follows strict TDD: write a failing test, implement to pass it, then refactor.

Test files to create/modify:
- `src/types/__tests__/user.test.ts` — new
- `src/lib/__tests__/auth-guard.test.ts` — extend existing
- `src/lib/__tests__/auth-config.test.ts` — extend existing (additionalFields)
- `src/server/trpc/__tests__/init.test.ts` — new (or extend)
- `src/server/trpc/routers/__tests__/users.test.ts` — extend existing

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** before any implementation code. Run and confirm it fails.
2. **Implement** the simplest code to make it pass.
3. **Refactor** for clarity without breaking tests.

---

## Test Cases

### Task 1 — User tier type module (`src/types/__tests__/user.test.ts`)

**Spec:** `specs/user-tier-model.md`

- [ ] `TIER_RANK['home-cook'] === 0`
- [ ] `TIER_RANK['prep-cook'] === 1`
- [ ] `TIER_RANK['sous-chef'] === 2`
- [ ] `TIER_RANK['executive-chef'] === 3`
- [ ] `hasAtLeastTier({ tier: 'sous-chef', isAdmin: false }, 'sous-chef')` → `true` (exact match)
- [ ] `hasAtLeastTier({ tier: 'executive-chef', isAdmin: false }, 'prep-cook')` → `true` (higher tier)
- [ ] `hasAtLeastTier({ tier: 'home-cook', isAdmin: false }, 'sous-chef')` → `false` (insufficient)
- [ ] `hasAtLeastTier({ tier: 'home-cook', isAdmin: false }, 'home-cook')` → `true` (home-cook meets home-cook)
- [ ] `hasAtLeastTier({ tier: 'home-cook', isAdmin: true }, 'executive-chef')` → `true` (admin bypass)
- [ ] `hasAtLeastTier({ tier: undefined, isAdmin: false }, 'home-cook')` → `true` (undefined treated as home-cook, passes home-cook)
- [ ] `hasAtLeastTier({ tier: undefined, isAdmin: false }, 'prep-cook')` → `false` (undefined treated as home-cook, fails elevated)
- [ ] `hasAtLeastTier({ tier: undefined, isAdmin: false }, 'sous-chef')` → does not throw

---

### Task 2 — Better-Auth additionalFields (`src/lib/__tests__/auth-config.test.ts`)

**Spec:** `specs/auth-integration.md`

- [ ] `auth` config object includes `user.additionalFields.tier` with `type: 'string'` and `defaultValue: 'home-cook'`
- [ ] `auth` config object includes `user.additionalFields.isAdmin` with `type: 'boolean'` and `defaultValue: false`
- [ ] Existing config keys (emailAndPassword, session, plugins) are all still present
- [ ] TypeScript compiles `ctx.user.tier` as `string` (or `UserTier`) without type assertion errors — verified via `tsc --noEmit`

---

### Task 3 — Route guards (`src/lib/__tests__/auth-guard.test.ts`)

**Spec:** `specs/route-guards.md`

`requireTier`:
- [ ] User with `tier: 'executive-chef'`, `isAdmin: false`, required `'sous-chef'` → no redirect (returns `undefined`)
- [ ] User with `tier: 'prep-cook'`, `isAdmin: false`, required `'prep-cook'` → no redirect (exact match passes)
- [ ] User with `tier: 'prep-cook'`, `isAdmin: false`, required `'sous-chef'` → throws redirect to `/account` with `reason: 'tier-limit-reached'`
- [ ] User with `tier: 'home-cook'`, `isAdmin: true`, required `'executive-chef'` → no redirect (admin bypass)
- [ ] User with `tier: undefined`, `isAdmin: false`, required `'prep-cook'` → throws redirect (undefined treated as home-cook)
- [ ] User with `tier: undefined`, `isAdmin: false`, required `'home-cook'` → no redirect (home-cook meets home-cook)
- [ ] No session → guard does not throw `tier-limit-reached` (unauthenticated path is handled by `requireAuth`, not `requireTier`)

`requireAdmin`:
- [ ] User with `isAdmin: true` → no redirect
- [ ] User with `isAdmin: false` → throws redirect to `/account` with `reason: 'tier-limit-reached'`

Existing `requireAuth` regression:
- [ ] `requireAuth` with no session still redirects to `/auth/login` with `reason: 'auth-required'`
- [ ] `requireAuth` with valid session still proceeds without redirect

---

### Task 4 — tRPC procedure guards (`src/server/trpc/__tests__/init.test.ts`)

**Spec:** `specs/trpc-procedures.md`

`tierProcedure`:
- [ ] Authenticated user with `tier: 'executive-chef'`, required `'sous-chef'` → procedure body executes, result returned
- [ ] Authenticated user with `tier: 'home-cook'`, required `'sous-chef'` → throws `TRPCError` with code `'FORBIDDEN'`
- [ ] Authenticated user with `tier: 'home-cook'`, `isAdmin: true`, required `'executive-chef'` → procedure body executes
- [ ] Unauthenticated call with required `'prep-cook'` → throws `TRPCError` with code `'UNAUTHORIZED'` (not `'FORBIDDEN'`)
- [ ] Authenticated user with `tier: undefined`, required `'prep-cook'` → throws `TRPCError` with code `'FORBIDDEN'`

`adminProcedure`:
- [ ] User with `isAdmin: true` → procedure body executes
- [ ] User with `isAdmin: false` → throws `TRPCError` with code `'FORBIDDEN'`

`UserDocument` interface + `transformUserDoc` (`src/server/trpc/routers/__tests__/users.test.ts`):
- [ ] `transformUserDoc` with document containing `tier: 'sous-chef'` returns object with `tier: 'sous-chef'`
- [ ] `transformUserDoc` with document containing `isAdmin: false` returns object with `isAdmin: false`
- [ ] `transformUserDoc` with document missing `tier` field returns without throwing; `tier` is `undefined` or `'home-cook'`

---

### Task 5 — Migration script (manual integration test)

**Spec:** `specs/migration.md`

These are verified manually against a test/dev MongoDB instance, not via Vitest:

- [ ] Script runs to completion with exit code 0 when MongoDB is reachable
- [ ] After first run: both user documents have `tier: 'executive-chef'` and `isAdmin: false`
- [ ] After first run: `doug@dougis.com` document has `isAdmin: true`
- [ ] Second run: shows `0` documents updated for tier (idempotency)
- [ ] Second run: `doug@dougis.com` still has `isAdmin: true`
- [ ] Output log includes: count of tier-updated documents, admin flag confirmation, success message
- [ ] Script exits with non-zero code and error message when `MONGODB_URI` is unreachable

---

### Regression

- [ ] Existing auth E2E tests pass: `npm run test:e2e` (auth-session.spec.ts, cookbooks-auth.spec.ts, recipes-auth.spec.ts)
- [ ] Full test suite passes: `npm run test`
- [ ] Build succeeds: `npm run build`
