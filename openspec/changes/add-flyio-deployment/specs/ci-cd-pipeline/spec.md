## ADDED Requirements

### Requirement: Existing build-and-test workflow is unchanged
The CI pipeline that runs unit, integration, and E2E tests using an ephemeral PostgreSQL service container SHALL continue to function without modification.

#### Scenario: Pull request tests run against ephemeral Postgres
- **WHEN** a pull request is opened or updated
- **THEN** the `build-and-test` workflow runs with its own ephemeral Postgres 16 service and all tests execute in isolation

### Requirement: A deploy workflow deploys to production on merge to main
A `deploy.yml` GitHub Actions workflow SHALL trigger on push to `main` and deploy the application to Fly.io after all tests pass.

#### Scenario: Deploy is triggered after tests pass on main
- **WHEN** a commit is pushed to `main` (including via PR merge)
- **THEN** the `deploy.yml` workflow runs after the `build-and-test` workflow succeeds
- **THEN** Fly.io deploys the new version to `cookbook-tanstack`

#### Scenario: Deploy is not triggered on pull requests
- **WHEN** a pull request is opened or updated against any branch
- **THEN** the `deploy.yml` workflow does NOT run

#### Scenario: Deploy fails if tests fail
- **WHEN** the `build-and-test` workflow fails on main
- **THEN** the `deploy.yml` workflow does not proceed to deployment

### Requirement: FLY_API_TOKEN is stored as a GitHub Actions secret
The GitHub repository SHALL have a `FLY_API_TOKEN` secret configured so the deploy workflow can authenticate with Fly.io.

#### Scenario: Deploy workflow uses FLY_API_TOKEN for authentication
- **WHEN** the `deploy.yml` workflow runs `flyctl deploy`
- **THEN** it authenticates using `FLY_API_TOKEN` from GitHub secrets and does not prompt for credentials

### Requirement: Deploy workflow uses flyctl to build and deploy
The deploy workflow SHALL use the official `superfly/flyctl-actions` GitHub Action to run `fly deploy` with the `--remote-only` flag so the Docker image is built on Fly's infrastructure.

#### Scenario: Docker image is built remotely on Fly builders
- **WHEN** `fly deploy --remote-only` is executed in CI
- **THEN** Fly.io builds the Docker image on its remote builder infrastructure, not on the GitHub runner
- **THEN** the built image is deployed to the `cookbook-tanstack` app

#### Scenario: Deploy output is visible in GitHub Actions logs
- **WHEN** the deploy workflow runs
- **THEN** `flyctl` progress and deployment status are streamed to the GitHub Actions log

### Requirement: Deploy workflow runs release command before switching traffic
The `fly.toml` release command (`npm run db:migrate`) SHALL execute as part of the Fly deploy, and the deploy workflow SHALL fail if the release command exits non-zero.

#### Scenario: Migration failure aborts deployment in CI
- **WHEN** `fly deploy` triggers the release command and `npm run db:migrate` exits with a non-zero code
- **THEN** Fly aborts the deployment, the previous version continues serving, and the deploy workflow step fails
- **THEN** GitHub marks the workflow run as failed
