## Context

- **Relevant architecture:** TanStack Start (file-based routing, `src/routes/`), Nitro production server (`.output/server/index.mjs`), Mongoose connection singleton (`src/db/index.ts` — connects eagerly on module import), Playwright E2E (`playwright.config.ts` — `webServer` block with health-check URL), Fly.io deploy (`fly.toml` — existing `[[http_service.checks]]` block already present, currently pointing to `/`)
- **Dependencies:** `mongoose` (connection state), `@tanstack/react-router` (`createFileRoute`), GitHub Actions workflow (`.github/workflows/build-and-test.yml`)
- **Interfaces/contracts touched:** New `GET /api/health` HTTP endpoint; `playwright.config.ts` `webServer.reuseExistingServer`; `fly.toml` health check path/params; CI workflow step sequence

## Goals / Non-Goals

### Goals

- Provide a reliable readiness signal that CI can poll before dispatching E2E tests
- Ensure the health endpoint itself triggers lazy SSR bundle load (so polling `/api/health` is sufficient warmup — no separate page-route curl hits needed)
- Expose DB connectivity status so Fly.io can roll back deploys where the DB is unreachable
- Return correct HTTP status codes so Fly.io's health check needs no custom response parsing

### Non-Goals

- Kubernetes-style split liveness/readiness endpoints
- Metrics, tracing, or Prometheus exposition
- Runtime DB reconnection logic
- Authentication or rate limiting on the health route

## Decisions

### Decision 1: Route location — TanStack Start API route, not Nitro server route

- **Chosen:** `src/routes/api/health.ts` using `createFileRoute("/api/health")` with `server.handlers.GET`
- **Alternatives considered:** Nitro server route (`server/routes/health.get.ts`) — would live outside the app bundle, bypassing SSR bundle lazy-load entirely; raw `h3` event handler in `vite.config.ts` — non-standard and untestable
- **Rationale:** TanStack Start API routes in `src/routes/api/` are compiled into the same server bundle as all other app code. Hitting `/api/health` therefore triggers the same lazy bundle load that page routes trigger. This makes a single poll on `/api/health` sufficient to both verify readiness and warm the bundle — no separate page-route curl needed. Consistent with existing pattern (`src/routes/api/upload.tsx`).
- **Trade-offs:** If TanStack Start ever separates the SSR rendering bundle from the API handler bundle, the warmup guarantee breaks. Mitigated by the SSR page curl fallback documented in CI warmup step.

### Decision 2: Health endpoint path — `/api/health`

- **Chosen:** `/api/health`
- **Alternatives considered:** Bare `/health` — conventional for many platforms, zero-config for some tooling; but inconsistent with this project's route structure and requires a separate file outside `src/routes/api/`
- **Rationale:** All server-side endpoints in this project live under `/api/`. Fly.io accepts any path — `fly.toml` already specifies the path explicitly. The existing `fly.toml` check uses `/` with a `Host` header; updating to `/api/health` is a direct substitution.
- **Trade-offs:** Slightly less conventional than bare `/health`; acceptable given explicit `fly.toml` configuration.

### Decision 3: DB readiness via `mongoose.connection.readyState`

