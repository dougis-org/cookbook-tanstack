## MODIFIED Requirements

### Requirement: fly.toml exists and configures the app for Fly.io
The project SHALL contain a `fly.toml` at the repository root that configures the Fly.io app. It MUST specify an `app` name, a `primary_region` of `sjc`, an HTTP service on internal port 3000, a `release_command` that runs the database seed script, and a health check on `/`.

#### Scenario: fly.toml is present and valid
- **WHEN** the repository root is inspected
- **THEN** a `fly.toml` file exists with `app = "cookbook-tanstack"`, `primary_region = "sjc"`, `[http_service]` with `internal_port = 3000`, `[deploy] release_command`, and a `[[http_service.checks]]` health check section

#### Scenario: release_command runs seeds
- **WHEN** the `release_command` in `fly.toml` is executed
- **THEN** it runs `npm run db:seed`, which idempotently upserts taxonomy data before any VM comes up

#### Scenario: health check is configured
- **WHEN** Fly.io evaluates the deployed VM
- **THEN** it performs an HTTP GET to `/` on port 3000 and expects a 2xx or 3xx response

#### Scenario: health check passes through without an explicit Host header
- **WHEN** the Fly.io health check executes
- **THEN** it is not required to send an explicit `Host` header — `getDomainRedirectUrl` recognizes IP-addressed `Host` headers (see `domain-redirect` spec) and passes them through without redirecting, so the health check succeeds regardless of which domain is currently configured as primary
