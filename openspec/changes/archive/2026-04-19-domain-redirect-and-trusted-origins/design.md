## Context

- Relevant architecture: TanStack Start (v1.167+) with Nitro as the SSR server, deployed to Fly.io. Better Auth handles session/cookie auth with MongoDB adapter. No existing `src/start.ts` — the global middleware entry point must be created.
- Dependencies: `@tanstack/react-start` (already installed), `better-auth` (already installed). No new packages required.
- Interfaces/contracts touched:
  - `src/start.ts` (new) — TanStack Start's global middleware entry point
  - `src/lib/auth.ts` — Better Auth config object
  - `.env.example` — env var documentation

## Goals / Non-Goals

### Goals

- 301-redirect all requests arriving at any non-primary host to `APP_PRIMARY_URL` at the same path and query
- Allow Better Auth to accept requests from multiple trusted origins via `BETTER_AUTH_TRUSTED_ORIGINS` env var
- Zero hardcoded domain names in application code
- No new npm dependencies

### Non-Goals

- Fly.io infrastructure changes
- DNS/TLS management
- Custom domain routing per user/org

## Decisions

### Decision 1: Use TanStack Start `requestMiddleware` for domain redirect

- Chosen: Create `src/start.ts` exporting `startInstance = createStart(() => ({ requestMiddleware: [domainRedirectMiddleware] }))`. Middleware reads `APP_PRIMARY_URL`, compares `Host` header, returns `new Response(null, { status: 301, headers: { Location: ... } })` when mismatch detected.
- Alternatives considered:
  - **Nitro `server/middleware/` directory**: Would also work (runs at the same layer), but uses `h3` event handler API rather than TanStack Start's native middleware API. Less idiomatic for this stack.
  - **Fly.io proxy redirect**: No native domain-redirect capability in `[http_service]`. Would need a separate Fly app.
  - **TanStack Router `beforeLoad`**: Runs client-side and after SSR routing begins — too late to intercept for a clean redirect.
- Rationale: `requestMiddleware` is the official TanStack Start hook for pre-routing server logic. Keeps redirect logic in the app codebase (auditable, testable, version-controlled). Runs before auth, before routing.
- Trade-offs: If TanStack Start changes the `src/start.ts` convention in a future version, this file needs updating. Nitro middleware would be more stable long-term but less idiomatic today.

### Decision 2: Env-driven trusted origins for Better Auth

- Chosen: `trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',').map(s => s.trim()) ?? []` in `src/lib/auth.ts`. Fly secrets hold the comma-separated list.
- Alternatives considered:
  - **Hardcoded array**: Requires code change + deploy to add/remove domains.
  - **Better Auth wildcard pattern** (`*.dougis.com`): Overly broad — would trust any subdomain.
  - **Dynamic function**: Overkill for this use case; no runtime discovery needed.
- Rationale: Env-driven list gives ops flexibility without code deploys. Trim on split handles accidental whitespace in the env var value.
- Trade-offs: If `BETTER_AUTH_TRUSTED_ORIGINS` is not set, array is empty — Better Auth falls back to trusting only `BETTER_AUTH_URL`. This is the correct secure default.

### Decision 3: Redirect only when `Host` header explicitly matches old domain(s)

