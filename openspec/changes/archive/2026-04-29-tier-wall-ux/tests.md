---
name: tests
description: Tests for the tier-wall-ux change
---

# Tests

## Overview

All work follows strict TDD: write a failing test, implement to pass it, then refactor.
Each test case maps to a task in `tasks.md` and an acceptance scenario in the relevant spec.

## Testing Steps

For each task:
1. **Write a failing test** before any implementation code. Run it, confirm it fails.
2. **Write the simplest code** to make it pass.
3. **Refactor** while keeping tests green.

---

## Test Cases

### Task 1 — AppErrorCause type and errorFormatter

File: `src/server/trpc/__tests__/error-formatter.test.ts` _(new)_

- [ ] **Tier-wall cause is promoted to `data.appError`**
  Spec: `specs/app-error-cause.md` → "Tier-wall error carries structured cause on client"
  Given a PAYMENT_REQUIRED TRPCError with `cause: { type: 'tier-wall', reason: 'count-limit' }`,
  the formatted error shape has `data.appError` equal to that cause object.

- [ ] **No-cause error has null `data.appError`**
  Spec: `specs/app-error-cause.md` → "Non-cause error has null appError"
  Given a NOT_FOUND TRPCError with no cause, `data.appError` is `null`.

- [ ] **Invalid/non-plain-object cause yields null `data.appError`**
  Spec: `specs/app-error-cause.md` → "Formatter does not break on unexpected cause shape"
  Given a TRPCError with `cause` set to a string or Error instance, `data.appError` is `null` and the formatter does not throw.

- [ ] **Ownership FORBIDDEN has null `data.appError`**
  Spec: `specs/app-error-cause.md` → "Ownership FORBIDDEN is unaffected"
  Given a FORBIDDEN TRPCError from `verifyOwnership` (no cause), `data.appError` is `null`.

---

### Task 2 — Switch tier-enforcement throws to PAYMENT_REQUIRED

Files: existing router test files for `recipes.ts` and `cookbooks.ts`

- [ ] **`enforceContentLimit` throws PAYMENT_REQUIRED with count-limit cause**
  Spec: `specs/app-error-cause.md` → "Count-limit enforcement in recipe/cookbook creation"
  Given a user at their tier limit, calling `enforceContentLimit` rejects with code `PAYMENT_REQUIRED` and `cause.reason === 'count-limit'`.

- [ ] **Cookbook update to private throws PAYMENT_REQUIRED for prep-cook**
  Spec: `specs/app-error-cause.md` → "Private-content enforcement in cookbook update"
  Given a `prep-cook` user attempts `cookbooks.update` with `isPublic: false`,
  the mutation rejects with `PAYMENT_REQUIRED` and `cause.reason === 'private-content'`.

- [ ] **Ownership FORBIDDEN still FORBIDDEN after migration**
  Spec: `specs/app-error-cause.md` → "Ownership FORBIDDEN is unaffected"
  Given a user attempts to update another user's cookbook, the mutation rejects with `FORBIDDEN` (not PAYMENT_REQUIRED).

---

### Task 3 — useTierEntitlements hook

File: `src/hooks/__tests__/useTierEntitlements.test.ts` _(new)_

- [ ] **prep-cook returns correct entitlements**
  Spec: `specs/use-tier-entitlements.md` → "Authenticated user gets correct entitlements"
  `useTierEntitlements()` with session `tier: 'prep-cook'` returns `{ canCreatePrivate: false, canImport: false, recipeLimit: 100, cookbookLimit: 10 }`.

- [ ] **sous-chef returns elevated entitlements**
  Spec: `specs/use-tier-entitlements.md` → "sous-chef user gets elevated entitlements"
  `canCreatePrivate: true`, `canImport: true`, `recipeLimit: 500`, `cookbookLimit: 25`.

- [ ] **executive-chef returns max entitlements**
  Hook returns `recipeLimit: 2500`, `cookbookLimit: 200`, both can flags `true`.

- [ ] **Null session returns home-cook fallback**
  Spec: `specs/use-tier-entitlements.md` → "Null session returns home-cook fallback"
  With session `null`, hook returns `{ recipeLimit: 10, cookbookLimit: 1, canCreatePrivate: false, canImport: false }`.

