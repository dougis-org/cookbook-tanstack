# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git fetch origin main` (done during proposal — dedicated worktree created from `origin/main`)
- [x] **Step 2 — Create and publish working branch:** `git worktree add .worktrees/publish-terms-of-service -b publish-terms-of-service origin/main` then `git push -u origin publish-terms-of-service` (done during proposal)

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. Confirmed present in this environment's skill listing at proposal time. If it is not listed when apply begins, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** — run `gh issue edit 625 --repo dougis-org/cookbook-tanstack --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] **Add `src/routes/terms.tsx`** — new route mirroring `src/routes/privacy-policy.tsx`'s structure exactly: `createFileRoute("/terms")({ component: TermsPage })`, a `LAST_UPDATED` constant, a `SECTIONS: AccordionItem[]` constant with 8 sections (Your Account, Your Content, Acceptable Use, Billing & Subscriptions, Third-Party Connections, Termination, Disclaimers, Changes to These Terms), and a `TermsPage()` function rendering `PageLayout role="public-marketing"` + `Accordion`. Content sourced from the exploration-session draft, refined per design.md Decisions 2 and 3 (cross-link to `/privacy-policy` in the Third-Party Connections section instead of restating data-handling detail).
- [x] **Update `src/components/auth/RegisterForm.tsx`** — replace the `<a href="/terms">Terms</a>` block (~lines 114-122) with `<Link to="/terms">Terms</Link>`, matching the existing adjacent `<Link to="/privacy-policy">` block's className/structure exactly. Remove the `{/* TODO: Replace <a> with <Link> for /terms once that route is created (#625) */}` comment.
- [x] Confirm `src/routeTree.gen.ts` picks up the new `/terms` route automatically via TanStack Router's dev-server codegen (do not hand-edit this file).
- [x] Confirm acceptance criteria in `specs/terms-of-service-page/spec.md` are covered: route resolves publicly, registration link is client-side, sections are independently collapsible, content covers all 7 substantive topics, third-party section cross-links rather than duplicates, no hardcoded colors/emoji introduced.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests (if `RegisterForm` or route-navigation E2E coverage exists/needs updating): `npm run test:e2e`
- [x] Run type checks (TypeScript strict mode, `noUnusedLocals`/`noUnusedParameters`): `npx tsc --noEmit` (or project's configured typecheck script)
- [x] Run build: `npm run build`
- [x] Run security/code quality checks required by project standards (Codacy/Snyk, per `CLAUDE.md`)
- [x] Manual visual QA: toggle all four themes (`dark`, `dark-greens`, `light-cool`, `light-warm`) on `/terms` via the header drawer; confirm legibility per `design-system/CLAUDE.md` "What done looks like" checklist
- [x] Manual click-through: from `/register`, click "Terms" and confirm client-side navigation (no full page reload) to `/terms`
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against `main`) and check whether every changed file ends in `.md`. This change touches `.tsx` files, so the **full path** applies.

**Full path:**

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — included in `npm run test` per this project's Vitest setup
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch (including the `.gitignore` addition of `.worktrees/`) and push to remote
- [x] Open PR from `publish-terms-of-service` to `main`. PR body MUST include `Closes #625`.
- [x] **Issue lifecycle: mark in-review** — run `gh issue edit 625 --repo dougis-org/cookbook-tanstack --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [x] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent (this session), on behalf of dougis
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent (automated); dougis (human, optional final pass given legal-content risk noted in proposal/design Risks)
- Required approvals: PR review gate (zero findings) before auto-merge; no separate human legal review is blocking for this change per proposal Non-Goals, though flagged as advisable follow-up

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only` (from the primary checkout, not the worktree)
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change (none identified beyond this change's own artifacts — `/terms` is not referenced elsewhere in `CLAUDE.md`/`AGENTS.md`)
- [x] Sync approved spec deltas into `openspec/specs/`: copy `openspec/changes/publish-terms-of-service/specs/terms-of-service-page/spec.md` to `openspec/specs/terms-of-service-page/spec.md`, updating the relative link `../../design.md` to `../../changes/archive/YYYY-MM-DD-publish-terms-of-service/design.md`
- [x] Archive the change: move `openspec/changes/publish-terms-of-service/` to `openspec/changes/archive/YYYY-MM-DD-publish-terms-of-service/` **and stage both the new location and the deletion of the old location in a single commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-publish-terms-of-service/` exists and `openspec/changes/publish-terms-of-service/` is gone
- [x] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-publish-terms-of-service` then `git push -u origin doc/archive-YYYY-MM-DD-publish-terms-of-service`
- [x] Open a PR from `doc/archive-YYYY-MM-DD-publish-terms-of-service` to `main` with title `docs: archive publish-terms-of-service (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [x] Prune merged local branches and remove the dedicated worktree: `git worktree remove .worktrees/publish-terms-of-service`, `git fetch --prune`, `git branch -D publish-terms-of-service doc/archive-YYYY-MM-DD-publish-terms-of-service`

Required cleanup after archive: `git worktree remove .worktrees/publish-terms-of-service`, `git fetch --prune`, `git branch -D publish-terms-of-service doc/archive-YYYY-MM-DD-publish-terms-of-service`
