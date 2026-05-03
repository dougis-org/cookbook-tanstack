# Spec: CI E2E Server Warmup

## ADDED Requirements

### Requirement: ADDED CI warmup step — blocks tests until server is ready

The CI workflow SHALL include a "Warm up production server" step between "Seed database" and "Run E2E tests" that starts the server, polls `/api/health` until 200, and leaves the server running for Playwright to reuse.

#### Scenario: Server reaches ready state within timeout

- **Given** the production build exists at `.output/server/index.mjs`
- **And** MongoDB is running and reachable
- **When** the warmup step executes
- **Then** the server starts in the background
- **And** the step polls `GET /api/health` until it receives `200`
- **And** the step exits successfully with the server still running on port 3000
- **And** Playwright finds the server on port 3000 and reuses it (no second launch)

#### Scenario: Server fails to reach ready state — CI fails fast

- **Given** the server cannot reach ready state (DB unreachable, crash, or bundle error)
- **When** the warmup step polls `/api/health` for 60 seconds without a `200` response
- **Then** the `timeout 60 bash -c` command exits non-zero
- **And** the CI job fails with a clear non-zero exit code before any E2E tests run
- **And** no E2E test timeout occurs (failure mode is explicit, not flaky)

---

### Requirement: ADDED CI warmup step — SSR bundle primed before tests

The warmup step SHALL issue at least one request to a React-rendered page route after the health check passes, ensuring the SSR rendering pipeline is warmed.

#### Scenario: Belt-and-suspenders SSR warmup

- **Given** the health check has passed (server + DB ready)
- **When** the warmup step issues `curl -sf http://localhost:3000/ > /dev/null`
- **Then** the React SSR rendering bundle is loaded
- **And** the first Playwright test does not encounter an SSR cold-start delay

## MODIFIED Requirements

### Requirement: MODIFIED Playwright `reuseExistingServer` — always true

`playwright.config.ts` SHALL set `reuseExistingServer: true` unconditionally (previously `!process.env.CI`).

#### Scenario: CI — Playwright reuses pre-warmed server

- **Given** the warmup step has left a server running on port 3000
- **When** Playwright initializes and checks port 3000
- **Then** Playwright finds the server already running
- **And** Playwright does not execute the `webServer.command` (no second cold start)
- **And** E2E tests run against the pre-warmed server

#### Scenario: Local dev — Playwright reuses running dev server

- **Given** a developer has `npm run dev` running on port 3000
- **When** the developer runs `npm run test:e2e`
- **Then** Playwright finds the dev server and reuses it (same behavior as before — `!process.env.CI` was `true` locally)

#### Scenario: Local dev — Playwright starts server when none is running

- **Given** no server is running on port 3000
- **When** the developer runs `npm run test:e2e`
- **Then** Playwright executes `webServer.command` (`npm run dev -- --mode test`)
- **And** tests run normally

## REMOVED Requirements

None. The 120 s `webServer.timeout` in `playwright.config.ts` remains as a safeguard (now guards against the rare case where the pre-started server dies between warmup completion and Playwright initialization).

## Traceability

- Proposal: "Warmup step between Seed database and Run E2E tests" → Requirement: ADDED CI warmup step
- Proposal: "`reuseExistingServer: true`" → Requirement: MODIFIED Playwright reuseExistingServer
- Design Decision 4 (background process + reuse) → ADDED CI warmup step
- Design Decision 5 (reuseExistingServer unconditionally true) → MODIFIED Playwright reuseExistingServer
- Requirements → Tasks: `tasks.md` — Task: Update CI workflow; Task: Update playwright.config.ts

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: CI wall-clock overhead

- **Given** a typical CI run where MongoDB is ready and the server starts normally
- **When** the warmup step executes
- **Then** the step completes in < 15 s (from server start to health check passing)
- **And** total CI wall-clock time does not increase by more than 15 s compared to baseline

### Requirement: Reliability

#### Scenario: 10 consecutive CI runs — no first-test timeout

- **Given** the warmup step is in place
- **When** 10 CI runs are observed
- **Then** zero runs exhibit a first-E2E-test timeout attributable to an unready server

### Requirement: Security

#### Scenario: No credentials in warmup step

- **Given** the warmup step curl commands
- **When** CI logs are inspected
- **Then** no secrets, tokens, or credentials appear in the curl commands or their output
