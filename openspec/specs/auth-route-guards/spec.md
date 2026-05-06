## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Route guard on `/import`

The system SHALL redirect unauthenticated users to `/auth/login` when they navigate to `/import`, whether via direct URL or client-side navigation.

#### Scenario: Unauthenticated direct URL access to /import

- **Given** the user is not logged in
- **When** the user navigates directly to `/import`
- **Then** the server redirects to `/auth/login?reason=auth-required&from=%2Fimport`
- **And** the import page is never rendered

#### Scenario: Unauthenticated client-side navigation to /import

- **Given** the user is not logged in and is on another page (e.g., `/`)
- **When** the user navigates to `/import` via the hamburger menu or programmatic navigation
- **Then** TanStack Router `beforeLoad` fires, context.session is null, and the router redirects to `/auth/login?reason=auth-required&from=%2Fimport`
- **And** the import page component is never rendered

#### Scenario: Authenticated user can access /import

- **Given** the user is logged in (valid session)
- **When** the user navigates to `/import`
- **Then** the import page renders normally with no redirect

### Requirement: ADDED `beforeLoad` guard on `/recipes/new`

The system SHALL protect `/recipes/new` via `beforeLoad` (replacing server-only middleware) so it fires on client-side navigation as well.

#### Scenario: Unauthenticated client-side navigation to /recipes/new

- **Given** the user is not logged in and is on another page
- **When** the user navigates to `/recipes/new` (e.g., via the hamburger link that will be hidden but accessible via URL)
- **Then** `beforeLoad` fires before the component renders, and the router redirects to `/auth/login?reason=auth-required&from=%2Frecipes%2Fnew`

#### Scenario: Authenticated user can access /recipes/new

- **Given** the user is logged in
- **When** the user navigates to `/recipes/new`
- **Then** the new recipe form renders normally

### Requirement: ADDED `beforeLoad` guard on `/recipes/:recipeId/edit`

The system SHALL protect `/recipes/:recipeId/edit` via `beforeLoad`.

#### Scenario: Unauthenticated client-side navigation to edit route

- **Given** the user is not logged in
- **When** the user navigates to `/recipes/abc123/edit`
- **Then** the router redirects to `/auth/login?reason=auth-required&from=%2Frecipes%2Fabc123%2Fedit`

#### Scenario: Authenticated user can access edit route

- **Given** the user is logged in
- **When** the user navigates to `/recipes/abc123/edit`
- **Then** the edit form renders normally

### Requirement: ADDED Session available in router context

The system SHALL load the current session in the root route `beforeLoad` and expose it as `context.session` for all child routes.

#### Scenario: Session present for authenticated user

- **Given** the user is logged in
- **When** any navigation occurs
- **Then** `context.session` in child `beforeLoad` functions is a non-null session object

#### Scenario: Session null for unauthenticated user

- **Given** the user is not logged in
- **When** any navigation occurs
- **Then** `context.session` in child `beforeLoad` functions is `null`

### Requirement: ADDED `requireAuth()` redirect includes reason and from params

The system SHALL include `reason=auth-required` and `from=<attempted-path>` in the redirect URL when `requireAuth()` fires.

#### Scenario: Redirect URL contains correct params

- **Given** an unauthenticated user attempts to access `/recipes/new`
- **When** `requireAuth()` fires in `beforeLoad`
- **Then** the redirect target is `/auth/login` with `reason=auth-required` and `from=%2Frecipes%2Fnew` in the search params

## MODIFIED Requirements

### Requirement: MODIFIED Route protection for `/recipes/new` and `/recipes/:id/edit`

The system SHALL protect these routes via `beforeLoad` instead of `server.middleware`, ensuring both server and client navigation are guarded.

#### Scenario: Protection works on client-side navigation (was broken)

- **Given** the user is not logged in and the app is already hydrated client-side
- **When** the user navigates to `/recipes/new` via a link click (no full page reload)
- **Then** the guard fires (was previously bypassed) and redirects to login

## REMOVED Requirements

### Requirement: REMOVED `server.middleware: [authMiddleware]` on route files

Reason for removal: `server.middleware` only executes during SSR (server-side rendering of the initial page load), not during client-side SPA navigation. Replaced by `beforeLoad: requireAuth()` which executes in both contexts. The `src/lib/middleware.ts` file is deleted.

### Requirement: ADDED `requireVerifiedAuth()` route guard (email-verification-hard-gate)

