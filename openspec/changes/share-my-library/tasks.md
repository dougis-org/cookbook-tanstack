# Tasks

**Change:** `share-my-library` · **Epic:** #670 · **Design issue:** #668
**Follow-up:** #669 (print, out of scope)
**Worktree:** `.worktrees/share-my-library` · **Branch:** `share-my-library` · **Base:** `main`

## PR Decomposition

This change is too large for a single reviewable PR. It ships as **five sequential PRs**
off `main`, each independently testable and mergeable, each tracked by a child issue of
epic #670. Every PR runs the full Preflight → Pre-Commit Code Review → Validation →
PR and Merge cycle below before the next one starts.

| PR | Issue | Scope | Depends on | User-visible? |
| -- | ----- | ----- | ---------- | ------------- |
| 1 | #671 | `LibraryShare` model + `visibilityFilter` + context (Tasks 1.x) | — | No |
| 2 | #672 | `sharing` tRPC router: grant, revoke, list (Tasks 2.x) | PR 1 | No |
| 3 | #673 | Read-path integration: `sharedBy`, cross-owner entries, read-only tests (Tasks 3.x) | PR 2 | No |
| 4 | #674 | Recipe/cookbook UI: badges, gated affordances, unavailable placeholder (Tasks 4.x) | PR 3 | Yes |
| 5 | #675 | Account "Sharing & Collaboration" section (Tasks 5.x) | PR 4 | Yes |

PRs 1-3 are server-only and ship dark: no UI references the new capability, so merging
them cannot change user-visible behavior. The feature becomes reachable at PR 5.

Ownership metadata:

- Implementer: @dougis (or delegated agent)
- Reviewer(s): @dougis
- Required approvals: 1, plus a passing `pr-review-toolkit:review-pr` gate with zero
  findings. This change alters an authorization boundary — it must not be self-merged
  without the review gate.

## Preparation

- [ ] **Step 1 — Sync default branch:** from the primary checkout, `git checkout main`
      and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** already done during propose —
      worktree exists at `.worktrees/share-my-library` on branch `share-my-library`,
      published to origin. Verify with `git worktree list` and
      `git rev-parse --abbrev-ref --symbolic-full-name @{u}`
- [ ] **Step 3 — Confirm submodule is initialized in the worktree:** the OpenSpec schema
      lives in the `.github/openspec-shared` submodule, which a fresh worktree does not
      populate automatically. Run `git submodule update --init --recursive` inside
      `.worktrees/share-my-library` if `openspec/schemas/` is empty
- [ ] **Step 4 — Confirm local environment:** `docker compose up -d` for MongoDB, then
      `npm install` and `npm run db:connect`

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills
      list for `pr-review-toolkit:review-pr`. If it is not listed, halt immediately,
      inform the user the plugin is required, provide installation guidance, and do not
      proceed until the user confirms it is installed.
- [ ] **Verify the `openspec-review-code` skill is available** for the mandatory
      pre-commit review step. Halt and inform the user if missing.
- [ ] **Verify `gh` auth and scopes:** `gh auth status`. The project-item lifecycle steps
      need the `project` scope; if absent, surface `gh auth refresh -s project` to the
      user and continue with issue-label updates only.

## Execution

- [ ] **Step 1 — Confirm the dedicated worktree:** confirm `.worktrees/share-my-library`
      exists and `cd` into it. If missing, from the primary checkout run
      `git fetch origin main` then
      `git worktree add .worktrees/share-my-library -b share-my-library origin/main`.
      Never checkout the change branch in the primary checkout.
- [ ] **Step 2 — Confirm the branch is pushed:** verify `share-my-library` exists on
      origin; if not, `git push -u origin share-my-library` from inside the worktree
      before any implementation work.
