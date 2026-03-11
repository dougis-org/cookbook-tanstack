## 1. Branch Setup

- [x] 1.1 Create feature branch: `git checkout -b feat/deploy-fly-io`

## 2. Dockerfile

- [x] 2.1 Create `Dockerfile` at project root with a two-stage build: `node:24-alpine` builder runs `npm ci` + `npm run build`; runtime stage copies `.output/` and runs `node .output/server/index.mjs` on port 3000
- [x] 2.2 Add `.dockerignore` to exclude `node_modules/`, `.output/`, `coverage/`, `test-results/`, `playwright-report/`, `.env*`
- [x] 2.3 Verify locally: `docker build -t cookbook-tanstack .` completes without error

## 3. fly.toml

- [x] 3.1 Create `fly.toml` at project root — set `app = "cookbook-tanstack"`, `primary_region = "sjc"`, `[build]` pointing to the Dockerfile
- [x] 3.2 Add `[deploy] release_command = "npm run db:seed"` so seeds run before VMs start
- [x] 3.3 Add `[http_service]` with `internal_port = 3000`, `force_https = true`, and an HTTP health check on `/`
- [x] 3.4 Add `[[vm]]` block with `memory = "512mb"` and `cpu_kind = "shared"` (or adjust to app needs)

## 4. GitHub Actions Deploy Workflow

- [x] 4.1 Create `.github/workflows/deploy.yml` that triggers on `pull_request` closed events targeting `main` with condition `if: github.event.pull_request.merged == true`
- [x] 4.2 Add a `deploy` job using `superfly/flyctl-actions/setup-flyctl@master` and run `flyctl deploy --remote-only`
- [x] 4.3 Set `FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}` in the workflow env (never hardcode the token)
- [x] 4.4 Confirm `FLY_API_TOKEN` secret is set in the GitHub repository settings (Settings → Secrets → Actions)

## 5. Validation

- [x] 5.1 Run `docker build .` locally and confirm success
- [ ] 5.2 Run `docker run --rm -e MONGODB_URI=... -e BETTER_AUTH_SECRET=... -e BETTER_AUTH_URL=... -p 3000:3000 cookbook-tanstack` and confirm `GET /` returns 200
- [x] 5.3 Confirm `fly.toml` passes `flyctl config validate` (run: `flyctl config validate`)
- [ ] 5.4 Verify MongoDB Atlas IP allowlist permits Fly.io outbound IPs (or is set to `0.0.0.0/0`)
- [x] 5.5 Run `npm run test` and `npx tsc --noEmit` — all must pass

## 6. PR and Merge

- [x] 6.1 Push branch and open PR targeting `main`
- [x] 6.2 Enable auto-merge on the PR
- [x] 6.3 Address any CI failures or review comments
- [ ] 6.4 Confirm all status checks pass before merge

## 7. Post-Merge

- [ ] 7.1 Confirm the deploy workflow runs automatically after merge to `main`
- [ ] 7.2 Check Fly.io dashboard that the `release_command` (seeds) completed successfully
- [ ] 7.3 Verify the deployed app responds at `https://<app>.fly.dev/`
- [ ] 7.4 Run `openspec archive --change deploy-fly-io` to archive the completed change
