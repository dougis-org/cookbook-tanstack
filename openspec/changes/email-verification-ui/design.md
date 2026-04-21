## Context

- Relevant architecture:
  - `src/lib/auth.ts` — BetterAuth server config with `emailVerification.sendOnSignUp: true` and `sendVerificationEmail` hook (calls `sendEmail()`)
  - `src/lib/auth-client.ts` — `createAuthClient()` with `useSession` exported; `useSession()` is reactive (live BetterAuth session)
  - `src/hooks/useAuth.ts` — merges server SSR session with reactive client session; exposes `session.user.emailVerified`
  - `src/routes/__root.tsx` — root layout renders `<Header />` then `{children}` inside `QueryClientProvider` + `ThemeProvider`
  - `src/components/auth/RegisterForm.tsx` — navigates to `/` on success; needs "check your email" state instead
  - BetterAuth handles token verification at `/api/auth/verify-email?token=xxx&callbackURL=...`; redirects to `callbackURL` afterward
- Dependencies: `better-auth`, `@tanstack/react-router`, `useAuth` hook, `sendEmail` utility
- Interfaces/contracts touched:
  - `authClient.sendVerificationEmail({ email, callbackURL })` — resend
  - `session.user.emailVerified: boolean` — gate condition
  - BetterAuth redirect contract from `/api/auth/verify-email` (params TBD; inspect at runtime)

## Goals / Non-Goals

### Goals

- Surface "check your email" state after registration
- Create `/auth/verify-email` landing page handling success and error states
- Show persistent banner to authenticated unverified users with resend option
- Auto-dismiss banner when `emailVerified` flips `true` (reactive via `useSession`)

### Non-Goals

- Hard route blocking on `emailVerified`
- Per-feature gates (deferred to social features)
- Email template redesign
- Admin verification tools

## Decisions

### Decision 1: Register form — "check your email" state

- Chosen: Add `isSubmitted` boolean state to `RegisterForm.tsx`; on `onSuccess` set `isSubmitted = true` instead of navigating. Render a static message: "Check your inbox — we've sent a verification link to `{email}`." with a link to `/auth/login`.
- Alternatives considered: Redirect to a dedicated `/auth/verify-pending` route — adds a route + page for a one-sentence message; unnecessary complexity.
- Rationale: Mirrors the pattern already used in `ForgotPasswordForm.tsx` (`isSubmitted` state). Consistent, minimal.
- Trade-offs: User stays on the register page URL which looks slightly odd, but matches existing auth pattern.

### Decision 2: Verification landing page — `/auth/verify-email`

- Chosen: New route `src/routes/auth/verify-email.tsx` with `validateSearch` reading optional `?error` param. Default (no error param): show success state. With `?error`: show error state + resend. Since BetterAuth redirects here after processing, `session.user.emailVerified` will already be `true` on success — use that as the authoritative signal via `useAuth()`.
- Alternatives considered: Polling `/api/auth/get-session` until `emailVerified = true` — fragile; session-based approach is cleaner.
- Rationale: BetterAuth's redirect is the handshake; reading the session state gives ground truth without extra round-trips.
- Trade-offs: If BetterAuth appends custom params (e.g., `?status=success`), those are ignored — but the session check covers the success case.

### Decision 3: Banner placement and session source

- Chosen: `VerificationBanner` component rendered in `__root.tsx` between `<Header />` and `{children}`. Uses `useAuth()` hook to get `session`; checks `session?.user && !session.user.emailVerified`. `useSession()` inside `useAuth` is reactive — banner auto-dismisses when `emailVerified` flips without page reload.
- Alternatives considered: Banner inside `Header.tsx` — couples a page-level concern to the navigation component. Separate layout wrapper — over-engineered for one component.
- Rationale: `__root.tsx` is the natural place for app-wide UI. `useAuth()` already handles the SSR/client hydration merge.
- Trade-offs: Banner renders on every route including auth pages. Guard: only render when `isLoggedIn && !emailVerified`.

### Decision 4: Resend verification

- Chosen: Call `authClient.sendVerificationEmail({ email: session.user.email, callbackURL: "/auth/verify-email" })` directly from the banner and from the landing page error state. Show loading spinner during request; show "Email sent!" on success; surface BetterAuth error message on failure (e.g., rate limit).
- Alternatives considered: tRPC endpoint wrapping resend — unnecessary indirection for a client-side auth action.
- Rationale: BetterAuth client methods are the right abstraction; no server logic needed.
- Trade-offs: Rate-limit feedback depends on BetterAuth error shape; test at runtime.

### Decision 5: Banner auth-page suppression

- Chosen: Suppress banner on any route starting with `/auth/` using `useRouterState` to get current pathname.
- Alternatives considered: Always show — clutters auth forms. Separate layout — unnecessary.
- Rationale: Verification banner is irrelevant on login/register/forgot-password pages; avoid visual noise.
- Trade-offs: One `useRouterState` call in the banner component.

## Proposal to Design Mapping

