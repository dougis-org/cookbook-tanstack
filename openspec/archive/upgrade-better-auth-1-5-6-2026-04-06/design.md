## Context

- Relevant architecture: better-auth is configured in `src/lib/auth.ts`
  (server) and `src/lib/auth-client.ts` (client). The server config uses
  `mongodbAdapter` from `better-auth/adapters/mongodb`, `emailAndPassword`,
  `cookieCache` (enabled, 5-min maxAge), and two plugins: `username()` and
  `tanstackStartCookies()`. The client uses `createAuthClient` with
  `usernameClient()`.
- Dependencies: `better-auth` -> MongoDB (via Mongoose's underlying driver,
  cast through `unknown`), TanStack Start (cookie integration via plugin),
  and React (client hooks). Devtools packages are Vite-plugin + React
  component only, with no runtime auth dependency.
- Interfaces/contracts touched: `src/lib/auth.ts`, `src/lib/auth-client.ts`,
  `src/components/Header.tsx`, `package.json`, `package-lock.json`, plus
  route/component test files that were added or renamed as part of this PR.

## Goals / Non-Goals

### Goals

- Upgrade three packages to target versions while keeping code changes
  minimal and limited to the Header sign-out redirect adjustment plus related
  test updates
- Neutralize BSON UUID mismatch risk by clearing dev auth collections before first server start post-upgrade
- Confirm all auth flows pass (sign-up, sign-in, sign-out, session persistence, cookieCache behavior)
- All unit and E2E tests pass on upgraded versions, including the auth flow
  tests added or updated for the sign-out redirect behavior

### Non-Goals

- Adopting any new better-auth 1.5.x features or plugins
- Changing auth config (session TTL, cookieCache settings, plugin list)
- Upgrading to better-auth 1.6.0

## Decisions

### Decision 1: Pin better-auth to exactly 1.5.6

- Chosen: `"better-auth": "1.5.6"` (exact pin, no caret)
- Alternatives considered: `^1.5.6` (allows patch/minor auto-upgrade)
- Rationale: 1.6.0 shipped today with a breaking cookieCache change. A caret
  range would allow npm to pull 1.6.x on the next `npm install`, silently
  introducing the breaking change. An exact pin makes the intentional ceiling
  explicit and matches the issue's stated intent.
- Trade-offs: Future patch releases in 1.5.x will not auto-apply, but given
  auth library sensitivity this is acceptable. The follow-up 1.6.x issue
  will handle the next deliberate upgrade.

### Decision 2: Clear dev auth collections before first server start

- Chosen: Manually drop `users`, `sessions`, `accounts`, and
  `verifications` collections from the dev MongoDB instance before starting
  the upgraded server.
- Alternatives considered: (a) Skip clearing and rely on better-auth
  handling mixed UUID formats; (b) write a migration script to convert
  string UUIDs to BSON UUIDs.
- Rationale: No production data exists; this is a dev environment only.
  Dropping collections is instant, deterministic, and eliminates the entire
  UUID format mismatch risk. A migration script is over-engineering for dev.
- Trade-offs: Any manually created dev users/sessions are lost. Acceptable since re-creating them via sign-up takes seconds.

### Decision 3: Use `^` range for devtools packages

- Chosen: `"@tanstack/devtools-vite": "^0.5.5"` and `"@tanstack/react-devtools": "^0.10.1"`
- Alternatives considered: Exact pins
- Rationale: Devtools are dev-only dependencies with no runtime auth impact.
  Pre-1.0 semver is treated as minor = breaking, but both packages have shown
  stable interfaces within minor versions. The caret allows patch updates
  without PR churn.
- Trade-offs: Minor updates could change devtools panel behavior; acceptable since devtools don't affect production builds.

### Decision 4: Keep application changes minimal, with one intentional auth-flow exception

- Chosen: Keep the upgrade focused on dependency changes and avoid auth
  config changes in `auth.ts` and `auth-client.ts`, while allowing the
  intentional sign-out flow update that navigates users to `/auth/login` and
  the related test updates.
- Alternatives considered: (a) Preserve the previous post-sign-out behavior
  and limit the PR to dependency-only changes; (b) pre-emptively adopt 1.5.x
  new features (Agent auth plugin, email OTP resend, etc.)
- Rationale: Scope remains primarily the dependency bump, but the implemented
  diff includes a small, intentional application behavior change in the
  sign-out flow. Documenting that exception keeps the design aligned with the
  actual route/component and test changes while still avoiding unrelated
  feature work.
- Trade-offs: The diff is slightly larger than a pure dependency upgrade and
  includes a user-visible navigation change after sign-out, but this is
  acceptable because it is intentional, narrowly scoped, and covered by
  updated tests.

## Proposal to Design Mapping

- Proposal element: Pin to 1.5.6, not 1.6.0
  - Design decision: Decision 1 (exact pin)
  - Validation approach: `npm ls better-auth` confirms exact version post-install

