## 0. Local Dev Environment Setup

- [x] 0.1 Update `.env.example` to document both local database options: add `DATABASE_URL` with a placeholder and a comment explaining the two choices — `sponky.dougis.com` (on-network, preferred) and `docker compose` (remote/offline fallback) — with example connection string formats for each
- [x] 0.2 Verify that `.gitignore` already excludes `.env.local` (it should; confirm and add if missing)
- [x] 0.3 Update `docs/` or `README.md` local dev setup section to document the two database options with step-by-step instructions for each, including the connection string format for `sponky.dougis.com`
- [ ] 0.4 Confirm the network server at `sponky.dougis.com` *(manual — requires db credentials; run: npm run db:push && npm run db:seed with DATABASE_URL pointing to sponky.dougis.com)* has a `cookbook` database with the `pgcrypto` extension enabled; run `npm run db:push` and `npm run db:seed` against it to prepare it for local dev use

## 1. Docker Build Setup

- [x] 1.1 Create `Dockerfile` at project root — multi-stage build: `node:25-alpine` build stage runs `npm ci && npm run build`, production stage copies `.output/` and runs `node .output/server/index.mjs` (or equivalent Nitro entry point)
- [x] 1.2 Create `.dockerignore` to exclude `node_modules/`, `.git/`, `drizzle/`, `playwright-report/`, `test-results/`, `.env*`, and `openspec/`
- [x] 1.3 Verify image builds locally: `docker build -t cookbook-tanstack .` and `docker run -e PORT=3000 -e DATABASE_URL=... -p 3000:3000 cookbook-tanstack`

## 2. Fly.io App Configuration

- [ ] 2.1 Run `fly apps create cookbook-tanstack` *(manual — requires flyctl auth)* (requires `flyctl` installed and authenticated)
- [x] 2.2 Generate initial `fly.toml` via `fly launch --no-deploy` and configure: app name `cookbook-tanstack`, primary region, `internal_port = 3000`, HTTP service with `force_https = true`, health check at path `/`
- [x] 2.3 Add `[deploy]` section to `fly.toml` with `release_command = "npm run db:migrate"`
- [x] 2.4 Set vm size and initial scale in `fly.toml` (e.g., `shared-cpu-1x`, 512 MB RAM)
- [x] 2.5 Verify `fly.toml` is committed to git (it is not secret)

## 3. Fly Postgres — Production Database

- [ ] 3.1 Create prod Postgres cluster *(manual — requires flyctl auth)*: `fly postgres create --name cookbook-db-prod --region <same region as app> --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 1`
- [ ] 3.2 Attach prod cluster to app *(manual — requires flyctl auth)*: `fly postgres attach cookbook-db-prod --app cookbook-tanstack` (this auto-sets the `DATABASE_URL` secret)
- [ ] 3.3 Verify `DATABASE_URL` is set *(manual — requires flyctl auth)*: `fly secrets list --app cookbook-tanstack`

## 4. Fly Postgres — Test/Staging Database

- [ ] 4.1 Create test Postgres cluster *(manual — requires flyctl auth)*: `fly postgres create --name cookbook-db-test --region <same region> --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 1`
- [ ] 4.2 Document test DB connection string *(manual — requires flyctl auth)* for future staging app: `fly postgres connect -a cookbook-db-test` → note the internal URL format for when a staging app is created
- [x] 4.3 Note: test DB is provisioned and ready; a separate `cookbook-tanstack-test` Fly app can be wired up in a follow-on task once a staging deploy workflow is defined

## 5. Initial Production Deployment

- [ ] 5.1 Deploy to Fly.io *(manual — requires flyctl auth + provisioned app)*: `fly deploy --remote-only` — confirms Docker build, migration release command, and app startup all succeed
- [ ] 5.2 Run database migrations on prod *(manual — handled by release command on first deploy)*: the release command handles this automatically; confirm in deploy logs
- [ ] 5.3 Seed prod taxonomy data *(manual — one-time after first deploy)*: `fly ssh console -a cookbook-tanstack -C "npm run db:seed"` — one-time after first deploy
- [ ] 5.4 Verify app is live *(manual — after first deploy)*: `fly open` opens the deployed URL; confirm the home page loads

## 6. GitHub Actions — Deploy Workflow

- [ ] 6.1 Add `FLY_API_TOKEN` to the GitHub repository secrets *(manual — GitHub UI)* (Settings → Secrets → Actions)
- [x] 6.2 Create `.github/workflows/deploy.yml` — triggers on `push` to `main`, uses `superfly/flyctl-actions/setup-flyctl@master`, runs `fly deploy --remote-only`
- [x] 6.3 Add a `needs: build-and-test` dependency so deploy only runs after the existing test workflow passes (use `workflow_run` trigger or restructure into a single workflow with job dependencies)
- [ ] 6.4 Verify deploy workflow runs on a test push to main *(manual — verify after merge)* and completes successfully
- [x] 6.5 Verify deploy workflow does NOT run on pull requests

## 7. Documentation

- [x] 7.1 Update `README.md` (or create `docs/deployment.md`) with Fly deployment instructions: prerequisites (`flyctl`), first-time setup steps (clusters, attach, secrets), and day-to-day deploy via CI
- [x] 7.2 Document the rollback procedure: `fly releases list` → `fly deploy --image <previous-image>`
- [x] 7.3 Document how to connect to prod DB for emergency access: `fly proxy 5432 -a cookbook-db-prod` then `psql $DATABASE_URL`
