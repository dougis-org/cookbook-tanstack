# Tasks

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** `git checkout -b feat/operational-readiness-health-endpoint` then immediately `git push -u origin feat/operational-readiness-health-endpoint`

## Execution

### 1. Write tests for the health endpoint (TDD — tests first)

- [ ] Create `src/routes/api/__tests__/health.test.ts`
- [ ] Write unit tests covering:
  - Returns `200` + `{ status: "ok", db: "connected", uptime: <number> }` when `mongoose.connection.readyState === 1`
  - Returns `503` + `{ status: "degraded", db: "disconnected" }` when `readyState === 0`
  - Returns `503` + `{ status: "degraded", db: "disconnected" }` when `readyState === 2` (connecting)
  - Response body contains no fields other than `status`, `db`, `uptime`
  - Endpoint does not require authentication (no 401/403)
- [ ] Confirm tests fail (no implementation yet)

### 2. Implement the health endpoint

- [ ] Create `src/routes/api/health.ts` using `createFileRoute("/api/health")` with `server.handlers.GET`
- [ ] Import `mongoose` from `@/db` (triggers connection on import)
- [ ] Handler logic:
  - `readyState === 1` → return `jsonResponse({ status: "ok", db: "connected", uptime: process.uptime() }, 200)`
  - all other readyState values → return `jsonResponse({ status: "degraded", db: "disconnected" }, 503)`
- [ ] Run tests: `npx vitest run src/routes/api/__tests__/health.test.ts`
- [ ] Confirm tests pass

### 3. Update `playwright.config.ts`

- [ ] Change `reuseExistingServer: !process.env.CI` to `reuseExistingServer: true`
- [ ] Verify the change is the only modification to `playwright.config.ts`

### 4. Update CI workflow

- [ ] Open `.github/workflows/build-and-test.yml`
- [ ] Add the following step between "Seed database" and "Run E2E tests":

```yaml
- name: Warm up production server
  run: |
    PORT=3000 node .output/server/index.mjs &
    echo "Waiting for server to be ready..."
    timeout 60 bash -c 'until curl -sf http://localhost:3000/api/health > /dev/null; do sleep 1; done'
    echo "Server is healthy — priming SSR bundle..."
    curl -sf http://localhost:3000/ > /dev/null
    echo "Server ready."
```

- [ ] Confirm the "Run E2E tests" step is unchanged (server already running; Playwright reuses it)

### 5. Update `fly.toml` health check

- [ ] Replace the existing `[[http_service.checks]]` block with:

```toml
[[http_service.checks]]
  grace_period = "20s"
  interval = "10s"
  method = "GET"
  path = "/api/health"
  timeout = "5s"
```

- [ ] Remove the `[http_service.checks.headers]` block (the Host header was a workaround for the root route returning redirects; `/api/health` returns JSON directly and does not need it)
- [ ] Confirm no other `fly.toml` changes

## Validation

- [ ] Run unit/integration tests: `npm run test`
- [ ] Run type check: `npx tsc --noEmit`
- [ ] Run build: `npm run build`
- [ ] Smoke test health endpoint manually: `npm run build && PORT=3000 node .output/server/index.mjs &` then `curl http://localhost:3000/api/health`
- [ ] Confirm response is `{ "status": "ok", "db": "connected", "uptime": <n> }` with HTTP 200
- [ ] Kill local test server: `pkill -f ".output/server/index.mjs"`
- [ ] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **Integration tests** — included in `npm run test`
- **Build** — `npm run build` — must succeed with no errors
- **Type check** — `npx tsc --noEmit` — no errors
- If **ANY** of the above fail, iterate and address the failure before pushing

Note: E2E tests (`npm run test:e2e`) require the production build and a running MongoDB — run in CI rather than locally unless the full stack is available.

## PR and Merge

- [ ] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to `feat/operational-readiness-health-endpoint` and push to remote
- [ ] Open PR from `feat/operational-readiness-health-endpoint` to `main`; reference "Closes #434" in the PR body
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in Remote push validation, then push; wait 180 s, then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix, commit, follow all steps in Remote push validation, push; wait 180 s, then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — never wait for a human to report the merge; never force-merge

Ownership metadata:

- Implementer: Doug Hubbard
- Reviewer(s): automated (Codacy, CI)
- Required approvals: 0 (auto-merge when checks pass)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] No documentation updates required (CLAUDE.md and AGENTS.md unchanged)
- [ ] Sync approved spec deltas into `openspec/specs/` (create `openspec/specs/health-endpoint.md` and `openspec/specs/ci-warmup.md` from the change specs)
- [ ] Archive the change: move `openspec/changes/operational-readiness-health-endpoint/` to `openspec/changes/archive/YYYY-MM-DD-operational-readiness-health-endpoint/` — stage both the copy and the deletion in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-operational-readiness-health-endpoint/` exists and `openspec/changes/operational-readiness-health-endpoint/` is gone
- [ ] Commit and push the archive to `main` in one commit
- [ ] Prune merged local feature branch: `git fetch --prune` and `git branch -d feat/operational-readiness-health-endpoint`
