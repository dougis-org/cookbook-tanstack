# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/recipe-note-model` then immediately `git push -u origin feat/recipe-note-model`

## Execution

### Task 1 — Write failing unit tests (TDD)

Create `src/db/models/__tests__/RecipeNote.test.ts` covering all spec scenarios before writing the model. Follow the pattern in `src/db/models/__tests__/notification.test.ts`.

Tests to write (all must fail at this point):
- Required field validation: missing `userId`, `recipeId`, `body` each throw `ValidationError`
- Body maxlength: 10001-char body throws `ValidationError`
- Body trim: `"  hello  "` is stored as `"hello"`
- Timestamps: `createdAt` and `updatedAt` are `Date` instances after save
- Compound unique index: inserting duplicate `(userId, recipeId)` throws error with code `11000`
- Distinct pairs: same `userId` with different `recipeId` both save successfully

Verification: `npx vitest run src/db/models/__tests__/RecipeNote.test.ts` — all tests must **fail** (model does not exist yet).

### Task 2 — Implement `src/db/models/RecipeNote.ts`

Create the model file following the `notification.ts` typed pattern:

```
src/db/models/RecipeNote.ts
```

- `IRecipeNote extends Document` interface with fields: `userId: Types.ObjectId`, `recipeId: Types.ObjectId`, `body: string`, `createdAt: Date`, `updatedAt: Date`
- Schema: `userId` (`ObjectId`, ref `"User"`, required), `recipeId` (`ObjectId`, ref `"Recipe"`, required), `body` (`String`, required, maxlength 10000, trim)
- Schema options: `{ timestamps: true }`
- Post-schema: `recipeNoteSchema.index({ userId: 1, recipeId: 1 }, { unique: true })`
- Export guard: `(mongoose.models.RecipeNote as Model<IRecipeNote>) || mongoose.model<IRecipeNote>("RecipeNote", recipeNoteSchema)`
- **No** `hiddenByTier` field; **no** secondary index

Verification: `npx vitest run src/db/models/__tests__/RecipeNote.test.ts` — all tests must now **pass**.

### Task 3 — Add barrel export

Add to `src/db/models/index.ts`:
```
export { RecipeNote } from "./recipe-note";
```

Verification: `npm run build` succeeds (TypeScript resolves the new export).

### Task 4 — Update `docs/database.md`

Add a `recipe-notes` collection entry documenting:
- Fields: `userId` (ObjectId, ref users), `recipeId` (ObjectId, ref recipes), `body` (string, maxlength 10000), `createdAt`, `updatedAt`
- Indexes: compound unique `(userId, recipeId)`
- Tier gate: access enforced at API layer (`hasAtLeastTier(user, 'sous-chef')`); no visibility flag stored on the document; downgraded users retain stored notes but are denied access until re-upgrade

Verification: `docs/database.md` lists `recipe-notes` with all fields and the tier-gate note.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Automatically apply all clearly-correct findings to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npx vitest run src/db/models/__tests__/RecipeNote.test.ts` — all tests pass
- [x] `npm run test` — full test suite passes (no regressions)
- [x] `npm run build` — TypeScript compilation succeeds
- [x] No new type errors in `src/db/models/index.ts` or `src/db/models/RecipeNote.ts`
- [x] All tasks above marked complete

## Remote push validation

This change includes non-`.md` files (`src/db/models/RecipeNote.ts`, `src/db/models/index.ts`). Apply the **full path**:

- **Unit tests** — `npm run test` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- E2E tests are not required (no UI or API routes are introduced by this change)

If **ANY** required step fails, iterate and fix before pushing.

## PR and Merge

- [x] Run pre-commit code review sub-agent; apply all findings; re-run tests
- [ ] Commit all changes to `feat/recipe-note-model` and push to remote
- [ ] Open PR from `feat/recipe-note-model` to `main`. PR body must include: `Closes #490`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (never `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Iterate until merged** — repeat the following priority loop until `gh pr view <PR-URL> --json state` returns `MERGED`; if `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix failures, commit, push before anything else
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address each unresolved thread, commit fixes, run validation, push, wait 180 seconds
  3. **CI check failures** — after comments resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix failing required checks, commit, validate, push, wait 180 seconds; restart loop from step 1

Ownership metadata:

- Implementer: AI agent
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → `npm run test && npm run build` → push → re-run checks
- Security finding → remediate → commit → validate → push → re-scan
- Review comment → address → commit → validate → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify `src/db/models/RecipeNote.ts` and barrel export appear on `main`
- [ ] Mark all remaining tasks as complete
- [ ] Sync spec delta: copy `openspec/changes/recipe-note-model/specs/recipe-note-model/spec.md` to `openspec/specs/recipe-note-model/spec.md`; update relative links in the copied file: replace `../../design.md` → `../../changes/archive/YYYY-MM-DD-recipe-note-model/design.md` and `../../tasks.md` → `../../changes/archive/YYYY-MM-DD-recipe-note-model/tasks.md`
- [ ] Archive the change: move `openspec/changes/recipe-note-model/` to `openspec/changes/archive/YYYY-MM-DD-recipe-note-model/` — stage both the copy and deletion in **a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-recipe-note-model/` exists and `openspec/changes/recipe-note-model/` is gone
- [ ] Create doc branch: `git checkout -b doc/archive-YYYY-MM-DD-recipe-note-model` then `git push -u origin doc/archive-YYYY-MM-DD-recipe-note-model`
- [ ] Open PR from `doc/archive-YYYY-MM-DD-recipe-note-model` to `main` with title `docs: archive recipe-note-model (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor doc PR until merged; address any comments or CI failures on the doc branch
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D feat/recipe-note-model doc/archive-YYYY-MM-DD-recipe-note-model`
