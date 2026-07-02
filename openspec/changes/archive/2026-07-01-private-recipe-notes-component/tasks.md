# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/private-recipe-notes-component` then immediately `git push -u origin feat/private-recipe-notes-component`

## Execution

Follow strict TDD: write each test scenario first, then implement to make it pass.

### Task 1 — Scaffold the component file

- [x] Create `src/components/recipes/PrivateRecipeNotes.tsx` with default export `PrivateRecipeNotes({ recipeId }: { recipeId: string })`
- [x] Add early return `null` when `!canUsePrivateRecipeNotes` (from `useTierEntitlements()`)
- [x] Add `useQuery` with `trpc.privateRecipeNotes.get.queryOptions({ recipeId })` and `enabled: canUsePrivateRecipeNotes`
- [x] Add `useMutation` with `trpc.privateRecipeNotes.upsert.mutationOptions(...)` including optimistic update logic in `onMutate` and rollback in `onError`
- [x] Add `useState` for: `isEditing: boolean`, `editBody: string`, `saveError: string`

### Task 2 — Write RTL tests (TDD first)

Create `src/components/recipes/PrivateRecipeNotes.test.tsx` covering all spec scenarios:

- [x] **Test: non-entitled user** — mock `useTierEntitlements` with `canUsePrivateRecipeNotes: false`; assert component renders null and no query is made
- [x] **Test: loading skeleton** — mock query as loading; assert skeleton element is present
- [x] **Test: empty state** — mock `get` returning `{ hasNote: false, note: null }`; assert "Add a note" affordance is visible; assert no note body text
- [x] **Test: read mode with note** — mock `get` returning `{ hasNote: true, note: { body: "My note text", updatedAt: ... } }`; assert "My note text" is visible; assert Pencil edit button is present
- [x] **Test: enter edit mode** — from read mode, click edit button; assert textarea appears with current body value; assert `x / 10000` counter is visible; assert Save and Cancel buttons present
- [x] **Test: character counter updates** — in edit mode, type additional chars; assert counter reflects new length
- [x] **Test: Save disabled when body unchanged** — in edit mode with unchanged body; assert Save button is `disabled`
- [x] **Test: Save enabled after change** — modify textarea value; assert Save button is enabled
- [x] **Test: Save success** — mock upsert mutation resolving; fire Save; assert component returns to read mode; assert mutation called with correct args
- [x] **Test: Save disabled while pending** — mock mutation in pending state; assert Save button is `disabled`
- [x] **Test: Save error** — mock upsert mutation rejecting; fire Save; assert inline error message visible; assert still in edit mode; assert optimistic update rolled back
- [x] **Test: Cancel reverts** — in edit mode with changed body; click Cancel; assert textarea gone; assert original body shown (or empty state); assert no mutation called

### Task 3 — Implement rendering states

- [x] **Loading skeleton**: when `isLoading`, render a `div` with `animate-pulse` placeholder matching card height
- [x] **Read mode — empty state**: when `!isEditing && !data?.note`, render card with heading "Private Notes" and a `<button>` with `<Pencil />` icon and text "Add a note"
- [x] **Read mode — has note**: when `!isEditing && data?.note`, render card with heading "Private Notes", `<p className="whitespace-pre-wrap">` body, and a `<button aria-label="Edit note">` with `<Pencil />` icon
- [x] **Edit mode**: when `isEditing`, render card with:
  - `<textarea>` bound to `editBody`, `rows={6}`, `maxLength={10000}`
  - Character counter: `<span>{editBody.length} / 10000</span>`
  - Cancel button with `<X />` icon — calls `handleCancel`
  - Save button with `<Save />` icon — calls `handleSave`; `disabled={upsertMutation.isPending || editBody === (data?.note?.body ?? '')}`
  - Error message: `{saveError && <p className="text-red-500 text-sm mt-2">{saveError}</p>}`

### Task 4 — Apply card styling

- [x] Outer wrapper: `bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl shadow-[var(--theme-shadow-sm)] p-6 mt-8 print:hidden`
- [x] Section heading: `text-2xl font-bold text-[var(--theme-fg)] mb-4` with Fraunces (`font-display`) per design system
- [x] Edit button: `text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)] transition-colors`
- [x] Textarea: `w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] text-[var(--theme-fg)] p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]`
- [x] Counter: `text-sm text-[var(--theme-fg-subtle)]`
- [x] Save button: `inline-flex items-center gap-2 px-4 py-2 bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50`
- [x] Cancel button: `inline-flex items-center gap-2 px-4 py-2 border border-[var(--theme-border)] text-[var(--theme-fg-muted)] hover:bg-[var(--theme-surface-hover)] rounded-lg text-sm transition-colors`

### Task 5 — Wire component into recipe detail route

- [x] In `src/routes/recipes/$recipeId.tsx`, import `PrivateRecipeNotes` from `@/components/recipes/PrivateRecipeNotes`
- [x] Add `<PrivateRecipeNotes recipeId={recipeId} />` between `</RecipeDetail>` (closing tag) and the `<div className="mt-8 flex ...">` action buttons div

### Task 6 — Type-check and validate

- [x] Run `npx tsc --noEmit` — must pass with zero errors
- [x] Run `npm run test` — all tests must pass
- [x] Run `npm run build` — build must succeed

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run `npm run test` — all unit/integration tests pass
- [x] Run `npx tsc --noEmit` — zero type errors
- [x] Run `npm run build` — build succeeds
- [x] Visual check: all four themes render legibly (toggle theme in header drawer)
- [x] No hard-coded hex values in `PrivateRecipeNotes.tsx`
- [x] No emoji in new files
- [x] All completed tasks marked complete

## Remote push validation

**Full path** (non-`.md` files changed):

- **Unit tests** — `npm run test` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors

If **ANY** required step fails, iterate and fix before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `feat/private-recipe-notes-component` and push to remote
- [x] Open PR from `feat/private-recipe-notes-component` to `main`. PR body must include: **"Closes #495"**
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [x] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent
- Reviewer(s): Copilot, Codacy (automated)
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Sync approved spec delta: copy `openspec/changes/private-recipe-notes-component/specs/private-recipe-notes-component/spec.md` to `openspec/specs/private-recipe-notes-component/spec.md`; update relative links in the copied file: replace `../../design.md` → `../../changes/archive/YYYY-MM-DD-private-recipe-notes-component/design.md` and `../../tasks.md` → `../../changes/archive/YYYY-MM-DD-private-recipe-notes-component/tasks.md`
- [x] Archive the change: move `openspec/changes/private-recipe-notes-component/` to `openspec/changes/archive/YYYY-MM-DD-private-recipe-notes-component/` — stage both the new location and the deletion in a single commit
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-private-recipe-notes-component/` exists and `openspec/changes/private-recipe-notes-component/` is gone
- [x] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-private-recipe-notes-component` then `git push -u origin doc/archive-YYYY-MM-DD-private-recipe-notes-component`
- [x] Open a PR from `doc/archive-YYYY-MM-DD-private-recipe-notes-component` to `main` with title `docs: archive private-recipe-notes-component (YYYY-MM-DD)`
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [x] Monitor the doc PR until it merges; address any comments or CI failures on the doc branch
- [x] Prune merged local branches: `git fetch --prune` and `git branch -D feat/private-recipe-notes-component doc/archive-YYYY-MM-DD-private-recipe-notes-component`