- Proposal element: Post-registration "check your email" feedback
  - Design decision: Decision 1 — `isSubmitted` state in `RegisterForm.tsx`
  - Validation approach: Unit test `RegisterForm` — assert "check your email" message renders on mock `onSuccess`

- Proposal element: `/auth/verify-email` landing page
  - Design decision: Decision 2 — route with `?error` param handling + session check
  - Validation approach: Unit test page component with mock session states; E2E test clicking emailed link

- Proposal element: Persistent unverified banner
  - Design decision: Decision 3 — `VerificationBanner` in `__root.tsx`
  - Validation approach: Unit test banner renders for unverified user, hidden for verified, hidden on `/auth/*`

- Proposal element: Resend verification email
  - Design decision: Decision 4 — `authClient.sendVerificationEmail` from banner + error page
  - Validation approach: Unit test mock resend, assert loading/success/error states render

- Proposal element: Auto-dismiss banner on verification
  - Design decision: Decision 3 — reactive `useSession()` in `useAuth()` hook
  - Validation approach: Unit test — mock session flip from unverified to verified, assert banner unmounts

## Functional Requirements Mapping

- Requirement: User sees "check your email" after registration
  - Design element: `RegisterForm.tsx` `isSubmitted` state (Decision 1)
  - Acceptance criteria reference: specs/register-feedback
  - Testability notes: Mock `authClient.signUp.email` `onSuccess`; assert message contains email address

- Requirement: `/auth/verify-email` renders success state when `emailVerified = true`
  - Design element: Session check in landing page component (Decision 2)
  - Acceptance criteria reference: specs/verify-email-page
  - Testability notes: Mock `useAuth()` returning `emailVerified: true`; assert success message

- Requirement: `/auth/verify-email` renders error + resend when `?error` param present
  - Design element: `validateSearch` + conditional render (Decision 2)
  - Acceptance criteria reference: specs/verify-email-page
  - Testability notes: Render with `?error=INVALID_TOKEN`; assert error text and resend button visible

- Requirement: Banner visible to authenticated unverified users, hidden for verified/unauthenticated
  - Design element: `VerificationBanner` logic (Decision 3)
  - Acceptance criteria reference: specs/verification-banner
  - Testability notes: Three mock session states (null, unverified, verified); assert each render

- Requirement: Resend shows loading/success/error feedback
  - Design element: Local state in banner + landing page (Decision 4)
  - Acceptance criteria reference: specs/verification-banner, specs/verify-email-page
  - Testability notes: Mock `authClient.sendVerificationEmail`; test pending/resolved/rejected paths

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Banner does not crash if `session.user` lacks `emailVerified` field (edge case: old session shape)
  - Design element: Optional chain `session?.user?.emailVerified`
  - Acceptance criteria reference: specs/verification-banner
  - Testability notes: Pass session with missing `emailVerified` field; assert no throw

- Requirement category: performance
  - Requirement: Banner adds no extra network requests; uses already-loaded session
  - Design element: `useAuth()` hook — reactive, no additional fetch (Decision 3)
  - Acceptance criteria reference: implicit — no new `useQuery` calls in banner
  - Testability notes: Verify no API calls in banner render via mock inspection

- Requirement category: security
  - Requirement: Resend does not expose email to unauthenticated users
  - Design element: Banner only rendered when `isLoggedIn` (Decision 3); email sourced from session
  - Acceptance criteria reference: specs/verification-banner
  - Testability notes: Null session — assert banner not rendered

## Risks / Trade-offs

- Risk/trade-off: BetterAuth redirect params from `/api/auth/verify-email` are undocumented
  - Impact: Landing page may not receive expected `?error` format
  - Mitigation: Inspect actual redirect with a test token during implementation; make error state also triggerable by any non-empty `error` param value

- Risk/trade-off: `authClient.sendVerificationEmail` may require email verification client plugin
  - Impact: Method undefined at runtime
  - Mitigation: Verify method availability in auth-client.ts in Task 1; add `emailVerificationClient()` plugin if needed

## Rollback / Mitigation

- Rollback trigger: Banner causes layout regressions or auth page UI breaks
- Rollback steps: Remove `<VerificationBanner />` from `__root.tsx`; revert `RegisterForm.tsx` `isSubmitted` change; remove `/auth/verify-email` route
- Data migration considerations: None — no schema changes
- Verification after rollback: Run `npm run test && npm run test:e2e`; visually verify auth pages

## Operational Blocking Policy

- If CI checks fail: fix before pushing further commits; do not merge with failing tests or type errors
- If security checks fail: treat as blocking; address Codacy/Snyk findings before PR merge
- If required reviews are blocked/stale: re-request review after 24h; escalate to repo owner after 48h
- Escalation path and timeout: Unblock within 48h or close PR and re-open when available

## Open Questions

- What exact params does BetterAuth append to `callbackURL` on verification success vs failure? Inspect at runtime during Task 3 (implement landing page). If no params on success, rely solely on session `emailVerified` state.