- Proposal element: MongoDB BSON UUID storage change risk
  - Design decision: Decision 2 (clear dev auth collections)
  - Validation approach: Sign up a new user post-upgrade, verify sign-in
    works, and check MongoDB that the new user record stores a BSON UUID

- Proposal element: Cookie handling changes (1.5.2)
  - Design decision: Decision 4 (minimal app change for sign-out redirect)
    plus manual auth flow testing
  - Validation approach: Manual sign-in → sign-out → sign-in cycle; E2E auth tests pass

- Proposal element: Session freshness behavior (1.5.5)
  - Design decision: Decision 4 (minimal app change for sign-out redirect)
    plus unit test verification
  - Validation approach: Existing unit tests in `src/lib/__tests__/auth.test.ts` continue to pass

- Proposal element: Devtools upgrade
  - Design decision: Decision 3 (`^` range)
  - Validation approach: Dev server starts, devtools panel renders without console errors

## Functional Requirements Mapping

- Requirement: better-auth upgraded to exactly 1.5.6
  - Design element: Decision 1, `package.json` change
  - Acceptance criteria reference: specs/dependency-versions.md
  - Testability notes: `npm ls better-auth` output; lockfile inspection

- Requirement: All auth flows work post-upgrade
  - Design element: Decision 2 (clean DB) plus Decision 4 (minimal app
    change for sign-out redirect)
  - Acceptance criteria reference: specs/auth-flows.md
  - Testability notes: E2E tests in `src/e2e/recipes-auth.spec.ts`, `src/e2e/cookbooks-auth.spec.ts`; manual sign-up/sign-in/sign-out

- Requirement: cookieCache behavior unchanged
  - Design element: Decision 4 + Decision 1 (pinned below 1.6.0)
  - Acceptance criteria reference: specs/auth-flows.md
  - Testability notes: Session persists across page reload within the
    5-minute window; unit tests in `src/lib/__tests__/auth.test.ts`

- Requirement: Devtools load in development
  - Design element: Decision 3
  - Acceptance criteria reference: specs/dependency-versions.md
  - Testability notes: `npm run dev`, open browser, confirm devtools panel renders

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: Revoked sessions cannot be restored via DB fallback (1.5.6 fix)
  - Design element: Decision 1 (upgrade to 1.5.6 which includes the fix)
  - Acceptance criteria reference: specs/auth-flows.md
  - Testability notes: The fix is in the library; existing session
    management tests verify correct session behavior

- Requirement category: reliability
  - Requirement: Session data preserved on network errors (1.5.5 fix)
  - Design element: Decision 1
  - Acceptance criteria reference: specs/auth-flows.md
  - Testability notes: Covered by client-side session preservation behavior in unit tests

- Requirement category: operability
  - Requirement: Rollback remains low-risk and limited to reverting the
    dependency updates plus the auth-related application/test changes in this
    PR
  - Design element: Decision 4
  - Testability notes: `git diff` includes `package.json`,
    `package-lock.json`, the Header sign-out redirect change, and related
    auth test updates; rollback should revert all of those files together

## Risks / Trade-offs

- Risk/trade-off: BSON UUID mismatch on existing dev data
  - Impact: Sign-in failures for pre-upgrade dev users
  - Mitigation: Clear auth collections before first start (Decision 2)

- Risk/trade-off: `tanstackStartCookies()` interaction with cookie fixes
  - Impact: Session cookie corruption or double-encoding in TanStack Start
  - Mitigation: E2E auth tests cover cookie round-trips; manual testing confirms

- Risk/trade-off: Exact pin means missing future 1.5.x security patches
  - Impact: Low — 1.5.x is no longer the active release line
  - Mitigation: Follow-up issue for 1.6.x upgrade when ready

## Rollback / Mitigation

- Rollback trigger: Any auth E2E test failure, or manual auth flow
  (sign-up/sign-in/sign-out) failing after upgrade
- Rollback steps:
  1. `npm install better-auth@1.4.18 @tanstack/devtools-vite@0.3.12 @tanstack/react-devtools@0.7.11`
  2. Restore `package.json` version entries
  3. Clear auth collections again (UUID format will revert to strings)
  4. Verify auth works on old versions
- Data migration considerations: Auth collections must be cleared on both
  upgrade and rollback to avoid UUID format mismatches in either direction.
- Verification after rollback: Run `npm run test` and `npm run test:e2e`;
  manual sign-in flow confirms functionality.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Diagnose failing test(s) before retrying.
  If failure is pre-existing and unrelated, document it in the PR and get
  explicit reviewer sign-off.
- If security checks fail: Do not merge regardless of other status. Triage
  Codacy/Snyk findings, then either fix them or create a follow-up issue with
  the exception documented.
- If required reviews are blocked/stale: Ping reviewer after 24 hours. If no
  response after 48 hours, escalate to project owner.
- Escalation path and timeout: If CI is blocked by flaky infrastructure (not
  code), re-run once. If it fails again, investigate root cause before
  merging.

## Open Questions

No open questions. All design decisions are resolved. The BSON UUID risk
mitigation (clearing collections) is a procedural step during implementation
with no design ambiguity.
