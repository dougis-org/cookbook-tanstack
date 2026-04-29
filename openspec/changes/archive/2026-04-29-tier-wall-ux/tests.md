---
name: tests
description: Tests for the tier-wall-ux change
---

# Tests — tier-wall-ux

## Overview

Test cases for the tier-wall UX and upgrade prompts feature. All tests follow strict TDD: failing tests were written before implementation code.

## Test Cases

### Task 3–4: AppErrorCause + errorFormatter (`src/server/trpc/__tests__/error-formatter.test.ts`)

- [x] Promotes `tier-wall` cause with `count-limit` reason to `AppErrorCause`
- [x] Promotes `tier-wall` cause with `private-content` reason to `AppErrorCause`
- [x] Promotes `tier-wall` cause with `import` reason to `AppErrorCause`
- [x] Returns null when cause is absent
- [x] Returns null when cause is a string
- [x] Returns null when cause is an Error instance
- [x] Returns null when cause is a plain object with unknown type
- [x] Returns null when cause is a plain object with `tier-wall` but unknown reason
- [x] Promotes `ownership` type to `AppErrorCause`
- [x] Does not throw on null cause

### Task 7: enforceContentLimit throws PAYMENT_REQUIRED (`src/server/trpc/routers/__tests__/helpers.test.ts`)

- [x] Throws `PAYMENT_REQUIRED` when home-cook user is at 10-recipe limit
- [x] Throws `PAYMENT_REQUIRED` when home-cook user is at 1-cookbook limit
- [x] Defaults missing tier to home-cook and throws `PAYMENT_REQUIRED` at 10 recipes

### Task 12–13: useTierEntitlements hook (`src/hooks/__tests__/useTierEntitlements.test.ts`)

- [x] Returns correct entitlements for `home-cook`
- [x] Returns correct entitlements for `prep-cook`
- [x] Returns elevated entitlements for `sous-chef`
- [x] Returns max entitlements for `executive-chef`
- [x] Returns home-cook fallback when session is null
- [x] Returns home-cook fallback when tier is undefined on session user

### Task 15–16: TierWall component (`src/components/ui/__tests__/TierWall.test.tsx`)

- [x] Renders `count-limit` message and `/pricing` link (inline)
- [x] Renders `private-content` message mentioning sous chef (inline)
- [x] Renders `import` message mentioning sous chef (inline)
- [x] Renders `/pricing` link in modal
- [x] Calls `onDismiss` when dismiss button is clicked (modal)
- [x] Renders `count-limit` message in modal
- [x] Renders `private-content` message in modal
- [x] Renders `import` message in modal
- [x] Renders without crashing when `onDismiss` is omitted in modal mode

### Task 18–23: Affordance locations

#### Recipes page (`src/routes/__tests__/-recipes.test.tsx`)

- [x] Disables "New Recipe" button when home-cook user is at recipe limit
- [x] Shows inline TierWall when home-cook user is at recipe limit
- [x] Enables "New Recipe" button when home-cook user is below limit
- [x] Hides Import Recipe entry point for home-cook
- [x] Shows Import Recipe link for sous-chef

#### Cookbooks page (`src/components/cookbooks/__tests__/CookbooksPage.test.tsx`)

- [x] Disables "New Cookbook" button when home-cook user is at cookbook limit
- [x] Shows inline TierWall when at cookbook limit

#### Recipe/Cookbook create forms — private toggle

- [x] Hides "Set to private" toggle when `!canCreatePrivate` (RecipeForm)

### Task 24–26: Mutation error handling

#### RecipeForm (`src/components/recipes/__tests__/RecipeForm.test.tsx`)

- [x] Shows TierWall modal when recipe create returns count-limit tier wall error
- [x] Does not show generic submit error for tier-wall errors
- [x] Shows generic submit error for non-tier errors

#### ImportPage (`src/routes/__tests__/-import.test.tsx`)

- [x] Shows TierWall modal when import returns a tier-wall error
- [x] Does not show TierWall for non-tier import errors

#### CookbooksPage (`src/components/cookbooks/__tests__/CookbooksPage.test.tsx`)

- [x] Shows TierWall modal when cookbook create returns a tier-wall error
- [x] Shows generic error (not TierWall) when cookbook create fails with a non-tier error
