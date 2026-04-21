## GitHub Issues

- dougis-org/cookbook-tanstack#385

## Why

- Problem statement: After merging PR #382 (domain redirect middleware), fly.io health checks began failing on all machines. Both machines show `0/1` health checks, causing fly's load balancer to return 503 on both `cookbook-tanstack.fly.dev` and `recipe.dougis.com`.
- Why now: App is completely down in production. Fix is urgent.
- Business/user impact: 100% downtime — no requests served on either domain.

## Problem Space

- Current behavior: Fly.io health check sends `GET /` with `Host: [fdaa:1e:bb7b:a7b:652:ebdb:c00e:2]:3000` (internal IPv6 machine address). The domain redirect middleware parses the hostname, finds it differs from `recipe.dougis.com`, and returns HTTP 301. Fly treats 301 as a health check failure. Both machines stay in `0/1` state. Fly returns 503 to all traffic.
- Desired behavior: Health checks pass (HTTP 2xx). Machines become healthy. Traffic is served on `recipe.dougis.com` (redirect from fly.dev still works for browser users).
- Constraints: Fix must not break the domain redirect for real browser traffic. `APP_PRIMARY_URL` env var is already deployed as a fly secret.
- Assumptions: Fly health checks use the machine's internal IPv6 address as the `Host` header and do not follow redirects.
- Edge cases considered:
  - IPv6 hosts with brackets `[addr]:port` — already handled by domain-redirect URL parsing
  - IPv4 internal addresses — must also be skipped
  - Loopback `127.0.0.1` / `[::1]` — must also be skipped
  - Fly health check header injection (`Host: recipe.dougis.com`) as belt-and-suspenders

## Scope

### In Scope

- Fix `src/lib/domain-redirect.ts` to skip redirect when request host is an IP address (IPv4 or IPv6)
- Update `fly.toml` health check to explicitly send `Host: recipe.dougis.com` header (belt-and-suspenders)
- Add/update unit tests for the IP-address passthrough behavior

### Out of Scope

- Changing the redirect logic for any non-IP hostname
- Adding a dedicated `/health` endpoint (not needed with the two fixes above)
- Changes to `BETTER_AUTH_TRUSTED_ORIGINS` or auth configuration
- DNS / Cloudflare configuration for `recipe.dougis.com`

## What Changes

- `src/lib/domain-redirect.ts`: After parsing `requestHostname`, return `null` (pass through) if it is an IPv4 or IPv6 address
- `fly.toml`: Add `[http_service.checks.headers]` block with `Host = "recipe.dougis.com"` to the existing health check stanza
- `src/lib/__tests__/domain-redirect.test.ts`: Add test cases for IPv4, IPv6, and bracketed IPv6 hosts

## Risks

- Risk: Fly.toml header syntax for health checks may differ from expected TOML structure
  - Impact: Health check config silently ignored; falls back to IP-addressed requests (fix A still covers this)
  - Mitigation: Fix A (code change) is the primary fix; Fix B (fly.toml) is belt-and-suspenders. Either alone solves the problem.
- Risk: IP-address passthrough in domain-redirect could allow spoofed IP Host headers from external traffic
  - Impact: Very low — external HTTP requests with `Host: 1.2.3.4` would not be redirected, but the app would still serve them normally
  - Mitigation: Acceptable risk; external clients using IP Host headers are rare and non-malicious in practice

## Open Questions

No unresolved ambiguity. Both fixes are well-understood from log analysis. fly.toml header syntax can be verified locally before deploy.

## Non-Goals

- Replacing the domain redirect approach with a fly-level redirect rule
- Adding rate limiting or bot detection to the health check path
- Monitoring / alerting for future health check regressions

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
