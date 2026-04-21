## GitHub Issues

- #348

## Why

- Problem statement: BetterAuth email verification is fully wired server-side (`sendVerificationEmail` hook, `sendOnSignUp: true`, Mailtrap delivery) but there is no UI layer — no feedback after registration, no verification landing page, no resend mechanism, and no surface for the `emailVerified` flag.
- Why now: The Mailtrap foundation (#347) just merged, making this the natural next step. Shipping email delivery without the UI that closes the loop leaves the feature half-done.
- Business/user impact: Users currently receive a verification email they cannot act on (no landing page), receive no post-registration feedback, and have no way to resend if the email is lost. Unverified accounts also create a gap for future social features that require verified identity.

## Problem Space

- Current behavior: Registration sends a verification email (via Mailtrap) but the user sees no confirmation, the verification link lands on a 404, and there is no resend path. `session.user.emailVerified` exists but is never surfaced.
- Desired behavior: After registration the user sees a "check your email" message. Clicking the link lands on `/auth/verify-email` with a success or error state. All authenticated unverified users see a persistent banner with a resend option. The banner auto-dismisses when `emailVerified` flips to `true`.
- Constraints: BetterAuth handles token generation and verification endpoint (`/api/auth/verify-email`); the UI must consume its redirect/error contract. `session.user.emailVerified` is the source of truth. No hard block on app access — soft gate only.
- Assumptions: BetterAuth's verification redirect appends `?status=success` or similar query params; this needs verification during implementation. The `authClient.sendVerificationEmail` method is available on the base client.
- Edge cases considered: expired/invalid token on landing page; resend while in cooldown (surface BetterAuth error); user verifies in another tab (session refresh should dismiss banner); unauthenticated users must not see the banner.

## Scope

### In Scope

- Post-registration "check your email" feedback state in `RegisterForm.tsx`
- `/auth/verify-email` route and landing page (success + error states)
- Persistent unverified-email banner in `__root.tsx` (or dedicated layout)
- Resend verification email — in banner and on error state of landing page
- Loading, success, and error feedback on resend action
- Auto-dismiss banner when `session.user.emailVerified` becomes `true`

### Out of Scope

- Hard blocking unverified users from app access
- Gating individual features on `emailVerified` (deferred to when social features ship)
- Admin tools for manual verification
- Email template styling beyond plain-text/basic HTML (already set in auth.ts)

## What Changes

- `src/components/auth/RegisterForm.tsx` — add `isSubmitted` state showing "check your email" on success
- `src/routes/auth/verify-email.tsx` — new route reading `?status` / `?error` from BetterAuth redirect
- `src/components/auth/VerifyEmailPage.tsx` — success and error UI with resend
- `src/components/auth/VerificationBanner.tsx` — persistent banner for unverified authenticated users
- `src/routes/__root.tsx` — render `VerificationBanner` inside authenticated layout
- Tests: unit tests for banner logic, verify-email page states, resend flow

## Risks

- Risk: BetterAuth's redirect contract from `/api/auth/verify-email` is undocumented or differs from assumed `?status=success`.
  - Impact: Landing page shows wrong state.
  - Mitigation: Inspect actual redirect during implementation; make the page handle gracefully if no params present.

- Risk: `authClient.sendVerificationEmail` may require additional client plugin configuration.
  - Impact: Resend silently fails or throws.
  - Mitigation: Verify method availability in auth-client.ts early; add plugin if needed.

- Risk: Session does not auto-refresh after verification in another tab.
  - Impact: Banner stays visible after verification.
  - Mitigation: Add a periodic session refetch or rely on next navigation to trigger re-check; document the limitation.

## Open Questions

- Question: What exact query params does BetterAuth append to the `callbackURL` on verification success vs failure?
  - Needed from: BetterAuth docs / runtime inspection
  - Blocker for apply: yes — determines landing page logic

No other unresolved ambiguity. Gate strategy (soft gate), banner placement, and resend mechanism are decided.

## Non-Goals

- Hard blocking unverified users from any route
- Per-feature `emailVerified` guards (future work when social features ship)
- Custom email template redesign
- Multi-email / email change flow

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
