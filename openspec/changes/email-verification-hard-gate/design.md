## Context

- Relevant architecture: TanStack Router file-based routing with `beforeLoad` guards. Guards are factory functions returning a `beforeLoad`-compatible function that receives `{ context, location }`. `context.session` is the BetterAuth session populated server-side in `src/routes/__root.tsx`. Existing guards: `requireAuth()`, `requireTier()`, `requireAdmin()` — all in `src/lib/auth-guard.ts`.
- Dependencies: `better-auth` (session shape, `emailVerified` field), `@tanstack/react-router` (`redirect`, route `validateSearch`), `src/lib/auth-guard.ts`, `src/components/auth/VerifyEmailPage.tsx`, `src/routes/auth/verify-email.tsx`.
- Interfaces/contracts touched:
  - `auth-guard.ts` — exports a new `requireVerifiedAuth()` function
  - `verify-email.tsx` route — `validateSearch` extended with `from?: string`
  - `VerifyEmailPage.tsx` — accepts and uses a `from?: string` prop for post-verification navigation
  - Five route files — `beforeLoad` updated

## Goals / Non-Goals

### Goals

- Add `requireVerifiedAuth()` that redirects unverified authenticated users to `/auth/verify-email?from=<path>`
- Apply guard to all content-creation and tier-change routes
- Return users to their intended destination after email verification
- Preserve existing `requireAuth()` redirect-to-login behavior for unauthenticated users

### Non-Goals

- Changing signup session behavior (`autoSignIn`)
- Restricting read-only routes
- tRPC router-level enforcement
- Modifying admin guard chain

## Decisions

### Decision 1: `requireVerifiedAuth()` combines auth + verification in a single guard

- Chosen: A single exported `requireVerifiedAuth()` factory that internally runs the auth check first, then the verification check. Replaces the `requireAuth()` call at affected routes — callers do not need to chain two guards.
- Alternatives considered: (a) Keep `requireAuth()` and add a separate `requireEmailVerification()` that callers chain manually, as the admin route does. (b) Add a `requireVerified` flag parameter to `requireAuth()`.
- Rationale: Every route that needs verification also needs auth — there is no route that needs verification without auth. A combined guard removes the possibility of accidentally applying verification without auth, and keeps route files clean (one `beforeLoad` line, not two).
- Trade-offs: Slightly less composable than two independent guards, but the use-case for verification-without-auth doesn't exist here.

### Decision 2: `from` param on `/auth/verify-email` for post-verification redirect

- Chosen: Extend `validateSearch` on the verify-email route to accept `from?: string`. `VerifyEmailPage` receives `from` as a prop and uses it for the "Continue" button/link. If absent (e.g., BetterAuth callback flow), falls back to `/`.
- Alternatives considered: Storing `from` in session storage or a cookie to survive the email-link redirect.
- Rationale: The guard flow (logged-in unverified user) keeps the user on the same browser tab — `from` in the URL is sufficient and stateless. The BetterAuth email-link callback is a separate flow that does not need to preserve `from` (user clicks link from email, typically in a new tab).
- Trade-offs: `from` is lost if the user opens the verification email in a different browser/tab, but this is an acceptable UX trade-off given the low-friction fallback to `/`.

### Decision 3: `/pricing` remains public

- Chosen: No guard on `/pricing`.
- Alternatives considered: `requireAuth()` only (no verification check).
- Rationale: Pricing is an informational page. Requiring auth would reduce conversion for new visitors. The only actionable route is `/change-tier`, which is gated.
- Trade-offs: None — this is purely additive.

### Decision 4: Guard placement — route level for most routes, tRPC level for cookbooks

- Chosen: Route-level `beforeLoad` guards for `/recipes/new`, `/recipes/$recipeId/edit`, `/import`, and `/change-tier`. For `/cookbooks/` (public-content listing page): UI-level verification check hides the create form and shows a "Verify Email to Create" link; the `cookbooks.create` tRPC mutation is enforced via a new `verifiedProcedure` middleware. The `/api/upload` endpoint also checks `emailVerified` to prevent unverified users from uploading images via direct API calls.
- Alternatives considered: Adding a route-level guard to `/cookbooks/` (would block public cookbook browsing); leaving tRPC unmodified (allows API-level bypass).
- Rationale: `/cookbooks/` is public-content — anonymous and unverified users can browse cookbooks. Only the creation action is gated. tRPC enforcement on `cookbooks.create` prevents direct API bypass. The `verifiedProcedure` middleware handles this cleanly.
- Trade-offs: Unverified users on `/cookbooks/` see the page but not the create controls; they are guided to verify rather than being hard-redirected away from the listing.

## Proposal to Design Mapping

- Proposal element: New `requireVerifiedAuth()` guard
  - Design decision: Decision 1
  - Validation approach: Unit tests in `auth-guard.test.ts` covering (a) unauthenticated → redirect to login, (b) authenticated unverified → redirect to verify-email with `from`, (c) authenticated verified → no redirect

