## Context

The app is a TanStack Start application built with Vite + Nitro. Running `npm run build` produces a self-contained Node.js server at `.output/server/index.mjs` with static assets at `.output/public/`. There is currently no `fly.toml`, no `Dockerfile`, and no CI/CD deploy step. All production secrets (`MONGODB_URI`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`) are already present in the Fly.io app. The MongoDB seed scripts (`npm run db:seed`) are idempotent upserts that serve as the equivalent of migrations.

## Goals / Non-Goals

**Goals:**
- `fly.toml` that configures the HTTP service, health check, and `release_command` for seeds
- Multi-stage `Dockerfile` that produces a minimal production image
- GitHub Actions workflow (`.github/workflows/deploy.yml`) that deploys on push to `main`
- Seeds always run before new server instances come up (via Fly.io `release_command`)

**Non-Goals:**
- Adding or changing MongoDB hosting (Atlas is assumed, secret already set)
- Fly.io Postgres / managed databases (MongoDB only)
- Multi-region / scaling configuration beyond defaults
- Custom domain / TLS setup (Fly.io handles this automatically)

## Decisions

### D1 — Multi-stage Dockerfile
**Decision:** Use a two-stage build: `node:24-alpine` builder → `node:24-alpine` slim runtime.

**Rationale:** The full `node_modules` (including devDependencies) is ~400 MB; the build output + production dependencies only is ~80–100 MB. A multi-stage build keeps the final image small and avoids shipping build tools to production.

**Alternatives considered:**
- Single-stage: simpler but ships all devDependencies and build tooling.
- `distroless`: smallest image but harder to debug; not worth the friction for a small app.

### D2 — `release_command` for seeds instead of an init container
**Decision:** Use Fly.io's `release_command` to run `npm run db:seed` on every deploy.

**Rationale:** Seeds are idempotent (upsert by slug), so running them on every release is safe. `release_command` runs before new VMs come up, guaranteeing taxonomy data is present before the app starts. No separate migration framework is needed.

**Alternatives considered:**
- One-time manual seed: fragile, error-prone across environments.
- Fly.io `[deploy] release_command` in a separate process machine: overkill for simple seeds.

### D3 — GitHub Actions deploy workflow (flyctl)
**Decision:** Add `.github/workflows/deploy.yml` that triggers on `pull_request` closed events targeting `main` where `github.event.pull_request.merged == true`. It runs `flyctl deploy --remote-only` using `FLY_API_TOKEN` from GitHub secrets.

**Rationale:** Triggering on `push` to `main` would fire on direct pushes, which bypass CI quality gates. Gating on a merged PR ensures all checks (tests, lint, review) passed before a deploy is triggered. `--remote-only` offloads the Docker build to Fly.io builders.

**Alternatives considered:**
- `on: push` to `main`: simpler but allows deploying commits that bypassed CI via a direct push.
- Fly.io auto-deploy from GitHub integration: requires additional Fly.io dashboard configuration; a workflow file is more transparent and versionable.

### D4 — Port and health check
**Decision:** The Nitro/srvx server listens on `PORT` env var (default 3000). Fly.io `fly.toml` sets `internal_port = 3000` and a `/` health check.

**Rationale:** Nitro respects the `PORT` environment variable. Fly.io injects `PORT` automatically when set via `[env]` or defaults. A simple `GET /` health check is sufficient for this app.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Seeds fail during release, blocking deploy | Seeds are idempotent and read-only by nature (upsert); add error logging. If consistently failing, Fly.io will roll back to previous version automatically. |
| Build cache cold start is slow | `--remote-only` uses Fly.io's shared build cache; subsequent deploys will be fast. |
| `BETTER_AUTH_URL` must match production domain | Set to `https://<app>.fly.dev` (or custom domain) in Fly.io secrets — already required, no change needed. |
| MongoDB Atlas IP allowlist | Atlas must allow connections from Fly.io's IP ranges (or `0.0.0.0/0` for simplicity). User should verify this. |

## Rollback / Mitigation

- Fly.io automatically keeps the previous release version. Run `flyctl releases` → `flyctl deploy --image <previous-image>` to roll back.
- The `release_command` (seeds) failing will abort the deploy and leave the previous version running.
- CI/CD workflow failures block merge via branch protection (if configured); fix forward.

**Operational blocking policy:** If the deploy workflow is blocked (e.g., `FLY_API_TOKEN` expired), rotate the token in Fly.io dashboard → update the GitHub secret → re-run the workflow.

## Open Questions

_None — app name confirmed as `cookbook-tanstack`, primary region confirmed as `sjc` (US West / Pacific)._
