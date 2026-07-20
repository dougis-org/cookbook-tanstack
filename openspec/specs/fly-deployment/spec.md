## Requirements

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

#### Scenario: health check sends explicit Host header
- **WHEN** the Fly.io health check executes
- **THEN** it sends `Host: recipe.dougis.com` so the request exercises the real domain path and does not trigger domain-redirect logic based on an IP-addressed host

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

### Requirement: Dockerfile accepts client-exposed build-time variables via ARG
The `Dockerfile` builder stage SHALL declare `ARG` entries for `VITE_ADSENSE_ENABLED`, `VITE_GOOGLE_ADSENSE_TOP_SLOT_ID`, `VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID`, `VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID`, and `VITE_GOOGLE_ANALYTICS_ID`, and MUST re-export each as an `ENV` of the same name before `RUN npm run build`, so Vite inlines their values into the compiled client bundle.

#### Scenario: Build args are visible to the Vite build
- **Given** the `Dockerfile` builder stage declares matching `ARG`/`ENV` pairs for the 5 variables
- **When** `docker build --build-arg VITE_ADSENSE_ENABLED=true --build-arg VITE_GOOGLE_ADSENSE_TOP_SLOT_ID=1234567890 .` is run
- **Then** the resulting client bundle contains `import.meta.env.VITE_ADSENSE_ENABLED` resolved to `"true"` and `import.meta.env.VITE_GOOGLE_ADSENSE_TOP_SLOT_ID` resolved to `"1234567890"` (verifiable by grepping the compiled JS for the literal slot ID string)

#### Scenario: Missing build args degrade gracefully
- **Given** the `Dockerfile` builder stage declares the `ARG`/`ENV` pairs but no values are supplied
- **When** `docker build .` is run with no `--build-arg` flags for these variables
- **Then** the build still succeeds, and the resulting bundle behaves exactly as it does today (`AdSlot` renders `SponsorSlot`/no ads, no GA tag)

---

### Requirement: Deploy workflow forwards client-exposed configuration as build args
`.github/workflows/deploy.yml` SHALL pass `VITE_ADSENSE_ENABLED`, `VITE_GOOGLE_ADSENSE_TOP_SLOT_ID`, `VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID`, `VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID`, and `VITE_GOOGLE_ANALYTICS_ID` to `flyctl deploy` as `--build-arg` flags, with values sourced from GitHub Actions repository Variables (`vars.*`), not Secrets.

#### Scenario: Deploy step includes build args sourced from repo variables
- **Given** the 5 GitHub Actions repository Variables exist with valid values
- **When** the `deploy` job in `deploy.yml` runs the `flyctl deploy` step
- **Then** the invoked command includes `--build-arg VITE_ADSENSE_ENABLED=${{ vars.VITE_ADSENSE_ENABLED }}` and the equivalent flags for the other four variables

#### Scenario: Values are not sourced from GitHub Secrets
- **Given** `deploy.yml` is inspected
- **When** the `--build-arg` flags for these 5 variables are read
- **Then** none of them reference `secrets.*` — only `vars.*` — because their values are inlined into public client JavaScript and are not confidential

---

### Requirement: Deploy job validates required build-time variables before deploying
The `deploy` job in `.github/workflows/deploy.yml` SHALL include a step, running before the `flyctl deploy` step, that checks all 5 required Variables (`VITE_ADSENSE_ENABLED`, `VITE_GOOGLE_ADSENSE_TOP_SLOT_ID`, `VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID`, `VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID`, `VITE_GOOGLE_ANALYTICS_ID`) are non-empty, and MUST fail the job with a message naming the missing variable(s) if any is unset or empty. This step MUST exist only in `deploy.yml` and MUST NOT be added to any PR-triggered or non-production workflow.

#### Scenario: Deploy fails loudly when a required variable is missing
- **Given** one of the 5 required repository Variables is unset or empty
- **When** the `deploy` job runs (triggered by PR merge to `main` or `workflow_dispatch`)
- **Then** the validation step fails the job before the `flyctl deploy` step executes, and the failure message names the missing variable(s)

#### Scenario: Deploy proceeds when all required variables are present
- **Given** all 5 required repository Variables are set to non-empty values
- **When** the `deploy` job runs
- **Then** the validation step passes and the job proceeds to `flyctl deploy`

#### Scenario: Validation does not run on non-production workflows
- **Given** the repository's PR-triggered CI workflows (unit tests, typecheck, lint, e2e)
- **When** those workflows run on a pull request
- **Then** none of them execute the build-time-variable validation step — it exists solely inside `deploy.yml`'s `deploy` job

---

### Requirement: GitHub Actions workflow deploys only on PR merge to main
The project SHALL contain `.github/workflows/deploy.yml` that triggers on `pull_request` closed events targeting `main`, with a job-level condition `if: github.event.pull_request.merged == true` (or manual `workflow_dispatch`). It MUST use the official `superfly/flyctl-actions` action, authenticate via a `FLY_API_TOKEN` GitHub secret, validate that the 5 required client-exposed build-time Variables are present (failing loudly if not), and then run `flyctl deploy --remote-only` with `--build-arg` flags for those same 5 variables sourced from repository Variables.

#### Scenario: Workflow triggers on PR merge to main
- **WHEN** a pull request targeting `main` is merged
- **THEN** the `deploy.yml` workflow is triggered automatically

#### Scenario: Workflow does NOT trigger on direct push to main
- **WHEN** a commit is pushed directly to `main` without a pull request
- **THEN** the deploy workflow is NOT triggered

#### Scenario: Fly.io deployment invoked with remote build and configuration build args
- **Given** the build-time variable validation step has passed
- **WHEN** the deploy job runs
- **THEN** it calls `flyctl deploy --remote-only` with `--build-arg` flags for all 5 client-exposed configuration variables, offloading the Docker build (with those args) to Fly.io builders

#### Scenario: FLY_API_TOKEN is used for authentication
- **WHEN** the deploy step executes
- **THEN** it reads `FLY_API_TOKEN` from GitHub Actions secrets (not hardcoded in the workflow file)
