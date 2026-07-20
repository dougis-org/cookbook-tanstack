## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-07-20-fix-adsense-buildarg-plumbing/design.md) document, not a replacement.

### Requirement: ADDED Dockerfile accepts client-exposed build-time variables via ARG

The `Dockerfile` builder stage SHALL declare `ARG` entries for `VITE_ADSENSE_ENABLED`, `VITE_GOOGLE_ADSENSE_TOP_SLOT_ID`, `VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID`, `VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID`, and `VITE_GOOGLE_ANALYTICS_ID`, and MUST re-export each as an `ENV` of the same name before `RUN npm run build`, so Vite inlines their values into the compiled client bundle.

#### Scenario: Build args are visible to the Vite build

- **Given** the `Dockerfile` builder stage declares matching `ARG`/`ENV` pairs for the 5 variables
- **When** `docker build --build-arg VITE_ADSENSE_ENABLED=true --build-arg VITE_GOOGLE_ADSENSE_TOP_SLOT_ID=1234567890 .` is run
- **Then** the resulting client bundle contains `import.meta.env.VITE_ADSENSE_ENABLED` resolved to `"true"` and `import.meta.env.VITE_GOOGLE_ADSENSE_TOP_SLOT_ID` resolved to `"1234567890"` (verifiable by grepping the compiled JS for the literal slot ID string)

#### Scenario: Missing build args degrade gracefully

- **Given** the `Dockerfile` builder stage declares the `ARG`/`ENV` pairs but no values are supplied
- **When** `docker build .` is run with no `--build-arg` flags for these variables
- **Then** the build still succeeds, and the resulting bundle behaves exactly as it does today (`AdSlot` renders `SponsorSlot`/no ads, no GA tag)

### Requirement: ADDED Deploy workflow forwards client-exposed configuration as build args

`.github/workflows/deploy.yml` SHALL pass `VITE_ADSENSE_ENABLED`, `VITE_GOOGLE_ADSENSE_TOP_SLOT_ID`, `VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID`, `VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID`, and `VITE_GOOGLE_ANALYTICS_ID` to `flyctl deploy` as `--build-arg` flags, with values sourced from GitHub Actions repository Variables (`vars.*`), not Secrets.

#### Scenario: Deploy step includes build args sourced from repo variables

- **Given** the 5 GitHub Actions repository Variables exist with valid values
- **When** the `deploy` job in `deploy.yml` runs the `flyctl deploy` step
- **Then** the invoked command includes `--build-arg VITE_ADSENSE_ENABLED=${{ vars.VITE_ADSENSE_ENABLED }}` and the equivalent flags for the other four variables

#### Scenario: Values are not sourced from GitHub Secrets

- **Given** `deploy.yml` is inspected
- **When** the `--build-arg` flags for these 5 variables are read
- **Then** none of them reference `secrets.*` — only `vars.*` — because their values are inlined into public client JavaScript and are not confidential

### Requirement: ADDED Deploy job validates required build-time variables before deploying

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

## MODIFIED Requirements

### Requirement: MODIFIED GitHub Actions workflow deploys only on PR merge to main

The project SHALL contain `.github/workflows/deploy.yml` that triggers on `pull_request` closed events targeting `main`, with a job-level condition `if: github.event.pull_request.merged == true`. It MUST use the official `superfly/flyctl-actions` action, authenticate via a `FLY_API_TOKEN` GitHub secret, validate that the 5 required client-exposed build-time Variables are present (failing loudly if not), and then run `flyctl deploy --remote-only` with `--build-arg` flags for those same 5 variables sourced from repository Variables.

#### Scenario: Workflow triggers on PR merge to main

- **Given** a pull request targeting `main`
- **When** it is merged
- **Then** the `deploy.yml` workflow is triggered automatically

#### Scenario: Workflow does NOT trigger on direct push to main

- **Given** a commit is pushed directly to `main` without a pull request
- **When** the push occurs
- **Then** the deploy workflow is NOT triggered

#### Scenario: Fly.io deployment invoked with remote build and configuration build args

- **Given** the build-time variable validation step has passed
- **When** the deploy job runs
- **Then** it calls `flyctl deploy --remote-only` with `--build-arg` flags for all 5 client-exposed configuration variables, offloading the Docker build (with those args) to Fly.io builders

#### Scenario: FLY_API_TOKEN is used for authentication

- **Given** the deploy step executes
- **When** it authenticates to Fly.io
- **Then** it reads `FLY_API_TOKEN` from GitHub Actions secrets (not hardcoded in the workflow file)

## Traceability

- Proposal element: `Dockerfile` gains `ARG`/`ENV` plumbing -> Requirement: ADDED Dockerfile accepts client-exposed build-time variables via ARG
- Proposal element: `deploy.yml` passes values as `--build-arg` sourced from repo Variables -> Requirement: ADDED Deploy workflow forwards client-exposed configuration as build args
- Proposal element: prod-only loud failure if Variables are unset, no non-prod noise -> Requirement: ADDED Deploy job validates required build-time variables before deploying
- Proposal element: `VITE_ADSENSE_ENABLED` provisioned as `true` -> covered operationally by Task group "Repository configuration" (not a code-level requirement; the requirement above governs presence/non-emptiness, not the specific value)
- Design decision: Decision 1 (ARG/ENV plumbing) -> Requirement: ADDED Dockerfile accepts client-exposed build-time variables via ARG
- Design decision: Decision 2 (Variables not Secrets) -> Requirement: ADDED Deploy workflow forwards client-exposed configuration as build args
- Design decision: Decision 5 (prod-only loud validation) -> Requirement: ADDED Deploy job validates required build-time variables before deploying; MODIFIED GitHub Actions workflow deploys only on PR merge to main
- Requirement -> Task(s): Dockerfile tasks, workflow tasks, and verification tasks in `tasks.md`

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Latency budget

- **Given** the deploy job now includes an additional validation step
- **When** the `deploy` job runs end-to-end
- **Then** the validation step adds no more than a few seconds of wall-clock time (a simple string-emptiness check), with no measurable impact on total deploy duration

### Requirement: Security

See functional scenario: "Values are not sourced from GitHub Secrets" — the non-secret classification of these 5 variables is already fully specified there; no additional access-control property applies.

### Requirement: Reliability

See functional scenario: "Missing build args degrade gracefully" (Docker-level default behavior) and "Deploy fails loudly when a required variable is missing" (deploy-job-level enforcement) — together these cover both the safe-default and the fail-loud recovery paths; no additional reliability scenario is needed.

### Requirement: Operability

#### Scenario: Failure message is actionable

- **Given** the validation step fails due to one or more missing Variables
- **When** a maintainer reads the GitHub Actions job log
- **Then** the log clearly names which specific variable(s) are missing, without requiring the maintainer to inspect `deploy.yml` source to determine the cause
