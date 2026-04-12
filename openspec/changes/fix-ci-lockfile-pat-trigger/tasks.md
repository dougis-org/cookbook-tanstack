# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix/ci-lockfile-pat-trigger` then immediately `git push -u origin fix/ci-lockfile-pat-trigger`

## Manual Setup (one-time, before deploying the workflow change)

- [x] **Create fine-grained PAT in GitHub:**
  1. Go to GitHub → your account → Settings → Developer settings → Personal access tokens → Fine-grained tokens
  2. Click "Generate new token"
  3. Set resource owner to `dougis-org`
  4. Set repository access to "Only selected repositories" → select `cookbook-tanstack`
  5. Under "Repository permissions", set `Contents` to **Read and write**; leave all others as No access
  6. Set expiration as desired (or no expiry — see design.md for trade-offs)
  7. Generate and copy the token value immediately

- [x] **Store PAT as repo secret:**
  1. Go to `dougis-org/cookbook-tanstack` → Settings → Secrets and variables → Actions
  2. Click "New repository secret"
  3. Name: `WORKFLOW_PAT`
  4. Value: paste the PAT copied above
  5. Save

## Execution

- [x] **Edit `.github/workflows/build-and-test.yml`** — in the `Checkout` step, add `token: ${{ secrets.WORKFLOW_PAT }}`:

  ```yaml
  - name: Checkout
    uses: actions/checkout@v6
    with:
      ref: ${{ github.event_name == 'pull_request' && github.event.pull_request.head.repo.full_name == github.repository && github.event.pull_request.head.sha || github.ref }}
      token: ${{ secrets.WORKFLOW_PAT }}
  ```

  No other changes to the file. The existing push command in "Commit updated lock file" works unchanged.

- [x] **Review the diff** — confirm only the `token:` line was added; no other workflow steps were modified

## Validation

- [ ] Run type checks — `npx tsc --noEmit` (workflow file is YAML, but confirm no TS errors in the repo)
- [ ] Run build — `npm run build`
- [ ] Open a test PR with a dep change that drifts the lockfile (or manually delete a line from `package-lock.json` and commit it to a branch), then:
  - Observe Run #1 auto-commits the lockfile with message `chore: update package-lock.json [ci-auto-lock-update]`
  - Observe Run #2 is triggered automatically on the bot commit
  - Confirm all four required checks are green on the bot-commit SHA in the "Checks" tab
- [ ] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before pushing):

- **Unit tests** — `npm run test` — all must pass
- **Build** — `npm run build` — must succeed with no errors
- **E2E tests** — not applicable for a workflow-only change
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [ ] Commit all changes to `fix/ci-lockfile-pat-trigger` and push to remote
- [ ] Open PR from `fix/ci-lockfile-pat-trigger` to `main`
- [ ] Wait 120 seconds for automated reviewer comments
- [ ] **Monitor PR comments** — address any comments, commit fixes, validate locally, push; repeat until no unresolved comments remain
- [ ] Enable auto-merge once no blocking review comments remain
- [ ] **Monitor CI checks** — diagnose and fix any failures, push, repeat until all checks pass
- [ ] Wait for PR to merge — never force-merge

Ownership metadata:

- Implementer: Doug Hubbard
- Reviewer(s): automated (Codacy)
- Required approvals: 0 (configured per repo settings)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on main
- [ ] Mark all remaining tasks as complete
- [ ] Archive the change: move `openspec/changes/fix-ci-lockfile-pat-trigger/` to `openspec/changes/archive/2026-04-11-fix-ci-lockfile-pat-trigger/` in a single commit
- [ ] Confirm archive exists and old path is gone
- [ ] Commit and push the archive to main
- [ ] Prune merged local branch: `git fetch --prune` and `git branch -d fix/ci-lockfile-pat-trigger`