The system SHALL redirect unauthenticated users to `/auth/login` and redirect authenticated-but-unverified users to `/auth/verify-email?from=<path>` when accessing any route guarded by `requireVerifiedAuth()`. Authenticated verified users SHALL pass through without redirect.

#### Scenario: FR-1 — Unauthenticated user is redirected to login

- **Given** `context.session` is `null`
- **When** `requireVerifiedAuth()` runs in `beforeLoad`
- **Then** a redirect is thrown to `/auth/login` with `reason: 'auth-required'` and `from: <current path>` search params

#### Scenario: FR-2 — Authenticated unverified user is redirected to verify-email

- **Given** `context.session.user.emailVerified` is `false`
- **When** `requireVerifiedAuth()` runs in `beforeLoad`
- **Then** a redirect is thrown to `/auth/verify-email` with `from: <current path>` search param

#### Scenario: FR-3 — Authenticated verified user passes through

- **Given** `context.session.user.emailVerified` is `true`
- **When** `requireVerifiedAuth()` runs in `beforeLoad`
- **Then** no redirect is thrown and the route renders normally

#### Scenario: NFR-2 — Legacy session with undefined emailVerified passes through

- **Given** `context.session.user.emailVerified` is `undefined`
- **When** `requireVerifiedAuth()` runs in `beforeLoad`
- **Then** no redirect is thrown (only explicit `false` gates)

### Requirement: ADDED `requireVerifiedAuth()` applied to content-creation and tier-change routes

The system SHALL apply `requireVerifiedAuth()` as the `beforeLoad` guard on `/recipes/new`, `/recipes/$recipeId/edit`, `/import`, and `/change-tier`. The `/cookbooks/` listing page is intentionally public and is NOT guarded at the route level; instead, the `cookbooks.create` tRPC mutation uses `verifiedProcedure` to enforce verification at the API level.

#### Scenario: Unverified user navigates to recipe creation

- **Given** an authenticated user with `emailVerified: false`
- **When** they navigate to `/recipes/new`
- **Then** they are redirected to `/auth/verify-email?from=/recipes/new`

#### Scenario: Unverified user navigates to tier change

- **Given** an authenticated user with `emailVerified: false`
- **When** they navigate to `/change-tier`
- **Then** they are redirected to `/auth/verify-email?from=/change-tier`

#### Scenario: Unverified user attempts to create a cookbook via API

- **Given** an authenticated user with `emailVerified: false`
- **When** they call the `cookbooks.create` tRPC mutation
- **Then** the mutation returns a `FORBIDDEN` error with cause `email-not-verified`

## Traceability

- Proposal: "protect /recipes/new, /recipes/$recipeId/edit, /import via beforeLoad" → Requirements: ADDED route guards × 3, MODIFIED route protection
- Proposal: "replace server.middleware pattern" → Requirement: REMOVED server.middleware
- Proposal: "requireAuth() centralized helper" → Requirement: ADDED session in router context + requireAuth redirect params
- Design Decision 1 (router context) → Requirement: ADDED session in router context
- Design Decision 2 (createServerFn) → Requirement: ADDED session in router context
- Design Decision 3 (requireAuth factory) → Requirement: ADDED requireAuth redirect params
- Requirements → Tasks: Task: set up RouterContext + root beforeLoad; Task: create auth-guard.ts; Task: migrate route files; Task: delete middleware.ts

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Server-side direct URL access is also blocked

- **Given** the user is not logged in
- **When** the user accesses `/import` or `/recipes/new` directly via a full page load (no prior hydration)
- **Then** the server-side `beforeLoad` fires (via `createServerFn` inline execution) and redirects to login before any HTML for the protected page is sent

#### Scenario: No dead auth code remains

- **Given** the implementation is complete
- **When** the codebase is searched for `authMiddleware`
- **Then** no imports or usages are found; `src/lib/middleware.ts` does not exist

### Requirement: Reliability

#### Scenario: Session load returns null (e.g., session expired mid-navigation)

- **Given** Better-Auth's `getSession` returns `null` (expired or invalid session)
- **When** `requireAuth()` evaluates `context.session`
- **Then** `context.session` is `null`, the guard redirects to login — no error thrown, no crash

### Requirement: TypeScript

#### Scenario: Type-safe context in all guard calls

- **Given** `RouterContext` is typed with `session: AuthSession | null`
- **When** `npm run build` is executed
- **Then** TypeScript compiles without errors; `context.session` is correctly typed in all `beforeLoad` functions
