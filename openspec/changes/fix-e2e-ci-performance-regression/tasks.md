# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix/e2e-ci-performance-regression` then immediately `git push -u origin fix/e2e-ci-performance-regression`

## Execution

### Phase 1 — Investigate: bisect the breaking version

- [x] **1.1 — Set up local E2E reproduction baseline**
  - Install current packages: `npm install`
  - Build production server: `npm run build`
  - Start server in background: `PORT=3000 node .output/server/index.mjs &`
  - Run E2E with list reporter to capture timing: `npx playwright test --reporter=list 2>&1 | tee /tmp/e2e-post-upgrade.txt`
  - Confirm the 14 auth/admin test failures appear locally
  - Kill the server: `pkill -f ".output/server/index.mjs"`

- [x] **1.2 — Bisect `@tanstack/react-start` to find the breaking version**
  - Starting range: 1.167.16 (known good) to 1.167.52 (known bad per prior experiments)
  - For each candidate version (binary search: try 1.167.34, then narrow):
    - Update `package.json`: `"@tanstack/react-start": "1.167.XX"`
    - `npm install && npm run build`
    - `PORT=3000 node .output/server/index.mjs &`
    - Run targeted failing tests: `npx playwright test auth-session admin/admin-users --reporter=list`
    - Record pass/fail; kill server
  - Document the first failing version in `design.md` under a new "Root Cause" section
  - Restore `package.json` to `1.167.58` after bisection

- [x] **1.3 — Inspect the breaking version's changelog and diff**
  - Check `https://github.com/TanStack/router/releases` for the breaking version
  - Identify the specific commit(s) that changed server or CSS behavior
  - Document findings in `design.md` under "Root Cause"

- [x] **1.4 — Determine fix type**
  - If the breaking change is a **TanStack Start config option** (e.g., RSC CSS injection, server component option): identify the option and update `app.config.ts` or equivalent config.
  - If the breaking change is a **server startup timing issue** (health check passes before SSR is fully ready): implement a CI warmup step.
  - If both apply: implement both.
  - Document the chosen fix type in `design.md`.

### Phase 2 — Fix: server or CI change

- [x] **2.1 — Implement the fix identified in Phase 1**
  - If config change: update the relevant TanStack Start config file (likely `app.config.ts` or `vite.config.ts`).
  - If CI warmup: add a step to `.github/workflows/build-and-test.yml` between `Seed database` and `Run E2E tests`:
    ```yaml
    - name: Warm up production server
      run: |
        PORT=3000 node .output/server/index.mjs &
        timeout 60 bash -c 'until curl -sf http://localhost:3000 > /dev/null; do sleep 1; done'
        # Make a few requests to trigger lazy SSR bundle initialization
        curl -sf http://localhost:3000 > /dev/null
        curl -sf http://localhost:3000/recipes > /dev/null
        pkill -f ".output/server/index.mjs" || true
    ```
    Note: If the fix is CI warmup, `playwright.config.ts` `webServer` still starts the server; the warmup above pre-initializes the bundle before Playwright starts. Adjust if needed based on investigation findings.

- [x] **2.2 — Restore h3 override to rc.21**
  - In `package.json` overrides, update:
    ```json
    "h3": "2.0.1-rc.21",
    "h3-v2": "npm:h3@2.0.1-rc.21"
    ```
  - Run `npm install` and verify `npm ls h3` shows `2.0.1-rc.21`
  - Run `npm run build` and confirm it succeeds

- [x] **2.3 — Update `webServer.timeout` in `playwright.config.ts`**
  - Based on investigation findings, set `timeout` to a justified value (minimum 120000ms unless investigation shows 60s is safe)
  - Add an inline comment: `// Server startup measured at ~Xs locally; CI budget is Ys`
  - File: `playwright.config.ts`

- [x] **2.4 — Remove the `continue-on-error` workaround from CI workflow**
  - In `.github/workflows/build-and-test.yml`, remove the `continue-on-error` line and its associated comment from the `Run E2E tests` step
  - File: `.github/workflows/build-and-test.yml`

### Phase 3 — Validate locally

- [x] **3.1 — Full local E2E run**
  - `npm run build`
  - `PORT=3000 node .output/server/index.mjs &`
  - `npx playwright test --reporter=list 2>&1 | tee /tmp/e2e-post-fix.txt`
  - Confirm all 155 tests pass; confirm 0 retries for auth/admin tests
  - Compare total duration against pre-upgrade baseline (target: ≤ 250s total / 2 workers ≈ ≤ 4 min wall clock)

- [x] **3.2 — Unit and type checks**
  - `npm run test` — all unit/integration tests pass
  - `npx tsc --noEmit` — no type errors

- [x] **3.3 — Build check**
  - `npm run build` — build succeeds, no errors or warnings

## Validation

- [x] All 155 E2E tests pass locally with 0 retries on the previously-failing 14 tests
- [x] `npm ls h3` shows `2.0.1-rc.21`
- [x] `playwright.config.ts` `webServer.timeout` has an inline comment explaining the value
- [x] `.github/workflows/build-and-test.yml` has no `continue-on-error` on the `Run E2E tests` step
- [x] Root cause is documented in `design.md`
- [x] `npm run test` passes
- [x] `npm run build` succeeds
- [x] `npx tsc --noEmit` passes

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors
- **Type check** — `npx tsc --noEmit`; no errors
- **E2E** — `npx playwright test --reporter=list`; all 155 tests pass locally

If **ANY** of the above fail, iterate and address the failure before pushing.

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to `fix/e2e-ci-performance-regression` and push to remote
- [ ] Open PR from `fix/e2e-ci-performance-regression` to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in Remote push validation, then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in Remote push validation, then push; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:
- Implementer: assigned agent
- Reviewer(s): Doug Hubbard
- Required approvals: 1

Blocking resolution flow:
- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on main
- [ ] Mark all remaining tasks as complete
- [ ] Sync approved spec deltas to `openspec/specs/e2e-ci-performance/spec.md` (global spec)
- [ ] Archive the change: move `openspec/changes/fix-e2e-ci-performance-regression/` to `openspec/changes/archive/YYYY-MM-DD-fix-e2e-ci-performance-regression/` in a single atomic commit (stage both the new location and the deletion of the old location together)
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-e2e-ci-performance-regression/` exists and `openspec/changes/fix-e2e-ci-performance-regression/` is gone
- [ ] Commit and push the archive commit to main
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d fix/e2e-ci-performance-regression`
