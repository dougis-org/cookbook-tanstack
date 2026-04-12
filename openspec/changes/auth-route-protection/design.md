## Context

- **Relevant architecture:**
  - TanStack Start (SSR) with TanStack Router file-based routing in `src/routes/`
  - Better-Auth for session management; `tanstackStartCookies()` plugin forwards cookies server-side
  - `src/router.tsx` creates the router with an empty `context: {}`
  - `src/routes/__root.tsx` uses `createRootRoute` (no context type, no `beforeLoad`)
  - `src/hooks/useAuth.ts` wraps Better-Auth's reactive `useSession()` — used by UI components
  - `src/lib/middleware.ts` contains `authMiddleware` (server-only) — to be deleted
- **Dependencies:**
  - `@tanstack/react-router`: `createRootRouteWithContext`, `redirect`, `beforeLoad`
  - `@tanstack/react-start`: `createServerFn`, `getRequestHeaders`
  - `better-auth`: `auth.api.getSession({ headers })` (server), `authClient.getSession()` (client)
- **Interfaces/contracts touched:**
  - `createRouter` in `src/router.tsx` — gains a typed `RouterContext`
  - `__root.tsx` — switches to `createRootRouteWithContext<RouterContext>()`, gains `beforeLoad`
  - All protected route files — `server.middleware` removed, `beforeLoad` added
  - `LoginForm` — gains `reason` banner and `from` redirect behavior

## Goals / Non-Goals

### Goals

- Protect `/recipes/new`, `/recipes/$recipeId/edit`, and `/import` on both server and client navigation
- Session available in typed router context for all child route guards
- Single `requireAuth()` helper — no duplication across route files
- Redirect includes `reason` and `from` so login page can show context and return user
- Open-redirect attack prevented on `from` param
- Hamburger nav hides auth-required items when unauthenticated
- `middleware.ts` deleted; no dead code remains

### Non-Goals

- Tier enforcement or `requireTier()` implementation
- Protecting routes beyond the three listed
- tRPC procedure auth (separate concern)

## Decisions

### Decision 1: Router context for session (not per-route fetch)

- **Chosen:** Load session once in root `beforeLoad`, return it as `{ session }` into `RouterContext`; child route guards read `context.session`.
- **Alternatives considered:** Each protected route calls `authClient.getSession()` independently in its own `beforeLoad`.
- **Rationale:** Single session fetch per navigation; consistent session snapshot across all guards in one navigation; enables future `requireTier()` to read `context.session.user.tier` without extra queries.
- **Trade-offs:** Root `beforeLoad` adds a server RPC call on every client navigation; mitigated by Better-Auth's cookie cache (5 min window avoids DB hits).

### Decision 2: `createServerFn` for isomorphic session loading

- **Chosen:** `src/lib/get-session.ts` exports a `createServerFn`-wrapped `getSession()` that calls `auth.api.getSession({ headers: getRequestHeaders() })`.
- **Alternatives considered:** (a) Inline `typeof window === 'undefined'` guard with dynamic imports; (b) `authClient.getSession()` everywhere with a `baseURL` env var.
- **Rationale:** `createServerFn` is the TanStack Start idiomatic pattern — runs inline on the server during SSR (no HTTP roundtrip), becomes an RPC call on the client. Avoids bundling server-only `auth.ts` into the client bundle. No `baseURL` env var needed.
- **Trade-offs:** Client navigations incur one HTTP call for session; acceptable given cookie cache.

### Decision 3: `requireAuth()` returns a `beforeLoad` function

- **Chosen:** `requireAuth()` is a factory returning `({ context, location }) => void | never`. Usage: `beforeLoad: requireAuth()`.
- **Alternatives considered:** Direct function `requireAuth({ context, location })` called inline.
- **Rationale:** Factory pattern accommodates future options (e.g., `requireAuth({ reason: 'custom-message' })`); matches the future `requireTier(tier)` pattern where the tier argument is the factory param.
- **Trade-offs:** Slight indirection; minimal.

### Decision 4: `reason` + `from` search params on redirect

