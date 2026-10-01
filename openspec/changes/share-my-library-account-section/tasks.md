# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done during proposal — fetched `origin/main`
      before creating the dedicated worktree.
- [x] **Step 2 — Create and publish working branch:** done during proposal —
      `.worktrees/share-my-library-account-section` created from `origin/main` on
      branch `share-my-library-account-section`, pushed with
      `git push -u origin share-my-library-account-section`.

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — confirmed present in
      the current session's skill list. No installation action needed.

## Execution

- [x] **Issue lifecycle: mark in-progress** — run
      `gh issue edit 675 --add-label "in-progress"`. Discover the GitHub Project
      linked to the repo (`gh project list --owner dougis-org --format json`),
      resolve the status field option semantically matching "In Progress"
      (`gh project field-list <project-number> --owner dougis-org --format json`),
      and move the item via `gh project item-edit`. If no project item is found,
      log a warning and continue. If the `gh` token lacks the `project` scope,
      instruct the user to run `gh auth refresh -s project` and skip the
      project-item update (issue label update still proceeds).

### Phase 1 — `SharingSection` component scaffold (Decision 1)

- [x] **1.1 — Write failing component tests first** (TDD): three lists render
      given seeded `myLibraryShares` / `mySharedLibraries` / `myCollaborations`
      query responses; each list's empty state renders when its query returns
      `[]`; collaboration entries link to `/cookbooks/:id`.
      _Covers spec: ADDED Managing-shares gating by tier and received-share
      state (list rendering)._
- [x] **1.2 — Create `src/components/account/SharingSection.tsx`** following the
      structure of `src/components/account/ProfileSection.tsx` /
      `PreferencesSection.tsx`: default-exported section component, internal
      (non-exported) sub-views `SharesIGiveList`, `SharedWithMeList`,
      `MyCollaborationsList`, each with its own `useQuery` against
      `trpc.sharing.myLibraryShares`, `trpc.sharing.mySharedLibraries`, and
      `trpc.cookbooks.myCollaborations` respectively.
- [x] **1.3 — Wire into `src/routes/account.tsx`**: import and render
      `SharingSection` after `PreferencesSection`.
- [x] Run: `npx vitest run src/components/account/__tests__/SharingSection.test.tsx`

### Phase 2 — Gating matrix (Decision 2)

- [x] **2.1 — Write failing tests first**: one test per row of the Decision 2
      matrix in `design.md` — Executive Chef sees everything; non-Exec-Chef with
      a received share or a collaboration sees lists 2/3 but not list 1 or its
      invite control; non-Exec-Chef with both empty sees the upgrade affordance
      instead of all three lists.
      _Covers spec: ADDED Managing-shares gating by tier and received-share
      state._
- [x] **2.2 — Implement the gating logic** in `SharingSection.tsx`: read tier
      from the same session/tier source `StatusSection`/`PreferencesSection`
      already use; derive "has anything shared" from
      `mySharedLibraries.length > 0 || myCollaborations.length > 0` (data
      already fetched in Phase 1 — no new query).
- [x] **2.3 — Build the upgrade affordance** using `.up-*` classnames (never
      `.promo-*` / `.ad-*` / `.sponsor-*`), matching the design-system's existing
      upsell pattern (e.g. `RecipeNotesUpgradeNudge.tsx` for tone/structure
      reference, not for literal reuse).
- [x] Run: `npx vitest run src/components/account/__tests__/SharingSection.test.tsx`

### Phase 3 — Invite flow (Decision 3)

- [x] **3.1 — Write failing tests first**: typing ≥2 characters in the invite
      field invokes `users.search` with the debounced query; selecting a result
      calls `sharing.shareLibrary` with the selected recipient id and the new
      grant appears in the "I share" list on success; scope-warning copy is
      present adjacent to the invite control.
      _Covers spec: ADDED Invite flow uses single-field search, no role
      selection._
- [x] **3.2 — Implement the inline (non-modal) search-and-select invite UI**,
      modeled on the debounce/search/select interaction in
      `InviteCollaboratorModal` (`src/routes/cookbooks.$cookbookId.tsx`) but
      without the role `fieldset` — a library share has no role.
- [x] **3.3 — Add the scope-warning copy**: state that the grant covers the
      user's entire library, including private content created in the future.
      Sentence case, no emoji, brand name not applicable here.
- [x] **3.4 — Wire the `shareLibrary` mutation** with pending-state UI per
      Decision 4: `useMutation` + `onSuccess: invalidate` + `onError: show
      inline error`; invite control `disabled` + pending label while
      `mutation.isPending`; no `onMutate` cache write.
- [x] Run: `npx vitest run src/components/account/__tests__/SharingSection.test.tsx`

### Phase 4 — Revoke flow (Decision 4)

