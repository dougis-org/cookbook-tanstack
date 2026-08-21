---
name: tests
description: Tests for the consolidate-account-page change
---

# Tests

## Overview

This document outlines the tests for the `consolidate-account-page` change.
Tests were written and updated alongside each extracted component/route
change, verified failing/passing incrementally as each piece landed
(component extraction → route composition → redirect routes → Header link),
rather than as a single separate pre-implementation pass. All listed cases
pass as of this writing (`npm run test`: 2061/2061; e2e: 34/34).

## Test Cases

### Task 1 — ProfileSection extraction

- [x] `src/components/account/__tests__/ProfileSection.test.tsx` — shows
      loading skeleton while session pending → maps to `account-page` spec
      "All three sections render on one page".
- [x] same file — renders nothing when no session.
- [x] same file — displays user information (name, email, username, member
      since).
- [x] same file — displays avatar when image available.

### Task 2 — StatusSection extraction

- [x] `src/routes/__tests__/-account.test.tsx` (tier section suite) — tier
      name/description, recipe/cookbook progress bars, next-tier preview,
      upgrade CTA present/absent by tier, usage loading/error states → maps
      to `account-page` spec "All three sections render on one page".

### Task 3 — PreferencesSection extraction

- [x] `src/components/account/__tests__/PreferencesSection.test.tsx` — theme
      selection (loading state, current theme selected, late session sync,
      invalid theme fallback), save via `authClient.updateUser` (success,
      error with selection preserved, unexpected exception, error→success
      retry, sibling `useAuth()` consumer sees new theme immediately), print
      preference toggles (default-on, independent toggling, saved alongside
      theme, failed save preserves toggle state) → maps to `user-settings`
      spec's four MODIFIED requirements.
- [x] same file — "does not clobber an in-progress manual pick when the
      session value changes" → maps to `user-settings` spec "An in-progress,
      unsaved edit is not overwritten by an async session refresh".

### Task 4 — Consolidated `/account` page composition

- [x] `src/routes/__tests__/-account.test.tsx` ("composed page" suite) —
      renders Profile, Status, and Preferences sections together; no internal
      link to `/account/settings` → maps to `account-page` spec "All three
      sections render on one page" and "No in-page link to a separate
      settings route".

### Task 5 — Redirect-only legacy routes

- [x] `src/routes/auth/__tests__/-profile.test.tsx` — unauthenticated visitor
      redirected to `/auth/login` (not `/account`); authenticated visitor
      redirected to `/account` → maps to `auth-route-guards` spec "Legacy
      `/auth/profile` route redirects authenticated visitors to `/account`".
- [x] `src/routes/__tests__/-account-settings.test.tsx` — same two cases for
      `/account/settings` → maps to `auth-route-guards` spec "Legacy
      `/account/settings` route redirects authenticated visitors to
      `/account`".

### Task 6 — Header link

- [x] `src/components/__tests__/Header.test.tsx` and
      `src/components/auth/__tests__/Header.test.tsx` — user link targets
      `/account`, not `/auth/profile` → maps to `header` spec "Header user
      link navigates to the consolidated account page".
- [x] `src/e2e/header-sidebar.spec.ts` — clicking the Header user link
      navigates to `/account` and renders the consolidated page (browser
      test, since the unit tests mock `Link`) → same requirement, "Link
      behavior is consistent at narrow viewport widths" covered by e2e
      running at default viewport plus `account.spec.ts`'s dedicated mobile
      test.

### Task 8 — New coverage (redirects, mobile layout)

- [x] `src/e2e/account.spec.ts` — `/auth/profile` and `/account/settings`
      redirect an authenticated visitor to `/account` (browser-level,
      confirms the full SSR redirect chain, not just `beforeLoad` in
      isolation).
- [x] same file — renders all three sections without horizontal clipping at
      375×667 mobile viewport, Save button reachable by scrolling → maps to
      `account-page` spec "Page remains usable at mobile width".
- [x] `src/e2e/auth-session.spec.ts` (updated) — session persists across
      reload, survives absent cookie cache, and old-route access still
      redirects logged-out visitors to login, now asserted against `/account`
      instead of the old `/auth/profile` page.
- [x] `src/e2e/theme.spec.ts` (updated) — theme save flow exercised against
      `/account` instead of `/account/settings`; print-isolation test
      unaffected but re-verified.

## Regression coverage

- [x] Full unit suite (`npm run test`) — 2061/2061, confirms no unrelated
      breakage from the extraction/route changes.
- [x] `src/e2e/cookbooks-auth.spec.ts` (untouched by this change) — 9/9,
      run specifically to rule out environment-vs-code-change ambiguity
      during e2e debugging.
