# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b restrict-import-to-executive-chef` then immediately `git push -u origin restrict-import-to-executive-chef`

## Execution

### T1 — Update Header.tsx to hide import nav link for non-entitled users

- [x] In `src/components/Header.tsx`, import `useTierEntitlements` from `@/hooks/useTierEntitlements`
- [x] Call `const { canImport } = useTierEntitlements()` inside the `Header` function
- [x] Change the import link render condition from `{session && (` to `{session && canImport && (`
- [x] Verify: no TypeScript errors (`npx tsc --noEmit`)

### T2 — Update import page to show inline upsell for non-entitled users

- [x] In `src/routes/import/index.tsx`, import `useTierEntitlements` from `@/hooks/useTierEntitlements`
- [x] Call `const { canImport } = useTierEntitlements()` inside `ImportPage` (alongside existing hooks)
- [x] Wrap the `<ImportDropzone .../>` and field errors in a `canImport` conditional
- [x] Add `{!canImport && <TierWall reason="import" display="inline" />}` as the non-entitled branch
- [x] Guard `<ImportPreviewModal>` and the mutation TierWall modal with `{canImport && ...}` to keep them unreachable for non-entitled users
- [x] Verify: no TypeScript errors (`npx tsc --noEmit`)

### T3 — Update Header tests to cover tier-gated import link

- [x] In `src/components/__tests__/Header.test.tsx`, update `mockSession` to include `tier: 'executive-chef'` (tests that assert the import link is visible require an entitled session)
- [x] Update "shows Import Recipe link when session is non-null" test description to reflect executive-chef tier
- [x] Add test: "does not show Import Recipe link when session tier is sous-chef" — set `mockAuthResult` with `tier: 'sous-chef'`; assert `queryByText('Import Recipe')` is null

### T4 — Update import page tests to cover page-load upsell

- [x] In `src/routes/__tests__/-import.test.tsx`, add `vi.mock('@/hooks/useTierEntitlements', ...)` — default mock returns `{ canImport: true }` to preserve all existing test behavior
- [x] Add test: "shows inline TierWall when canImport is false" — override mock to return `canImport: false`; render `ImportPage`; assert `screen.getByText('Import requires Executive Chef')` is present
- [x] Add test: "does not show ImportDropzone when canImport is false" — assert `ImportDropzone` mock is not rendered (or its container is absent)

## Validation

- [x] Run unit tests: `npm run test` — all tests must pass
- [x] Run type check: `npx tsc --noEmit` — no errors
- [x] Run build: `npm run build` — must succeed
- [x] Confirm no E2E changes needed (unit tests cover the new behavior; existing E2E for import remains valid for executive-chef path)
- [x] All execution tasks marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- if **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to `restrict-import-to-executive-chef` branch and push to remote
- [x] Open PR from `restrict-import-to-executive-chef` to `main` — title: "feat: restrict recipe import to Executive Chef tier only (closes #421)"
- [x] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [x] Enable auto-merge: `gh pr merge --auto --merge`
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in Remote push validation, push; wait 180 seconds then repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix, commit, follow Remote push validation, push; wait 180 seconds then repeat until all checks pass
- [x] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — never wait for a human to report the merge; never force-merge

Ownership metadata:

- Implementer: claude-code
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → `npm run test && npm run build` → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] No documentation updates required (feature matrix in `docs/user-tier-feature-sets.md` was already updated in #419)
- [ ] Sync approved spec deltas: copy `openspec/changes/restrict-import-to-executive-chef/specs/import-tier-gate.md` → `openspec/specs/import-tier-gate.md`
- [x] Archive the change: move `openspec/changes/restrict-import-to-executive-chef/` to `openspec/changes/archive/YYYY-MM-DD-restrict-import-to-executive-chef/` **staging both the new location and deletion in a single commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-restrict-import-to-executive-chef/` exists and `openspec/changes/restrict-import-to-executive-chef/` is gone
- [x] Commit and push the archive to `main` in one commit
- [ ] Prune merged local branch: `git fetch --prune` and `git branch -d restrict-import-to-executive-chef`
