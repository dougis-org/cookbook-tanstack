# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix/health-check-domain-redirect` then immediately `git push -u origin fix/health-check-domain-redirect`

## Execution

### Fix A — domain-redirect.ts IP passthrough

- [x] Open `src/lib/domain-redirect.ts`
- [x] After the `requestHostname` is extracted from `new URL(...)`, add IP-address guard:
  - IPv4: `/^(\d{1,3}\.){3}\d{1,3}$/`
  - IPv6: `/^[0-9a-f:]+$/i`
  - If either matches, return `null`
- [x] Verify existing tests still pass: `npx vitest run src/lib/__tests__/domain-redirect.test.ts`

### Fix B — fly.toml health check Host header

- [x] Open `fly.toml`
- [x] Add `[http_service.checks.headers]` block inside `[[http_service.checks]]` with `Host = "recipe.dougis.com"`

### Tests

- [x] Open `src/lib/__tests__/domain-redirect.test.ts`
- [x] Add test cases covering:
  - IPv4 host `1.2.3.4` → returns `null`
  - IPv4 host with port `127.0.0.1:3000` → returns `null`
  - IPv6 bracketed `[fdaa:1e:bb7b:a7b:652:ebdb:c00e:2]:3000` → returns `null`
  - IPv6 loopback `[::1]:3000` → returns `null`
  - Named non-primary host `cookbook-tanstack.fly.dev` → still returns redirect URL (regression)
  - Primary host `recipe.dougis.com` → still returns `null` (regression)

## Validation

- [x] Run unit tests: `npm run test`
- [x] Run type check: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] All new test cases pass, all existing tests pass
- [x] No TypeScript errors

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **Type check** — `npx tsc --noEmit` — no errors
- **Build** — `npm run build` — must succeed with no errors
- if **ANY** of the above fail, iterate and address the failure

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to `fix/health-check-domain-redirect` and push to remote
- [x] Open PR from `fix/health-check-domain-redirect` to `main` — title: `fix: skip domain redirect for IP-addressed Host headers and harden fly health check`
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] Enable auto-merge: `gh pr merge --auto --merge`
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [x] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

Ownership metadata:

- Implementer: Claude Code
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify merged changes appear on main
- [x] `fly machines list --app cookbook-tanstack` — confirm both machines show `1/1` checks
- [x] `curl -sI https://recipe.dougis.com/` — confirm 2xx response
- [x] `curl -sI https://cookbook-tanstack.fly.dev/` — confirm 301 redirect to `https://recipe.dougis.com/`
- [x] Mark all remaining tasks as complete
- [x] Sync approved spec deltas into `openspec/specs/` (global spec)
- [x] Archive the change: move `openspec/changes/fix-health-check-domain-redirect/` to `openspec/changes/archive/2026-04-21-fix-health-check-domain-redirect/` in a single atomic commit
- [x] Confirm `openspec/changes/archive/2026-04-21-fix-health-check-domain-redirect/` exists and `openspec/changes/fix-health-check-domain-redirect/` is gone
- [x] Commit and push the archive to main in one commit
- [x] Prune merged local feature branches: `git fetch --prune` and `git branch -d fix/health-check-domain-redirect`