- **Chosen:** Guards throw `redirect({ to: '/auth/login', search: { reason, from: location.href } })`. Login page reads both via `validateSearch`. `LoginForm` shows a banner keyed on `reason` and navigates to `from` after success (relative paths only).
- **Alternatives considered:** Flash message via session storage; redirect only (no reason).
- **Rationale:** URL-carried state is simple, testable, shareable, and requires no server state. Contextual messaging satisfies the issue requirement that users understand why they were redirected. `from` prevents losing the user's intended destination.
- **Trade-offs:** `from` in URL is visible; open-redirect risk mitigated by relative-path validation in `LoginForm`.

### Decision 5: `REDIRECT_REASON_MESSAGES` map for human-readable text

- **Chosen:** `auth-guard.ts` exports a `REDIRECT_REASON_MESSAGES` record mapping `RedirectReason` string literals to display strings. `LoginForm` imports this map.
- **Rationale:** Single source of truth for message text; adding a new reason in the guard automatically makes the message available without touching `LoginForm`.
- **Trade-offs:** None significant.

### Decision 6: Delete `middleware.ts`; remove `server.middleware` from all routes

- **Chosen:** `src/lib/middleware.ts` is deleted. All route files using `server: { middleware: [authMiddleware] }` have that block removed.
- **Rationale:** `server.middleware` only fires during SSR; `beforeLoad` supersedes it for both SSR and client navigation. Keeping both would be confusing and duplicate logic.
- **Trade-offs:** Slightly more trust placed in `beforeLoad` alone; tRPC mutations retain server-side auth independently.

### Decision 7: `useAuth()` hook remains for reactive UI; context for guards only

- **Chosen:** `Header.tsx` continues using `useAuth()` (reactive `useSession()`) to conditionally render nav items. Route guards use `context.session` (navigation-time snapshot).
- **Rationale:** Two different needs: (1) UI reactivity after login/logout without navigation — requires a live subscription; (2) Guard decisions at navigation time — snapshot is sufficient and already loaded.
- **Trade-offs:** Two sources of session truth; they are complementary, not conflicting.

## Proposal to Design Mapping

- **Proposal: Router context with typed session**
  - Design decision: Decision 1 + Decision 2
  - Validation: TypeScript compilation; `context.session` accessible in child `beforeLoad` functions

- **Proposal: `requireAuth()` centralized guard**
  - Design decision: Decision 3
  - Validation: All three protected routes use `beforeLoad: requireAuth()`; no `server.middleware` remains

- **Proposal: `reason` + `from` redirect system**
  - Design decision: Decision 4 + Decision 5
  - Validation: Login page `validateSearch`; `LoginForm` banner renders for known reasons; `from` redirect after login

- **Proposal: Delete `middleware.ts`**
  - Design decision: Decision 6
  - Validation: File absent; no imports of `authMiddleware` remain in codebase

- **Proposal: Hamburger nav hides auth-required items**
  - Design decision: Decision 7 (uses `useAuth()`)
  - Validation: `session` null → links absent from DOM; `session` truthy → links present

- **Proposal: Open-redirect mitigation**
  - Design decision: Decision 4
  - Validation: Unit test — `from` values with `http://`, `//`, etc. are ignored; only relative paths followed

## Functional Requirements Mapping

- **Requirement:** Unauthenticated client-side nav to `/recipes/new` redirects to login
  - Design element: `beforeLoad: requireAuth()` in `src/routes/recipes/new.tsx`
  - Acceptance criteria reference: `specs/auth-route-guards/spec.md`
  - Testability notes: Playwright E2E — navigate while unauthenticated, assert redirect to `/auth/login`

- **Requirement:** Unauthenticated client-side nav to `/import` redirects to login
  - Design element: `beforeLoad: requireAuth()` in `src/routes/import/index.tsx`
  - Acceptance criteria reference: `specs/auth-route-guards/spec.md`
  - Testability notes: Playwright E2E — same pattern

- **Requirement:** Unauthenticated client-side nav to `/recipes/:id/edit` redirects to login
  - Design element: `beforeLoad: requireAuth()` in `src/routes/recipes/$recipeId_.edit.tsx`
  - Acceptance criteria reference: `specs/auth-route-guards/spec.md`
  - Testability notes: Playwright E2E — same pattern

- **Requirement:** Redirect includes `reason` and `from` params
  - Design element: `requireAuth()` throws `redirect({ search: { reason, from } })`
  - Acceptance criteria reference: `specs/auth-route-guards/spec.md`
  - Testability notes: Unit test `requireAuth()` — inspect thrown redirect's search params

