## GitHub Issues

- #352

## Why

- Problem statement: App has a new primary domain (`recipe.dougis.com`) but the old Fly.io subdomain (`cookbook-tanstack.fly.dev`) remains live. Better Auth broke because its `baseURL` was not updated, and requests from the old domain were rejected as untrusted origins. Users hitting the old URL get a broken auth experience.
- Why now: The new domain is already in production and is the intended canonical URL. Every day the old domain remains active without redirect degrades SEO and user trust.
- Business/user impact: Auth failures on the old domain lock out users who navigate or bookmark the old URL. Uncorrected 1:1 traffic split between domains fragments analytics and crawl budget.

## Problem Space

- Current behavior: `cookbook-tanstack.fly.dev` and `recipe.dougis.com` both serve the app. Better Auth only trusts one origin; requests from the non-configured domain fail auth checks. No redirect exists between domains.
- Desired behavior: Any request arriving at `cookbook-tanstack.fly.dev` is permanently redirected (301) to `recipe.dougis.com` at the same path and query string. Better Auth accepts requests from all legitimate domains during transition. Configuration is env-driven so adding/removing trusted domains requires no code changes.
- Constraints: Cannot use Fly.io `[http_service]` for domain-level redirects (no native support). Must stay within the TanStack Start / Nitro server layer. Must not break auth for users already on `recipe.dougis.com`. Must preserve path and query string on redirect.
- Assumptions: `APP_PRIMARY_URL` and `BETTER_AUTH_TRUSTED_ORIGINS` will be set as Fly.io secrets. `BETTER_AUTH_URL` already exists as a Fly secret and points to the new domain.
- Edge cases considered: Health check path (`/`) must not redirect (Fly.io pings `cookbook-tanstack.fly.dev` internal port directly — but health checks hit the internal port, not the public hostname, so redirect is safe). Requests without a `Host` header pass through without redirect. Future additional domains only need env var updates, not code changes.

## Scope

### In Scope

- `src/start.ts`: new file — global TanStack Start request middleware that 301-redirects any request whose host does not match `APP_PRIMARY_URL`
- `src/lib/auth.ts`: add `trustedOrigins` config, populated from `BETTER_AUTH_TRUSTED_ORIGINS` env var
- `.env.example`: document new env vars (`APP_PRIMARY_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`)
- Fly.io secret documentation in `docs/` or PR description

### Out of Scope

- DNS configuration for `recipe.dougis.com`
- Fly.io certificate provisioning
- Removing `cookbook-tanstack.fly.dev` from Fly.io (may stay as internal hostname)
- Any changes to auth provider configuration beyond `trustedOrigins`

## What Changes

- New `src/start.ts` exports `startInstance` via `createStart` with a `domainRedirectMiddleware` in `requestMiddleware`
- Middleware reads `APP_PRIMARY_URL` env var; if request `Host` header differs from primary host, returns `301` response to primary URL + same path + query
- `src/lib/auth.ts` gains `trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',') ?? []`
- `.env.example` updated with `APP_PRIMARY_URL` and `BETTER_AUTH_TRUSTED_ORIGINS`

## Risks

- Risk: TanStack Start `requestMiddleware` returning a `Response` directly (without calling `next()`) may not short-circuit the render pipeline in all versions.
  - Impact: Redirect fires but SSR continues, causing double work or unexpected behavior.
  - Mitigation: Verify with a quick integration test that a 301 response is returned and the body is empty. If blocked, fall back to Nitro `server/middleware/` directory approach.
- Risk: `BETTER_AUTH_TRUSTED_ORIGINS` misconfiguration (typo, missing domain) could break auth on a legitimate domain.
  - Impact: Auth failures in production.
  - Mitigation: Test locally with both domains in the list before deploying. Document exact format in `.env.example`.
- Risk: Fly.io internal health checks travel through public hostname and get redirected.
  - Impact: Health check fails, machines restart.
  - Mitigation: Fly health checks hit internal port directly (not through the public load balancer), so they won't carry the public `Host` header. Low risk; verify after deploy.

## Open Questions

- Question: Should the middleware skip redirect for requests where `Host` is missing or is an IP (e.g., local Docker / internal calls)?
  - Needed from: Doug
  - Blocker for apply: no — safe default is to only redirect when host is explicitly the old domain string

## Non-Goals

- Building a multi-tenant domain routing system
- Supporting custom domains per user/org
- Automatic certificate provisioning for new domains

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
