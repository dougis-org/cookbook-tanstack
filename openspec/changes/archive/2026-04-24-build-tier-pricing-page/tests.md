---
name: tests
description: Tests for the build-tier-pricing-page change
---

# Tests

## Overview

All work follows strict TDD. Write failing test → implement → refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** before any implementation code
2. **Write the simplest code** to make it pass
3. **Refactor** while keeping tests green

## Test Cases

### Task 1 — `TIER_DESCRIPTIONS` in entitlement module

File: `src/lib/__tests__/tier-entitlements.test.ts`

- [ ] All `EntitlementTier` keys (`anonymous`, `home-cook`, `prep-cook`, `sous-chef`, `executive-chef`) exist in `TIER_DESCRIPTIONS`
- [ ] Each description is a non-empty string
- [ ] `TIER_DESCRIPTIONS` is importable from `@/lib/tier-entitlements`

Spec ref: `specs/pricing-page.md` — Requirement: Tier description copy

---

### Task 2 — `countUserContent` shared helper

File: `src/server/trpc/routers/__tests__/helpers.test.ts`

- [ ] Returns `{ recipeCount: N, cookbookCount: M }` for user with known seeded data
- [ ] Excludes recipes where `hiddenByTier: true` from `recipeCount`
- [ ] Excludes cookbooks where `hiddenByTier: true` from `cookbookCount`
- [ ] Returns `{ recipeCount: 0, cookbookCount: 0 }` for user with no documents
- [ ] Existing `enforceContentLimit` tests still pass after refactor

Spec ref: `specs/usage-router.md` — Requirement: count predicate matches `enforceContentLimit`

---

### Task 3 — `usage.getOwned` tRPC procedure

File: `src/server/trpc/routers/__tests__/usage.test.ts`

- [ ] Returns `{ recipeCount: N, cookbookCount: M }` for authenticated user
- [ ] `recipeCount` excludes documents with `hiddenByTier: true`
- [ ] `cookbookCount` excludes documents with `hiddenByTier: true`
- [ ] Returns `{ recipeCount: 0, cookbookCount: 0 }` for user with no content
- [ ] Throws `UNAUTHORIZED` when called without a session
- [ ] TypeScript: `trpc.usage.getOwned` resolves to `{ recipeCount: number, cookbookCount: number }` (type check via `npx tsc --noEmit`)

Spec ref: `specs/usage-router.md` — Requirement: `usage.getOwned` returns authenticated user's counts

---

### Task 4 — `/upgrade` stub route

File: `src/routes/__tests__/-upgrade.test.tsx` (or inline type check)

- [ ] Route file `src/routes/upgrade.tsx` exists and exports `Route` + `UpgradePage`
- [ ] Renders without runtime error (`npx tsc --noEmit` passes)
- [ ] Contains a `<Link to="/pricing">` element

Spec ref: `specs/upgrade-stub.md` — Requirement: stub renders, links back to `/pricing`

---

### Task 5 — `/pricing` route

File: `src/routes/__tests__/-pricing.test.tsx`

- [ ] All 5 tier names rendered (Anonymous, Home Cook, Prep Cook, Sous Chef, Executive Chef)
- [ ] Recipe limits match `TIER_LIMITS` for each tier (0, 10, 100, 500, 2500)
- [ ] Cookbook limits match `TIER_LIMITS` for each tier (0, 1, 10, 25, 200)
- [ ] Anonymous session: no tier card has a "current" highlight class/indicator
- [ ] Anonymous session: two `AdSlot` elements present (above and below cards)
- [ ] Home Cook session: home-cook card highlighted; two `AdSlot` elements present
- [ ] Sous Chef session: sous-chef card highlighted; zero `AdSlot` elements present
- [ ] Executive Chef card renders no upgrade CTA link
- [ ] Home Cook, Prep Cook, Sous Chef cards render a CTA linking to `/upgrade`
- [ ] Anonymous visitor: non-anonymous tier cards include a CTA linking to `/auth/sign-up` (sign-up path)
- [ ] Tier descriptions visible and non-empty on each card
- [ ] `session.user.tier = undefined`: no card highlighted, no crash

Spec ref: `specs/pricing-page.md` — all requirements

---

### Task 6 — Account page tier section

File: `src/routes/__tests__/-account.test.tsx`

- [ ] Home Cook session: tier name "Home Cook" visible
- [ ] Tier description visible (non-empty)
- [ ] Recipe progress renders "X of 10" for home-cook (mocked `usage.getOwned` response)
- [ ] Cookbook progress renders "X of 1" for home-cook
- [ ] Next-tier preview (Prep Cook) visible for Home Cook
- [ ] Sous Chef session: next-tier preview shows Executive Chef limits
- [ ] Executive Chef session: no next-tier preview section rendered
- [ ] All tiers: link to `/pricing` present
- [ ] "coming soon" stub text absent
- [ ] Loading state: skeleton/spinner visible while `usage.getOwned` is pending
- [ ] Error state: graceful message when `usage.getOwned` returns error; no crash
- [ ] Recipe and cookbook limits in progress bars sourced from `TIER_LIMITS` (not hardcoded)

Spec ref: `specs/account-tier-section.md` — all requirements