- **Requirement:** Login page shows contextual banner
  - Design element: `LoginForm` reads `reason` via `Route.useSearch()`; renders banner from `REDIRECT_REASON_MESSAGES`
  - Acceptance criteria reference: `specs/login-redirect/spec.md`
  - Testability notes: RTL unit test — render with `reason=auth-required`, assert banner text

- **Requirement:** Login redirects to `from` after success
  - Design element: `LoginForm.handleSubmit` reads `from`, validates relative, navigates
  - Acceptance criteria reference: `specs/login-redirect/spec.md`
  - Testability notes: RTL unit test — mock `signIn`, assert `navigate` called with `from`

- **Requirement:** Hamburger nav hides New/Import Recipe when unauthenticated
  - Design element: `Header.tsx` wraps those `<Link>` elements in `{session && (...)}`
  - Acceptance criteria reference: `specs/nav-visibility/spec.md`
  - Testability notes: RTL unit test — render with null session, assert links absent

## Non-Functional Requirements Mapping

- **Requirement category:** Security
  - Requirement: No open-redirect via `from` param
  - Design element: `LoginForm` validates `from` is a relative path before navigating
  - Acceptance criteria reference: `specs/login-redirect/spec.md`
  - Testability notes: Unit test with `from=http://evil.com` — assert navigation stays on `/`

- **Requirement category:** Performance
  - Requirement: Session load adds minimal latency to navigations
  - Design element: `createServerFn` + Better-Auth `cookieCache` (5 min)
  - Acceptance criteria reference: N/A (not a hard SLA)
  - Testability notes: Manual smoke — navigations feel instant; no regression vs. current

- **Requirement category:** Reliability
  - Requirement: Session load failure does not crash app
  - Design element: `getSession` server fn — Better-Auth returns `null` on failure; `requireAuth` treats null as unauthenticated (redirects to login)
  - Acceptance criteria reference: `specs/auth-route-guards/spec.md`
  - Testability notes: Unit test `requireAuth()` with `context.session = null`

- **Requirement category:** Operability
  - Requirement: Dead code (middleware.ts) removed; no orphaned imports
  - Design element: Decision 6 — file deleted, all imports removed
  - Acceptance criteria reference: TypeScript build passes
  - Testability notes: `npm run build` passes; `grep -r authMiddleware src/` returns no results

## Risks / Trade-offs

- **Risk/trade-off:** Root `beforeLoad` session fetch on every client navigation adds latency
  - **Impact:** Navigations slightly slower than pure client-side render
  - **Mitigation:** Better-Auth `cookieCache` reduces DB hits; `createServerFn` overhead is a single lightweight HTTP call

- **Risk/trade-off:** Two session sources (context + `useSession()`) could diverge briefly
  - **Impact:** Nav items could momentarily differ from guard decisions
  - **Mitigation:** Divergence window is tiny (one navigation cycle); no security risk since guard is authoritative

## Rollback / Mitigation

- **Rollback trigger:** `beforeLoad` throws unexpectedly, breaking navigation for authenticated users; or session fetch causes unacceptable latency.
- **Rollback steps:**
  1. Revert `__root.tsx` to `createRootRoute` with no `beforeLoad`
  2. Revert `router.tsx` to `context: {}`
  3. Restore `server.middleware` on affected routes from git history
  4. Restore `middleware.ts` from git history
  5. Revert `Header.tsx` nav visibility change
  6. Revert login page `validateSearch` and `LoginForm` banner
- **Data migration considerations:** None — this change is purely routing/UI logic.
- **Verification after rollback:** Navigate to `/recipes/new` unauthenticated via direct URL; confirm server-side redirect fires. `npm run test` passes.

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Diagnose failing check; fix in a follow-up commit on the same branch before re-requesting review.
- **If security checks fail (Codacy/Snyk):** Do not merge. Address the finding or document a justified exception with the team before proceeding.
- **If required reviews are blocked/stale:** Re-request review after 24 hours. If reviewer is unavailable, escalate to another team member.
- **Escalation path and timeout:** If blocked for >48 hours, raise in team sync. After 5 business days without resolution, consider parking the branch and re-evaluating priority.

## Open Questions

No open questions. All design decisions confirmed during exploration session.