- [ ] **Step 3 — Issue lifecycle: mark in-progress:** run
      `gh issue edit <child-issue> --add-label "in-progress"` for the child issue of the
      PR being started (#671-#675 per the decomposition table), not the epic.
      Then discover the linked project
      (`gh project list --owner dougis-org --format json`), resolve the status field
      option semantically matching "In Progress"
      (`gh project field-list <project-number> --owner dougis-org --format json`), and
      move the item with `gh project item-edit`. If no project item is found, log a
      warning and continue. If the token lacks `project` scope, instruct the user to run
      `gh auth refresh -s project` and skip the project-item update only.
- [ ] **Step 4 — Reuse audit:** before writing new logic, review the shipped
      Collaboration feature for reusable pieces — `execChefProcedure`
      (`src/server/trpc/routers/cookbooks.ts`), `usersRouter.search`
      (`src/server/trpc/routers/users.ts`), the `Collaborator` model shape, and the
      invite modal UI. Extend or mirror these rather than writing parallel mechanisms.

All implementation tasks below follow strict TDD: write the failing test first, confirm
it fails for the expected reason, then implement until it passes.

### Phase 1 — Foundation (PR 1)

- [ ] **1.1 — `visibilityFilter` shared-owner clause**
  - [ ] Write failing unit tests in `src/server/trpc/routers/__tests__/` covering:
        anonymous caller unchanged; authenticated caller with empty `sharedOwnerIds`
        produces the pre-change filter; non-empty `sharedOwnerIds` adds an `$or` clause
        on `userId` that also requires `hiddenByTier: { $ne: true }`; invalid ObjectId
        strings are filtered out.
  - [ ] Add a third parameter `sharedOwnerIds: string[] = []` to `visibilityFilter` in
        `src/server/trpc/routers/_helpers.ts` and implement the clause.
  - [ ] Verify: `npx vitest run src/server/trpc/routers/__tests__`
  - _Covers spec: MODIFIED Content visibility filtering; ADDED Hidden content stays hidden_

- [ ] **1.2 — `LibraryShare` model and `ctx.sharedOwnerIds`**
  - [ ] Write failing tests for the model: unique `(ownerId, recipientId)` index rejects
        duplicates; indexes on `ownerId` and `recipientId` exist.
  - [ ] Write failing tests for context creation: grants from an `executive-chef` owner
        appear in `ctx.sharedOwnerIds`; grants from a downgraded owner do not; a caller
        with zero grant rows yields `[]` and performs no owner-tier lookup; a failed
        tier lookup yields `[]` rather than throwing.
  - [ ] Create `src/db/models/library-share.ts` with `ILibraryShare`
        (`ownerId`, `recipientId`, `addedAt`, `addedBy`) and the three indexes. Include a
        comment recording why grants are **not** deleted on downgrade (design Decision 2)
        so a future maintainer does not add a reconciliation job that breaks re-upgrade.
  - [ ] Export `LibraryShare` from `src/db/models/index.ts`.
  - [ ] Extend `src/server/trpc/context.ts` to resolve `sharedOwnerIds`, joining grant
        rows against each owner's current tier and filtering to `executive-chef`. Wrap
        the lookup so a failure degrades to `[]` (fail closed on access, open on
        availability).
  - [ ] Verify: `npm run test:unit` and `npm run test:integration`
  - _Covers spec: MODIFIED Request context composition; ADDED Tier downgrade suspends shares_

### Phase 2 — Sharing router (PR 2)

- [ ] **2.1 — `shareLibrary` grant procedure**
  - [ ] Write failing integration tests: Executive Chef creates a grant with correct
        field values; each lower tier receives `FORBIDDEN`; duplicate pair receives
        `CONFLICT`; self-share receives `BAD_REQUEST`; non-existent recipient receives
        `NOT_FOUND`.
  - [ ] Create `src/server/trpc/routers/sharing.ts` with `shareLibrary` built on the
        existing `execChefProcedure` pattern. Promote `execChefProcedure` out of
        `cookbooks.ts` into a shared location if it can be reused without disturbing the
        existing collaboration procedures; otherwise mirror it locally and note why.
  - [ ] Register the router in `src/server/trpc/routers/_app.ts`.
  - _Covers spec: ADDED Granting library access_

- [ ] **2.2 — `revokeLibraryShare` and listing procedures**
  - [ ] Write failing integration tests: owner revokes and the row is deleted; a
        non-owner receives `FORBIDDEN` and the grant survives; `myLibraryShares` returns
        grants given with recipient name; `mySharedLibraries` returns grants received
        with owner name; both exclude grants from owners below `executive-chef`.
  - [ ] Implement `revokeLibraryShare`, `myLibraryShares`, `mySharedLibraries`.
  - [ ] Verify: `npm run test:integration`
  - _Covers spec: ADDED Revoking a share; ADDED Managing shares (server half)_

### Phase 3 — Read-path integration (PR 3)

- [ ] **3.1 — Thread `sharedOwnerIds` through every `visibilityFilter` call site**
  - [ ] Enumerate call sites: `grep -rn "visibilityFilter" src/` — update each to pass
        `ctx.sharedOwnerIds`. Record the full list in the PR description so review can
        confirm none were missed.
  - [ ] Write a failing test per affected router asserting shared content appears.
  - _Covers spec: ADDED Recipient visibility_

- [ ] **3.2 — `sharedBy` on read payloads**
  - [ ] Write failing tests: shared recipes/cookbooks carry
        `sharedBy: { id, name }`; owned and public content carry `null`; the payload
        contains no owner email or tier.
  - [ ] Add `sharedBy` resolution to `recipes.list`, `recipes.byId`, `cookbooks.list`,
        and `cookbooks.byId`. Resolve owner display names in a single batched lookup —
        do not issue one query per row.
  - _Covers spec: ADDED Recipient visibility; NFAC Security "Owner identity is the only owner data exposed"_

- [ ] **3.3 — Cross-owner cookbook entries**
  - [ ] Write failing tests: a recipient adds a shared recipe to their own cookbook and
        no new `Recipe` document is created; the entry resolves with `sharedBy`; the
        owner's later edits are reflected; after revocation the entry returns
        `unavailable: true` with `orderIndex` and `chapterId` preserved and no recipe
        content; same after owner downgrade; same after the owner soft-deletes.
  - [ ] Allow adding a visible non-owned recipe to an owned cookbook in
        `src/server/trpc/routers/cookbooks.ts`; keep ownership enforcement on the
        *cookbook* unchanged.
  - [ ] Resolve `recipes[]` entries through caller visibility and emit
        `{ recipeId, unavailable: true }` for unresolvable entries. Do **not** add a
        persisted flag — this state is derived (design Decision 3).
  - [ ] **Audit every consumer of `Cookbook.recipes[]`** (`grep -rn "\.recipes" src/`)
        and confirm each resolves through visibility. The print route
        `src/routes/cookbooks.$cookbookId_.print.tsx` must not render cross-owner
        entries until #669 is resolved — assert this with a test.
  - _Covers spec: ADDED Adding shared recipes to own cookbooks; ADDED Unavailable shared entries_

- [ ] **3.4 — Read-only enforcement test sweep**
  - [ ] Write a table-driven integration test invoking **every** recipe and cookbook
        mutation as a grantee against the owner's content, asserting
        `FORBIDDEN`/`NOT_FOUND` and that the document is unchanged. Enumerate mutations
        from the routers rather than hand-listing, so future mutations are covered.
  - [ ] Write a test asserting a grantee cannot re-share the owner's library.
  - [ ] Confirm no new guards were needed — if any mutation passed, that is a real
        defect in the ownership check, not a reason to add a share-specific guard.
  - _Covers spec: ADDED Read-only enforcement_

### Phase 4 — Content UI (PR 4)

- [ ] **4.1 — "Shared with me" badges**
  - [ ] Write failing component tests for `RecipeCard` and `CookbookCard` rendering the
        badge when `sharedBy` is set and omitting it when `null`.
  - [ ] Implement in `src/components/recipes/RecipeCard.tsx` and
        `src/components/cookbooks/CookbookCard.tsx`. Use a Lucide icon and
        `--theme-*` tokens only — no hard-coded colors, no emoji.
  - _Covers spec: ADDED Recipient visibility_

- [ ] **4.2 — Gate edit affordances on shared content**
  - [ ] Write failing tests asserting edit/delete controls are absent on recipe and
        cookbook detail views when `sharedBy` is set, and that owner attribution shows.
  - [ ] Implement in the recipe and cookbook detail routes.
  - _Covers spec: ADDED Read-only enforcement (UI half)_

- [ ] **4.3 — Unavailable entry placeholder**
  - [ ] Write a failing test asserting an entry with `unavailable: true` renders a
        placeholder that preserves position and reveals no recipe content.
  - [ ] Implement in the cookbook detail view. Copy must use the `N/A`-style empty
        convention and sentence case.
  - _Covers spec: ADDED Unavailable shared entries (UI half)_

- [ ] **4.4 — Quota displays exclude shared content**
  - [ ] Write a failing test: a `home-cook` recipient owning 3 recipes with 50 shared
        recipes visible sees usage of 3, and can still create recipes.
  - [ ] Audit every place recipe/cookbook counts are computed for display or limit
        enforcement; ensure each counts owned content only. Keep the entitlement
        decision itself in `src/lib/tier-entitlements.ts` rather than inlining it.
  - _Covers spec: ADDED Quota displays exclude shared content_

### Phase 5 — Account section (PR 5)

- [ ] **5.1 — `SharingSection` component scaffold**
  - [ ] Write failing component tests: grants given are listed with name and date;
        libraries shared with the user are listed; existing cookbook collaborations are
        listed and link to the cookbook.
  - [ ] Create `src/components/account/SharingSection.tsx` following the structure of
        the existing `ProfileSection` / `PreferencesSection` components.
  - [ ] Render it from `src/routes/account.tsx`.
  - _Covers spec: ADDED Managing shares_

- [ ] **5.2 — Invite and revoke flows**
  - [ ] Write failing tests: searching invokes `users.search`; selecting a user creates a
        grant; revoke removes the grant and updates the list; a failed mutation reverts
        optimistic UI.
  - [ ] Implement using the existing `users.search` procedure and the Collaboration
        invite modal as the interaction model.
  - [ ] Include scope-warning copy stating the grant covers the entire library including
        future private content.
  - _Covers spec: ADDED Managing shares_

- [ ] **5.3 — Theme and design-system pass**
  - [ ] Verify the section renders legibly in all four themes (`dark`, `dark-greens`,
        `light-cool`, `light-warm`); no hard-coded hex values; Lucide icons only; no
        emoji; Title Case CTAs and sentence-case body; brand name written
        **My CookBooks**.
  - [ ] Confirm any tier-upsell surface in this section uses adblock-safe classnames
        (`.up-*`), never `.promo-*` / `.ad-*` / `.sponsor-*`.

- [ ] **5.4 — End-to-end coverage**
  - [ ] Write a Playwright test covering the full round trip across two users: owner
        grants → recipient sees shared content badged → recipient adds a shared recipe
        to their own cookbook → owner revokes → recipient sees the entry as unavailable.
  - [ ] Verify: `npm run test:e2e`

- [ ] **Confirm acceptance criteria are covered:** walk every requirement in
      `openspec/changes/share-my-library/specs/library-sharing/spec.md` and confirm a
      test exercises each scenario.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the
      `openspec-review-code` skill. The primary agent must automatically apply all
      clearly-correct findings directly to the code — without stopping, without
      presenting the findings list to the user, and without asking for confirmation.
      Apply fixes, re-run tests to confirm they pass, then proceed to commit. This step
      is mandatory and must never be skipped.

## Validation

- [ ] Run unit tests: `npm run test:unit`
- [ ] Run integration tests: `npm run test:integration`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Run type checks: `npx tsc --noEmit` (strict mode with `noUnusedLocals` and
      `noUnusedParameters`)
- [ ] Run build: `npm run build`
- [ ] Run route-outlet lint: `npm run lint:route-outlet`
- [ ] Run security/code quality checks required by project standards — Codacy and Snyk
      per `.github/instructions/`. Findings touching `_helpers.ts`, `context.ts`, or
      `sharing.ts` are blocking and must be fixed, never waived.
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run
`git diff --name-only HEAD` (or compare the working branch against `main`) and check
whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise
apply the full path.

**Full path** (any non-`.md` file changed):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — `npm run build`; must succeed with no errors
- Skip integration and regression/E2E tests — they are not required when no code changed

If **ANY** required step fails, you **MUST** iterate and address the failure before
pushing.

## PR and Merge

Run this section once per PR in the decomposition table.

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were
      automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from the working branch to `main`. **The PR body MUST include
      `Closes #<child-issue>`** for the child issue that PR delivers (#671-#675), plus
      `Part of #670` to link the epic. The **final** PR (#675) additionally carries
      `Closes #668`, closing the original design issue. Earlier PRs must NOT close #668
      or #670. Include the `visibilityFilter` call-site list from Task 3.1 in the PR 3
      description.
- [ ] **Issue lifecycle: mark in-review:** run
      `gh issue edit <child-issue> --add-label "in-review" --remove-label "in-progress"`.
      Then move
      the project item to the status column semantically matching "In Review" via
      `gh project item-edit` (same discovery pattern as the in-progress step; warn and
      skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings
      (commit, push, re-run) until zero findings remain. If findings persist after three
      or more iterations with no progress, report the stall with remaining findings
      listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):**
      `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until
      `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit
      and notify the user — **never wait for a human to report the merge; never
      force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures,
     commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every
     unresolved thread, address the feedback, commit fixes, run [Remote push
     validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll
     `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks,
     commit, run [Remote push validation], push, wait 180 seconds; then restart this
     loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any
fix.

Ownership metadata:

- Implementer: @dougis (or delegated agent)
- Reviewer(s): @dougis
- Required approvals: 1 plus a zero-finding `pr-review-toolkit:review-pr` gate

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan. Findings in
  the authorization path (`_helpers.ts`, `context.ts`, `sharing.ts`) are never waived.
- Review comment → address → commit → validate locally → push → confirm resolved
- Stalled after 3 review iterations with no progress → report remaining findings and
  wait for human guidance
- Blocked review >2 working days → mention @dougis on the PR; >5 working days → park the
  branch and record the blocker here rather than merging partial work

## Post-Merge

- [ ] From the primary checkout, `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change — at minimum
      `docs/database.md` (new `library-shares` collection) and the collections list in
      `CLAUDE.md`
- [ ] Sync approved spec deltas into `openspec/specs/`: copy
      `openspec/changes/share-my-library/specs/library-sharing/spec.md` to
      `openspec/specs/library-sharing/spec.md`, then update relative links that pointed
      into the change directory — replace `../../design.md` with
      `../../changes/archive/YYYY-MM-DD-share-my-library/design.md`, and similarly for
      `../../tasks.md`
- [ ] Archive the change: move `openspec/changes/share-my-library/` to
      `openspec/changes/archive/YYYY-MM-DD-share-my-library/` **and stage both the new
      location and the deletion of the old location in a single commit** — do not commit
      the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-share-my-library/` exists and
      `openspec/changes/share-my-library/` is gone
- [ ] **Create a doc branch** for the archive and spec updates:
      `git checkout -b doc/archive-YYYY-MM-DD-share-my-library` then
      `git push -u origin doc/archive-YYYY-MM-DD-share-my-library`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-share-my-library` to `main` with title
      `docs: archive share-my-library (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR:
      `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address
      comments and CI failures, push to the same doc branch, repeat)
- [ ] Confirm all five child issues (#671-#675) are closed, #668 is closed via the final
      PR's `Closes #668`, and epic #670 can be closed. Confirm #669 remains **open** as
      the deferred print follow-up
- [ ] Remove the change's dedicated worktree:
      `git worktree remove .worktrees/share-my-library`
- [ ] Prune merged local branches: `git fetch --prune` and
      `git branch -D share-my-library doc/archive-YYYY-MM-DD-share-my-library`

Required cleanup after archive: `git fetch --prune` and
`git branch -D share-my-library doc/archive-YYYY-MM-DD-share-my-library`