- [x] **4.1 — Write failing tests first**: activating revoke on a listed grant
      calls `sharing.revokeLibraryShare` with that grant's id and removes it
      from the list on success; a failed revoke shows an inline error and
      leaves the grant listed (no optimistic removal to roll back).
      _Covers spec: ADDED Revoke flow updates the owner's list immediately on
      success._
- [x] **4.2 — Implement the revoke control** on each "I share" list row with
      the same pending-state pattern as 3.4.
- [x] Run: `npx vitest run src/components/account/__tests__/SharingSection.test.tsx`

### Phase 5 — Theme and design-system pass

- [x] **5.1 — Toggle all four themes** (`dark`, `dark-greens`, `light-cool`,
      `light-warm`) on `/account` and confirm `SharingSection` is legible in
      each.
- [x] **5.2 — Grep for violations** in the new file: no hard-coded hex
      (`grep -nE '#[0-9a-fA-F]{3,6}'`), no emoji, no `.ad-*`/`.promo-*`/`.sponsor-*`
      classnames, Lucide-only icon imports.
- [x] **5.3 — Confirm Title Case CTAs / sentence-case body / brand name "My
      CookBooks"** wherever it appears in new copy.

### Phase 6 — Fix the existing `networkidle` gap (Decision 5)

- [x] **6.1 — Replace both `page.waitForLoadState("networkidle")` calls** in
      `src/e2e/cookbooks-collaboration.spec.ts`'s `inviteCollaborator()` helper
      with the appropriate helper(s) from `src/e2e/helpers/app.ts` (e.g.
      `waitForHydration`, or a retrying `expect(...)` scoped to the specific
      post-invite state, per the project's "retry assertions for data fetched
      independently of hydration" convention).
      _Covers spec: ADDED Fix `networkidle` instance in
      `cookbooks-collaboration.spec.ts`._
- [x] **6.2 — Verify no behavior change**: run the existing collaboration spec
      and confirm TC-COL-1, TC-COL-2, and any other scenarios in the file still
      pass unmodified in assertions, only in waits.
- [x] Run: `npx playwright test cookbooks-collaboration`

### Phase 7 — Two-browser-context E2E coverage (Decision 6)

- [x] **7.1 — Write the failing E2E spec first**: new file (e.g.
      `src/e2e/library-sharing-account.spec.ts`) using two real
      `browser.newContext()` instances (owner, recipient), each authenticated
      concurrently via existing `src/e2e/helpers/auth.ts` /
      `src/e2e/helpers/admin.ts` helpers (`registerAndLoginWithTier` for the
      Executive Chef owner).
      _Covers spec: ADDED Cross-context readiness wait for concurrent multi-user
      tests; and the parent change's "Recipient visibility", "Adding shared
      recipes to own cookbooks", "Revoking a share", "Unavailable shared
      entries" scenarios._
- [x] **7.2 — Add the cross-context readiness helper** to
      `src/e2e/helpers/app.ts` (name TBD at implementation time, e.g.
      `waitForContextToReflect` or similar): a retrying Playwright expectation
      against the second context's page, never `networkidle` or
      `waitForTimeout`.
- [x] **7.3 — Implement the full round trip**: owner opens `/account`, invites
      the recipient via `SharingSection` → recipient's recipe/cookbook list
      shows the "Shared with me" badge (using the cross-context helper from
      7.2, no reload) → recipient adds a shared recipe to their own cookbook →
      owner revokes the share from `/account` → recipient's next assertion
      shows the entry as unavailable.
- [x] **7.4 — Implement the tier-downgrade-suspends-shares scenario**: with an
      active grant, mutate the owner's tier directly in the DB (per the parent
      change's existing test convention), then assert the recipient's next page
      load shows no shared content.
- [x] Run: `npx playwright test library-sharing-account`

## Confirm acceptance criteria are covered

- [x] Walk every requirement in
      `openspec/changes/share-my-library-account-section/specs/library-sharing/spec.md`
      and `openspec/changes/share-my-library-account-section/specs/e2e-test-reliability/spec.md`
      and confirm a test exercises each scenario.
- [x] Walk the parent change's `openspec/changes/share-my-library/specs/library-sharing/spec.md`
      "ADDED Managing shares" requirement and confirm this change's tests
      collectively satisfy it.
- [x] Look for existing tooling or functions in the codebase that can be reused
      or extended before writing new logic from scratch (done during design:
      `InviteCollaboratorModal`'s search pattern, `ProfileSection`/
      `PreferencesSection` structure, `src/e2e/helpers/app.ts` hydration
      helpers — no net-new infrastructure beyond the cross-context helper in
      7.2).

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the
      `openspec-review-code` skill. The primary agent must automatically apply
      all clearly-correct findings directly to the code — without stopping,
      without presenting the findings list to the user, and without asking for
      confirmation. Apply fixes, re-run tests to confirm they pass, then
      proceed to commit. This step is mandatory and must never be skipped.

## Validation

- [x] Run unit tests: `npm run test:unit`
- [x] Run integration tests: `npm run test:integration`
- [x] Run E2E tests: `npm run test:e2e`
- [x] Run type checks: `npx tsc --noEmit` (strict mode with `noUnusedLocals` and
      `noUnusedParameters`)
- [x] Run build: `npm run build`
- [x] Run route-outlet lint: `npm run lint:route-outlet`
- [ ] Run security/code quality checks required by project standards — Codacy
      and Snyk per `.github/instructions/`. Findings touching
      `SharingSection.tsx`, `account.tsx`, `cookbooks-collaboration.spec.ts`, or
      `src/e2e/helpers/app.ts` are blocking and must be fixed, never waived.
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run
`git diff --name-only HEAD` (or compare the working branch against the base
branch) and check whether every changed file ends in `.md`. This change is not
docs-only, so apply the **full path**:

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were
      automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `share-my-library-account-section` to `main`. PR body MUST
      include `Closes #668` (per the issue's own "On merge" instructions) and
      reference `Closes #675`.
- [ ] **Issue lifecycle: mark in-review**: run
      `gh issue edit 675 --add-label "in-review" --remove-label "in-progress"`.
      Move the project item to the status column semantically matching
      "In Review" via `gh project item-edit` (same project/field/option
      discovery as the in-progress lifecycle step above; warn and skip if not
      found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all
      findings (commit, push, re-run) until zero findings remain. If findings
      persist after three or more iterations with no progress, report the
      stall with remaining findings listed and wait for human guidance before
      continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):**
      `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the
      merge)
- [ ] **Iterate until merged** — repeat the following priority loop
      continuously until `gh pr view <PR-URL> --json state` returns `MERGED`;
      if it returns `CLOSED` exit and notify the user — never wait for a human
      to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any
     failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for
     every unresolved thread, address the feedback, commit fixes, run [Remote
     push validation], push, wait 180 seconds; continue until all threads are
     resolved
  3. **CI check failures** — only after all comments are resolved, poll
     `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required
     checks, commit, run [Remote push validation], push, wait 180 seconds; then
     restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before
pushing any fix.

Ownership metadata:

- Implementer: dougis (assignee on #675)
- Reviewer(s): `pr-review-toolkit:review-pr` automated gate; human reviewer per
  repo branch protection
- Required approvals: per repo branch protection rules

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm
  resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout,
      not the worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected
      beyond this change's own artifacts — no README/CLAUDE.md changes
      anticipated)
- [ ] Sync approved spec deltas into `openspec/specs/`:
      `openspec/specs/library-sharing/spec.md` (create if the parent change
      hasn't already promoted it; otherwise merge this change's additions into
      it) and `openspec/specs/e2e-test-reliability/spec.md` (append this
      change's two new requirements to the existing promoted spec). Update all
      relative links that pointed into the change directory so they resolve
      from the archive location — replace `../../design.md` with
      `../../changes/archive/YYYY-MM-DD-share-my-library-account-section/design.md`,
      and similarly for `../../tasks.md`.
- [ ] Archive the change: move
      `openspec/changes/share-my-library-account-section/` to
      `openspec/changes/archive/YYYY-MM-DD-share-my-library-account-section/`
      **and stage both the new location and the deletion of the old location
      in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-share-my-library-account-section/`
      exists and `openspec/changes/share-my-library-account-section/` is gone
- [ ] **Create a doc branch**:
      `git checkout -b doc/archive-YYYY-MM-DD-share-my-library-account-section`
      then
      `git push -u origin doc/archive-YYYY-MM-DD-share-my-library-account-section`
- [ ] Open a PR from
      `doc/archive-YYYY-MM-DD-share-my-library-account-section` to `main` with
      title `docs: archive share-my-library-account-section (YYYY-MM-DD)` —
      do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR:
      `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force
      the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR —
      address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and
      `git branch -D share-my-library-account-section
      doc/archive-YYYY-MM-DD-share-my-library-account-section`
- [ ] Remove the change's dedicated worktree:
      `git worktree remove .worktrees/share-my-library-account-section`
- [ ] Close out epic bookkeeping: confirm #675 and #668 are closed by the merge
      (via `Closes #668`/`Closes #675` in the PR body); #669 (print attribution)
      remains open as the deferred follow-up per the issue; #688 and #689
      remain open as separately tracked follow-ups spun out of this proposal

Required cleanup after archive: `git fetch --prune` and
`git branch -D share-my-library-account-section
doc/archive-YYYY-MM-DD-share-my-library-account-section`
