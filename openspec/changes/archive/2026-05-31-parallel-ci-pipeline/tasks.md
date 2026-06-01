# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b parallel-ci-pipeline` then immediately `git push -u origin parallel-ci-pipeline`

## Execution

Ensure a BDD/TDD workflow: you MUST define the desired behavior in the `tests.md` file first and write test validations before executing the execution steps. Do not start file changes until `tests.md` is complete!

- [x] **Task 1: Add isolated test scripts in `package.json`**
  - Edit `package.json` to add:
    - `"test:unit": "vitest run --exclude \"**/e2e/**\" --exclude \"**/*.integration.test.ts\" --exclude \"**/*.integration.spec.ts\""`
    - `"test:integration": "vitest run \"**/*.integration.test.ts\" \"**/*.integration.spec.ts\""`
  - *Verification command*: Run `npm run test:unit` locally and verify only unit tests run. Run `npm run test:integration` locally and verify only 3 integration files run.

- [x] **Task 2: Deconstruct `.github/workflows/build-and-test.yml` into parallel jobs**
  - Refactor `.github/workflows/build-and-test.yml` to define:
    - `build-and-unit` job:
      - Runs build (`npm run build`).
      - Runs unit tests (`npm run test:unit -- --coverage`).
      - Uploads compiled `.output/` artifact using `actions/upload-artifact@v6` (with `retention-days: 1`).
      - Uploads partial coverage reports using Codacy CLI script with `--partial`.
    - `integration` job (needs `build-and-unit`):
      - Restores npm dependencies.
      - Runs integration tests (`npm run test:integration -- --coverage`).
      - Uploads partial coverage reports using Codacy CLI script with `--partial`.
    - `e2e` job (needs `build-and-unit`):
      - Starts MongoDB Docker container.
      - Restores npm dependencies and downloads the `.output/` artifact using `actions/download-artifact@v6`.
      - Installs Playwright browsers.
      - Runs database seed and E2E warmup.
      - Runs E2E tests (`npm run test:e2e`).
      - Uploads Playwright runtime summary, test results, and partial coverage reports.
    - `finalize-coverage` job (needs `[build-and-unit, integration, e2e]`, runs `if: always()`):
      - Runs the Codacy CLI reporter `final` merge command.

Suggested start-of-work commands: `git checkout main` → `git pull --ff-only` → `git checkout -b parallel-ci-pipeline` → `git push -u origin parallel-ci-pipeline`

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] Run unit tests: `npm run test:unit`
- [x] Run integration tests: `npm run test:integration`
- [x] Run E2E tests: `npm run test:e2e`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — run `npm run test:unit`; all tests must pass
- **Integration tests** — run `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — run `npm run test:e2e`; all tests must pass
- **Build** — run `npm run build`; build must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from working branch to `main`. **The PR body MUST explicitly state "Closes #473".**
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved to allow the process to progress. Follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll for check status autonomously using `gh pr checks <PR-URL> --json isRequired,state`; when any **required (blocking)** CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all required checks pass
- [x] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

Ownership metadata:

- Implementer: Antigravity
- Reviewer(s): Doug
- Required approvals: 1 approval from a human reviewer

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change (README.md or standard guides if affected)
- [x] Sync approved spec deltas into `openspec/specs/` (global spec)
- [x] Archive the change: move `openspec/changes/parallel-ci-pipeline/` to `openspec/changes/archive/2026-05-31-parallel-ci-pipeline/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [x] Confirm `openspec/changes/archive/2026-05-31-parallel-ci-pipeline/` exists and `openspec/changes/parallel-ci-pipeline/` is gone
- [x] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-2026-05-31-parallel-ci-pipeline` then `git push -u origin doc/archive-2026-05-31-parallel-ci-pipeline`
- [x] Open a PR from `doc/archive-2026-05-31-parallel-ci-pipeline` to `main` with title `docs: archive parallel-ci-pipeline (2026-05-31)` — **do NOT push directly to `main`**
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [x] Prune merged local branches: `git fetch --prune` and `git branch -d parallel-ci-pipeline doc/archive-2026-05-31-parallel-ci-pipeline`
