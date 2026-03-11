## Why

The application has no production deployment configuration — there is no `fly.toml`, no `Dockerfile`, and no CI/CD step to run database seeds on deploy. All production secrets are already configured in Fly.io, so the only missing pieces are the deployment wiring itself.

## What Changes

- Add `fly.toml` — Fly.io app configuration (app name, region, HTTP service, health check, env vars)
- Add `Dockerfile` — multi-stage build for the TanStack Start / Nitro server
- Add `release_command` in `fly.toml` to run `npm run db:seed` on every deploy (idempotent seeds act as "migrations")
- Add GitHub Actions workflow to deploy when pull requests to `main` are merged

## Capabilities

### New Capabilities

- `fly-deployment`: Production deployment to Fly.io — `fly.toml`, `Dockerfile`, seed-as-release-command, and CI/CD deploy workflow

### Modified Capabilities

<!-- none — no existing spec-level requirements are changing -->

## Impact

- **New files**: `fly.toml`, `Dockerfile`, `.github/workflows/deploy.yml`
- **No code changes** to application source
- **Database**: seeds run via Fly.io `release_command`; requires `MONGODB_URI` secret (Atlas SRV) already set in Fly.io
- **Secrets already present** in Fly.io: `MONGODB_URI`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` — no manual secret setup needed
- **Dependencies**: none added
