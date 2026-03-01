# Deployment Guide

CookBook is deployed to [Fly.io](https://fly.io) via GitHub Actions. This document covers local dev database setup, first-time Fly.io provisioning, and day-to-day operations.

---

## Local Development Database

Two database options are supported for local development. Both connect via `DATABASE_URL` in `.env.local` — switching between them requires only updating that one variable.

### Option 1 — Persistent local network server (preferred when on-network)

The `sponky.dougis.com` PostgreSQL server is always running and shared across developers on the local network. No Docker required.

1. Create `.env.local` at the project root:
   ```
   DATABASE_URL=postgresql://<user>:<pass>@sponky.dougis.com:5432/cookbook
   ```
   Replace `<user>` and `<pass>` with the shared credentials.

2. On first use, push the schema and seed taxonomy data:
   ```bash
   npm run db:push
   npm run db:seed
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

### Option 2 — Docker compose (remote/offline fallback)

Use this when you are off-network or the `sponky.dougis.com` server is unreachable.

1. Start the local Postgres container:
   ```bash
   docker compose up -d
   ```

2. Create `.env.local`:
   ```
   DATABASE_URL=postgresql://cookbook_user:cookbook_pass@localhost:5432/cookbook_db
   ```

3. On first use, push the schema and seed taxonomy data:
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

---

## Fly.io Deployment

### Prerequisites

- [`flyctl`](https://fly.io/docs/flyctl/install/) installed
- Authenticated: `flyctl auth login`
- Access to the GitHub repository secrets (for CI setup)

### First-time provisioning (run once)

```bash
# 1. Create the Fly app
fly apps create cookbook-tanstack

# 2. Create the production Postgres cluster (same region as the app)
fly postgres create \
  --name cookbook-db-prod \
  --region iad \
  --initial-cluster-size 1 \
  --vm-size shared-cpu-1x \
  --volume-size 1

# 3. Attach the prod DB — this automatically sets the DATABASE_URL secret
fly postgres attach cookbook-db-prod --app cookbook-tanstack

# 4. Confirm the secret was set
fly secrets list --app cookbook-tanstack

# 5. Create the test/staging Postgres cluster
fly postgres create \
  --name cookbook-db-test \
  --region iad \
  --initial-cluster-size 1 \
  --vm-size shared-cpu-1x \
  --volume-size 1

# 6. Deploy (builds Docker image remotely and runs migrations via release command)
fly deploy --remote-only

# 7. Seed taxonomy data on prod (one-time, run from local checkout via proxy)
#    In a separate terminal: fly proxy 5432 -a cookbook-db-prod
#    Then:
DATABASE_URL="postgresql://<user>:<pass>@localhost:5432/cookbook" npm run db:seed

# 8. Verify the app is live
fly open
```

### GitHub Actions CI secret

Add `FLY_API_TOKEN` to the GitHub repository under **Settings → Secrets and variables → Actions**:

```bash
fly tokens create deploy -x 720h
# Copy the output token into GitHub as FLY_API_TOKEN
# Rotate this token monthly: re-run the command above and update the secret
```

### Day-to-day deploys

Deploys happen automatically via `deploy.yml` when a commit is merged to `main` and the `Build and Test` workflow succeeds. No manual steps needed.

To deploy manually:
```bash
fly deploy --remote-only
```

---

## Operations Runbook

### Rollback a deployment

```bash
# List recent releases
fly releases list --app cookbook-tanstack

# Redeploy a previous image
fly deploy --image <image-from-list> --app cookbook-tanstack
```

> Schema rollbacks are not automatic — Drizzle does not generate reverse migrations. Write a manual reverse migration script if needed, apply it before rolling back the app image.

### Emergency database access

```bash
# Open a local proxy to the prod DB on port 5432
fly proxy 5432 -a cookbook-db-prod

# In a separate terminal, connect with psql (use your actual prod credentials)
psql "postgresql://<user>:<pass>@localhost:5432/cookbook"
# Or use the Fly CLI shortcut (no proxy needed):
# fly postgres connect -a cookbook-db-prod
```

### Rotate DATABASE_URL

If Postgres credentials change, update the secret on the app:
```bash
fly secrets set DATABASE_URL="<new-connection-string>" --app cookbook-tanstack
```

Verify with:
```bash
fly secrets list --app cookbook-tanstack
```

### Check app status

```bash
fly status --app cookbook-tanstack
fly logs --app cookbook-tanstack
```
