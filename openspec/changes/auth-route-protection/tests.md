---
name: tests
description: Tests for the auth-route-protection change
---

# Tests

## Overview

All work follows strict TDD: write a failing test first, implement the minimum code to pass it, then refactor.

Test files:
- Unit: `src/lib/__tests__/auth-guard.test.ts` (Tasks 7)
- Unit: `src/components/auth/__tests__/LoginForm.test.tsx` (Task 8)
- Unit: `src/components/__tests__/Header.test.tsx` (Task 9)
- E2E: `e2e/auth-protection.spec.ts` (covers Tasks 10–14 end-to-end)

---

## Testing Steps

For each task in `tasks.md`:
1. **Write a failing test** before writing any implementation code. Run it and confirm it fails.
2. **Write the minimum code** to make it pass.
3. **Refactor** while keeping the test green.

---

## Test Cases

### Task 7 — `requireAuth()` unit tests
`src/lib/__tests__/auth-guard.test.ts`

- [ ] **T7-1:** `requireAuth()` with `context.session = null` — throws a `redirect`
  - Spec: `specs/auth-route-guards/spec.md` → Requirement: ADDED requireAuth redirect params
  - `expect(() => requireAuth()({ context: { session: null }, location: { href: '/recipes/new' } })).toThrow()`

- [ ] **T7-2:** Thrown redirect targets `/auth/login`
  - Spec: `specs/auth-route-guards/spec.md` → Requirement: ADDED requireAuth redirect params
  - Inspect the thrown redirect object's `to` property equals `'/auth/login'`

- [ ] **T7-3:** Thrown redirect search contains `reason: 'auth-required'`
  - Spec: `specs/auth-route-guards/spec.md` → Requirement: ADDED requireAuth redirect includes reason and from params
  - Inspect `search.reason === 'auth-required'`

- [ ] **T7-4:** Thrown redirect search contains `from` equal to the location href
  - Spec: `specs/auth-route-guards/spec.md` → Requirement: ADDED requireAuth redirect includes reason and from params
  - `search.from === '/recipes/new'`

- [ ] **T7-5:** `requireAuth()` with a non-null session returns void (no throw)
  - Spec: `specs/auth-route-guards/spec.md` → Requirement: ADDED route guard (authenticated user passes through)
  - `expect(() => requireAuth()({ context: { session: mockSession }, location: { href: '/recipes/new' } })).not.toThrow()`

- [ ] **T7-6:** `REDIRECT_REASON_MESSAGES` has a non-empty string for `'auth-required'`
  - Spec: `specs/login-redirect/spec.md` → Requirement: ADDED login banner (keyed on reason)
  - `expect(REDIRECT_REASON_MESSAGES['auth-required']).toBeTruthy()`

- [ ] **T7-7:** `REDIRECT_REASON_MESSAGES` has a non-empty string for `'tier-limit-reached'`
  - Spec: `specs/login-redirect/spec.md` → future-proofing
  - `expect(REDIRECT_REASON_MESSAGES['tier-limit-reached']).toBeTruthy()`

### Task 8 — `LoginForm` unit tests
`src/components/auth/__tests__/LoginForm.test.tsx`

- [ ] **T8-1:** Banner rendered when `reason=auth-required`
  - Spec: `specs/login-redirect/spec.md` → Requirement: ADDED login page displays contextual redirect banner
  - Render `<LoginForm />` with route context providing `reason: 'auth-required'`; assert element with `REDIRECT_REASON_MESSAGES['auth-required']` text is in the document

- [ ] **T8-2:** No banner rendered when no `reason` param
  - Spec: `specs/login-redirect/spec.md` → Scenario: No banner when navigating to login directly
  - Render with no search params; assert banner element absent

- [ ] **T8-3:** No banner rendered for unknown `reason` value
  - Spec: `specs/login-redirect/spec.md` → Scenario: Unknown reason param handled gracefully
  - Render with `reason: 'unknown-value'`; assert banner absent

- [ ] **T8-4:** On success with valid relative `from=/recipes/new`, navigates to `/recipes/new`
  - Spec: `specs/login-redirect/spec.md` → Requirement: ADDED login redirects to `from` path
  - Mock `authClient.signIn.email` to call `onSuccess`; assert `navigate` called with `{ to: '/recipes/new' }`

- [ ] **T8-5:** On success with no `from`, navigates to `/`
  - Spec: `specs/login-redirect/spec.md` → Scenario: Successful login with no `from` param
  - Assert `navigate` called with `{ to: '/' }`

