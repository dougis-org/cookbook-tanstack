# Tasks

## Preparation

- [ ] **Step 1 — Verify dependency:** Confirm `private-recipe-notes-router` change is merged (`privateRecipeNotes` router exists in `src/server/trpc/routers/privateRecipeNotes.ts`).
- [ ] **Step 2 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 3 — Create and publish working branch:** `git checkout -b test/notes-tier-change-integration` then immediately `git push -u origin test/notes-tier-change-integration`

## Execution

### Task 1 — Create `admin-notes-tier-change-integration.test.ts`

- [ ] Create `src/server/trpc/routers/__tests__/admin-notes-tier-change-integration.test.ts`
- [ ] Add `// @vitest-environment node` as the first line
- [ ] Import: `describe`, `it`, `expect` from `vitest`
- [ ] Import: `Types` from `mongoose`
- [ ] Import: `withCleanDb` from `@/test-helpers/with-clean-db`
- [ ] Import: `Recipe`, `RecipeNote` from `@/db/models`
- [ ] Import: `seedUserWithBetterAuth`, `makeAuthCaller` from `./test-helpers`

### Task 2 — Add local helper: `seedUserWithTier`

- [ ] Define a local async helper `seedUserWithTier(tier: UserTier)` that:
  1. Calls `seedUserWithBetterAuth()` to create the user in the DB
  2. Imports `getMongoClient` from `@/db` and updates the user document: `{ $set: { tier } }` on the `user` collection
  3. Returns the seeded user object
- [ ] Do NOT export this helper — it is local to this file

### Task 3 — Add local helper: `makeAdminCaller`

- [ ] Define a local async helper `makeAdminCaller()` that:
  1. Generates a fresh `Types.ObjectId().toHexString()` as the admin userId
  2. Returns `makeAuthCaller(adminId, { email: 'admin@test.com', isAdmin: true })`
- [ ] Do NOT export — local helper only

### Task 4 — Write test: downgrade withholds note body

- [ ] Add `describe('admin.users.setTier — notes tier visibility', () => { ... })`
- [ ] Write test: `'downgrade: note content withheld immediately on next request'`
  ```
  withCleanDb(async () => {
    const user = await seedUserWithTier('sous-chef')
    const recipe = await Recipe.create({ name: 'R', userId: new Types.ObjectId(user.id), isPublic: true })
    const recipeId = recipe._id.toHexString()

    const sousChefCaller = await makeAuthCaller(user.id, { tier: 'sous-chef' })
    await sousChefCaller.privateRecipeNotes.upsert({ recipeId, body: 'Secret note' })

    const adminCaller = await makeAdminCaller()
    await adminCaller.admin.users.setTier({ userId: user.id, tier: 'home-cook' })

    const homeCookCaller = await makeAuthCaller(user.id, { tier: 'home-cook' })
    const result = await homeCookCaller.privateRecipeNotes.get({ recipeId })
    expect(result).toEqual({ hasNote: true, note: null })
  })
  ```
- [ ] Run test — should pass
- **Verification:** `npx vitest run src/server/trpc/routers/__tests__/admin-notes-tier-change-integration.test.ts`

### Task 5 — Write test: re-upgrade restores original body

- [ ] Write test: `'re-upgrade: original note body restored intact'`
  ```
  withCleanDb(async () => {
    const user = await seedUserWithTier('sous-chef')
    const recipe = await Recipe.create({ name: 'R', userId: new Types.ObjectId(user.id), isPublic: true })
    const recipeId = recipe._id.toHexString()

    const sousChefCaller = await makeAuthCaller(user.id, { tier: 'sous-chef' })
    await sousChefCaller.privateRecipeNotes.upsert({ recipeId, body: 'Original body' })

    const adminCaller = await makeAdminCaller()
    await adminCaller.admin.users.setTier({ userId: user.id, tier: 'home-cook' })
    await adminCaller.admin.users.setTier({ userId: user.id, tier: 'sous-chef' })

    const restoredCaller = await makeAuthCaller(user.id, { tier: 'sous-chef' })
    const result = await restoredCaller.privateRecipeNotes.get({ recipeId })
    expect(result.hasNote).toBe(true)
    expect(result.note!.body).toBe('Original body')
    expect(result.note!.updatedAt).toBeInstanceOf(Date)
  })
  ```
- [ ] Run test — should pass
- **Verification:** `npx vitest run src/server/trpc/routers/__tests__/admin-notes-tier-change-integration.test.ts`

### Task 6 — Write test: upgrade from zero

