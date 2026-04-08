# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b
  upgrade-better-auth-1-5-6` then immediately `git push -u origin
  upgrade-better-auth-1-5-6`

## Execution

### Task 1 — Update package versions

- [x] In `package.json`, update the following entries:
  - `"better-auth"` → `"1.5.6"` (exact, no caret)
  - `"@tanstack/devtools-vite"` → `"^0.5.5"`
  - `"@tanstack/react-devtools"` → `"^0.10.1"`
- [x] Run `npm install better-auth@1.5.6 @tanstack/devtools-vite@0.5.5
  @tanstack/react-devtools@0.10.1`
- [x] Verify with `npm ls better-auth @tanstack/devtools-vite
  @tanstack/react-devtools` — confirm resolved versions match targets

### Task 2 — Clear dev auth collections (BSON UUID migration)

- [x] Ensure Docker MongoDB is running: `docker compose up -d`
- [x] Connect to MongoDB and drop auth collections:

```text
use cookbook
db.users.drop()
db.sessions.drop()
db.accounts.drop()
db.verifications.drop()
```

(Use `mongosh mongodb://localhost:27017` or MongoDB Compass)
- [x] Re-seed taxonomy data: `npm run db:seed`

### Task 3 — Verify server starts and devtools render

- [x] Start dev server: `npm run dev`
- [x] Open browser at <http://localhost:3000>
- [x] Confirm TanStack devtools panel renders without console errors
- [x] Stop dev server

### Task 4 — Manual auth flow verification

- [x] Start dev server: `npm run dev`
- [x] Sign up a new user (email + password + username)
- [x] Confirm redirect to app after sign-up
- [x] Sign out — confirm redirect to sign-in page
- [x] Sign in with the credentials just created — confirm session restored
- [x] Reload page — confirm user remains authenticated (cookieCache active)
- [x] Sign out again — confirm session cleared, protected routes redirect to sign-in

## Validation

- [x] Run unit/integration tests: `npm run test` — all tests must pass
- [x] Run E2E tests: `npm run test:e2e` — all tests must pass (includes
  `recipes-auth.spec.ts`, `cookbooks-auth.spec.ts`)
- [x] Run type check: `npx tsc --noEmit` — no errors
- [x] Run build: `npm run build` — build succeeds
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — included in `npm run test`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Commit all changes (`package.json`, `package-lock.json`) to the working branch and push to remote
- [x] Open PR from `upgrade-better-auth-1-5-6` to `main` referencing issue #257
- [x] Wait for 120 seconds for agentic reviewers to post their comments
- [x] **Monitor PR comments** — when comments appear, address them, commit
  fixes, follow all steps in [Remote push validation] then push to the same
  working branch; repeat until no unresolved comments remain
- [x] Enable auto-merge once no blocking review comments remain
- [x] **Monitor CI checks** — when any CI check fails, diagnose and fix,
  commit, follow all steps in [Remote push validation] then push; repeat
  until all checks pass
- [x] Wait for the PR to merge — **never force-merge**; if a human
  force-merges, continue to Post-Merge

The comment and CI resolution loops are iterative: address -> validate
locally -> push -> sleep for 120 seconds -> re-check -> repeat until the PR
is fully clean.

Ownership metadata:

- Implementer: Doug Hubbard
- Reviewer(s): automated (Codacy, CI)
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on main (`npm ls better-auth` shows
  `1.5.6`)
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] No documentation updates required (no user-facing changes)
- [x] No global spec deltas to sync (no capability specs added to
  `openspec/specs/`)
- [x] Archive the change: move `openspec/changes/upgrade-better-auth-1-5-6/`
  to `openspec/archive/upgrade-better-auth-1-5-6-2026-04-06/`, staging both
  the new location and the deletion of the old location in a single commit
- [x] Confirm `openspec/archive/upgrade-better-auth-1-5-6-2026-04-06/`
  exists and `openspec/changes/upgrade-better-auth-1-5-6/` is gone
- [x] Commit and push the archive to main in one commit
- [x] Prune merged local branch: `git fetch --prune` and `git branch -d
  upgrade-better-auth-1-5-6`