- Chosen: Middleware compares `Host` header against the hostname of `APP_PRIMARY_URL`. Redirect fires only when `Host` is present and differs from primary host. Requests with no `Host` header (internal/Docker) pass through.
- Alternatives considered: Allowlist of redirect-source domains. Rejected — would require code changes to add sources.
- Rationale: Inverting the logic (redirect everything that isn't primary) is safer and simpler. Internal requests (health checks, Docker) typically lack a public `Host` header.
- Trade-offs: If a misconfigured `APP_PRIMARY_URL` is set, the app would redirect itself. Mitigated by clear `.env.example` documentation and local testing requirement.

## Proposal to Design Mapping

- Proposal element: 301 redirect from old domain preserving path + query
  - Design decision: Decision 1 — `requestMiddleware` returning `Response` with `Location` header constructed from `new URL(request.url).pathname + search`
  - Validation approach: Integration test — request with `Host: cookbook-tanstack.fly.dev` returns 301 with correct `Location`

- Proposal element: Better Auth multi-domain trusted origins
  - Design decision: Decision 2 — `trustedOrigins` from `BETTER_AUTH_TRUSTED_ORIGINS` env var
  - Validation approach: Unit test on auth config; E2E test that auth succeeds from both domains

- Proposal element: Env-driven, no hardcoded domains in code
  - Design decision: Decisions 1 + 2 combined — `APP_PRIMARY_URL` and `BETTER_AUTH_TRUSTED_ORIGINS` are the only source of domain names
  - Validation approach: Code review / grep confirming no literal `recipe.dougis.com` or `cookbook-tanstack.fly.dev` in source

## Functional Requirements Mapping

- Requirement: Request to `cookbook-tanstack.fly.dev/recipes/123?q=foo` redirects to `https://recipe.dougis.com/recipes/123?q=foo` with status 301
  - Design element: Decision 1 — `requestMiddleware` redirect logic
  - Acceptance criteria reference: `specs/domain-redirect/spec.md` — redirect behavior
  - Testability notes: Unit-testable by constructing a mock `Request` with old host; assert response status and `Location` header

- Requirement: Request to `recipe.dougis.com` passes through unchanged
  - Design element: Decision 1 — middleware no-op when host matches primary
  - Acceptance criteria reference: `specs/domain-redirect/spec.md` — pass-through behavior
  - Testability notes: Mock `Request` with primary host; assert `next()` called, no redirect response

- Requirement: Better Auth accepts sessions/requests from all domains in `BETTER_AUTH_TRUSTED_ORIGINS`
  - Design element: Decision 2 — `trustedOrigins` config
  - Acceptance criteria reference: `specs/trusted-origins/spec.md`
  - Testability notes: Auth config unit test validates array is populated from env; E2E test confirms no CSRF rejection from listed origins

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: Adding a new trusted domain requires only env var change, no code deploy
  - Design element: Decision 2 — env-driven `trustedOrigins`
  - Acceptance criteria reference: `specs/trusted-origins/spec.md` — env config requirement
  - Testability notes: Documented in `.env.example`; verified by code review

- Requirement category: security
  - Requirement: `trustedOrigins` defaults to empty (not permissive) when env var is unset
  - Design element: Decision 2 — `?? []` fallback
  - Acceptance criteria reference: `specs/trusted-origins/spec.md` — secure default
  - Testability notes: Unit test with `BETTER_AUTH_TRUSTED_ORIGINS` unset; assert `trustedOrigins` is `[]`

- Requirement category: reliability
  - Requirement: Requests with no `Host` header are not redirected
  - Design element: Decision 3 — guard clause before redirect
  - Acceptance criteria reference: `specs/domain-redirect/spec.md` — internal request passthrough
  - Testability notes: Mock `Request` with no `Host` header; assert pass-through

## Risks / Trade-offs

- Risk/trade-off: `createMiddleware().server()` returning a `Response` without calling `next()` may behave unexpectedly in current TanStack Start version
  - Impact: Redirect response sent but SSR pipeline still runs; wasted compute or doubled response
  - Mitigation: Verify via integration test. If confirmed broken, switch to Nitro `server/middleware/` using `h3` `sendRedirect` — functionally identical behavior, different API

- Risk/trade-off: `APP_PRIMARY_URL` not set in local dev
  - Impact: Middleware skips redirect (no URL to redirect to) — correct behavior in local dev
  - Mitigation: Guard: `if (!primaryUrl) return next()`. Document in `.env.example` as optional for local dev

## Rollback / Mitigation

- Rollback trigger: Auth failures on `recipe.dougis.com` after deploy, or Fly health check failures
- Rollback steps:
  1. `fly secrets unset APP_PRIMARY_URL` — disables redirect middleware (guard clause short-circuits)
  2. Revert `BETTER_AUTH_TRUSTED_ORIGINS` to single domain if needed
  3. Redeploy is not required if only env vars changed
- Data migration considerations: None — no schema or data changes
- Verification after rollback: Hit `recipe.dougis.com` auth endpoints; confirm 200 responses and valid session cookies

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix failing checks before proceeding. No exceptions for this change.
- If security checks fail: Block merge. This change touches auth config — security scan must pass.
- If required reviews are blocked/stale: Ping reviewer after 24h. Escalate to Doug after 48h.
- Escalation path and timeout: Doug is the sole reviewer. If unavailable, change waits — no self-merge on auth-touching PRs.

## Open Questions

- Resolved: Skip redirect when `Host` is missing or non-public — handled by guard clause in Decision 3.
