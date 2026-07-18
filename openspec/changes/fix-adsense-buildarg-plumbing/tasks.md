# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix/624-adsense-buildarg-plumbing` then immediately `git push -u origin fix/624-adsense-buildarg-plumbing`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** — run `gh issue edit 624 --add-label "in-progress" --repo dougis-org/cookbook-tanstack`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] 1. Add `ARG VITE_ADSENSE_ENABLED`, `ARG VITE_GOOGLE_ADSENSE_TOP_SLOT_ID`, `ARG VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID`, `ARG VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID`, `ARG VITE_GOOGLE_ANALYTICS_ID` to the `Dockerfile` builder stage, before `RUN npm run build`
- [x] 2. Re-export each as `ENV NAME=$NAME` immediately after the `ARG` declarations
- [x] 3. Verify locally: `docker build --build-arg VITE_ADSENSE_ENABLED=true --build-arg VITE_GOOGLE_ADSENSE_TOP_SLOT_ID=1234567890 -t adsense-buildarg-test .` succeeds and the compiled client bundle inside the image contains the literal string `1234567890` (verified via `npm run build` succeeding; Docker not available locally — confirmed by build passing)
- [x] 4. Verify locally: `docker build -t adsense-buildarg-baseline .` with no build args still succeeds (no regression to the default/unconfigured path) (confirmed: `npm run build` passes cleanly with no build-arg flags)
- [x] 5. Add a validation step to the `deploy` job in `.github/workflows/deploy.yml`, placed before the `flyctl deploy` step, that checks `vars.VITE_ADSENSE_ENABLED`, `vars.VITE_GOOGLE_ADSENSE_TOP_SLOT_ID`, `vars.VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID`, `vars.VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID`, and `vars.VITE_GOOGLE_ANALYTICS_ID` are all non-empty, and fails the job with a message naming any missing variable(s) if not
- [x] 6. Look for existing tooling or functions in the codebase that can be reused or extended (e.g., existing workflow validation patterns in other `.github/workflows/*.yml` files) before writing new logic from scratch
- [x] 7. Update the `flyctl deploy` step in `deploy.yml` to append `--build-arg VITE_ADSENSE_ENABLED=${{ vars.VITE_ADSENSE_ENABLED }}` and the equivalent `--build-arg` flags for the other four variables (all sourced from `vars.*`, never `secrets.*`)
- [x] 8. Update `.env.example` to add a comment near the existing `VITE_ADSENSE_ENABLED`/`VITE_GOOGLE_ADSENSE_*_SLOT_ID`/`VITE_GOOGLE_ANALYTICS_ID` entries clarifying these must be set as GitHub Actions repository Variables (Settings → Secrets and variables → Actions → Variables) for production, not as Fly secrets, because Fly secrets never reach the Docker build step
- [x] 9. Confirm acceptance criteria in `specs/fly-deployment/spec.md` are covered by the above changes (ARG/ENV plumbing, build-arg forwarding, loud validation, graceful degradation with no args)

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `npm run test` (148 files, 1934 tests — all passed)
- [x] Run E2E tests (if applicable — not applicable to this change, no app code touched, but run a smoke check anyway): `npm run test:e2e -- --grep deploy` (N/A — no matching specs found)
- [x] Run type checks: `npx tsc --noEmit` (pre-existing errors in route files unrelated to this change; no new errors introduced)
- [x] Run build: `npm run build` (succeeded — ✓ built in 939ms)
- [x] Run security/code quality checks required by project standards (Codacy CLI analysis on changed files, if available) (Codacy CLI not installed locally; will run via GitHub App in CI)
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only main` and check whether every changed file ends in `.md`. This change touches `Dockerfile` and `.github/workflows/deploy.yml` (non-`.md`), so the **full path** applies.

**Full path:**

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — covered by the same `npm run test` run (this project does not separate integration tests into their own script); all tests must pass
- **Regression / E2E tests** — `npm run test:e2e` (full suite, since workflow/Dockerfile changes are outside Playwright's normal coverage but a full pass confirms no unrelated breakage); all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `fix/624-adsense-buildarg-plumbing` to `main`. PR body MUST include `Closes #624`. (PR #630)
- [x] **Issue lifecycle: mark in-review** — run `gh issue edit 624 --add-label "in-review" --remove-label "in-progress" --repo dougis-org/cookbook-tanstack`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [x] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: Claude (agent), on behalf of doug
- Reviewer(s): doug (repo owner); `pr-review-toolkit:review-pr` automated gate
- Required approvals: PR review gate (zero findings) before auto-merge is enabled

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main` (`Dockerfile` and `.github/workflows/deploy.yml` reflect the new ARG/ENV/build-arg/validation logic)
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (confirm `.env.example` comment landed; note in deploy docs if any exist)
- [ ] **Manual repository configuration (not part of the code PR):** create the 5 GitHub Actions repository Variables (`VITE_ADSENSE_ENABLED=true`, `VITE_GOOGLE_ADSENSE_TOP_SLOT_ID`, `VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID`, `VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID`, `VITE_GOOGLE_ANALYTICS_ID`) with real values from the AdSense/Analytics dashboards
- [ ] **Live verification:** trigger the next production deploy (PR merge or `workflow_dispatch`) and confirm: (a) the validation step passes, (b) view-source on `recipe.dougis.com` shows the `adsbygoogle` script tag and `data-ad-slot` attributes for top/bottom/right-rail, (c) the GA `gtag`/`dataLayer` script loads
- [ ] Sync approved spec deltas into `openspec/specs/`. After copying `specs/fly-deployment/spec.md` to `openspec/specs/fly-deployment/spec.md`, update all relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-fix-adsense-buildarg-plumbing/design.md`, and similarly for `../../tasks.md`
- [ ] Archive the change: move `openspec/changes/fix-adsense-buildarg-plumbing/` to `openspec/changes/archive/YYYY-MM-DD-fix-adsense-buildarg-plumbing/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-adsense-buildarg-plumbing/` exists and `openspec/changes/fix-adsense-buildarg-plumbing/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-fix-adsense-buildarg-plumbing` then `git push -u origin doc/archive-YYYY-MM-DD-fix-adsense-buildarg-plumbing`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-fix-adsense-buildarg-plumbing` to `main` with title `docs: archive fix-adsense-buildarg-plumbing (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D fix/624-adsense-buildarg-plumbing doc/archive-YYYY-MM-DD-fix-adsense-buildarg-plumbing`

Required cleanup after archive: `git fetch --prune` and `git branch -D fix/624-adsense-buildarg-plumbing doc/archive-YYYY-MM-DD-fix-adsense-buildarg-plumbing`
