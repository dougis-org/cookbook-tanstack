# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/domain-redirect-and-trusted-origins` then immediately `git push -u origin feat/domain-redirect-and-trusted-origins`

## Execution

### Capability 1: Domain Redirect Middleware

- [x] **1.1 — Write tests first (TDD):** Create `src/__tests__/domain-redirect.test.ts` with unit tests for the redirect middleware:
  - Test: old host → 301 with correct `Location` (path + query preserved)
  - Test: primary host → `next()` called, no redirect
  - Test: no `Host` header → `next()` called, no redirect
  - Test: `APP_PRIMARY_URL` unset → `next()` called, no error
  - Test: query string preserved on redirect
  - Test: malformed `APP_PRIMARY_URL` → catch error, call `next()`
- [x] **1.2 — Create `src/start.ts`:** Export `startInstance = createStart(() => ({ requestMiddleware: [domainRedirectMiddleware] }))`. Implement `domainRedirectMiddleware` using `createMiddleware({ type: 'request' }).server(({ next, request }) => { ... })`. Guard on missing `APP_PRIMARY_URL`. Compare hostname from `Host` header against `APP_PRIMARY_URL` hostname. Return `new Response(null, { status: 301, headers: { Location: redirectUrl } })` on mismatch. Wrap URL parsing in try/catch → call `next()` on error.
- [x] **1.3 — Verify tests pass:** `npx vitest run src/__tests__/domain-redirect.test.ts`

### Capability 2: Better Auth Trusted Origins

- [x] **2.1 — Write tests first (TDD):** Create or update `src/lib/__tests__/auth-config.test.ts` with unit tests:
  - Test: `BETTER_AUTH_TRUSTED_ORIGINS` set → `trustedOrigins` array populated correctly
  - Test: `BETTER_AUTH_TRUSTED_ORIGINS` not set → `trustedOrigins` is `[]`
  - Test: entries with whitespace → trimmed correctly
  - Test: multiple entries split correctly
- [x] **2.2 — Update `src/lib/auth.ts`:** Add `trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',').map(s => s.trim()) ?? []` to the `betterAuth()` call.
- [x] **2.3 — Verify tests pass:** `npx vitest run src/lib/__tests__/auth-config.test.ts`

### Capability 3: Environment Documentation

- [x] **3.1 — Update `.env.example`:** Added `APP_PRIMARY_URL` and `BETTER_AUTH_TRUSTED_ORIGINS` entries with documentation.
- [x] **3.2 — Review for hardcoded domains:** Grep confirmed zero matches in `src/` outside test fixtures.

## Validation

- [x] Run unit/integration tests: `npm run test` — 944 passing
- [x] Run E2E tests: `npm run test:e2e`
- [x] Run type check: `npx tsc --noEmit` — clean
- [x] Run build: `npm run build` — succeeded
- [x] Confirm redirect middleware unit tests all pass
- [x] Confirm auth config unit tests all pass
- [x] Confirm no hardcoded domain names in `src/`
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **Integration tests** — included in `npm run test`
- **Regression / E2E tests** — `npm run test:e2e` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `feat/domain-redirect-and-trusted-origins` to `main` — https://github.com/dougis-org/cookbook-tanstack/pull/382
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] Enable auto-merge: `gh pr merge https://github.com/dougis-org/cookbook-tanstack/pull/382 --auto --merge`
- [x] **Monitor PR comments** — poll autonomously; address, commit, validate locally, push; wait 180s; repeat until no unresolved comments
- [x] **Monitor CI checks** — poll autonomously; diagnose failures, fix, commit, validate locally, push; wait 180s; repeat until all pass
- [x] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify user — never wait for a human; never force-merge

Ownership metadata:

- Implementer: Claude Code (agentic)
- Reviewer(s): Doug Hubbard
- Required approvals: 1 (Doug)

Blocking resolution flow:

- CI failure → diagnose → fix → `npm run test && npm run build` → commit → push → re-run checks
- Security finding → remediate → commit → push → re-scan
- Review comment → address → commit → `npm run test && npm run build` → push → confirm resolved

**Post-deploy manual step (not automated):**
After merge and deploy to Fly.io, set Fly secrets:
```bash
fly secrets set APP_PRIMARY_URL=https://recipe.dougis.com
fly secrets set BETTER_AUTH_TRUSTED_ORIGINS=https://recipe.dougis.com,https://cookbook-tanstack.fly.dev
```
Then verify: `curl -I https://cookbook-tanstack.fly.dev/recipes` should return `301` with `Location: https://recipe.dougis.com/recipes`.

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update `.env.example` if any env var names changed during implementation
- [x] Sync approved spec deltas into `openspec/specs/` (global spec)
- [x] Archive the change: move `openspec/changes/domain-redirect-and-trusted-origins/` to `openspec/changes/archive/YYYY-MM-DD-domain-redirect-and-trusted-origins/` **in a single commit** that stages both the new location and the deletion of the old location
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-domain-redirect-and-trusted-origins/` exists and `openspec/changes/domain-redirect-and-trusted-origins/` is gone
- [x] Commit and push the archive to `main` in one commit
- [x] `git fetch --prune` and `git branch -d feat/domain-redirect-and-trusted-origins`
