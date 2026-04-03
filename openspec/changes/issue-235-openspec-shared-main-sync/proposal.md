# Change Proposal: Issue #235 - Auto-sync `.github/openspec-shared` to `main`

## Why

The `.github/openspec-shared` submodule must stay current without manual intervention.  
Issue #235 requires immediate updates when code lands on `main` (both direct pushes and merges), and the automation must push updates directly to `main`.

## Scope

In scope:
- Automation that updates only the `.github/openspec-shared` submodule reference.
- Trigger behavior for immediate execution on `main` updates.
- Direct push to `main` by automation when a submodule pointer update is needed.

Out of scope:
- Any non-submodule repository content changes.
- Changes to unrelated workflows, release logic, or branch strategies.
- PR-based update flow for this automation.

## Proposed Change

Implement (or update) a GitHub Actions workflow that:

1. Triggers immediately on updates to `main`.
2. Syncs `.github/openspec-shared` to its configured upstream `main`.
3. Detects whether the submodule pointer changed.
4. Commits only the submodule pointer update.
5. Pushes directly to `main` using workflow credentials.

## Behavioral Requirements

- Immediate execution for:
  - direct pushes to `main`
  - merges that result in new commits on `main`
- Only `.github/openspec-shared` pointer updates are committed.
- No commit is made when there is no submodule change.
- Workflow avoids infinite self-trigger loops (idempotent + guard conditions).
- Automation uses least-privilege permissions required to push.

## Acceptance Criteria

1. A push to `main` triggers the workflow and performs sync logic immediately.
2. A merged PR into `main` results in the same immediate sync behavior.
3. If submodule is already current, workflow exits cleanly with no commit.
4. If outdated, exactly one commit updates `.github/openspec-shared`, pushed to `main`.
5. No files outside `.github/openspec-shared` are included in automation commits.

## Risks & Mitigations

- **Risk:** recursive workflow triggering from bot commits  
  **Mitigation:** skip conditions (actor/message/path guard) and no-op detection.
- **Risk:** push permission failures  
  **Mitigation:** explicit workflow `permissions: contents: write` and clear failure logging.
- **Risk:** accidental broader repository mutation  
  **Mitigation:** stage/commit only `.github/openspec-shared`.

