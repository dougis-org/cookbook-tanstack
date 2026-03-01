## ADDED Requirements

### Requirement: fly.toml configures the app for production deployment
The project SHALL include a `fly.toml` at the repository root that defines the Fly.io app name, build strategy, HTTP service, and release command.

#### Scenario: fly.toml is present and valid
- **WHEN** a developer runs `fly deploy` from the project root
- **THEN** Fly.io reads `fly.toml` and deploys the Nitro server without additional flags

#### Scenario: HTTP service is exposed on port 3000
- **WHEN** the app is deployed and Fly routes external HTTPS traffic
- **THEN** Fly proxies requests to the internal port 3000 on the app VM

#### Scenario: Release command runs migrations before traffic cutover
- **WHEN** a new version is deployed
- **THEN** Fly runs `npm run db:migrate` as the release command before routing traffic to the new instance
- **THEN** if migrations fail, the deploy is aborted and the previous version continues serving

### Requirement: Dockerfile builds the Nitro production server
The project SHALL include a `Dockerfile` that produces a minimal Node.js image running the Nitro build output.

#### Scenario: Docker image builds successfully
- **WHEN** `docker build -t cookbook-tanstack .` is run in the project root
- **THEN** the image builds without errors and includes only production dependencies

#### Scenario: Container starts the server on the PORT env var
- **WHEN** the container starts with `PORT=3000`
- **THEN** the Nitro server listens on port 3000 and responds to HTTP health checks

#### Scenario: Build artifacts are present in the image
- **WHEN** the image is built after `npm run build`
- **THEN** the `.output/` (or `dist/`) directory is present and the server entry point is executable

### Requirement: Health check endpoint responds to Fly probes
The Fly HTTP service SHALL have a health check configured so Fly can detect unhealthy instances.

#### Scenario: Health check passes when server is ready
- **WHEN** the app is running and accepts connections
- **THEN** a GET request to `/` returns HTTP 200 within 10 seconds of startup

#### Scenario: Deploy is blocked on unhealthy health check
- **WHEN** the new instance fails to pass health checks after deployment
- **THEN** Fly does not route traffic to the new instance and marks the deploy as failed
