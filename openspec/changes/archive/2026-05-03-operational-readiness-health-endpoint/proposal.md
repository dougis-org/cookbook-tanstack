## GitHub Issues

- #434

## Why

- **Problem statement:** The Nitro production server lazy-loads the SSR bundle (~2.5 MB mongoose+auth) on first request. The Playwright `webServer` health-check URL responds as soon as the HTTP server is listening — before the SSR bundle finishes loading — so E2E tests can be dispatched against a server that isn't fully initialized, causing flaky timeouts.
- **Why now:** The current mitigation (a 120 s `webServer.timeout` in `playwright.config.ts`) is a blunt instrument that delays failure without guaranteeing readiness. The project is also deploying to Fly.io, where a proper health endpoint enables automatic rollback of bad deploys — a capability worth building once and using everywhere.
- **Business/user impact:** Flaky CI erodes confidence in the test suite and wastes developer time on retriggers. Missing deploy health gates mean a bad build can promote to production undetected.

## Problem Space

- **Current behavior:** Playwright polls `http://localhost:3000` (the root URL) and starts dispatching tests as soon as it receives any HTTP response, even if the SSR bundle hasn't loaded. A 120 s timeout provides headroom but no actual readiness guarantee.
- **Desired behavior:** Before any E2E test runs, the server is fully initialized (HTTP listening + DB connected + SSR bundle loaded). If the server fails to reach this state within a bounded timeout, CI fails fast with a clear error rather than timing out mid-test.
- **Constraints:** The fix must not significantly increase CI wall-clock time (< 15 s overhead acceptable). The health endpoint must be unauthenticated and on a conventional path compatible with Fly.io's default health check expectations.
- **Assumptions:** The SSR bundle load is triggered by the first request to any React-rendered route. API/server routes (Nitro-only) do not trigger it.
- **Edge cases considered:**
  - Server crashes after warmup but before/during tests: CI fails, retrigger acceptable.
  - DB temporarily unreachable at startup: health endpoint returns 503, warmup loop fails, CI fails fast.
  - Local dev: `reuseExistingServer: true` means E2E tests reuse a running dev server if present, or Playwright starts one via the existing command — no behavior change for developers.

## Scope

### In Scope

- New Nitro server route: `GET /health` — returns `{ status, db, uptime }`, 200 on healthy / 503 on DB disconnected
- CI workflow: new "Warm up production server" step that starts the server, polls `/health`, hits two page routes to prime SSR, then leaves the server running for Playwright to reuse
- `playwright.config.ts`: change `reuseExistingServer` to `true` unconditionally (Playwright reuses the pre-warmed server in CI; locally reuses running dev server or starts one)
- `fly.toml`: add `[[http_service.checks]]` block pointing to `/health`

### Out of Scope

- Separate liveness vs. readiness endpoints (`/health/live`, `/health/ready`)
- SSR bundle eager-loading at server startup (the curl-based page warmup is sufficient)
- Authentication or rate-limiting on the health endpoint
- Structured logging or metrics emission from the health handler
- Any changes to the application's production deployment process beyond `fly.toml`

## What Changes

- **New file:** `server/routes/health.get.ts` — Nitro server route returning health JSON
- **Modified:** `.github/workflows/build-and-test.yml` — add warmup step between "Seed database" and "Run E2E tests"; remove `SERVER_PID` cleanup (Playwright manages the process)
- **Modified:** `playwright.config.ts` — `reuseExistingServer: true`
- **Modified:** `fly.toml` — add health check block

## Risks

- Risk: `/health` path conflicts with an existing route or reserved Nitro path
  - Impact: Low — server routes in `server/routes/` take precedence over React routes; no existing `/health` route
  - Mitigation: Verify no collision during implementation; test manually

- Risk: `reuseExistingServer: true` locally causes tests to run against stale dev state
  - Impact: Low — same behavior as current local default (`reuseExistingServer: !process.env.CI` was already `true` locally)
  - Mitigation: No change to local developer experience

- Risk: CI warmup step starts the server as a background process; if the process fails to bind, the `timeout 60 bash -c` poll will exhaust and fail the job
  - Impact: Desired — fast failure is the goal
  - Mitigation: Pipe server stderr in the warmup step for debugging

- Risk: Fly.io health check interval/timeout values need tuning for cold-start times
  - Impact: Medium — too-aggressive values cause Fly to fail a valid deploy
  - Mitigation: Use conservative initial values (grace_period: 20s, interval: 10s) and tune after first deploy

## Open Questions

No unresolved ambiguity. All design decisions were resolved during exploration:
- Single `/health` endpoint (not split liveness/readiness)
- Playwright manages server process; CI retrigger is acceptable if server dies mid-test
- SSR warmup via page-route curl hits (not eager bundle loading)
- Fly.io is the deploy target; health check path is `/health` (Fly default convention)

## Non-Goals

- This is not a general observability or APM initiative
- This does not implement pre-promotion smoke tests beyond the health check
- This does not change how the application handles DB reconnection at runtime
- This does not add a `/metrics` endpoint or Prometheus integration

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
