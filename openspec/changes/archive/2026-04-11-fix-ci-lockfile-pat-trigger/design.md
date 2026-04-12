## Context

- **Relevant architecture:** `.github/workflows/build-and-test.yml` — single workflow file handling build, test, and the auto-lockfile-update push. Uses `actions/checkout@v6` which accepts a `token:` parameter and stores it as git credentials for the duration of the job.
- **Dependencies:** GitHub repo secret `WORKFLOW_PAT` (fine-grained PAT, `Contents: Read and write`, scoped to `cookbook-tanstack`). Must be created manually before the workflow change is deployed.
- **Interfaces/contracts touched:** The git push in the "Commit updated lock file" step currently uses the credentials set by `actions/checkout`. Changing the checkout token changes what credentials that push uses — no other steps are affected.

## Goals / Non-Goals

### Goals

- Ensure that when CI pushes a lockfile-update commit, GitHub fires the `synchronize` event on the PR, triggering all required checks on the new commit SHA.

### Non-Goals

- Reducing CI run count
- Modifying any other workflow
- Changing the lockfile commit strategy

## Decisions

### Decision 1: PAT over GitHub App token

- **Chosen:** Fine-grained Personal Access Token stored as repo secret `WORKFLOW_PAT`
- **Alternatives considered:** GitHub App installation token (via `actions/create-github-app-token`)
- **Rationale:** PAT is sufficient for a single-repo, small-team project. GitHub App setup requires creating an App, storing App ID and private key as secrets, and adding a token-generation step to the workflow — meaningful overhead with no benefit at this scale.
- **Trade-offs:** PAT requires manual rotation; GitHub App tokens auto-rotate. Acceptable trade-off given project scale.

### Decision 2: Token injected via `actions/checkout`, not the push command

- **Chosen:** Pass `token: ${{ secrets.WORKFLOW_PAT }}` to `actions/checkout@v6`
- **Alternatives considered:** Embed token directly in the `git push` URL (`https://x-access-token:$TOKEN@github.com/...`)
- **Rationale:** `actions/checkout` stores the token as authenticated git credentials scoped to the job. The existing push command (`git push origin HEAD:${{ github.head_ref }} --force-with-lease=...`) works unchanged. Embedding in the URL would require modifying the push command and risks token exposure in logs if the command is echo'd.
- **Trade-offs:** None significant. The checkout approach is the documented pattern for this use case.

### Decision 3: No change to downstream steps

- **Chosen:** Only the `actions/checkout` step is modified
- **Alternatives considered:** Adding a separate step to re-configure git credentials before the push
- **Rationale:** The checkout action's credential helper applies to all subsequent git operations in the job. No additional step is needed.
- **Trade-offs:** None.

## Proposal to Design Mapping

- Proposal element: PAT stored as `WORKFLOW_PAT` secret
  - Design decision: Decision 1 — PAT over GitHub App token
  - Validation approach: After adding the secret and deploying the workflow change, open a PR with a dep change and verify the auto-commit triggers a new CI run

- Proposal element: `token:` added to checkout step only
  - Design decision: Decision 2 — Token injected via `actions/checkout`
  - Validation approach: Confirm the push step is unmodified; confirm CI run count on a lockfile-drift PR

## Functional Requirements Mapping

- Requirement: Auto-lockfile push triggers `synchronize` event
  - Design element: PAT credentials set via `actions/checkout` token parameter
  - Acceptance criteria reference: New CI run appears after bot commit on a PR with stale lockfile
  - Testability notes: Can be verified by opening a PR that intentionally drifts the lockfile

- Requirement: All four required checks pass on the lockfile-update commit
  - Design element: `synchronize` event fires → full `build-and-test` job reruns → Codacy webhooks receive the new commit
  - Acceptance criteria reference: All check statuses green on the lockfile-update commit SHA in GitHub UI
  - Testability notes: Inspect the "Checks" tab on a PR after the bot auto-commit

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: PAT has minimum necessary scope
  - Design element: Fine-grained PAT, `Contents: Read and write`, single repo
  - Acceptance criteria reference: PAT settings visible in GitHub → Settings → Developer settings → Fine-grained tokens
  - Testability notes: Manual review of PAT configuration

- Requirement category: reliability
  - Requirement: Existing race-condition guard (force-with-lease) remains intact
  - Design element: Push command is unchanged; only the credentials change
  - Acceptance criteria reference: `continue-on-error: true` and `--force-with-lease` still present in push step
  - Testability notes: Code review

## Risks / Trade-offs

- Risk/trade-off: PAT expiration silently breaks the fix
  - Impact: Same symptom as issue #297 returns
  - Mitigation: Set a calendar reminder to rotate the PAT annually; GitHub also sends expiry emails if an expiry date is set

- Risk/trade-off: Double CI run on every PR with stale lockfile
  - Impact: Increased CI minutes consumed
  - Mitigation: Accepted as a known cost. Could be optimized later by short-circuiting non-lockfile steps on the `CI_UPDATED_LOCKFILE=true` run, but that is out of scope.

## Rollback / Mitigation

- **Rollback trigger:** PAT is revoked, lost, or the change introduces unexpected behavior
- **Rollback steps:** Remove `token: ${{ secrets.WORKFLOW_PAT }}` from the checkout step; the job reverts to `GITHUB_TOKEN` behavior (back to the blocked state, but safe)
- **Data migration considerations:** None
- **Verification after rollback:** CI runs without the PAT token; lockfile auto-commits no longer trigger new runs (confirms rollback successful)

## Operational Blocking Policy

- If CI checks fail: fix the failure, commit, push to the working branch, repeat until checks pass
- If security checks fail: remediate the finding before merging
- If required reviews are blocked/stale: escalate to repo owner
- Escalation path and timeout: N/A — single-developer project

## Open Questions

- None.
