# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/506-reveal-private-source-name-input` then immediately `git push -u origin feat/506-reveal-private-source-name-input`

## Execution

- [x] **Task 1 — Update sources tRPC router and tests:**
  - Modify `src/server/trpc/routers/sources.ts` to add the `slug` property to query outputs for:
    - `list` (returns `slug: (s.slug ?? null) as string | null`)
    - `search` (returns `slug: (s.slug ?? null) as string | null`)
    - `byId` (returns `slug: (source.slug ?? null) as string | null`)
  - Add test coverage in `src/server/trpc/routers/__tests__/sources.test.ts` ensuring that `slug` is present in the response of `list`, `search`, and `byId`.
  - Run `npm run test src/server/trpc/routers/__tests__/sources.test.ts` to verify.

- [x] **Task 2 — Implement SourceSelector UI input and styling:**
  - Update `SourceSelectorProps` in `src/components/ui/SourceSelector.tsx` to add `personalSourceName: string` and `onPersonalSourceNameChange: (v: string) => void`.
  - Inside `SourceSelector`, wire a React Query call to get details of the selected source `value` (ID) by running:
    ```typescript
    const { data: selectedSource } = useQuery({
      ...trpc.sources.byId.queryOptions({ id: value }),
      enabled: !!value,
    })
    ```
  - Determine if the source is Personal by checking if the resolved slug or the selected search result's slug equals `"personal"`:
    ```typescript
    const selectedFromSearch = results.find((r) => r.id === value)
    const isPersonalSelected = (selectedSource?.slug === "personal") || (selectedFromSearch?.slug === "personal")
    ```
  - When `isPersonalSelected` is true, render a form input group below the source selection container:
    - Wrapper: `div` with margin-top (e.g., `mt-4`).
    - Label: `<label htmlFor="personalSourceName" className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-1">Personal Name</label>`.
    - Input: `<input id="personalSourceName" type="text" placeholder="e.g. Aunt Mary" maxLength={80} value={personalSourceName} onChange={(e) => onPersonalSourceNameChange(e.target.value)} aria-describedby="personalSourceName-helper" className="..." />` (using CSS variables to support all 4 themes).
    - Helper: `<p id="personalSourceName-helper" className="mt-1.5 text-xs text-[var(--theme-fg-subtle)]">Only you can see this.</p>`.
  - Ensure the field is hidden when any other source is selected.

- [x] **Task 3 — Create SourceSelector component tests:**
  - Create `src/components/ui/__tests__/SourceSelector.test.tsx` containing tests:
    - Assert that the "Personal Name" input is not rendered initially when no source is selected.
    - Assert that when a source with slug `"personal"` is selected, the "Personal Name" input group, label, placeholder, and helper text are rendered.
    - Assert that when a source with a different slug (e.g. `"bon-appetit"`) is selected, the input group is not rendered.
    - Assert that typing in the input triggers `onPersonalSourceNameChange` with the typed string.
    - Assert that the input has `aria-describedby` matching the helper paragraph's ID.
  - Run `npm run test src/components/ui/__tests__/SourceSelector.test.tsx` to verify.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path.

**Full path** (any non-`.md` file changed):

- **Unit tests** — run `npm run test`; all tests must pass
- **Integration tests** — run `npm run test:integration`; all tests must pass (if any exist)
- **Regression / E2E tests** — run `npm run test:e2e`; all tests must pass
- **Build** — run `npm run build`; build must succeed with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — run `npm run build`; build must succeed with no errors
- Skip integration and regression/E2E tests — they are not required when no code changed

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

Use the project's documented commands for each of the above.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from working branch to `main`. **The PR body MUST explicitly state "Closes #506".**
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: Antigravity
- Reviewer(s): dougis
- Required approvals: dougis

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the main branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change
- [x] Sync approved spec deltas into `openspec/specs/` (global spec). After copying `openspec/changes/reveal-private-source-name-input/specs/source-selector/spec.md` to `openspec/specs/source-selector/spec.md`, update all relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/2026-06-15-reveal-private-source-name-input/design.md`, and similarly for `../../tasks.md`.
- [x] Archive the change: move `openspec/changes/reveal-private-source-name-input/` to `openspec/changes/archive/2026-06-15-reveal-private-source-name-input/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [x] Confirm `openspec/changes/archive/2026-06-15-reveal-private-source-name-input/` exists and `openspec/changes/reveal-private-source-name-input/` is gone
- [x] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-2026-06-15-reveal-private-source-name-input` then `git push -u origin doc/archive-2026-06-15-reveal-private-source-name-input`
- [x] Open a PR from `doc/archive-2026-06-15-reveal-private-source-name-input` to `main` with title `docs: archive reveal-private-source-name-input (2026-06-15)` — **do NOT push directly to main**
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [x] Prune merged local branches: `git fetch --prune` and `git branch -D feat/506-reveal-private-source-name-input doc/archive-2026-06-15-reveal-private-source-name-input`
