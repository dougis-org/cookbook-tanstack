# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix/remove-vite-tsconfig-paths` then immediately `git push -u origin fix/remove-vite-tsconfig-paths`

## Execution

- [x] **T1 — Update `vite.config.ts`:** Remove `import tsconfigPaths from 'vite-tsconfig-paths'` and `tsconfigPaths()` from plugins array; add `resolve: { tsconfigPaths: true }` to the config object returned by `defineConfig`
- [x] **T2 — Update `vitest.config.ts`:** Remove `import tsconfigPaths from 'vite-tsconfig-paths'` and `tsconfigPaths()` from plugins array; add `resolve: { tsconfigPaths: true }` to the config object
- [x] **T3 — Update `vite.config.test.ts`:**
  - Remove `expect(pluginNames).toContain('vite-tsconfig-paths')` assertion
  - Remove `assertOrder('nitro:init', 'vite-tsconfig-paths')` assertion
  - Remove `assertOrder('vite-tsconfig-paths', '@tailwindcss/vite:scan')` assertion
  - Delete the entire second `it` block ("keeps vitest config aligned with the expected plugin chain")
- [x] **T4 — Uninstall package:** `npm uninstall vite-tsconfig-paths` (updates `package.json` and `package-lock.json`)
- [x] **T5 — Update `CLAUDE.md`:** Change the documented plugin order from `devtools → nitro → tsConfigPaths → tailwindcss → tanstackStart → react` to `devtools → nitro → tailwindcss → tanstackStart → react`

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] Verify no deprecation warning: start `npm run dev` and confirm no `"vite-tsconfig-paths" is detected` line in output
- [x] Verify `vite.config.test.ts` passes: `npx vitest run vite.config.test.ts`
- [x] Confirm `node_modules/vite-tsconfig-paths` is absent: `ls node_modules/vite-tsconfig-paths 2>&1 | grep -c "No such file"`
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — included in `npm run test`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to `fix/remove-vite-tsconfig-paths` and push to remote
- [ ] Open PR from `fix/remove-vite-tsconfig-paths` to `main`; reference issue dougis-org/cookbook-tanstack#328 in PR body
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] Enable auto-merge: `gh pr merge --auto --merge`
- [ ] **Monitor PR comments** — poll autonomously; address each comment, commit fix, run full validation, push; wait 180 seconds; repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll autonomously; if any check fails, diagnose and fix, commit, run full validation, push; wait 180 seconds; repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify user

Ownership metadata:

- Implementer: Doug Hubbard
- Reviewer(s): Copilot / Codacy (automated)
- Required approvals: 1 (auto-merge handles once CI passes)

Blocking resolution flow:

- CI failure → fix → commit → run full validation locally → push → re-run checks
- Security finding → remediate → commit → run full validation locally → push → re-scan
- Review comment → address → commit → run full validation locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] No repository documentation changes required beyond CLAUDE.md (already in Execution)
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec) if applicable
- [ ] Archive the change: move `openspec/changes/remove-vite-tsconfig-paths/` to `openspec/changes/archive/YYYY-MM-DD-remove-vite-tsconfig-paths/` — stage both new location and deletion of old location in a **single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-remove-vite-tsconfig-paths/` exists and `openspec/changes/remove-vite-tsconfig-paths/` is gone
- [ ] Commit and push the archive to `main` in one commit
- [ ] Prune merged local branch: `git fetch --prune` and `git branch -d fix/remove-vite-tsconfig-paths`
