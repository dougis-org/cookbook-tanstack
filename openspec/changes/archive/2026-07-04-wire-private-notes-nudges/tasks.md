# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/wire-private-notes-nudges` then immediately `git push -u origin feat/wire-private-notes-nudges`

## Execution

### Task 1 — Write failing tests for all four render branches

File: `src/components/recipes/PrivateRecipeNotes.test.tsx`

Add four new `it` blocks (one per branch) as per `tests.md`. Run tests — all four must fail before implementation begins (TDD red phase):

```bash
npx vitest run src/components/recipes/PrivateRecipeNotes.test.tsx
```

Branches to cover:
1. Anonymous visitor → nudge `"anonymous"`, no query call
2. Below-tier, `hasNote: false` → nudge `"below-tier"`, no textarea
3. Below-tier, `hasNote: true` (downgrade) → nudge `"hidden-by-downgrade"`, no note body text
4. Entitled user, existing note → note body visible, no nudge

### Task 2 — Update PrivateRecipeNotes to implement all four branches

File: `src/components/recipes/PrivateRecipeNotes.tsx`

Changes:
1. Add `import { useAuth } from '@/hooks/useAuth'` 
2. Add `import RecipeNotesUpgradeNudge from '@/components/recipes/RecipeNotesUpgradeNudge'`
3. Inside the component, destructure `isLoggedIn` from `useAuth()`
4. Change `enabled: canUsePrivateRecipeNotes` → `enabled: isLoggedIn` on the `useQuery` call
5. Replace `if (!canUsePrivateRecipeNotes) return null` with:
   - If `!isLoggedIn` → `return <RecipeNotesUpgradeNudge state="anonymous" />`
   - If below-tier and `isLoading` → `return null`
   - If below-tier and `isError` → `return null`
   - If below-tier and `data?.hasNote` → `return <RecipeNotesUpgradeNudge state="hidden-by-downgrade" />`
   - If below-tier → `return <RecipeNotesUpgradeNudge state="below-tier" />`

Run tests — all four new tests plus existing tests must pass (TDD green phase):

```bash
npx vitest run src/components/recipes/PrivateRecipeNotes.test.tsx
```

### Task 3 — Type-check and lint

```bash
npx tsc --noEmit
```

Ensure no new type errors.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npx vitest run src/components/recipes/PrivateRecipeNotes.test.tsx` — all tests pass
- [x] `npx vitest run src/routes/recipes/__tests__/-$recipeId.test.tsx` — existing route tests still pass
- [x] `npx tsc --noEmit` — no type errors
- [x] `npm run build` — build succeeds
- [x] All four branch scenarios verified against spec: `openspec/changes/wire-private-notes-nudges/specs/private-notes-nudge-branches/spec.md`

## Remote push validation

**Full path** (non-`.md` files changed):

- **Unit tests** — `npm run test` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors

If **ANY** required step fails, iterate and fix before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings addressed before final commit
- [x] Commit all changes and push: `git push origin feat/wire-private-notes-nudges`
- [x] Open PR from `feat/wire-private-notes-nudges` to `main` with body: `Closes #497`
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, push before anything else
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads resolved
  3. **CI check failures** — only after all comments resolved, poll `gh pr checks <PR-URL>`; fix failing required checks, commit, push, wait 180 seconds; restart loop from step 1

After every push, restart at step 1.

Ownership metadata:

- Implementer: agent
- Reviewer(s): @dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all remaining tasks complete
- [ ] Sync approved spec delta to global specs: copy `openspec/changes/wire-private-notes-nudges/specs/private-notes-nudge-branches/spec.md` to `openspec/specs/private-notes-nudge-branches/spec.md`; update relative links from `../../design.md` → `../../changes/archive/YYYY-MM-DD-wire-private-notes-nudges/design.md` and `../../tasks.md` → `../../changes/archive/YYYY-MM-DD-wire-private-notes-nudges/tasks.md`
- [ ] Archive the change: move `openspec/changes/wire-private-notes-nudges/` to `openspec/changes/archive/YYYY-MM-DD-wire-private-notes-nudges/` and stage both the copy and deletion in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-wire-private-notes-nudges/` exists and `openspec/changes/wire-private-notes-nudges/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-wire-private-notes-nudges` then `git push -u origin doc/archive-YYYY-MM-DD-wire-private-notes-nudges`
- [ ] Open a PR from the doc branch to `main` with title `docs: archive wire-private-notes-nudges (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor doc PR until merged (same loop — address comments and CI failures, push, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D feat/wire-private-notes-nudges doc/archive-YYYY-MM-DD-wire-private-notes-nudges`
