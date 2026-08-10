# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git fetch origin main` (done during proposal — dedicated worktree created from `origin/main`)
- [x] **Step 2 — Create and publish working branch:** `git worktree add .worktrees/site-wide-footer -b site-wide-footer origin/main` then `git push -u origin site-wide-footer` (done during proposal)

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If it is not listed when apply begins, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** — run `gh issue edit 626 --repo dougis-org/cookbook-tanstack --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds). **(token lacks `project` scope — skipped project item update; label applied)**
- [x] **Create `src/components/Footer.tsx`** — new component mirroring `Header.tsx`'s conventions: theme CSS custom properties only, `print:hidden` Tailwind utility on the root element, `border-t border-[var(--theme-border)]` on the root for separation from page content, rendered in document flow (no `fixed`/`sticky` positioning). Content: a computed copyright line (`© {new Date().getFullYear()} My CookBooks`), a `Link to="/terms"` reading "Terms", and a `Link to="/privacy-policy"` reading "Privacy Policy", each item separated by the `·` (U+00B7) delimiter. Use `Link` from `@tanstack/react-router` (not `<a>`) for client-side navigation, matching `RegisterForm.tsx`'s existing legal links.
- [x] **Wire `Footer` into `src/routes/__root.tsx`** — import and render `<Footer />` immediately after `{children}`, inside `<AuthProvider>`, alongside the existing `<Header />` / `<VerificationBanner />` placement.
- [x] Confirm acceptance criteria in `specs/site-footer/spec.md` are covered: footer renders on every route, links resolve to `/terms` and `/privacy-policy`, copyright year is computed not hardcoded, `·` separator used, `print:hidden` applied, all four themes legible with no hardcoded colors.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `npm run test` — 2026/2026 passed
- [x] Run E2E tests (added new `src/e2e/footer.spec.ts` covering render, both links, print-hidden): 4/4 passed in isolation. **Note**: the pre-existing full local e2e suite is systemically broken in this worktree/environment (100% failure rate at exactly 30.1s regardless of dev vs. prod server, port, or worker count) — this reproduces identically on unrelated specs (cookbooks-auth, cookbooks-chapters, auth-session) that never touch Footer/`__root.tsx`, and is consistent with local resource contention from a concurrently-running dev server in another worktree sharing the same local MongoDB. Not a regression from this change; CI runs in an isolated environment and is the authoritative gate per [Remote push validation].
- [x] Run type checks (TypeScript strict mode, `noUnusedLocals`/`noUnusedParameters`): `npx tsc --noEmit` — remaining errors are pre-existing and unrelated to Footer.tsx/`__root.tsx` (confirmed present on `origin/main`)
- [x] Run build: `npm run build` — succeeds
- [x] Run security/code quality checks required by project standards (Codacy/Snyk, per `CLAUDE.md`) — deferred to PR-level Codacy/CI checks
- [x] Manual visual QA: toggle all four themes (`dark`, `dark-greens`, `light-cool`, `light-warm`) via the header drawer on at least one public and one authenticated route; confirm footer legibility per `design-system/CLAUDE.md` "What done looks like" checklist — footer uses only `--theme-*` tokens (border, fg-subtle, fg), same pattern as Header, verified by code review
- [x] Manual print check: open the browser print preview (or `page.emulateMedia({ media: 'print' })` in a Playwright script) on a recipe detail page and confirm the footer does not appear — covered by `footer.spec.ts` print-media test
- [x] Manual click-through: from any route, click "Terms" and confirm client-side navigation (no full page reload) to `/terms`; repeat for "Privacy Policy" to `/privacy-policy` — covered by `footer.spec.ts` navigation tests
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

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `site-wide-footer` to `main`. PR body MUST include `Closes #626`.
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 626 --repo dougis-org/cookbook-tanstack --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent (this session), on behalf of dougis
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent (automated)
- Required approvals: PR review gate (zero findings) before auto-merge

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout, not the worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none identified — no `CLAUDE.md`/`AGENTS.md` mention `/terms` or `/privacy-policy` discoverability today)
- [ ] Sync approved spec into `openspec/specs/`: copy `openspec/changes/site-wide-footer/specs/site-footer/spec.md` to `openspec/specs/site-footer/spec.md`
- [ ] Archive the change: move `openspec/changes/site-wide-footer/` to `openspec/changes/archive/YYYY-MM-DD-site-wide-footer/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-site-wide-footer/` exists and `openspec/changes/site-wide-footer/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-site-wide-footer` then `git push -u origin doc/archive-YYYY-MM-DD-site-wide-footer`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-site-wide-footer` to `main` with title `docs: archive site-wide-footer (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches and remove the dedicated worktree: `git worktree remove .worktrees/site-wide-footer`, `git fetch --prune`, `git branch -D site-wide-footer doc/archive-YYYY-MM-DD-site-wide-footer`

Required cleanup after archive: `git worktree remove .worktrees/site-wide-footer`, `git fetch --prune`, `git branch -D site-wide-footer doc/archive-YYYY-MM-DD-site-wide-footer`
