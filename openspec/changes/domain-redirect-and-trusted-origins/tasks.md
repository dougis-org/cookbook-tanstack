# Tasks

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** `git checkout -b feat/domain-redirect-and-trusted-origins` then immediately `git push -u origin feat/domain-redirect-and-trusted-origins`

## Execution

### Capability 1: Domain Redirect Middleware

- [ ] **1.1 — Write tests first (TDD):** Create `src/__tests__/domain-redirect.test.ts` with unit tests for the redirect middleware:
  - Test: old host → 301 with correct `Location` (path + query preserved)
  - Test: primary host → `next()` called, no redirect
  - Test: no `Host` header → `next()` called, no redirect
  - Test: `APP_PRIMARY_URL` unset → `next()` called, no error
  - Test: query string preserved on redirect
  - Test: malformed `APP_PRIMARY_URL` → catch error, call `next()`
- [ ] **1.2 — Create `src/start.ts`:** Export `startInstance = createStart(() => ({ requestMiddleware: [domainRedirectMiddleware] }))`. Implement `domainRedirectMiddleware` using `createMiddleware().server(({ next, request }) => { ... })`. Guard on missing `APP_PRIMARY_URL`. Compare `new URL(request.url).hostname` against `new URL(APP_PRIMARY_URL).hostname`. Return `new Response(null, { status: 301, headers: { Location: primaryUrl + pathname + search } })` on mismatch. Wrap URL parsing in try/catch → call `next()` on error.
- [ ] **1.3 — Verify tests pass:** `npx vitest run src/__tests__/domain-redirect.test.ts`

### Capability 2: Better Auth Trusted Origins

- [ ] **2.1 — Write tests first (TDD):** Create or update `src/lib/__tests__/auth-config.test.ts` with unit tests:
  - Test: `BETTER_AUTH_TRUSTED_ORIGINS` set → `trustedOrigins` array populated correctly
  - Test: `BETTER_AUTH_TRUSTED_ORIGINS` not set → `trustedOrigins` is `[]`
  - Test: entries with whitespace → trimmed correctly
  - Test: multiple entries split correctly
- [ ] **2.2 — Update `src/lib/auth.ts`:** Add `trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',').map(s => s.trim()) ?? []` to the `betterAuth()` call.
- [ ] **2.3 — Verify tests pass:** `npx vitest run src/lib/__tests__/auth-config.test.ts`

### Capability 3: Environment Documentation

- [ ] **3.1 — Update `.env.example`:** Add entries:
  ```
  # Primary domain — requests from other hosts redirect here (optional in local dev)
  APP_PRIMARY_URL=https://recipe.dougis.com

  # Comma-separated list of origins Better Auth trusts (beyond BETTER_AUTH_URL)
  # Example: https://recipe.dougis.com,https://cookbook-tanstack.fly.dev
  BETTER_AUTH_TRUSTED_ORIGINS=
  ```
- [ ] **3.2 — Review for hardcoded domains:** Grep `src/` for literal `recipe.dougis.com` and `cookbook-tanstack.fly.dev` — confirm none exist outside `.env.example` and test fixtures.

## Validation

- [ ] Run unit/integration tests: `npm run test`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Run type check: `npx tsc --noEmit`
- [ ] Run build: `npm run build`
- [ ] Confirm redirect middleware unit tests all pass
- [ ] Confirm auth config unit tests all pass
- [ ] Confirm no hardcoded domain names in `src/`
- [ ] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **Integration tests** — included in `npm run test`
- **Regression / E2E tests** — `npm run test:e2e` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [ ] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `feat/domain-redirect-and-trusted-origins` to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] **Monitor PR comments** — poll autonomously; address, commit, validate locally, push; wait 180s; repeat until no unresolved comments
- [ ] **Monitor CI checks** — poll autonomously; diagnose failures, fix, commit, validate locally, push; wait 180s; repeat until all pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify user — never wait for a human; never force-merge

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

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update `.env.example` if any env var names changed during implementation
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/domain-redirect-and-trusted-origins/` to `openspec/changes/archive/YYYY-MM-DD-domain-redirect-and-trusted-origins/` **in a single commit** that stages both the new location and the deletion of the old location
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-domain-redirect-and-trusted-origins/` exists and `openspec/changes/domain-redirect-and-trusted-origins/` is gone
- [ ] Commit and push the archive to `main` in one commit
- [ ] `git fetch --prune` and `git branch -d feat/domain-redirect-and-trusted-origins`
