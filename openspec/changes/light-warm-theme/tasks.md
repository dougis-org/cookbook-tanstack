# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/light-warm-theme` then immediately `git push -u origin feat/light-warm-theme`

## Execution

- [x] **Task 3 — Write failing E2E tests for Light (warm) theme switching and visual correctness**
  - Add to `src/e2e/theme.spec.ts`:
    - Test: `theme selector renders Dark, Light (cool), and Light (warm) options`
    - Test: `switching to Light (warm) changes key surface colors`
    - Test: `light-warm: active filter chip text matches the theme accent`
    - Test: `light-warm theme persists across page reload`
    - Test: `no flash: html has light-warm class before hydration when light-warm stored`
  - Run `npm run test:e2e` — tests must fail (theme not yet implemented)

- [x] **Task 4 — Create `src/styles/themes/light-warm.css`**
  ```css
  html.light-warm {
    --theme-bg: theme(colors.amber.50);
    --theme-surface: theme(colors.white);
    --theme-surface-raised: theme(colors.stone.50);
    --theme-surface-hover: theme(colors.amber.100);
    --theme-border: theme(colors.stone.200);
    --theme-border-muted: theme(colors.stone.100);
    --theme-fg: theme(colors.stone.900);
    --theme-fg-muted: theme(colors.stone.600);
    --theme-fg-subtle: theme(colors.stone.500);
    --theme-accent: theme(colors.amber.700);
    --theme-accent-hover: theme(colors.amber.800);
    --theme-accent-emphasis: theme(colors.amber.900);
    --theme-shadow-sm: 0 1px 3px 0 rgb(120 53 15 / 0.10), 0 1px 2px -1px rgb(120 53 15 / 0.10);
    --theme-shadow-md: 0 4px 6px -1px rgb(120 53 15 / 0.10), 0 2px 4px -2px rgb(120 53 15 / 0.10);
  }
  ```
  - Verify the CSS file is imported in `src/styles.css` or the main style entry (check how `light-cool.css` is imported and follow the same pattern)

- [x] **Task 5 — Register `light-warm` in `src/contexts/ThemeContext.tsx`**
  - Add `{ id: 'light-warm', label: 'Light (warm)' }` to the `THEMES` array
  - Verify TypeScript compiles: `npx tsc --noEmit`
  - Check for any exhaustive `ThemeId` type checks and update if found

- [x] **Task 6 — Verify no component changes are needed**
  - Confirm the theme selector renders the new option automatically (it iterates `THEMES`)
  - Spot-check the app at `http://localhost:3000` with Light (warm) selected

## Validation

- [x] Run unit/integration tests: `npm run test` — all must pass
- [x] Run E2E tests: `npm run test:e2e` — all must pass (including new Light (warm) tests)
- [x] Run type checks: `npx tsc --noEmit` — no errors
- [x] Run build: `npm run build` — must succeed
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — included in `npm run test`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure before pushing

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `feat/light-warm-theme` to `main` — title: `feat: Light (warm) theme (#308)`
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

Ownership metadata:

- Implementer: Claude Code
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on main
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] No documentation updates required (no new user-facing docs needed beyond the theme itself)
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec) if applicable
- [ ] Archive the change: move `openspec/changes/light-warm-theme/` to `openspec/changes/archive/YYYY-MM-DD-light-warm-theme/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-light-warm-theme/` exists and `openspec/changes/light-warm-theme/` is gone
- [ ] Commit and push the archive to main in one commit
- [ ] Prune merged local feature branch: `git fetch --prune` and `git branch -d feat/light-warm-theme`
