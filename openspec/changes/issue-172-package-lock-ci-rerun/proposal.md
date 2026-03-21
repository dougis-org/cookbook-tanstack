## Why

GitHub Actions CI currently auto-commits a regenerated `package-lock.json` from the `build-and-test` workflow when dependencies drift. That commit is intentionally marked with `[skip ci]`, which prevents the changed branch from being fully validated by CI after the lockfile correction. The issue is reported in #172.

## What Changes

- Remove `[skip ci]` from the auto-commit message in `.github/workflows/build-and-test.yml`.
- Keep the `continue-on-error: true` behavior to avoid failing the entire run if commit/push fails.
- Maintain the existing `--force-with-lease` push to reduce race conditions while still ensuring the new commit gets evaluated by CI.
- Add documentation comment to explain why this behavior is safe and deliberate.

## Capabilities

### New Capabilities

- `github-actions-ci-integrity`: CI should treat auto-committed lockfile corrections like normal commits and run all checks.
- `github-actions-auto-update-trigger`: workflow can annotate run context when a run is triggered by CI self-commit.

### Modified Capabilities

- `.github/workflows/build-and-test.yml`: commit/push flow for lockfile updates.

## Impact

- **Files changed:** `.github/workflows/build-and-test.yml`
- **CI behavior:** Auto-updated lockfile commits will now re-trigger workflow checks instead of being skipped.
- **Dependencies:** No `package.json` dependency changes required.

## Scope

**In scope:**

- Workflow's lockfile auto-commit step in `build-and-test.yml`
- Maintaining current PR-mode lock sync semantics (same-repo PR branch only)

**Out of scope:**

- Changing checkout refs or enabling CI for feedback branches outside this workflow
- Adding lockfile correction to any other workflow

## Risks

- **Potential extra workflow runs:** When `package-lock.json` is corrected, an additional PR workflow run will occur. This is acceptable because it validates the branch state and avoids hidden drift.
- **Loop risk:** If the lockfile toggles repeatedly, the workflow may run multiple times. Mitigation is that the step only commits when `git diff --cached` has changes, so it stops once stable.

## Non-Goals

- Not addressing unrelated CI failure modes (e.g., flaky tests, environment setup issues)
- Not introducing a separate lockfile bot or new GitHub Apps

## Open Questions

- We will add an explicit workflow-level stamp (e.g., `CI_UPDATED_LOCKFILE=true`) on the auto-commit-triggered check run, so downstream logic can distinguish auto-applying workflow events from user pushes.
- Should the stamp also emit a GitHub Actions output or PR comment when set? (out-of-scope for this change, optional later.)
