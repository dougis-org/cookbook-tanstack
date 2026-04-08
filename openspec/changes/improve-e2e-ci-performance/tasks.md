# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/improve-e2e-ci-performance` then immediately `git push -u origin feat/improve-e2e-ci-performance`
- [x] Review `openspec/changes/improve-e2e-ci-performance/proposal.md`, `openspec/changes/improve-e2e-ci-performance/design.md`, and `openspec/changes/improve-e2e-ci-performance/specs/e2e-ci-performance/spec.md` before editing implementation files
- [x] Capture or document the current Playwright CI baseline from `.github/workflows/build-and-test.yml` and `playwright.config.ts`, including the serialized `workers: 1` behavior and any available runtime signal from recent CI runs

## Execution

- [x] Define the desired BDD/TDD behavior first by adding or updating failing tests that codify the required Playwright CI behavior and any refactored E2E spec structure before changing implementation code
- [x] Implement lightweight runtime visibility for the Playwright CI segment so maintainers can identify spec skew, retry behavior, or other dominant runtime costs without introducing heavyweight telemetry
- [x] Raise Playwright CI concurrency above the serialized baseline in `playwright.config.ts` and/or `.github/workflows/build-and-test.yml` using an incremental, validated worker strategy
- [x] Rebalance, split, or isolate high-skew E2E specs and shared setup flows in `src/e2e/` when they block deterministic parallel execution
- [x] Update any affected documentation or workflow notes so the optimized CI behavior, rollback path, and relation to spike issue `#277` are clear
- [x] Review for duplication and unnecessary complexity after each small increment, keeping the implementation scoped to full-suite PR execution rather than selective test routing
- [x] Confirm acceptance criteria from `openspec/changes/improve-e2e-ci-performance/specs/e2e-ci-performance/spec.md` are covered by code changes and tests

Suggested start-of-work commands: `git checkout main` -> `git pull --ff-only` -> `git checkout -b feat/improve-e2e-ci-performance` -> `git push -u origin feat/improve-e2e-ci-performance`

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests against the updated configuration: `npm run test:e2e`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] Run security/code quality checks required by project standards, including Codacy analysis if available for the touched files
- [x] Verify the runtime visibility added by this change is present and usable without negating the intended CI-minute savings
- [x] Re-run the relevant validation after any spec refactor or worker-count change until results are deterministic
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — run `npm run test`; all tests must pass
- **Regression / E2E tests** — run `npm run test:e2e`; all tests must pass
- **Type checks** — run `npx tsc --noEmit`; the type check must pass
- **Build** — run `npm run build`; build must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

Use the project's documented commands for each of the above (see `AGENTS.md` and `CONTRIBUTING.md`).

## PR and Merge

- [ ] Run the required pre-PR self-review from `.codex/skills/openspec-apply-change/SKILL.md` before committing: spawn a reviewer sub-agent, review `git diff main...HEAD` plus unstaged changes, apply clearly correct fixes, then re-run validation
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `feat/improve-e2e-ci-performance` to `main`, ensuring the PR description references `#244` and notes issue `#277` as related research only
- [ ] Wait for 120 seconds for the agentic reviewers to post their comments
- [ ] **Monitor PR comments** — when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; repeat until no unresolved comments remain
- [ ] Enable auto-merge once no blocking review comments remain and all required CI checks are green
- [ ] **Monitor CI checks** — when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; repeat until all checks pass
- [ ] Wait for the PR to merge — **never force-merge**; if a human force-merges, continue to Post-Merge

The comment and CI resolution loops are iterative: address -> validate locally -> push -> sleep for 120 seconds -> re-check -> repeat until the PR is fully clean. If a human force-merges before the PR is clean, proceed directly to Post-Merge steps.

Ownership metadata:

- Implementer: Codex/main agent
- Reviewer(s): human maintainer plus required pre-PR reviewer sub-agent
- Required approvals: explicit human proposal approval before implementation, then repository-required PR approvals before merge

Blocking resolution flow:

- CI failure -> fix -> commit -> validate locally -> push -> re-run checks
- Security finding -> remediate -> commit -> validate locally -> push -> re-scan
- Review comment -> address -> commit -> validate locally -> push -> confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change
- [ ] Sync approved spec deltas into `openspec/specs/`
- [ ] Archive the change: move `openspec/changes/improve-e2e-ci-performance/` to `openspec/changes/archive/YYYY-MM-DD-improve-e2e-ci-performance/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-improve-e2e-ci-performance/` exists and `openspec/changes/improve-e2e-ci-performance/` is gone
- [ ] Commit and push the archive to `main` in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d feat/improve-e2e-ci-performance`

Required cleanup after archive: `git fetch --prune` and `git branch -d feat/improve-e2e-ci-performance`
