# Tasks

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** `git checkout -b fix/upgrade-tanstack-packages` then immediately `git push -u origin fix/upgrade-tanstack-packages`

## Execution

### Phase 1: Determine target versions

- [ ] Run `npm view @tanstack/react-start@latest version` to confirm the latest react-start version
- [ ] Run `npm view @tanstack/react-start@<latest-version> dependencies` to get the internal react-router pin — this is the authoritative react-router target version
- [ ] Run `npm view @tanstack/router-plugin@latest version` and `npm view @tanstack/router-plugin@latest peerDependencies` to confirm it accepts the target react-router version
- [ ] Run `npm view @tanstack/react-router-devtools@latest version` and `npm view @tanstack/react-router-ssr-query@latest version` to find compatible versions
- [ ] Document the exact target version set before making any changes

### Phase 2: Apply version bump

- [ ] Update `package.json` with target versions for:
  - `@tanstack/react-router` (driven by react-start internal pin)
  - `@tanstack/react-start` (latest)
  - `@tanstack/router-plugin` (latest compatible)
  - `@tanstack/react-router-devtools` (latest compatible)
  - `@tanstack/react-router-ssr-query` (latest compatible)
- [ ] Run `npm install` and confirm it exits 0 with no peer dependency warnings for these packages
- [ ] Check that `package-lock.json` is updated

### Phase 3: Regenerate route tree and check compilation

- [ ] Run `npm run build` once to trigger route tree regeneration via router-plugin
- [ ] Confirm `src/routeTree.gen.ts` is regenerated without errors
- [ ] Run `npx tsc --noEmit` and capture any type errors introduced by the upgrade

### Phase 4: Investigate and fix failures

- [ ] Run `npm run test` — capture full output if there are failures
- [ ] Run `npm run test:e2e` — capture full output if there are failures
- [ ] For each failure, categorize root cause: type error / runtime error / test infra / transitive dep
- [ ] Fix app code, type usage, or test configuration as needed — one category at a time
- [ ] Repeat Phase 3 + Phase 4 until all tests pass

### Phase 5: Final verification

- [ ] Run `npm run test` — must exit 0
- [ ] Run `npm run test:e2e` — must exit 0
- [ ] Run `npx tsc --noEmit` — must exit 0
- [ ] Run `npm run build` — must exit 0
- [ ] Confirm no peer dep warnings: check `npm install` output

## Validation

- [ ] Run unit/integration tests: `npm run test`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Run type checks: `npx tsc --noEmit`
- [ ] Run build: `npm run build`
- [ ] Confirm no peer dependency warnings for upgraded TanStack packages
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — included in `npm run test`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [ ] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to `fix/upgrade-tanstack-packages` and push to remote
- [ ] Open PR from `fix/upgrade-tanstack-packages` to `main` — reference issue #414 in the PR body
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

The comment and CI resolution loops are iterative: address → validate locally → push → wait 180 seconds → re-check → poll for merge → repeat until the PR merges.

Ownership metadata:

- Implementer: Claude Code agent
- Reviewer(s): Doug Hubbard
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected for this change)
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/upgrade-tanstack-packages/` to `openspec/changes/archive/YYYY-MM-DD-upgrade-tanstack-packages/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-upgrade-tanstack-packages/` exists and `openspec/changes/upgrade-tanstack-packages/` is gone
- [ ] Commit and push the archive to the default branch in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d fix/upgrade-tanstack-packages`
- [ ] Close GitHub issue #414 once merge is confirmed