- [ ] **T8-6:** On success with `from=http://evil.com`, navigates to `/` (open-redirect rejected)
  - Spec: `specs/login-redirect/spec.md` → Non-Functional: Security — open redirect prevention
  - Assert `navigate` called with `{ to: '/' }`, not `{ to: 'http://evil.com' }`

- [ ] **T8-7:** On success with `from=//evil.com`, navigates to `/` (protocol-relative rejected)
  - Spec: `specs/login-redirect/spec.md` → Non-Functional: Security — protocol-relative URL rejected
  - Assert `navigate` called with `{ to: '/' }`, not `{ to: '//evil.com' }`

### Task 9 — `Header` nav visibility unit tests
`src/components/__tests__/Header.test.tsx`

- [ ] **T9-1:** "New Recipe" link absent when `session = null`
  - Spec: `specs/nav-visibility/spec.md` → Requirement: ADDED hamburger nav hides auth-required items
  - Mock `useAuth` to return `{ session: null, isPending: false }`; assert `queryByText('New Recipe')` is null

- [ ] **T9-2:** "Import Recipe" link absent when `session = null`
  - Spec: `specs/nav-visibility/spec.md` → Requirement: ADDED hamburger nav hides auth-required items
  - Mock `useAuth` to return `{ session: null, isPending: false }`; assert `queryByText('Import Recipe')` is null

- [ ] **T9-3:** "New Recipe" link present when session is non-null
  - Spec: `specs/nav-visibility/spec.md` → Scenario: Links visible when authenticated
  - Mock `useAuth` to return `{ session: mockSession, isPending: false }`; assert `getByText('New Recipe')` is in the document

- [ ] **T9-4:** "Import Recipe" link present when session is non-null
  - Spec: `specs/nav-visibility/spec.md` → Scenario: Links visible when authenticated
  - Mock `useAuth` to return `{ session: mockSession, isPending: false }`; assert `getByText('Import Recipe')` is in the document

- [ ] **T9-5:** Both links absent when `isPending = true` (session loading)
  - Spec: `specs/nav-visibility/spec.md` → Scenario: Links remain hidden during session load
  - Mock `useAuth` to return `{ session: null, isPending: true }`; assert both links absent

### E2E Tests
`e2e/auth-protection.spec.ts`

- [ ] **TE-1:** Unauthenticated user navigating to `/recipes/new` is redirected to login
  - Spec: `specs/auth-route-guards/spec.md` → Scenario: Unauthenticated client-side navigation to /recipes/new
  - Playwright: ensure logged out; click link or navigate to `/recipes/new`; assert URL contains `/auth/login`; assert `reason=auth-required` in URL

- [ ] **TE-2:** Unauthenticated user navigating to `/import` is redirected to login
  - Spec: `specs/auth-route-guards/spec.md` → Scenario: Unauthenticated client-side navigation to /import
  - Playwright: same pattern; assert redirect to `/auth/login?reason=auth-required`

- [ ] **TE-3:** Unauthenticated user navigating to `/recipes/:id/edit` is redirected to login
  - Spec: `specs/auth-route-guards/spec.md` → Scenario: Unauthenticated client-side navigation to edit route
  - Playwright: navigate to a known recipe edit URL while logged out; assert redirect

- [ ] **TE-4:** Login page shows banner when `reason=auth-required` in URL
  - Spec: `specs/login-redirect/spec.md` → Scenario: Banner shown for auth-required reason
  - Playwright: navigate to `/auth/login?reason=auth-required`; assert banner text visible on page

- [ ] **TE-5:** Successful login with `from` param redirects to the original page
  - Spec: `specs/login-redirect/spec.md` → Scenario: Successful login with valid `from` param
  - Playwright: navigate to `/import` while logged out → redirected to login → log in → assert URL is `/import`

- [ ] **TE-6:** Hamburger nav hides New/Import Recipe links while logged out
  - Spec: `specs/nav-visibility/spec.md` → Scenario: Links hidden when unauthenticated
  - Playwright: open hamburger; assert "New Recipe" and "Import Recipe" text not present

- [ ] **TE-7:** Hamburger nav shows New/Import Recipe links while logged in
  - Spec: `specs/nav-visibility/spec.md` → Scenario: Links visible when authenticated
  - Playwright: log in; open hamburger; assert both links visible
