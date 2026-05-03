# Spec: Health Endpoint (`GET /api/health`)

## ADDED Requirements

### Requirement: ADDED Health endpoint — healthy response

The system SHALL expose `GET /api/health` that returns HTTP 200 with a JSON body containing `status`, `db`, and `uptime` when the server is running and MongoDB is connected.

#### Scenario: Server and DB are ready

- **Given** the Nitro production server is running
- **And** `mongoose.connection.readyState` is `1` (connected)
- **When** a GET request is made to `/api/health` without credentials
- **Then** the response status is `200`
- **And** the response body is `{ "status": "ok", "db": "connected", "uptime": <number> }`
- **And** the `uptime` value is a positive number (seconds since process start)

#### Scenario: Response does not require authentication

- **Given** the server is running
- **When** a GET request is made to `/api/health` with no `Authorization` header or session cookie
- **Then** the response status is `200` (not `401` or `403`)

---

### Requirement: ADDED Health endpoint — degraded response

The system SHALL return HTTP 503 with `{ "status": "degraded", "db": "disconnected" }` when MongoDB is not in connected state.

#### Scenario: DB is disconnected

- **Given** `mongoose.connection.readyState` is `0` (disconnected) or `3` (disconnecting)
- **When** a GET request is made to `/api/health`
- **Then** the response status is `503`
- **And** the response body is `{ "status": "degraded", "db": "disconnected" }`

#### Scenario: DB is still connecting

- **Given** `mongoose.connection.readyState` is `2` (connecting)
- **When** a GET request is made to `/api/health`
- **Then** the response status is `503`
- **And** the response body is `{ "status": "degraded", "db": "disconnected" }`

---

### Requirement: ADDED Health endpoint triggers SSR bundle load

The system SHALL load the full server bundle (including mongoose and auth modules) as a side effect of handling the first `/api/health` request, so subsequent page-route requests are not cold-starts.

#### Scenario: First request warms the bundle

- **Given** the server has just started and no requests have been made
- **When** a GET request is made to `/api/health`
- **Then** the response is returned (200 or 503) without a timeout
- **And** a subsequent request to `/` completes within normal response time (< 5 s)

## MODIFIED Requirements

### Requirement: MODIFIED Fly.io health check path

The system's Fly.io health check SHALL poll `/api/health` (previously `/`) to verify both HTTP liveness and DB connectivity before routing traffic to a new machine.

#### Scenario: Healthy deploy promotes successfully

- **Given** a new Fly.io machine starts and the server reaches ready state
- **When** Fly polls `GET /api/health` after the `grace_period`
- **Then** the endpoint returns `200`
- **And** Fly routes traffic to the new machine

#### Scenario: Unhealthy deploy does not promote

- **Given** a new Fly.io machine starts but the DB is unreachable
- **When** Fly polls `GET /api/health`
- **Then** the endpoint returns `503`
- **And** Fly does not route traffic to the new machine
- **And** the existing healthy machine continues serving traffic

## REMOVED Requirements

### Requirement: REMOVED Fly.io health check on `/`

Previously `fly.toml` checked `/` (the React home page) for health.

Reason for removal: The root route goes through React SSR rendering and does not distinguish between server/DB failures and application-level errors. It also adds unnecessary load during health polling. Replaced by `/api/health`.

## Traceability

- Proposal: "New Nitro server route: `GET /health`" → Requirement: ADDED Health endpoint (healthy + degraded)
- Proposal: "`fly.toml`: add `[[http_service.checks]]` block" → Requirement: MODIFIED Fly.io health check path
- Design Decision 1 (TanStack Start API route) → Requirement: ADDED Health endpoint triggers SSR bundle load
- Design Decision 2 (path `/api/health`) → All health endpoint requirements
- Design Decision 3 (readyState check) → Requirement: ADDED healthy + degraded responses
- Requirements → Tasks: `tasks.md` — Task: Implement health route; Task: Update fly.toml

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Health check response latency

- **Given** the server is in steady state (bundle loaded, DB connected)
- **When** `GET /api/health` is called
- **Then** the response is returned in < 100 ms (p99 on CI runner)

### Requirement: Security

#### Scenario: No sensitive data in response

- **Given** an unauthenticated caller
- **When** `GET /api/health` returns a response
- **Then** the body contains only `status`, `db`, and `uptime` — no user data, credentials, environment variables, or internal paths

### Requirement: Reliability

#### Scenario: Health endpoint survives DB reconnect cycle

- **Given** the DB connection drops and mongoose begins reconnecting (`readyState` transitions 1 → 0 → 2 → 1)
- **When** `/api/health` is polled during the reconnect window
- **Then** it returns `503` during disconnected/connecting states and `200` once reconnected
- **And** the endpoint does not throw or crash the server process
