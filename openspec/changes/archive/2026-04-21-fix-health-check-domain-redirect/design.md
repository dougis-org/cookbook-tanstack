## Context

- Relevant architecture: `src/lib/domain-redirect.ts` — pure helper, exported `getDomainRedirectUrl(request, primaryUrl)`. Used by `src/start.ts` TanStack Start request middleware. `fly.toml` defines the `http_service.checks` health check config.
- Dependencies: No new dependencies. Fly.io TOML v2 health check spec supports `[http_service.checks.headers]`.
- Interfaces/contracts touched:
  - `getDomainRedirectUrl` signature unchanged; behavior change: returns `null` for IP-addressed hosts
  - `fly.toml` `[[http_service.checks]]` stanza — adds `[http_service.checks.headers]`

## Goals / Non-Goals

### Goals

- Health checks return HTTP 2xx so fly marks machines healthy
- Domain redirect still fires for real browser traffic on `cookbook-tanstack.fly.dev`
- No regression to existing redirect logic for named hostnames

### Non-Goals

- Changing redirect behavior for any valid non-IP hostname
- Adding a dedicated `/health` endpoint
- Altering auth or CORS trusted origins logic

## Decisions

### Decision 1: Skip redirect for IP-addressed Host headers in domain-redirect.ts

- Chosen: After parsing `requestHostname`, detect IPv4 (`/^(\d{1,3}\.){3}\d{1,3}$/`) or IPv6 (`/^[0-9a-f:]+$/i`) and return `null` (pass through)
- Alternatives considered:
  - Dedicated `/health` endpoint — adds a new route and more surface area; overkill when the simpler guard fixes it
  - Allowlist specific fly internal subnets — brittle; fly internal IP ranges can change
- Rationale: IP addresses as `Host` headers always indicate system/internal traffic (health checks, load balancer pings). Legitimate browser requests always use a named hostname.
- Trade-offs: Minimal. Very rare case where an external client uses a raw IP as Host — they would not be redirected, but they'd still get served normally.

### Decision 2: Add explicit Host header to fly.toml health check (belt-and-suspenders)

- Chosen: Add `[http_service.checks.headers]` with `Host = "recipe.dougis.com"` to the health check stanza
- Alternatives considered:
  - Change health check path to `/health` — requires adding a new server route; not needed
  - Remove health check — eliminates the check entirely; unsafe for production
- Rationale: Makes health checks exercise the real domain path (same as a browser visit). Decision 1 alone is sufficient, but this makes the health check more realistic and removes IP-as-Host from the equation entirely.
- Trade-offs: If `recipe.dougis.com` DNS ever breaks, health check fails — but that would be a real failure, not a false negative.

## Proposal to Design Mapping

- Proposal element: IP-address host passthrough in domain-redirect
  - Design decision: Decision 1 — regex guard before redirect return
  - Validation approach: Unit tests with IPv4, IPv6, bracketed IPv6 host headers
- Proposal element: fly.toml health check Host header
  - Design decision: Decision 2 — `[http_service.checks.headers]` block
  - Validation approach: Deploy and verify `fly machines list` shows `1/1` checks; `curl -sI` returns non-503

## Functional Requirements Mapping

- Requirement: `getDomainRedirectUrl` returns `null` for IPv4 host `1.2.3.4`
  - Design element: Decision 1 regex `/^(\d{1,3}\.){3}\d{1,3}$/`
  - Acceptance criteria reference: specs/domain-redirect-ip-passthrough.md
  - Testability notes: Pure function; test with mocked Request object
- Requirement: `getDomainRedirectUrl` returns `null` for IPv6 host `fdaa:1e:bb7b:a7b:652:ebdb:c00e:2`
  - Design element: Decision 1 regex `/^[0-9a-f:]+$/i`
  - Acceptance criteria reference: specs/domain-redirect-ip-passthrough.md
  - Testability notes: Pure function; test with bracketed IPv6 in Host header
- Requirement: `getDomainRedirectUrl` still redirects named non-primary hostnames (e.g. `cookbook-tanstack.fly.dev`)
  - Design element: Decision 1 — guard runs before existing redirect logic, not replacing it
  - Acceptance criteria reference: existing tests + specs/domain-redirect-ip-passthrough.md regression
  - Testability notes: Existing test suite must pass unchanged
- Requirement: fly health check returns 2xx after deploy
  - Design element: Decision 2 — Host header on health check
  - Acceptance criteria reference: specs/fly-health-check.md
  - Testability notes: `fly machines list` shows `1/1`; `curl -sI https://recipe.dougis.com/` returns 2xx or valid redirect

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Zero downtime after fix deploy
  - Design element: Both decisions apply independently; either alone restores health checks
  - Acceptance criteria reference: specs/fly-health-check.md
  - Testability notes: Monitor fly logs for health check passes after deploy

- Requirement category: security
  - Requirement: IP passthrough does not open redirect bypass for crafted requests
  - Design element: Decision 1 — only skips redirect, does not change authorization or session logic
  - Acceptance criteria reference: specs/domain-redirect-ip-passthrough.md
  - Testability notes: Verify redirected and non-redirected responses are identical content-wise

## Risks / Trade-offs

- Risk/trade-off: IPv6 regex `/^[0-9a-f:]+$/i` could false-positive on a hex-only hostname
  - Impact: Negligible; valid hostnames always contain dots or are TLD-rooted
  - Mitigation: Regex is combined with the fact that requestHostname has already been extracted from `new URL(...)` which normalizes format

## Rollback / Mitigation

- Rollback trigger: Health checks still `0/1` after deploy, or new 5xx errors introduced
- Rollback steps:
  1. `git revert <commit>` targeting `domain-redirect.ts` and `fly.toml` changes
  2. `fly deploy` to push reverted image
  3. Verify machines return to prior state (app was already broken; revert returns to pre-fix state)
- Data migration considerations: None — no schema or data changes
- Verification after rollback: `fly machines list` + `curl -sI https://cookbook-tanstack.fly.dev/`

## Operational Blocking Policy

- If CI checks fail: Do not deploy. Fix failing tests or type errors before proceeding.
- If security checks fail: Do not deploy. Review Codacy/Snyk findings; address or document as accepted risk.
- If required reviews are blocked/stale: Ping in PR after 24h. After 48h escalate to repo owner.
- Escalation path and timeout: App is in full downtime — treat as P0. Escalate immediately if CI blocks deploy.

## Open Questions

No open questions. Both fixes are fully specified and independently testable.