- [ ] Write test: `'upgrade from zero: newly-entitled user with no notes gets { hasNote: false, note: null }'`
  ```
  withCleanDb(async () => {
    const user = await seedUserWithTier('prep-cook')
    const recipe = await Recipe.create({ name: 'R', userId: new Types.ObjectId(user.id), isPublic: true })
    const recipeId = recipe._id.toHexString()

    const adminCaller = await makeAdminCaller()
    await adminCaller.admin.users.setTier({ userId: user.id, tier: 'executive-chef' })

    const execChefCaller = await makeAuthCaller(user.id, { tier: 'executive-chef' })
    const result = await execChefCaller.privateRecipeNotes.get({ recipeId })
    expect(result).toEqual({ hasNote: false, note: null })
  })
  ```
- [ ] Run test — should pass
- **Verification:** `npx vitest run src/server/trpc/routers/__tests__/admin-notes-tier-change-integration.test.ts`

### Task 7 — Write test: idempotent downgrade leaves RecipeNote unchanged

- [ ] Write test: `'idempotent downgrade: RecipeNote document is unchanged after tier change'`
  ```
  withCleanDb(async () => {
    const user = await seedUserWithTier('sous-chef')
    const recipe = await Recipe.create({ name: 'R', userId: new Types.ObjectId(user.id), isPublic: true })
    const recipeId = recipe._id.toHexString()

    const sousChefCaller = await makeAuthCaller(user.id, { tier: 'sous-chef' })
    await sousChefCaller.privateRecipeNotes.upsert({ recipeId, body: 'Test body' })

    const userObjId = new Types.ObjectId(user.id)
    const noteBefore = await RecipeNote.findOne({ userId: userObjId, recipeId: recipe._id }).lean()

    const adminCaller = await makeAdminCaller()
    await adminCaller.admin.users.setTier({ userId: user.id, tier: 'home-cook' })
    // Second call hits no-op branch (already home-cook)
    await adminCaller.admin.users.setTier({ userId: user.id, tier: 'home-cook' })

    const noteAfter = await RecipeNote.findOne({ userId: userObjId, recipeId: recipe._id }).lean()
    expect(noteAfter).toEqual(noteBefore)
  })
  ```
- [ ] Run test — should pass
- **Verification:** `npx vitest run src/server/trpc/routers/__tests__/admin-notes-tier-change-integration.test.ts`

### Task 8 — Run full test suite to check for regressions

- [ ] `npx vitest run src/server/trpc/routers/__tests__/`
- [ ] All tests in the `__tests__/` directory pass

## Pre-Commit Code Review

- [ ] **Before committing**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] `npx vitest run src/server/trpc/routers/__tests__/admin-notes-tier-change-integration.test.ts` — all 4 tests pass
- [ ] `npx vitest run src/server/trpc/routers/__tests__/` — no regressions in the broader test suite
- [ ] `npm run build` — build succeeds (test-only change; no type errors introduced)
- [ ] All tasks above marked complete

## Remote push validation

This change adds a single `.test.ts` file — non-docs, code change — apply the **full path**:

- **Unit/integration tests:** `npx vitest run src/server/trpc/routers/__tests__/` — all pass
- **Build:** `npm run build` — succeeds with no errors
- Skip E2E tests — no UI or route changed

If **ANY** required step fails, iterate and fix before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes and push to `test/notes-tier-change-integration`
- [ ] Open PR from `test/notes-tier-change-integration` to `main`. PR body MUST include: `Closes #493`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

Ownership metadata:
- Implementer: (agent)
- Reviewer(s): (auto-merge; agentic reviewers via CI)
- Required approvals: per repo settings

Blocking resolution flow:
- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify `src/server/trpc/routers/__tests__/admin-notes-tier-change-integration.test.ts` appears on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec delta: copy `openspec/changes/notes-tier-change-integration-tests/specs/notes-tier-visibility/spec.md` to `openspec/specs/notes-tier-visibility/spec.md`. Update relative links in the copied file: replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-notes-tier-change-integration-tests/design.md` and `../../tasks.md` with `../../changes/archive/YYYY-MM-DD-notes-tier-change-integration-tests/tasks.md`.
- [ ] Archive the change: move `openspec/changes/notes-tier-change-integration-tests/` to `openspec/changes/archive/YYYY-MM-DD-notes-tier-change-integration-tests/` — stage both the new location and the deletion of the old location in a **single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-notes-tier-change-integration-tests/` exists and `openspec/changes/notes-tier-change-integration-tests/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-notes-tier-change-integration-tests` then `git push -u origin doc/archive-YYYY-MM-DD-notes-tier-change-integration-tests`
- [ ] Open PR from `doc/archive-...` to `main` with title `docs: archive notes-tier-change-integration-tests (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor the doc PR until it merges (same loop as implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D test/notes-tier-change-integration doc/archive-YYYY-MM-DD-notes-tier-change-integration-tests`
