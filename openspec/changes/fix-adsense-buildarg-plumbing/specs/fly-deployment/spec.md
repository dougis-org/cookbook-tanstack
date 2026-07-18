## ADDED Requirements

### Requirement: Dockerfile accepts client-exposed build-time variables via ARG
The `Dockerfile` builder stage SHALL declare `ARG` entries for `VITE_ADSENSE_ENABLED`, `VITE_GOOGLE_ADSENSE_TOP_SLOT_ID`, `VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID`, `VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID`, and `VITE_GOOGLE_ANALYTICS_ID`, and MUST re-export each as an `ENV` of the same name before `RUN npm run build`, so Vite inlines their values into the compiled client bundle.

#### Scenario: Build args are visible to the Vite build
- **WHEN** `docker build --build-arg VITE_ADSENSE_ENABLED=true --build-arg VITE_GOOGLE_ADSENSE_TOP_SLOT_ID=1234567890 .` is run
- **THEN** the resulting bundle's `import.meta.env.VITE_ADSENSE_ENABLED` is `"true"` and `import.meta.env.VITE_GOOGLE_ADSENSE_TOP_SLOT_ID` is `"1234567890"`

#### Scenario: Missing build args degrade gracefully
- **WHEN** `docker build .` is run with no `--build-arg` flags for these variables
- **THEN** the build still succeeds, and the resulting bundle behaves exactly as it does today (`AdSlot` renders `SponsorSlot`/no ads, no GA tag)

### Requirement: Deploy workflow forwards client-exposed configuration as build args
`.github/workflows/deploy.yml` SHALL pass `VITE_ADSENSE_ENABLED`, `VITE_GOOGLE_ADSENSE_TOP_SLOT_ID`, `VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID`, `VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID`, and `VITE_GOOGLE_ANALYTICS_ID` to `flyctl deploy` as `--build-arg` flags, with values sourced from GitHub Actions repository Variables (`vars.*`), not Secrets.

#### Scenario: Deploy step includes build args sourced from repo variables
- **WHEN** the `deploy` job in `deploy.yml` runs the `flyctl deploy` step
- **THEN** the invoked command includes `--build-arg VITE_ADSENSE_ENABLED=${{ vars.VITE_ADSENSE_ENABLED }}` and the equivalent flags for the other four variables

#### Scenario: Values are not sourced from GitHub Secrets
- **WHEN** `deploy.yml` is inspected
- **THEN** none of these five variables are read via `secrets.*` — only `vars.*` — because their values are inlined into public client JavaScript and are not confidential

## MODIFIED Requirements

### Requirement: GitHub Actions workflow deploys only on PR merge to main
The project SHALL contain `.github/workflows/deploy.yml` that triggers on `pull_request` closed events targeting `main`, with a job-level condition `if: github.event.pull_request.merged == true`. It MUST use the official `superfly/flyctl-actions` action, authenticate via a `FLY_API_TOKEN` GitHub secret, and run `flyctl deploy --remote-only` with `--build-arg` flags for the client-exposed build-time configuration variables (`VITE_ADSENSE_ENABLED`, `VITE_GOOGLE_ADSENSE_TOP_SLOT_ID`, `VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID`, `VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID`, `VITE_GOOGLE_ANALYTICS_ID`) sourced from repository Variables.

#### Scenario: Workflow triggers on PR merge to main
- **WHEN** a pull request targeting `main` is merged
- **THEN** the `deploy.yml` workflow is triggered automatically

#### Scenario: Workflow does NOT trigger on direct push to main
- **WHEN** a commit is pushed directly to `main` without a pull request
- **THEN** the deploy workflow is NOT triggered

#### Scenario: Fly.io deployment invoked with remote build and configuration build args
- **WHEN** the deploy job runs
- **THEN** it calls `flyctl deploy --remote-only` with `--build-arg` flags for all five client-exposed configuration variables, offloading the Docker build (with those args) to Fly.io builders

#### Scenario: FLY_API_TOKEN is used for authentication
- **WHEN** the deploy step executes
- **THEN** it reads `FLY_API_TOKEN` from GitHub Actions secrets (not hardcoded in the workflow file)
