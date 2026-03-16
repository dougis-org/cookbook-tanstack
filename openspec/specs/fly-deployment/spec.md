## ADDED Requirements

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

---

### Requirement: Dockerfile produces a deployable production image
The project SHALL contain a `Dockerfile` at the repository root using a multi-stage build. The builder stage MUST use `node:24-alpine`, install all dependencies and run `npm run build`. The runtime stage MUST copy the build output (`.output/`), production dependencies (`node_modules/`), and application source (`src/`) needed by the Fly.io `release_command` for database seeding. It MUST expose port 3000 and start the server with `node .output/server/index.mjs`.

#### Scenario: Dockerfile builds successfully
- **WHEN** `docker build .` is run from the repository root
- **THEN** the build completes without error and produces an image that includes `.output/server/index.mjs`

#### Scenario: Container starts and serves traffic
- **WHEN** the built image is run with `MONGODB_URI`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` set
- **THEN** the server listens on port 3000 and responds to HTTP requests

#### Scenario: Image does not contain devDependencies source files
- **WHEN** the final image layer is inspected
- **THEN** Vite, Playwright, Vitest, and other devDependency binaries are NOT present in `node_modules`

---

### Requirement: GitHub Actions workflow deploys only on PR merge to main
The project SHALL contain `.github/workflows/deploy.yml` that triggers on `pull_request` closed events targeting `main`, with a job-level condition `if: github.event.pull_request.merged == true`. It MUST use the official `superfly/flyctl-actions` action, authenticate via a `FLY_API_TOKEN` GitHub secret, and run `flyctl deploy --remote-only`.

#### Scenario: Workflow triggers on PR merge to main
- **WHEN** a pull request targeting `main` is merged
- **THEN** the `deploy.yml` workflow is triggered automatically

#### Scenario: Workflow does NOT trigger on direct push to main
- **WHEN** a commit is pushed directly to `main` without a pull request
- **THEN** the deploy workflow is NOT triggered

#### Scenario: Fly.io deployment invoked with remote build
- **WHEN** the deploy job runs
- **THEN** it calls `flyctl deploy --remote-only`, offloading the Docker build to Fly.io builders

#### Scenario: FLY_API_TOKEN is used for authentication
- **WHEN** the deploy step executes
- **THEN** it reads `FLY_API_TOKEN` from GitHub Actions secrets (not hardcoded in the workflow file)
