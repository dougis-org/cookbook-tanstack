## GitHub Issues

- dougis-org/cookbook-tanstack#297

## Why

- **Problem statement:** When `build-and-test.yml` auto-commits a stale `package-lock.json` back to a PR branch, GitHub's security model blocks the `synchronize` event from firing — because the push uses `GITHUB_TOKEN`. Required checks (build/test, Codacy quality, Codacy coverage, Codacy duplication) never run on the lockfile-update commit, leaving the PR permanently blocked until the developer manually pushes another commit.
- **Why now:** This blocks every PR that touches dependencies. It is a frequent occurrence and always requires manual intervention to unblock.
- **Business/user impact:** Developer productivity — PRs silently stall after CI auto-fixes the lockfile. The developer must push a no-op commit or re-push to unstick it. Compounded by the fact that all four required checks plus comment resolution must pass before merge.

## Problem Space

- **Current behavior:** CI runs, detects a stale `package-lock.json`, commits and pushes the update using `GITHUB_TOKEN`. GitHub drops the event; required checks never fire on the new commit. PR is blocked.
- **Desired behavior:** CI commits and pushes the lockfile update; GitHub fires the `synchronize` event; all required checks run on the updated commit; PR proceeds normally once checks pass.
- **Constraints:** Auto-fix behavior must be preserved — removing it caused deployment failures from stale lockfiles. The fix must not require changes to any other workflow file.
- **Assumptions:** A fine-grained PAT with `Contents: Read and write` scoped to this repo is acceptable for this use case. Double-running CI (once to commit lockfile, once to validate it) is an acceptable cost.
- **Edge cases considered:**
  - Two PRs racing to push lockfile updates — already handled by `--force-with-lease` and `continue-on-error: true` on the push step.
  - Second CI run on the auto-commit — lockfile will already be current, so no second auto-commit occurs (guarded by `git diff --cached --quiet` check).
  - The `CI_UPDATED_LOCKFILE` env var is set on the second run but currently unused — this is acceptable; it may be used for optimization in future.

## Scope

### In Scope

- Add `token: ${{ secrets.WORKFLOW_PAT }}` to the `actions/checkout` step in `.github/workflows/build-and-test.yml`
- Document the required PAT configuration (secret name, scope, repo restriction)

### Out of Scope

- Changes to any other workflow file
- Optimizing the double-run (e.g., skipping E2E on auto-lockfile commits)
- Removing or redesigning the auto-commit behavior
- Using a GitHub App token (PAT is sufficient for this project scale)

## What Changes

- `.github/workflows/build-and-test.yml` — one line added to the `actions/checkout` step
- A new repo secret `WORKFLOW_PAT` must be created in GitHub repository settings (manual one-time setup, not a code change)

## Risks

- Risk: PAT expiration
  - Impact: CI auto-commit push silently fails; PR blocks again (same symptom as today)
  - Mitigation: Use a fine-grained PAT with no expiry, or set a calendar reminder to rotate it. GitHub will also send an expiry notification email.
- Risk: PAT scope too broad
  - Impact: If the PAT is compromised, it has write access to repo contents
  - Mitigation: Use a fine-grained PAT scoped to `cookbook-tanstack` repo only, `Contents: Read and write` permission only. This is the minimum required scope.

## Open Questions

- None. All decisions resolved during exploration.

## Non-Goals

- Redesigning the lockfile auto-commit strategy
- Migrating to GitHub App tokens
- Optimizing CI run count

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`, and `tasks.md` before implementation starts.
