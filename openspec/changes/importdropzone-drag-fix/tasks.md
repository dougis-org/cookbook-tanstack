## 1. Preparation

- [x] 1.1 **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] 1.2 **Step 2 — Create and publish working branch:** `git checkout -b fix/importdropzone-drag-semantics` then immediately `git push -u origin fix/importdropzone-drag-semantics`

## 2. Tests First (TDD)

- [x] 2.1 Write failing tests for semantic element: assert drop zone is NOT a `<button>`, has `role="button"`, and `tabIndex={0}`
- [x] 2.2 Write failing tests for keyboard activation: Enter and Space trigger file input click; other keys do not
- [x] 2.3 Write failing tests for drag-over visual feedback: `isDragging` true adds `border-cyan-500`; false shows `border-slate-600`
- [x] 2.4 Write failing tests for drag-leave reset: border returns to `border-slate-600` after drag leaves
- [x] 2.5 Write failing tests for drop reset: border returns to `border-slate-600` after drop

## 3. Implementation

- [x] 3.1 Replace `<button>` with `<div role="button" tabIndex={0}>` in `src/components/recipes/ImportDropzone.tsx`
- [x] 3.2 Add `onKeyDown` handler: Enter or Space triggers `inputRef.current?.click()`
- [x] 3.3 Add `isDragging` state (`useState<boolean>(false)`) and `dragCounterRef` (`useRef<number>(0)`)
- [x] 3.4 Add `onDragEnter` handler: increment counter, set `isDragging(true)`
- [x] 3.5 Update `onDragLeave` handler: decrement counter, set `isDragging(false)` only when counter reaches 0
- [x] 3.6 Update `onDrop` handler: reset counter to 0, set `isDragging(false)`, then call `handleFile(...)`
- [x] 3.7 Replace `hover:border-cyan-500` Tailwind class with conditional: `isDragging ? 'border-cyan-500' : 'border-slate-600'`
- [x] 3.8 Review for duplication and unnecessary complexity
- [x] 3.9 Confirm all spec acceptance criteria are covered

## 4. Validation

- [x] 4.1 Run unit/integration tests: `npm run test` — all pass
- [x] 4.2 Run E2E tests: `npm run test:e2e` — all pass
- [x] 4.3 Run type checks: `npx tsc --noEmit` — no errors (pre-existing unrelated error in cookbooks print route)
- [x] 4.4 Run build: `npm run build` — succeeds with no errors
- [x] 4.5 Run security/code quality checks required by project standards
- [x] 4.6 All completed tasks marked complete
- [x] 4.7 All steps in [Remote push validation] pass

## 5. Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — included in `npm run test`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure before pushing

## 6. Pre-PR Self-Review

- [x] 6.1 Spawn a code reviewer sub-agent to review all staged/unstaged changes (`git diff main...HEAD`) — check for complexity, duplication, and quality issues
- [x] 6.2 Apply accepted fixes from the review report
- [x] 6.3 Re-run all tests to confirm fixes pass before committing

## 7. PR and Merge

- [ ] 7.1 Commit all changes to `fix/importdropzone-drag-semantics` and push to remote
- [ ] 7.2 Open PR from `fix/importdropzone-drag-semantics` to `main` — include `Closes #195` in PR body
- [ ] 7.3 Wait **3 minutes** for CI to start and reviewers to post early comments
- [ ] 7.4 **Unified CI + comment loop** — gather all CI failures and unresolved review threads in one pass; fix everything, batch into a single commit+push; wait 1 minute after each push for CI to re-trigger and threads to auto-resolve; resolve any addressed threads still open via GitHub GraphQL `resolveReviewThread`; repeat until all CI checks are green AND zero open review threads remain
- [ ] 7.5 Enable auto-merge only when **both** conditions are true: all CI checks green **and** zero open review threads — `gh pr merge <PR-URL> --auto --merge`
- [ ] 7.6 Wait for the PR to merge — **never force-merge**; if a human force-merges, continue to Post-Merge

The comment and CI resolution loops are iterative: address → validate locally → push → wait 1 minute → re-check → repeat until the PR is fully clean.

Ownership metadata:

- Implementer:
- Reviewer(s):
- Required approvals:

Blocking resolution flow:

- CI failure → fix → commit → validate locally (`npm run test && npm run test:e2e && npm run build`) → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## 8. Post-Merge

- [ ] 8.1 `git checkout main` and `git pull --ff-only`
- [ ] 8.2 Verify the merged changes appear on `main`
- [ ] 8.3 Mark all remaining tasks as complete (`- [x]`)
- [ ] 8.4 Update repository documentation impacted by the change (if any)
- [ ] 8.5 Sync approved spec delta into `openspec/specs/importdropzone-drag-feedback/spec.md`
- [ ] 8.6 Archive the change: move `openspec/changes/importdropzone-drag-fix/` to `openspec/changes/archive/YYYY-MM-DD-importdropzone-drag-fix/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] 8.7 Confirm `openspec/changes/archive/YYYY-MM-DD-importdropzone-drag-fix/` exists and `openspec/changes/importdropzone-drag-fix/` is gone
- [ ] 8.8 Commit and push the archive to `main` in one commit
- [ ] 8.9 Prune merged local feature branches: `git fetch --prune` and `git branch -d fix/importdropzone-drag-semantics`
