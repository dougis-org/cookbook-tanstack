# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/source-slug-backfill` then immediately `git push -u origin feat/source-slug-backfill`

## Execution

### Task 1 — Update Source model

- [x] In `src/db/models/source.ts`: add `slug: string` to `ISource` interface
- [x] In `src/db/models/source.ts`: add `slug: { type: String, required: true, unique: true, index: true }` to `sourceSchema`
- [x] Verify TypeScript compiles: `npx tsc --noEmit`

### Task 2 — Write failing tests first (TDD)

- [x] In the Source model test file, add tests for:
  - `slug` field is present on `ISource` interface (TypeScript compile verifies)
  - Mongoose validation rejects a Source saved without `slug`
  - Mongoose rejects inserting two Sources with identical `slug` (duplicate key error)
  - `backfillSourceSlugs()` sets slug derived from `name` using `slugify()`
  - `backfillSourceSlugs()` skips documents that already have a slug (idempotency)
  - `backfillSourceSlugs()` logs a warning when zero documents are updated
- [x] Run tests and confirm they **fail** as expected: `npx vitest run src/db/models/source.test.ts`

### Task 3 — Create `src/db/seeds/sources.ts`

- [x] Create `src/db/seeds/sources.ts` exporting `backfillSourceSlugs()`
- [x] Import `slugify` from `scripts/migration/lib/transformHelpers.ts`
- [x] Import `Source` from `src/db/models/index.ts`
- [x] Implementation:
  - Query `Source.find({ slug: { $exists: false } })`
  - For each document, compute `slug = slugify(doc.name)` and call `doc.updateOne({ $set: { slug } })`
  - Log count of updated documents
  - If count is zero, log a warning: `"backfillSourceSlugs: no un-slugged documents found — already complete or collection is empty"`
- [x] Run tests and confirm they pass: `npx vitest run src/db/models/source.test.ts`

### Task 4 — Wire into seed entrypoint

- [x] In `src/db/seeds/index.ts`: import and call `backfillSourceSlugs()` alongside `seedMeals()`, `seedCourses()`, `seedPreparations()`
- [x] Run the full seed against local DB: `npm run db:seed`
- [x] Confirm output includes source backfill log line (expect "0 documents updated" warning on empty local DB — that is correct)

### Task 5 — Deploy ordering (prod)

> **IMPORTANT:** Do not deploy the app before running the backfill against Atlas.
>
> Prod deploy order:
> 1. Run `npm run db:seed` against the prod Atlas connection (set `MONGODB_URI` to Atlas SRV string in env)
> 2. Confirm all 150 Source documents have a slug (verify via Atlas UI or a quick `db.sources.countDocuments({ slug: { $exists: true } })`)
> 3. Then deploy the app build

- [x] Document Atlas backfill run in PR description after execution

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] All Source model tests pass: `npx vitest run src/db/models/source.test.ts`
- [x] Full unit/integration test suite passes: `npm run test`
- [x] TypeScript type check passes: `npx tsc --noEmit`
- [x] Build succeeds: `npm run build`
- [x] Seed runs without error on local DB: `npm run db:seed`
- [x] All spec scenarios from `openspec/changes/source-slug-backfill/specs/source-slug/spec.md` are covered by tests

## Remote push validation

**Full path** (non-`.md` files changed — applies here):

- **Unit tests** — `npm run test` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `feat/source-slug-backfill` and push to remote
- [x] Open PR from `feat/source-slug-backfill` to `main`. PR body must include: **"Closes #501"**
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [x] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address each unresolved thread, commit fixes, run validation, push, wait 180 seconds
  3. **CI check failures** — fix any failing required checks, commit, run validation, push, wait 180 seconds; then restart loop from step 1

Ownership metadata:

- Implementer: agent
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec delta into global spec: copy `openspec/changes/source-slug-backfill/specs/source-slug/spec.md` to `openspec/specs/source-slug/spec.md`; update relative links in the copied file to point to `../../changes/archive/YYYY-MM-DD-source-slug-backfill/design.md` and `../../changes/archive/YYYY-MM-DD-source-slug-backfill/tasks.md`
- [ ] Archive the change: move `openspec/changes/source-slug-backfill/` to `openspec/changes/archive/YYYY-MM-DD-source-slug-backfill/` — stage both the copy and deletion in a **single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-source-slug-backfill/` exists and `openspec/changes/source-slug-backfill/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-source-slug-backfill` then `git push -u origin doc/archive-YYYY-MM-DD-source-slug-backfill`
- [ ] Open PR from doc branch to `main` with title `docs: archive source-slug-backfill (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor doc PR until merged; address any comments or CI failures
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D feat/source-slug-backfill doc/archive-YYYY-MM-DD-source-slug-backfill`
