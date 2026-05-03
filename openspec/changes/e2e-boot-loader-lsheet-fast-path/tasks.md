# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b e2e-boot-loader-lsheet-fast-path` then immediately `git push -u origin e2e-boot-loader-lsheet-fast-path`

## Execution

- [x] **Add `l.sheet` fast-path test to `src/e2e/fouc-prevention.spec.ts`**
  - Add one test to the existing `FOUC prevention` describe block
  - Test structure:
    1. `await page.goto('/')` — prime the browser context HTTP cache (Nitro serves CSS with `Cache-Control: public, max-age=31536000, immutable`)
    2. `await expect(page.locator('#app-shell')).toBeVisible()` — confirm first load works
    3. `await page.addInitScript(...)` — install spy on `EventTarget.prototype.addEventListener` to set `window.__cssLoadListenerAttached = true` if a `'load'` listener is attached to any `<link>` element; only runs on the next navigation
    4. `await page.goto('/')` — second navigation; CSS served from cache; `link.sheet` non-null before `init()` runs
    5. `await expect(page.locator('#app-shell')).toBeVisible()` — app shell visible
    6. `await expect(page.locator('#boot-loader')).not.toBeVisible()` — boot-loader hidden
    7. Assert `fastPathTaken` — `page.evaluate(() => !(window as any).__cssLoadListenerAttached)` is `true`
    8. Assert `sheetWasNonNull` — `page.evaluate(...)` to read `link.sheet` from the non-print stylesheet is non-null
  - If `sheetWasNonNull` fails, it means cache priming didn't work; check Nitro headers and environment
  - Local dev note: Vite dev server may serve CSS with `no-cache` headers, causing `fastPathTaken` to fail locally. If so, skip on non-CI with `test.skip(!process.env.CI, 'Requires production build with immutable cache headers')` — or investigate during implementation.

## Validation

- [x] Run E2E tests: `npm run test:e2e` — new test must pass; all existing tests must still pass
- [x] Run type checks: `npx tsc --noEmit` — must pass with no errors
- [x] Run unit/integration tests: `npm run test` — must pass
- [x] Run build: `npm run build` — must succeed
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **Integration tests** — included in `npm run test`
- **E2E tests** — `npm run test:e2e` — all tests must pass (run against production build in CI)
- **Build** — `npm run build` — must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [ ] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to `e2e-boot-loader-lsheet-fast-path` and push to remote
- [ ] Open PR from `e2e-boot-loader-lsheet-fast-path` to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

Ownership metadata:

- Implementer: claude-code agent
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
- [ ] Sync approved spec delta into `openspec/specs/fouc-prevention/spec.md` — append FR-LSHEET-1 scenario from `openspec/changes/e2e-boot-loader-lsheet-fast-path/specs/fouc-prevention/cached-lsheet.md`
- [ ] Archive the change: move `openspec/changes/e2e-boot-loader-lsheet-fast-path/` to `openspec/changes/archive/YYYY-MM-DD-e2e-boot-loader-lsheet-fast-path/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-e2e-boot-loader-lsheet-fast-path/` exists and `openspec/changes/e2e-boot-loader-lsheet-fast-path/` is gone
- [ ] Commit and push the archive to `main` in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d e2e-boot-loader-lsheet-fast-path`
