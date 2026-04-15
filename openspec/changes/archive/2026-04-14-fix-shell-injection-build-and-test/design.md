## Context

- Relevant architecture: GitHub Actions workflows in `.github/workflows/`.
- Dependencies: GitHub Actions runner environment, `bash` shell.
- Interfaces/contracts touched: The interface between GitHub Actions context and the shell execution environment in `run` steps.

## Goals / Non-Goals

### Goals

- Eliminate the potential for shell injection in `build-and-test.yml`.
- Ensure context data is handled safely by using environment variables.
- Maintain existing functionality for lockfile auto-updates.

### Non-Goals

- Changing the workflow trigger logic.
- Adding new workflow steps.

## Decisions

### Decision 1: Use step-level `env` for GitHub context variables

- Chosen: Map `${{ github.head_ref }}` and `${{ github.event.pull_request.head.sha }}` to environment variables at the step level.
- Alternatives considered: Mapping at the job level or using direct interpolation (rejected due to security risks).
- Rationale: Step-level `env` keeps the variables scoped to where they are needed and is the standard way to securely pass context to shell scripts.
- Trade-offs: Slightly more verbose YAML, but significantly more secure.

### Decision 2: Quote environment variable references in shell script

- Chosen: Use `"$HEAD_REF"` and `"$HEAD_SHA"` in the `git` commands.
- Alternatives considered: Unquoted references (rejected as it's bad practice and could still lead to word splitting issues, though not direct injection).
- Rationale: Double-quoting ensures the shell treats the values as single strings, preventing word splitting and further shell interpretation.
- Trade-offs: None; this is a standard shell scripting best practice.

## Proposal to Design Mapping

- Proposal element: Hardening the `Commit updated lock file` step.
  - Design decision: Decision 1 & 2.
  - Validation approach: Manual inspection of the YAML and potentially triggering the workflow with a "normal" PR to ensure it still works.

## Functional Requirements Mapping

- Requirement: Push lockfile updates to the PR head branch.
  - Design element: `git push origin HEAD:"$HEAD_REF"`
  - Acceptance criteria reference: Specs (to be created)
  - Testability notes: Can be verified by observing successful pushes in PRs.

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: Prevent shell injection from branch names or commit SHAs.
  - Design element: Decision 1 (mapping to `env`).
  - Acceptance criteria reference: Specs (to be created)
  - Testability notes: Verified by the absence of direct `${{ ... }}` interpolation in the `run` block.

## Risks / Trade-offs

- Risk/trade-off: Typo in environment variable name.
  - Impact: Workflow failure.
  - Mitigation: Careful review of the change.

## Rollback / Mitigation

- Rollback trigger: `git push` fails due to incorrect variable resolution.
- Rollback steps: Revert the changes to `.github/workflows/build-and-test.yml`.
- Data migration considerations: None.
- Verification after rollback: Ensure the workflow returns to its previous (functioning but insecure) state.

## Operational Blocking Policy

- If CI checks fail: Investigate the logs to see if the environment variables are being resolved correctly.
- If security checks fail: Re-evaluate the implementation against GitHub security documentation.
- If required reviews are blocked/stale: Ping the relevant maintainers.
- Escalation path and timeout: If not resolved within 24 hours, escalate to repository admins.

## Open Questions

- None. The design follows established security patterns.
