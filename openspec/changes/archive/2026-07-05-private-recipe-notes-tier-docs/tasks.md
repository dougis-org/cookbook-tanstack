# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/private-notes-tier-docs-500` then immediately `git push -u origin feat/private-notes-tier-docs-500`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** — run `gh issue edit #500 --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).

- [x] **Task 1 — Update `docs/user-tier-feature-sets.md`**: Add one sentence to the end of the Home Cook section stating that private recipe notes are not available (making clear that public recipe notes remain available). Add one sentence to the end of the Prep Cook section with the same content. Do not modify the feature matrix table.

- [x] **Task 2 — Update `src/routes/pricing.tsx`**: Remove the `canCreatePrivate` and `canImport` named imports. Add `can` to the import from `@/lib/tier-entitlements`. Replace the three JSX feature rows:
  - `canCreatePrivate(tier)` → `can('createPrivate', tier)`
  - `canImport(tier)` → `can('import', tier)`
  - Add new row: `can('privateRecipeNotes', tier) ? "Private notes ✓" : "No private notes"`

- [x] Confirm acceptance criteria are covered:
  - Home Cook section contains private notes exclusion sentence
  - Prep Cook section contains private notes exclusion sentence
  - Pricing page tier cards show Private Recipe Notes row with correct Yes/No per tier
  - No wrappers added to `src/lib/tier-entitlements.ts`
  - TypeScript compiles without error

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run type check: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] Run unit tests: `npm run test`
- [x] Visually verify pricing page renders all five tier cards with the Private Recipe Notes row (Sous Chef and Executive Chef show "Private notes ✓"; others show "No private notes")
- [x] Confirm `docs/user-tier-feature-sets.md` Home Cook and Prep Cook sections contain the private notes exclusion sentences

## Remote push validation

This change modifies both `.md` files and a `.tsx` file — apply the **full path**:

- **Unit tests** — `npm run test`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- Skip E2E tests unless a test exists specifically for the pricing page feature rows

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `feat/private-notes-tier-docs-500` and push to remote
- [x] Open PR from `feat/private-notes-tier-docs-500` to `main`. **PR body must include `Closes #500`.**
- [x] **Issue lifecycle: mark in-review** — run `gh issue edit #500 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same discovery pattern as above; warn and skip if not found).
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [x] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user:
  1. **Build and tests** — run all steps in Remote push validation; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run Remote push validation, push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run Remote push validation, push, wait 180 seconds; then restart this loop from step 1

Ownership metadata:

- Implementer: dougis
- Reviewer(s): auto (pr-review-toolkit)
- Required approvals: 1 (or per repo branch protection)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on main (`git log --oneline -5`)
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Sync approved spec deltas into `openspec/specs/`:
  - Copy `openspec/changes/private-recipe-notes-tier-docs/specs/tier-doc-private-notes/spec.md` → `openspec/specs/tier-doc-private-notes/spec.md`
  - Copy `openspec/changes/private-recipe-notes-tier-docs/specs/pricing-card-private-notes/spec.md` → `openspec/specs/pricing-card-private-notes/spec.md`
  - Update relative links in each copied spec: replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-private-recipe-notes-tier-docs/design.md` and similarly for `../../tasks.md`
- [x] Archive the change: move `openspec/changes/private-recipe-notes-tier-docs/` to `openspec/changes/archive/YYYY-MM-DD-private-recipe-notes-tier-docs/` **and stage both the new location and the deletion of the old location in a single commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-private-recipe-notes-tier-docs/` exists and `openspec/changes/private-recipe-notes-tier-docs/` is gone
- [x] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-private-recipe-notes-tier-docs` then `git push -u origin doc/archive-YYYY-MM-DD-private-recipe-notes-tier-docs`
- [x] Open a PR from `doc/archive-YYYY-MM-DD-private-recipe-notes-tier-docs` to `main` with title `docs: archive private-recipe-notes-tier-docs (YYYY-MM-DD)`
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [x] Monitor the doc PR until it merges; address any comments or CI failures, push to the doc branch, repeat
- [x] Prune merged local branches: `git fetch --prune` and `git branch -D feat/private-notes-tier-docs-500 doc/archive-YYYY-MM-DD-private-recipe-notes-tier-docs`
