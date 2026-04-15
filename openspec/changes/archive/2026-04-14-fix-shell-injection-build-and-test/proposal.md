## GitHub Issues

- #319

## Why

- Problem statement: The GitHub Actions workflow `build-and-test.yml` uses direct variable interpolation (`${{ ... }}`) for GitHub context data (specifically `github.head_ref` and `github.event.pull_request.head.sha`) within a `run` step. This is a known security vulnerability that allows for shell injection if a user crafts a malicious pull request (e.g., with a specially named branch).
- Why now: Security vulnerabilities should be addressed as soon as they are identified to prevent exploitation.
- Business/user impact: Protecting the CI/CD environment from arbitrary code execution by external contributors or automated systems.

## Problem Space

- Current behavior: `build-and-test.yml` interpolates `${{ github.head_ref }}` and `${{ github.event.pull_request.head.sha }}` directly into shell commands.
- Desired behavior: Use environment variables to pass context data into shell scripts, ensuring that values are handled safely by the shell.
- Constraints: Must maintain existing functionality of the `Commit updated lock file` step, specifically the `git push` and `--force-with-lease` logic.
- Assumptions: The current logic for same-repo PRs (where this step runs) is correct and only needs hardening.
- Edge cases considered: Handling potentially empty values (though these specific GitHub context variables should be populated for the triggered events).

## Scope

### In Scope

- Hardening the `Commit updated lock file` step in `.github/workflows/build-and-test.yml`.
- Auditing and verifying other workflows for similar patterns.

### Out of Scope

- Changing the underlying logic of the lockfile update process.
- Modifying other parts of the workflow unrelated to shell injection risks.

## What Changes

- In `.github/workflows/build-and-test.yml`, the `Commit updated lock file` step will be updated to:
    1. Define `env:` for the step, mapping `${{ github.head_ref }}` and `${{ github.event.pull_request.head.sha }}` to environment variables (e.g., `HEAD_REF`, `HEAD_SHA`).
    2. Use `$HEAD_REF` and `$HEAD_SHA` (quoted) within the `run:` script instead of `${{ ... }}`.

## Risks

- Risk: Incorrectly mapping or referencing environment variables.
  - Impact: The `git push` command might fail, preventing automatic lockfile updates.
  - Mitigation: Use standard GitHub Actions environment variable mapping and verify with a test run if possible.

## Open Questions

- No unresolved ambiguity exists. The fix follows GitHub's recommended security practices.

## Non-Goals

- Refactoring the entire workflow.
- Implementing a different lockfile update strategy.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
