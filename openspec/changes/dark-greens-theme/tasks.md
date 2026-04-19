# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/dark-greens-theme` then immediately `git push -u origin feat/dark-greens-theme`

## Execution

### TDD: Write failing tests first

- [x] **T1 — Unit: THEMES array has four entries with correct labels**
  - File: `src/contexts/__tests__/ThemeContext.test.tsx`
  - Assert `THEMES` contains `{ id: 'dark', label: 'Dark (blues)' }` and `{ id: 'dark-greens', label: 'Dark (greens)' }`
  - Assert `THEMES.length === 4`

- [x] **T2 — Unit: setTheme rejects unknown IDs**
  - File: `src/contexts/__tests__/ThemeContext.test.tsx`
  - Assert calling `setTheme('dark-greens')` sets `document.documentElement.className` to `'dark-greens'`
  - Assert calling `setTheme('unknown')` does not change className

- [x] **T3 — E2E: Theme picker shows four options**
  - File: `src/e2e/theme.spec.ts`
  - Assert picker has exactly four buttons/items
  - Assert labels include `Dark (blues)` and `Dark (greens)`

- [x] **T4 — E2E: dark-greens applies correct class and background**
  - File: `src/e2e/theme.spec.ts`
  - Click `Dark (greens)` → assert `html.dark-greens`
  - Assert `background-color` of `<html>` is `#103c48`

- [x] **T5 — E2E: dark-greens persists across reload**
  - File: `src/e2e/theme.spec.ts`
  - Select `Dark (greens)` → reload → assert `html.dark-greens` still active

- [x] **T6 — E2E: FOUC prevention for dark-greens**
  - File: `src/e2e/fouc-prevention.spec.ts`
  - Set localStorage `'dark-greens'` → navigate → assert `<html>` class before hydration

- [x] **T7 — Unit: criticalCss contains dark-greens rule**
  - File: `src/routes/__tests__/` (or snapshot in E2E)
  - Assert rendered HTML head contains `html.dark-greens{background:#103c48;color:#adbcbc}`

### Implementation

- [x] **I1 — Update `ThemeContext.tsx`**
  - File: `src/contexts/ThemeContext.tsx`
  - Change `dark` label from `'Dark'` to `'Dark (blues)'`
  - Add entry: `{ id: 'dark-greens', label: 'Dark (greens)' }`
  - `ThemeId` union type extends automatically via `as const`

- [x] **I2 — Create `dark-greens.css`**
  - File: `src/styles/themes/dark-greens.css`
  - Selector: `html.dark-greens, [data-theme="dark-greens"]`
  - All tokens per design.md Decision 3 and Decision 4 (see token table)

- [x] **I3 — Import dark-greens theme in `styles.css`**
  - File: `src/styles.css`
  - Add `@import "./styles/themes/dark-greens.css";` after existing theme imports

- [x] **I4 — Update `__root.tsx` criticalCss**
  - File: `src/routes/__root.tsx`
  - Add to `criticalCss`: `html.dark-greens{background:#103c48;color:#adbcbc}`
  - Update slot comment: replace `<slot for 4th theme — add here when that change ships>` with `dark-greens  #103c48  fg: #adbcbc`

- [x] **I5 — Update `docs/theming.md`**
  - File: `docs/theming.md`
  - Add `dark-greens` entry to theme registry/maintenance checklist

### Verify tests pass

- [x] Run `npx vitest run src/contexts/__tests__/ThemeContext.test.tsx`
- [x] Run `npx playwright test --headed src/e2e/theme.spec.ts`
- [x] Run `npx playwright test --headed src/e2e/fouc-prevention.spec.ts`

## Validation

- [x] Run full unit/integration suite: `npm run test`
- [x] Run full E2E suite: `npm run test:e2e`
- [x] Run type check: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] Visual QC: `openwolf designqc` — inspect theme picker with four options; verify dark-greens colours on recipe list and recipe detail pages
- [x] Check theme picker layout on 375px viewport (mobile) — no overflow
- [x] All tasks above marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — `npm run test`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, **MUST** iterate and fix before pushing

## PR and Merge

- [x] Run required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to `feat/dark-greens-theme` and push to remote
- [ ] Open PR from `feat/dark-greens-theme` to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] **Monitor PR comments** — poll autonomously; address comments, commit fixes, follow remote push validation, push; wait 180 seconds; repeat until no unresolved comments
- [ ] **Monitor CI checks** — poll autonomously; on failure, diagnose and fix, commit, validate locally, push; wait 180 seconds; repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify user — never force-merge

Ownership metadata:

- Implementer: dougis
- Reviewer(s): AI reviewers (Copilot, Gemini) + repo owner
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all remaining tasks as complete
- [ ] Update `docs/theming.md` if any implementation details changed from design
- [ ] Sync approved spec deltas into `openspec/specs/`
- [ ] Archive the change: move `openspec/changes/dark-greens-theme/` to `openspec/changes/archive/YYYY-MM-DD-dark-greens-theme/` — stage both copy and deletion in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-dark-greens-theme/` exists and `openspec/changes/dark-greens-theme/` is gone
- [ ] Commit and push archive to `main` in one commit
- [ ] Prune merged branch: `git fetch --prune` and `git branch -d feat/dark-greens-theme`
