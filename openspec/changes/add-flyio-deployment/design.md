## Context

CookBook runs on TanStack Start with a Nitro server adapter. The database is PostgreSQL 16 via Drizzle ORM. Currently:
- The app has no deployment target — it runs locally against a Docker Postgres instance
- For local development, developers connect to the persistent PostgreSQL server at `sponky.dougis.com` when on the local network, or fall back to `docker compose up` when working remotely or when the network server is unavailable
- CI (`build-and-test.yml`) already spins up an ephemeral Postgres 16 service container for tests
- `src/db/index.ts` and `drizzle.config.ts` both strictly require `DATABASE_URL` from the environment (no hardcoded fallbacks)
- No `fly.toml` exists

The Nitro build output (`dist/`) is a standard Node.js server that binds to `HOST`/`PORT` environment variables, which is exactly what Fly.io expects.

## Goals / Non-Goals

**Goals:**

- Document two local dev database options: `sponky.dougis.com` (preferred when on-network) and `docker compose up` (fallback for remote work)
- Deploy the Nitro/TanStack Start server to Fly.io
- Provision two Fly Postgres clusters: `test` (staging) and `prod`
- Keep CI tests self-contained (ephemeral Postgres service — no change to existing workflow)
- Add a `deploy.yml` GitHub Actions workflow: test gates → deploy to prod on merge to main
- Run Drizzle migrations automatically on each deployment (release command)
- Manage secrets (`DATABASE_URL`, session keys) via `flyctl secrets` — never in git

**Non-Goals:**

- Replacing the existing CI Postgres service container (ephemeral PG is cheaper and faster for tests)
- Enforcing a single local dev database option — both `sponky.dougis.com` and Docker compose are valid
- Multi-region active-active Postgres replication
- Auto-scaling beyond a single app instance initially
- Preview environments per PR (can be added later)
- Authentication secrets (Better-Auth is a future milestone)

## Decisions

### 1. Local dev database — network server vs Docker compose

**Decision:** Support two local dev database options. `sponky.dougis.com` is the preferred option when on the local network; `docker compose up` remains available as a fallback for remote work or when the network server is unreachable.

**Rationale:** The persistent network server (`sponky.dougis.com`) avoids the overhead of spinning up a Docker container and provides a shared, always-on database that survives machine restarts. However, remote developers and CI-adjacent workflows still need a fully self-contained option, which Docker compose provides. Both approaches connect via `DATABASE_URL` in `.env.local`, so switching between them requires only a one-line change — no code changes.

**Workflow:**
- On-network: set `DATABASE_URL=postgresql://user:pass@sponky.dougis.com:5432/cookbook` in `.env.local`
- Remote / offline: `docker compose up -d`, set `DATABASE_URL` to the Docker Postgres connection string

**Alternative considered:** Making `sponky.dougis.com` the only local dev option — ruled out because it would block contributors who work remotely or outside the local network.

### 2. Fly Postgres vs Supabase / Neon for managed DB

**Decision:** Use `fly postgres create` (Fly-managed Postgres).

**Rationale:** Fly Postgres runs in the same private network as the app, giving low-latency connections without SSL overhead on the internal network. No external vendor dependency. Secrets attach directly via `fly postgres attach`.

**Alternative considered:** Neon serverless Postgres — better cold-start story but adds an external dependency and egress costs. Ruled out for simplicity at this stage.

### 3. Migration strategy — release command vs app startup

**Decision:** Use Fly's `[deploy] release_command` in `fly.toml` to run `npm run db:migrate` before each new version starts serving traffic.

**Rationale:** Release commands run before traffic is cut over; if migrations fail the deploy is aborted. This avoids partial-state scenarios where the new code runs against an unmigrated schema.

**Alternative considered:** Running migrations in app startup code — harder to detect failures, risks multiple instances racing.

### 4. Separate test DB cluster vs shared prod cluster with schema isolation

**Decision:** Two fully separate Fly Postgres clusters (`cookbook-db-test` and `cookbook-db-prod`).

**Rationale:** Schema isolation (different schemas within one cluster) still shares resources and connection limits. Separate clusters provide true environment isolation: test deployments can run destructive seeds without touching prod data.

### 5. CI continues using ephemeral Postgres service container

**Decision:** Keep `build-and-test.yml` unchanged — CI uses the GitHub-managed Postgres 16 service container.

**Rationale:** Ephemeral Postgres is faster (no network round-trip to Fly), free, and already proven. The Fly test cluster is for the _deployed_ staging environment, not for CI test runs.

### 6. Fly app name and port

**Decision:** App name `cookbook-tanstack`. Nitro listens on `PORT` (provided by Fly). Internal port 3000, external HTTPS on 443.

## Risks / Trade-offs

- **Fly Postgres is not managed RDS**: No automatic failover in free/hobby tier. Mitigation: daily volume snapshots enabled by default on Fly Postgres.
- **Release command timeouts**: Long migrations could exceed Fly's 300s release command timeout. Mitigation: keep migrations additive; never delete columns in the same deploy that removes code referencing them.
- **Secrets drift**: If `DATABASE_URL` is rotated on Fly but not updated, the app crashes. Mitigation: document rotation procedure; use `fly secrets list` as a check in runbook.
- **Single instance**: No horizontal scaling initially. Fly Postgres connection pooling (PgBouncer) is not configured. Mitigation: acceptable for MVP; add PgBouncer or Supabase pooler later if needed.

## Migration Plan

1. `flyctl auth login` (developer machine, one-time)
2. `fly apps create cookbook-tanstack`
3. Create Postgres clusters: `fly postgres create --name cookbook-db-prod` and `--name cookbook-db-test`
4. Attach prod DB: `fly postgres attach cookbook-db-prod --app cookbook-tanstack` → sets `DATABASE_URL` secret
5. Run initial migration via `fly ssh console -a cookbook-tanstack -C "npm run db:migrate"`
6. Add `FLY_API_TOKEN` to GitHub repo secrets
7. Merge PR → `deploy.yml` triggers → tests pass → deploy to prod

**Rollback:** `fly releases list` → `fly deploy --image <previous-image>`. Schema rollbacks require a manual reverse migration script (Drizzle does not auto-generate rollbacks).

## Open Questions

- Should the `test` Fly environment auto-deploy on pushes to a `staging` branch, or only on manual trigger?
- Does the team want Fly preview environments per PR in the future? (out of scope now but architecture supports it)
