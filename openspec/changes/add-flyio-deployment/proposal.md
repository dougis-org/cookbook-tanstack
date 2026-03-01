## Why

CookBook currently runs only on a local Docker-based PostgreSQL instance with no deployment target. Adding Fly.io deployment establishes a production-ready hosting environment with proper test/production database separation, enabling safe CI/CD workflows and live previews.

## What Changes

- Document two local dev database options: `sponky.dougis.com` (preferred on-network) and `docker compose up` (fallback for remote/offline work), both configured via `DATABASE_URL` in `.env.local`
- Add Fly.io app configuration (`fly.toml`) for the TanStack Start / Nitro server
- Add Fly.io Postgres clusters for `test` and `prod` environments
- Add environment-specific secrets management (DATABASE_URL, NODE_ENV) via `flyctl secrets`
- Add GitHub Actions CI/CD pipeline: deploy to prod on merge to main (tests already run in existing workflow)
- *(follow-up)* Add `.env.test` and `.env.production` environment files (gitignored, values injected via secrets)
- *(follow-up)* Update `drizzle.config.ts` and DB client to honour `DATABASE_URL` from environment without hard-coded defaults
- *(follow-up)* Add `npm run db:migrate:prod` script that runs migrations against prod DB via Fly.io proxy

## Capabilities

### New Capabilities

- `local-dev-environment`: Two supported local dev database options — `sponky.dougis.com` (preferred when on-network) and `docker compose up` (fallback for remote work); both configured via `DATABASE_URL` in `.env.local`
- `fly-app-config`: Fly.io app definition (`fly.toml`), regions, scaling, health checks, and Nitro server binding
- `fly-database-environments`: Two Fly Postgres clusters (test + prod) with per-environment secrets and connection management
- `ci-cd-pipeline`: GitHub Actions workflow — lint/test on PR (using test DB), deploy on push to main (using prod DB)

### Modified Capabilities

<!-- No existing spec-level requirements change; this is a pure infrastructure addition -->

## Impact

- **vite.config.ts / app.config.ts**: No changes needed — Nitro already supports Fly deployment
- **src/db/index.ts**: Remove hard-coded fallback DATABASE_URL; must be provided by environment
- **drizzle.config.ts**: Same — rely solely on `DATABASE_URL` from environment
- **package.json**: New scripts for prod migration and Fly-targeted commands
- **CI**: New `.github/workflows/` files
- **Secrets**: DATABASE_URL (test + prod), FLY_API_TOKEN in GitHub repo secrets
- **No breaking changes to application routes or API surface**
