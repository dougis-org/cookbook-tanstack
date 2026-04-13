# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix/hamburger-menu-close` then immediately `git push -u origin fix/hamburger-menu-close`

## Execution

### E1 — Write failing E2E tests (TDD first)

- [x] In `src/e2e/` (or equivalent Playwright test directory), add a test file `header-sidebar.spec.ts` (or extend the existing Header E2E spec if one exists) with scenarios:
  - AC1: Open sidebar → click backdrop → assert sidebar is not visible
  - AC2: Open sidebar → click a theme button → assert sidebar is not visible AND theme attribute is updated
  - AC2b: Open sidebar → click already-active theme → assert sidebar closes
  - AC3 regression: Open sidebar → click X → assert sidebar closed
  - AC3 regression: Open sidebar → click a nav link → assert sidebar closed

### E2 — Add backdrop overlay to `src/components/Header.tsx`

- [x] Between the `</header>` closing tag and the `<aside>` opening tag, add:
  ```tsx
  {isOpen && (
    <div
      className="fixed inset-0 z-40"
      aria-hidden="true"
      onClick={() => setIsOpen(false)}
    />
  )}
  ```

### E3 — Update theme buttons to close sidebar in `src/components/Header.tsx`

- [x] In the theme picker section (`THEMES.map(...)`), update the button `onClick` from:
  ```tsx
  onClick={() => setTheme(t.id)}
  ```
  to:
  ```tsx
  onClick={() => { setTheme(t.id); setIsOpen(false) }}
  ```

### E4 — Verify no regressions in existing unit tests

- [x] Run `npm run test` — all existing Header unit tests must pass

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] Confirm AC1–AC4 scenarios pass in Playwright
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — `npm run test`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to `fix/hamburger-menu-close` and push to remote
- [x] Open PR from `fix/hamburger-menu-close` to `main` — reference `dougis-org/cookbook-tanstack#310` in the PR body
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [x] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

Ownership metadata:

- Implementer: Doug Hubbard
- Reviewer(s): auto-merge when CI passes
- Required approvals: 0 (auto-merge enabled)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change (none expected)
- [x] Sync approved spec deltas into `openspec/specs/` (global spec)
- [x] Archive the change: move `openspec/changes/fix-hamburger-menu-close/` to `openspec/changes/archive/YYYY-MM-DD-fix-hamburger-menu-close/` **and stage both the new location and the deletion of the old location in a single commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-hamburger-menu-close/` exists and `openspec/changes/fix-hamburger-menu-close/` is gone
- [x] Commit and push the archive to the default branch in one commit
- [x] Prune merged local feature branches: `git fetch --prune` and `git branch -d fix/hamburger-menu-close`
