---
name: tests
description: Tests for the operational-readiness-health-endpoint change
---

# Tests

## Overview

All implementation follows strict TDD: write a failing test → write the simplest code to pass it → refactor. Test file location: `src/routes/api/__tests__/health.test.ts`.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** before any implementation code. Run and confirm it fails.
2. **Write the simplest code** to make the test pass.
3. **Refactor** while keeping tests green.

## Test Cases

### Task 1 & 2: Health endpoint implementation (`src/routes/api/health.ts`)

Maps to: specs/health-endpoint.md — all ADDED scenarios

#### Unit tests (mock `mongoose.connection.readyState`)

- [ ] **TC-H-01** — Healthy response body shape
  - Mock `readyState = 1`
  - Call `GET /api/health`
  - Assert status `200`
  - Assert body matches `{ status: "ok", db: "connected", uptime: expect.any(Number) }`
  - Assert `uptime > 0`

- [ ] **TC-H-02** — Healthy response contains no extra fields
  - Mock `readyState = 1`
  - Call `GET /api/health`
  - Assert body keys are exactly `["status", "db", "uptime"]`

- [ ] **TC-H-03** — Degraded response when DB disconnected (`readyState = 0`)
  - Mock `readyState = 0`
  - Call `GET /api/health`
  - Assert status `503`
  - Assert body is `{ status: "degraded", db: "disconnected" }`

- [ ] **TC-H-04** — Degraded response when DB still connecting (`readyState = 2`)
  - Mock `readyState = 2`
  - Call `GET /api/health`
  - Assert status `503`
  - Assert body is `{ status: "degraded", db: "disconnected" }`

- [ ] **TC-H-05** — No authentication required
  - Make request with no `Authorization` header and no session cookie
  - Assert status is not `401` or `403`

#### Coverage target

All branches of the `readyState` check must be covered. Aim for 100% line coverage on `src/routes/api/health.ts`.

---

### Task 3: `playwright.config.ts` change

No automated test exists for this config change. Validation is:

- [ ] **TC-P-01** — Manual: confirm `reuseExistingServer: true` appears in `playwright.config.ts` (no CI conditional)
- [ ] **TC-P-02** — CI observation: Playwright logs show "Reusing existing server" rather than launching a new one (visible in CI stdout when `stdout: 'pipe'`)

---

### Task 4: CI warmup step

No automated test for YAML changes. Validation is observational:

- [ ] **TC-C-01** — CI run completes with "Server ready." log line appearing before E2E tests start
- [ ] **TC-C-02** — Simulated failure: if `/api/health` never returns 200, the warmup step exits non-zero within 60 s and the job fails before E2E tests (verify in a test branch where DB is intentionally broken)
- [ ] **TC-C-03** — 10 consecutive green CI runs show zero first-test timeouts

---

### Task 5: `fly.toml` health check update

No automated test for config changes. Validation is:

- [ ] **TC-F-01** — Manual: confirm `path = "/api/health"` in `fly.toml` `[[http_service.checks]]` block
- [ ] **TC-F-02** — Manual: confirm `grace_period = "20s"` and `interval = "10s"`
- [ ] **TC-F-03** — Manual: confirm the `[http_service.checks.headers]` block with `Host` is removed
- [ ] **TC-F-04** — Post-deploy: Fly dashboard shows health check passing for new machine before it receives traffic

## Traceability

| Test Case | Task | Spec Scenario |
|-----------|------|---------------|
| TC-H-01   | Task 2 | health-endpoint.md — Healthy response body |
| TC-H-02   | Task 2 | health-endpoint.md — No sensitive data in response |
| TC-H-03   | Task 2 | health-endpoint.md — DB disconnected |
| TC-H-04   | Task 2 | health-endpoint.md — DB still connecting |
| TC-H-05   | Task 2 | health-endpoint.md — No authentication required |
| TC-P-01/02| Task 3 | ci-warmup.md — Playwright reuses pre-warmed server |
| TC-C-01   | Task 4 | ci-warmup.md — Server reaches ready state |
| TC-C-02   | Task 4 | ci-warmup.md — CI fails fast |
| TC-C-03   | Task 4 | ci-warmup.md — 10 consecutive CI runs |
| TC-F-01–04| Task 5 | health-endpoint.md — Fly.io deploy promotes/rolls back |
