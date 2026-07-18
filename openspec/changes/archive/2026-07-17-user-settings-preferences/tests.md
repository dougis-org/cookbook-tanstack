---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `user-settings-preferences` change. All work should follow a strict TDD (Test-Driven Development) process: write a failing test, write the simplest code to pass it, then refactor.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### T1 — `theme` in Better-Auth `additionalFields`

- [ ] Config test: `src/lib/auth.ts`'s `user.additionalFields.theme` has `type: "string"`, `defaultValue: "dark"`, `required: false`.
- [ ] Integration test: submitting `theme` through `authClient.updateUser` round-trips and is readable back from `session.user.theme` (maps to `specs/user-settings/spec.md` → "Selecting a new theme and saving persists it via updateUser").

### T2/T3 — Settings route (`src/routes/account_.settings.tsx`)

- [ ] Route test: logged-in user with `session.user.theme = 'dark-greens'` navigating to `/account/settings` sees `'dark-greens'` pre-selected in the form (maps to `specs/user-settings/spec.md` → "Logged-in user views their current theme preference").
- [ ] Route test: logged-out request to `/account/settings` is redirected by `requireAuth()`, mirroring existing `/account` guard test coverage (maps to `specs/user-settings/spec.md` → "Logged-out user is redirected away from settings").
- [ ] Component test: selecting a new theme and submitting save calls `authClient.updateUser({ theme: <new value> })` exactly once with the expected payload (maps to `specs/user-settings/spec.md` → "Selecting a new theme and saving persists it via updateUser").
- [ ] Component test: successful save shows a success/saved state (same scenario as above, success branch).
- [ ] Component test: `updateUser` rejecting (mocked network/validation error) shows an inline error message AND the form's selected value remains the user's chosen (unsaved) value, not reverted (maps to `specs/user-settings/spec.md` → "Save failure shows an explicit error without discarding the selection").
- [ ] Component test: re-submitting save after a prior failure, now succeeding, replaces the error state with success without a full page reload (maps to `specs/user-settings/spec.md` NFAC → "Save-error recovery does not require a page reload").
- [ ] Integration/component test: after a successful save, a sibling component consuming `useAuth()`/`useSession()` re-renders reflecting the new `theme` value without calling `refetch()` manually (maps to `specs/user-settings/spec.md` → "Session-consuming components see the new theme right after save").

### T4 — `AccountPage` settings link

- [ ] Component test (extend `src/routes/__tests__/-account.test.tsx`): `AccountPage` renders a link to `/account/settings` (maps to `specs/user-settings/spec.md` → "Account page links to settings").

### T5/T6 — `ThemeProvider` reconciliation (`src/contexts/ThemeContext.tsx`)

- [ ] Test: mount with a mocked session where `user.theme = 'dark-greens'` and `localStorage['cookbook-theme']` unset — assert first render/paint uses the pre-hydration/localStorage-resolved value (`'dark'`), then post-mount the DOM class, React state, and `localStorage` update to `'dark-greens'` (maps to `specs/theme-system/spec.md` → "Session theme differs from localStorage on a new device").
- [ ] Test: mount with a mocked session where `user.theme = 'light-cool'` and `localStorage['cookbook-theme'] = 'light-cool'` already — assert no change/flash occurs at any point (maps to `specs/theme-system/spec.md` → "Session theme matches localStorage — no visible change").
- [ ] Test: mount with no session (anonymous) — assert behavior is identical to pre-change `ThemeContext` (localStorage-only, no reconciliation attempted) (maps to `specs/theme-system/spec.md` → "Anonymous/logged-out users are unaffected").
- [ ] Test: reconciliation effect does not block or delay first paint (no synchronous network/session wait introduced before initial render) (maps to `specs/theme-system/spec.md` NFAC → "Reconciliation does not block first paint").

### T7 — E2E coverage

- [ ] E2E test (extend `src/e2e/theme.spec.ts` or sibling spec): logged-in user changes theme on `/account/settings`, reloads the page, and observes the new theme persisted (round trip covering `specs/user-settings/spec.md` and `specs/theme-system/spec.md` together).
- [ ] E2E regression check: existing anonymous/logged-out theme E2E scenarios in `src/e2e/theme.spec.ts` continue to pass unmodified.

## Traceability Summary

- Every scenario in `specs/user-settings/spec.md` and `specs/theme-system/spec.md` has at least one corresponding test case above.
- Every task in `tasks.md`'s Execution section (T1–T7) has at least one corresponding test case above.
