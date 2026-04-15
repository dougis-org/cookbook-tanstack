## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Secure context passing to shell

The system SHALL use environment variables to pass GitHub context data to shell scripts within `run` steps to prevent shell injection.

#### Scenario: Branch name with shell characters

- **Given** A pull request is opened with a branch name like `feature";rm -rf /;"`
- **When** The `build-and-test.yml` workflow runs and reaches the `Commit updated lock file` step
- **Then** The branch name is treated as a literal string value by the shell and does not execute any injected commands

## MODIFIED Requirements

### Requirement: MODIFIED Lockfile update push

The system SHALL push lockfile updates using securely passed environment variables for the target branch and lease SHA.

#### Scenario: Successful lockfile push

- **Given** A pull request from the same repository has an outdated `package-lock.json`
- **When** The `Commit updated lock file` step runs
- **Then** It successfully executes `git push` using the `$HEAD_REF` and `$HEAD_SHA` environment variables
- **And** The PR branch is updated with the new lockfile

## Traceability

- Proposal element: Hardening the `Commit updated lock file` step -> ADDED Secure context passing to shell
- Design decision: Decision 1: Use step-level `env` -> ADDED Secure context passing to shell
- Design decision: Decision 2: Quote environment variable references -> ADDED Secure context passing to shell
- Requirement: ADDED Secure context passing to shell -> Task: Update `build-and-test.yml` (to be created in `tasks.md`)

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Prevention of command execution via branch name

- **Given** A branch name containing a subshell expression like `$(whoami)`
- **When** The workflow runs and uses this value in a `run` step via an environment variable
- **Then** The shell does not evaluate the subshell expression and treats it as a literal string