- **Chosen:** Check `mongoose.connection.readyState === 1` (connected); return 200 if true, 503 if false
- **Alternatives considered:** Issue a lightweight DB command (e.g., `db.admin().ping()`) — more authoritative but adds async latency and can throw; importing mongoose alone triggers connect (see `src/db/index.ts` line 16–21), so `readyState` reflects actual connection state
- **Rationale:** `src/db/index.ts` calls `mongoose.connect()` on import when `readyState === 0`. By the time the health route handler runs, mongoose is either connecting (readyState 2) or connected (readyState 1). Polling until 200 naturally waits out the connecting phase. No need for an active ping.
- **Trade-offs:** `readyState` can flicker if the connection drops and reconnects; acceptable for a health gate (transient degraded = fail the check = don't promote)

### Decision 4: CI warmup — background process, Playwright reuses

- **Chosen:** CI starts the server as a background job, polls `/api/health` until 200 (60 s timeout → job fails fast), optionally hits `/` once as belt-and-suspenders SSR warmup, then leaves the server running. `playwright.config.ts` sets `reuseExistingServer: true` so Playwright finds the warm server on port 3000.
- **Alternatives considered:** Issue's proposed kill-and-relaunch — discards warmup benefit; cold start twice. Playwright-owned server with longer timeout — blunt, no readiness guarantee.
- **Rationale:** `reuseExistingServer: true` with a pre-started server means Playwright skips its `command` launch entirely. The `webServer.command` remains as a fallback for local dev when no server is running. If the server dies mid-test, CI fails and is retriggered — acceptable.
- **Trade-offs:** CI owns server lifecycle (not Playwright); server death mid-run is unrecoverable without retrigger. Low probability in practice.

### Decision 5: `reuseExistingServer` — `true` unconditionally

- **Chosen:** `reuseExistingServer: true` (remove CI conditional)
- **Alternatives considered:** New env var `PLAYWRIGHT_REUSE_SERVER` — unnecessary indirection
- **Rationale:** Locally, `true` means: if a dev server is running, reuse it (same as before since `!CI` was `true` locally). If no server is running, Playwright starts one via `command`. In CI, Playwright finds the pre-warmed server. No behavior change for local developers.
- **Trade-offs:** None meaningful.

## Proposal to Design Mapping

- Proposal element: New Nitro server route for `/health`
  - Design decision: Decision 1 (TanStack Start API route, not Nitro route) + Decision 2 (path `/api/health`)
  - Validation approach: `curl http://localhost:3000/api/health` returns 200 JSON; DB down returns 503

- Proposal element: CI warmup step polls health, leaves server running for Playwright
  - Design decision: Decision 4 (background process + reuseExistingServer)
  - Validation approach: CI log shows "Server ready" before Playwright dispatches first test; no first-test timeout in 10 consecutive CI runs

- Proposal element: `reuseExistingServer: true`
  - Design decision: Decision 5
  - Validation approach: `playwright.config.ts` diff; local E2E run with running dev server reuses it

- Proposal element: `fly.toml` health check update
  - Design decision: Decision 2 (path) + Decision 3 (503 on DB down)
  - Validation approach: Fly deploy shows machine health check passing before traffic routes; bad deploy with DB unreachable fails health check and does not promote

## Functional Requirements Mapping

- Requirement: Health endpoint returns 200 with `{ status, db, uptime }` when server and DB are ready
  - Design element: `src/routes/api/health.ts`, Decision 3
  - Acceptance criteria reference: specs/health-endpoint.md
  - Testability notes: Unit test with mocked `mongoose.connection.readyState = 1`; integration test against running server

- Requirement: Health endpoint returns 503 with `{ status: "degraded", db: "disconnected" }` when DB is unavailable
  - Design element: `src/routes/api/health.ts`, Decision 3
  - Acceptance criteria reference: specs/health-endpoint.md
  - Testability notes: Unit test with mocked `readyState = 0`; integration test with DB container stopped

- Requirement: CI E2E step never dispatches tests against an unready server
  - Design element: CI warmup step, Decision 4
  - Acceptance criteria reference: specs/ci-warmup.md
  - Testability notes: Observe CI logs; no first-test timeout failures

- Requirement: `fly.toml` health check polls `/api/health`, rolls back if 503
  - Design element: `fly.toml` update, Decisions 2 + 3
  - Acceptance criteria reference: specs/fly-health-gate.md
  - Testability notes: Manual Fly deploy verification; Fly dashboard shows health check passing

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Warmup adds < 15 s to CI wall-clock time
  - Design element: CI warmup step polls with 1 s interval; mongoose connects in < 5 s on warm CI runners
  - Acceptance criteria reference: specs/ci-warmup.md
  - Testability notes: Compare CI run duration before and after; warmup step duration in CI logs

- Requirement category: reliability
  - Requirement: CI fails fast (≤ 60 s) if server never reaches ready state
  - Design element: `timeout 60 bash -c` in warmup step
  - Acceptance criteria reference: specs/ci-warmup.md
  - Testability notes: Simulate DB failure; verify job fails within 60 s with clear error

- Requirement category: operability
  - Requirement: Health endpoint usable by external monitors and Fly.io without auth
  - Design element: No auth check in health handler (unlike upload route)
  - Acceptance criteria reference: specs/health-endpoint.md
  - Testability notes: Curl without credentials returns 200

## Risks / Trade-offs

- Risk/trade-off: TanStack Start separates API handler bundle from SSR rendering bundle in a future version
  - Impact: `/api/health` no longer warms the SSR rendering bundle; first React-rendered request is slow again
  - Mitigation: Keep the optional `curl http://localhost:3000/ > /dev/null` line in the CI warmup step as a belt-and-suspenders SSR hit; comment explains its purpose

- Risk/trade-off: Fly.io health check grace period too short for cold-start machines
  - Impact: New machine fails health check before DB connection established; deploy fails spuriously
  - Mitigation: Initial `grace_period = "20s"` is conservative; tune after first deployment observation

- Risk/trade-off: Server process exits between warmup completion and first Playwright test
  - Impact: All tests fail immediately
  - Mitigation: Accept retrigger as recovery path; probability is low (server crash in < 5 s window)

## Rollback / Mitigation

- **Rollback trigger:** CI E2E failure rate increases after merge, or Fly.io health check causes spurious deploy failures
- **Rollback steps:**
  1. Revert `playwright.config.ts` `reuseExistingServer` to `!process.env.CI`
  2. Remove the warmup step from `.github/workflows/build-and-test.yml`
  3. Revert `fly.toml` `[[http_service.checks]]` to previous state (path `/`, original values)
  4. `src/routes/api/health.ts` can remain (harmless endpoint)
- **Data migration considerations:** None
- **Verification after rollback:** One green CI run; Fly deploy succeeds

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Investigate warmup step logs and server stderr output first. If the failure is a pre-existing flake unrelated to this change, retrigger once before escalating.
- **If security checks fail:** Do not merge. The health endpoint is unauthenticated by design; verify no sensitive data is exposed in the response body.
- **If required reviews are blocked/stale:** Ping reviewer after 24 h; escalate to repo owner after 48 h.
- **Escalation path and timeout:** If blocked > 48 h with no review, author may self-merge with a comment explaining the unblock rationale.

## Open Questions

No open questions. All decisions resolved during design exploration.
