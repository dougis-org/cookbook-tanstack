# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix-shell-injection-build-and-test` then immediately `git push -u origin fix-shell-injection-build-and-test`

## Execution

- [x] **Step 3 — Update `.github/workflows/build-and-test.yml`:**
    - [x] Locate the `Commit updated lock file` step (around line 75).
    - [x] Add an `env` block to the step.
    - [x] Map `HEAD_REF: ${{ github.head_ref }}` and `HEAD_SHA: ${{ github.event.pull_request.head.sha }}`.
    - [x] Update the `run` script to use `"$HEAD_REF"` and `"$HEAD_SHA"` instead of `${{ github.head_ref }}` and `${{ github.event.pull_request.head.sha }}`.
- [x] **Step 4 — Final review of changes:** Ensure no other `${{ ... }}` interpolations are present in `run` blocks in `build-and-test.yml` that could be vulnerable.

Suggested start-of-work commands: `git checkout main` → `git pull --ff-only` → `git checkout -b fix-shell-injection-build-and-test` → `git push -u origin fix-shell-injection-build-and-test`

## Validation

- [x] **Step 5 — YAML Validation:** Ensure the modified `.github/workflows/build-and-test.yml` is valid YAML.
- [ ] **Step 6 — Dry Run (Optional):** If a local runner like `act` is available, test the workflow locally. Otherwise, rely on CI validation after pushing.
- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e`
- [x] Run type checks: `npm run typecheck` (if available, else `tsc`)
- [x] Run build: `npm run build`
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — `npm run test` (includes integration); all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from working branch to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

Ownership metadata:

- Implementer: Gemini CLI
- Reviewer(s): dougis-org maintainers
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/fix-shell-injection-build-and-test/` to `openspec/changes/archive/2026-04-14-fix-shell-injection-build-and-test/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/2026-04-14-fix-shell-injection-build-and-test/` exists and `openspec/changes/fix-shell-injection-build-and-test/` is gone
- [ ] Commit and push the archive to the default branch in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d fix-shell-injection-build-and-test`