- Proposal element: Swap `requireAuth()` on three routes, add guard to two ungated routes
  - Design decision: Decision 1 applied per-route
  - Validation approach: Route-level tests assert the guard redirects correctly; existing route tests updated to use verified sessions by default

- Proposal element: `from` param on verify-email route
  - Design decision: Decision 2
  - Validation approach: Unit tests for `validateSearch` parsing; `VerifyEmailPage` tests asserting "Continue" navigates to `from` or `/`

- Proposal element: `/pricing` stays public
  - Design decision: Decision 3
  - Validation approach: Existing pricing tests confirm no auth requirement is added

## Functional Requirements Mapping

- Requirement: Unauthenticated user hitting a guarded route redirects to `/auth/login`
  - Design element: `requireVerifiedAuth()` — auth check runs first, delegates to existing redirect logic
  - Acceptance criteria reference: `specs/auth-guard-verified/spec.md` — FR-1
  - Testability notes: Mock `context.session = null`; assert redirect to `/auth/login`

- Requirement: Authenticated unverified user hitting a guarded route redirects to `/auth/verify-email?from=<path>`
  - Design element: `requireVerifiedAuth()` — verification check after auth check
  - Acceptance criteria reference: `specs/auth-guard-verified/spec.md` — FR-2
  - Testability notes: Mock session with `emailVerified: false`; assert redirect to `/auth/verify-email` with correct `from`

- Requirement: Authenticated verified user passes through guarded route
  - Design element: `requireVerifiedAuth()` — returns without throwing
  - Acceptance criteria reference: `specs/auth-guard-verified/spec.md` — FR-3
  - Testability notes: Mock session with `emailVerified: true`; assert no redirect thrown

- Requirement: "Continue" on verify-email page navigates to `from` if present
  - Design element: `VerifyEmailPage` `from` prop + Decision 2
  - Acceptance criteria reference: `specs/verify-email-ux/spec.md` — FR-4
  - Testability notes: Render with `from="/recipes/new"`; assert link/button href is `/recipes/new`

- Requirement: "Continue" on verify-email page falls back to `/` when `from` is absent
  - Design element: `VerifyEmailPage` fallback — Decision 2
  - Acceptance criteria reference: `specs/verify-email-ux/spec.md` — FR-5
  - Testability notes: Render without `from`; assert link/button href is `/`

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: `from` param does not enable open redirect to external URLs
  - Design element: `validateSearch` in `verify-email.tsx` — accept only relative paths (no `://`)
  - Acceptance criteria reference: `specs/verify-email-ux/spec.md` — NFR-1
  - Testability notes: Unit test `validateSearch` with `from="https://evil.com"` — must be stripped or rejected

- Requirement category: reliability
  - Requirement: Guard does not throw or cause unexpected redirects when `emailVerified` is `undefined` (legacy session)
  - Design element: `requireVerifiedAuth()` — treat `undefined` as verified (do not gate)
  - Acceptance criteria reference: `specs/auth-guard-verified/spec.md` — NFR-2
  - Testability notes: Mock session with `emailVerified: undefined`; assert no redirect

- Requirement category: operability
  - Requirement: Existing `requireAuth()` callers (home, profile, account, admin) are unaffected
  - Design element: `requireAuth()` is not modified; only affected route files change
  - Acceptance criteria reference: Verified by existing passing tests
  - Testability notes: CI confirms no regressions in existing auth guard tests

## Risks / Trade-offs

- Risk/trade-off: Open redirect via `from` param
  - Impact: User could be redirected to a malicious external site after verification
  - Mitigation: `validateSearch` strips or rejects `from` values that are not relative paths (no protocol, no `//`)

- Risk/trade-off: Session `emailVerified` field not present in all session objects (e.g., OAuth users)
  - Impact: OAuth users could be incorrectly blocked
  - Mitigation: Guard treats `emailVerified !== false` as verified — only explicit `false` triggers the gate. BetterAuth sets `emailVerified: true` for OAuth sign-ins.

## Rollback / Mitigation

- Rollback trigger: Guard is redirecting verified users or breaking login flow in production
- Rollback steps: Revert the five route files and `auth-guard.ts` changes (no data migration needed — purely route-level logic)
- Data migration considerations: None — no schema or database changes
- Verification after rollback: Confirm authenticated verified users can access `/recipes/new` and `/cookbooks/` without redirect

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix failing tests before re-requesting review.
- If security checks fail: Treat open-redirect NFR-1 failure as a blocker. Do not ship `from` param without the sanitization check passing.
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to repo owner after 48 hours.
- Escalation path and timeout: If blocked > 48 hours with no response, flag in PR comments and consider splitting the `from` param UX improvement into a follow-up if it is the sole blocker.

## Open Questions

No open questions. All design decisions confirmed during explore session.
