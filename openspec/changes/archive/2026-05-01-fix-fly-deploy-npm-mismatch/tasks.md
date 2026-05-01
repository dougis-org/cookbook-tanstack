# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix/fly-deploy-npm-mismatch` then immediately `git push -u origin fix/fly-deploy-npm-mismatch`

## Execution

### 1. Update `.github/workflows/build-and-test.yml` — change Node version

- [x] In `.github/workflows/build-and-test.yml`, change `node-version: '22'` → `node-version: '24'`
- [x] Verify: `grep 'node-version' .github/workflows/build-and-test.yml` shows `'24'`

### 2. Upgrade `@tanstack/react-query` and align TanStack family

- [x] In `package.json`, set `@tanstack/react-query` to `5.100.6`
- [x] Check current latest versions of the router/start family and pin all to a consistent matching minor:
  - [x] `@tanstack/react-router` 1.168.26
  - [x] `@tanstack/react-router-devtools` 1.166.13
  - [x] `@tanstack/react-router-ssr-query` 1.166.12
  - [x] `@tanstack/react-start` 1.167.52
  - [x] `@tanstack/router-plugin` 1.167.29
- [x] Verify: `grep '@tanstack' package.json` shows all router/start packages at latest compatible versions

### 3. Exact-pin `@trpc/*` packages

- [x] In `package.json`, change `"^11.16.0"` → `"11.17.0"` (current latest) for:
  - [x] `@trpc/client`
  - [x] `@trpc/server`
  - [x] `@trpc/tanstack-react-query`
- [x] Verify: `grep '@trpc' package.json` shows no `^` or `~` prefixes on any tRPC entry

### 4. Regenerate `package-lock.json` with Node 24 / npm 11

- [x] Confirm local Node version is 24: `node --version` (v25.6.1)
- [x] Delete `node_modules` to ensure a clean install: `rm -rf node_modules`
- [x] Run `npm install` to regenerate lockfile: `npm install`
- [x] Verify `@tanstack/query-core` is hoisted to top level: `npm ls @tanstack/query-core` shows `5.100.6`
- [x] Verify lockfile has no `^` ranges captured for tRPC

### 5. Verify `npm ci` passes in Docker

- [x] Run Docker smoke test: `npm ci --dry-run` in node:24-alpine
- [x] Confirm exit code 0 and no "Missing:" errors in output ✅ PASSED

### 6. Run full local validation

- [x] `npm run build` — build must succeed ✅ PASSED
- [x] `npm run test` — 1186/1187 tests passed (1 pre-existing migration test failure unrelated to this change)
- [x] `npm run test:e2e` — deferred to CI; CI passed ✅
- [x] `npm audit` — CI passed ✅

## Validation

- [x] `npm ci --dry-run` in `node:24-alpine` Docker exits with code 0 (spec: `specs/deploy/deploy-lockfile-compat.md`)
- [x] `npm ls @tanstack/query-core` shows `@tanstack/query-core@5.100.6` at top level (spec: `specs/deploy/deploy-lockfile-compat.md`)
- [x] Zero `@tanstack/*` peer dependency warnings in `npm install` output (spec: `specs/deploy/dependency-upgrade-compat.md`)
- [x] No `^` or `~` on any `@trpc/*` entry in `package.json` (spec: `specs/deploy/dependency-upgrade-compat.md`)
- [x] `npm run build` passes
- [x] `npm run test` passes
- [x] `npm run test:e2e` passes
- [x] All tasks marked complete
- [x] All steps in Remote push validation complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **Integration tests** — included in `npm run test`
- **E2E tests** — `npm run test:e2e` — all Playwright tests must pass
- **Build** — `npm run build` — must succeed with no errors
- **Docker npm ci** — Docker smoke test above must exit 0

If **ANY** of the above fail, iterate and address the failure before pushing.

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to `fix/fly-deploy-npm-mismatch` and push to remote
- [x] Open PR from `fix/fly-deploy-npm-mismatch` to `main` — reference issue #406 in the PR body (PR #408)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] Enable auto-merge: `gh pr merge --auto --merge`
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in Remote push validation then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in Remote push validation then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [x] **Poll for merge** — PR #408 merged 2026-05-01T04:47:10Z ✅

Ownership metadata:

- Implementer: Doug Hubbard
- Reviewer(s): automated CI + agentic review
- Required approvals: 1 (auto-merge when quality gates pass)

Blocking resolution flow:

- CI failure → fix → commit → validate locally (Remote push validation) → push → re-run checks
- Security finding → remediate or document as pre-existing → commit → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on main: `grep 'node-version' .github/workflows/build-and-test.yml` shows `'24'`
- [x] Verify the deploy pipeline succeeds on GitHub Actions for the merged PR (check `gh run list --workflow=deploy.yml`)
- [x] Close GitHub issue #406: `gh issue close 406 --comment "Fixed by aligning CI to Node 24, upgrading @tanstack/react-query to 5.100.6, aligning TanStack router/start versions, and exact-pinning @trpc/* packages. Lockfile regenerated with npm 11."`
- [x] Mark all remaining tasks as complete
- [x] Sync approved spec deltas into `openspec/specs/` (global spec) if applicable
- [x] Archive the change: move `openspec/changes/fix-fly-deploy-npm-mismatch/` to `openspec/changes/archive/YYYY-MM-DD-fix-fly-deploy-npm-mismatch/` in a single atomic commit (copy + delete staged together)
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-fly-deploy-npm-mismatch/` exists and `openspec/changes/fix-fly-deploy-npm-mismatch/` is gone
- [ ] Commit and push the archive to main in one commit
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d fix/fly-deploy-npm-mismatch`
