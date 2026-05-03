## GitHub Issues

- #342

## Why

- Problem statement: Users who register but have not verified their email can immediately access content-creation and tier-change routes. This allows unverified (potentially fake or throwaway) accounts to create recipes, cookbooks, imports, and initiate tier changes.
- Why now: The email-verification plumbing (BetterAuth config, Mailtrap transport, VerificationBanner, VerifyEmailPage) is already merged. The only missing piece from issue #342 is enforcing access restrictions at the route level.
- Business/user impact: Reduces spam and fake-account abuse on write operations. Ensures tier changes are tied to a validated email address. Preserves a low-friction read-only experience for unverified users.

## Problem Space

- Current behavior: `emailVerification.sendOnSignUp: true` sends a verification email on signup, and a banner reminds unverified users to verify — but all routes remain accessible regardless of verification status.
- Desired behavior: Routes involving content creation (`/recipes/new`, `/recipes/$recipeId/edit`, `/import`, `/cookbooks/`) and tier changes (`/change-tier`) redirect unverified authenticated users to `/auth/verify-email?from=<original-path>`. After verifying, the user is returned to their intended destination.
- Constraints: Must not break the existing `requireAuth()` / `requireTier()` / `requireAdmin()` guard chain. `/pricing` stays public (informational only).
- Assumptions: `session.user.emailVerified` is a reliable boolean managed by BetterAuth. A `false` value (not `undefined`) indicates an unverified account.
- Edge cases considered:
  - Unauthenticated users are redirected to `/auth/login` by `requireAuth()` before verification is checked — no double-redirect.
  - Admin routes already chain guards manually; `requireVerifiedAuth()` will not be applied there (admins are expected to be verified).
  - The BetterAuth email-link callback lands on `/auth/verify-email` without a `from` param — "Continue" falls back to `/`.

## Scope

### In Scope

- New `requireVerifiedAuth()` guard in `src/lib/auth-guard.ts` combining auth + email verification checks
- Update `/recipes/new`, `/recipes/$recipeId/edit`, `/import` to use `requireVerifiedAuth()` instead of `requireAuth()`
- Add `requireVerifiedAuth()` to `/cookbooks/` and `/change-tier` (currently unguarded)
- Add `from?: string` to `/auth/verify-email` route's `validateSearch`
- Update `VerifyEmailPage` "Continue" button to navigate to `from ?? '/'` after verification

### Out of Scope

- `/pricing` — stays fully public
- Admin routes — existing manual guard chaining is unchanged
- `autoSignIn: false` in BetterAuth config — not changing signup session behavior
- Rate-limiting or abuse prevention beyond route gating
- Email template styling improvements

## What Changes

- `src/lib/auth-guard.ts` — add `requireVerifiedAuth()` exported function
- `src/routes/recipes/new.tsx` — swap `requireAuth()` → `requireVerifiedAuth()`
- `src/routes/recipes/$recipeId_.edit.tsx` — swap `requireAuth()` → `requireVerifiedAuth()`
- `src/routes/import/index.tsx` — swap `requireAuth()` → `requireVerifiedAuth()`
- `src/routes/cookbooks/index.tsx` — add `beforeLoad: requireVerifiedAuth()`
- `src/routes/change-tier.tsx` — add `beforeLoad: requireVerifiedAuth()`
- `src/routes/auth/verify-email.tsx` — add `from?: string` to `validateSearch`
- `src/components/auth/VerifyEmailPage.tsx` — use `from` prop on "Continue" navigation

## Risks

- Risk: `requireVerifiedAuth()` redirects unauthenticated users to `/auth/verify-email` instead of `/auth/login`
  - Impact: Confusing UX — unverified users who aren't logged in would hit the wrong page
  - Mitigation: Guard always checks auth first; if no session, delegates redirect to `/auth/login` as today. Verification check only runs when a session exists.

- Risk: The `from` param survives the BetterAuth email-link callback and causes a stale redirect after verification
  - Impact: User ends up at an unexpected route
  - Mitigation: `from` is only set by the route guard redirect, not by the BetterAuth callback URL. The two flows are distinct.

- Risk: Existing tests for guarded routes break if they mock an unverified session
  - Impact: CI failure
  - Mitigation: Test helpers that produce mock sessions need `emailVerified: true` by default. Tests covering the new guard behavior will explicitly set `emailVerified: false`.

## Open Questions

No unresolved ambiguity. All decisions confirmed during explore session:
- `requireVerifiedAuth()` combines auth + verification in one guard
- `from` param added to verify-email route for post-verification redirect
- `/pricing` remains public
- `/change-tier` and all content-creation routes get the hard gate

## Non-Goals

- Restricting read access (recipe browsing, cookbook viewing) for unverified users
- Blocking API endpoints directly (tRPC router-level enforcement)
- Building an admin tool to manually verify users

## Change Control

If scope changes after proposal approval, update `openspec/changes/email-verification-hard-gate/proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