- [ ] **home-cook returns correct entitlements**
  `recipeLimit: 10`, `cookbookLimit: 1`, both can flags `false`.

---

### Task 4 — TierWall component

File: `src/components/ui/__tests__/TierWall.test.tsx` _(new)_

- [ ] **Inline mode renders count-limit message and /pricing link**
  Spec: `specs/tier-wall-component.md` → "Inline TierWall shows correct message for count-limit"
  RTL render of `<TierWall reason="count-limit" display="inline" />` contains upgrade copy and a link to `/pricing`.

- [ ] **Inline mode renders private-content message**
  Spec: `specs/tier-wall-component.md` → "Inline TierWall shows correct message for private-content"
  Copy references sous-chef requirement.

- [ ] **Inline mode renders import message**
  Spec: `specs/tier-wall-component.md` → "Inline TierWall shows correct message for import"
  Copy references import requiring sous-chef or above.

- [ ] **Modal mode calls onDismiss when dismiss button clicked**
  Spec: `specs/tier-wall-component.md` → "Modal TierWall can be dismissed"
  RTL render of modal TierWall → click dismiss → `onDismiss` spy called once.

- [ ] **Modal mode renders /pricing link**
  Spec: `specs/tier-wall-component.md` → "Modal TierWall /pricing link is present"
  Link to `/pricing` present in modal render.

- [ ] **TierWall does not crash with null session context**
  Spec: `specs/tier-wall-component.md` → "TierWall renders without crash when tier is unknown"
  Renders without throwing; shows generic upgrade message.

---

### Task 5 — Pre-emptive affordances

Files: `src/routes/__tests__/-recipes.test.tsx`, `src/routes/__tests__/-cookbooks.test.tsx` _(extend existing or add new)_

- [ ] **New Recipe button disabled when home-cook user is at recipe limit**
  Spec: `specs/pre-emptive-affordances.md` → "New Recipe button disabled at limit"
  Mock session with `tier: 'home-cook'` + recipe count = 10 → button has `disabled` attribute and inline TierWall present.

- [ ] **New Recipe button enabled when below limit**
  Spec: `specs/pre-emptive-affordances.md` → "New Recipe button enabled below limit"
  Mock session with `tier: 'home-cook'` + recipe count = 7 → button enabled, no TierWall.

- [ ] **New Cookbook button disabled when home-cook is at cookbook limit**
  Spec: `specs/pre-emptive-affordances.md` → "New Cookbook button disabled at limit"
  Mock session with cookbook count = 1 → button disabled, inline TierWall present.

- [ ] **Private toggle absent for prep-cook**
  Spec: `specs/pre-emptive-affordances.md` → "Private toggle hidden for prep-cook"
  Form renders with `tier: 'prep-cook'` → private toggle not in DOM.

- [ ] **Private toggle present for sous-chef**
  Spec: `specs/pre-emptive-affordances.md` → "Private toggle shown for sous-chef"
  Form renders with `tier: 'sous-chef'` → private toggle present.

- [ ] **Import entry point hidden for home-cook**
  Spec: `specs/pre-emptive-affordances.md` → "Import entry point hidden for home-cook"
  Import button/link absent or disabled for `tier: 'home-cook'`.

- [ ] **Import entry point visible for sous-chef**
  Spec: `specs/pre-emptive-affordances.md` → "Import entry point visible for sous-chef"
  Import button/link present for `tier: 'sous-chef'`.

---

### Task 6 — Client-side PAYMENT_REQUIRED catch

Files: affected component test files

- [ ] **PAYMENT_REQUIRED with tier-wall cause renders modal TierWall**
  Spec: `specs/tier-wall-component.md` → "Modal TierWall is shown after server PAYMENT_REQUIRED"
  Mock mutation returning PAYMENT_REQUIRED + `appError: { type: 'tier-wall', reason: 'count-limit' }` → modal TierWall rendered with correct reason.

- [ ] **Non-tier error still shows generic toast**
  A FORBIDDEN error without `appError` → generic error toast shown, no TierWall.

- [ ] **UNAUTHORIZED error is unaffected**
  UNAUTHORIZED errors continue to redirect/handle as before.
