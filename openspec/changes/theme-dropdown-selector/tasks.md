# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/theme-dropdown-selector` then immediately `git push -u origin feat/theme-dropdown-selector`

## Execution

### T1 — Add `data-theme` selector to theme CSS files

Add `[data-theme="<id>"]` as a secondary selector to each theme CSS file so that swatch `<span>` elements can inherit that theme's CSS custom properties.

- [x] **T1a** Edit `src/styles/themes/dark.css`: change `html.dark {` to `html.dark, [data-theme="dark"] {`
- [x] **T1b** Edit `src/styles/themes/light-cool.css`: change `html.light-cool {` to `html.light-cool, [data-theme="light-cool"] {`
- [x] **T1c** Edit `src/styles/themes/light-warm.css`: change `html.light-warm {` to `html.light-warm, [data-theme="light-warm"] {`
- [x] **T1d** Verify: `grep -n 'data-theme' src/styles/themes/*.css` shows one match per file

### T2 — Write unit tests for the new dropdown (TDD — write tests first)

Tests live in `src/components/__tests__/Header.test.tsx` alongside existing Header tests.

- [x] **T2a** Test: dropdown renders one option per THEMES entry (label visible)
- [x] **T2b** Test: each option has a swatch `<span>` with the correct `data-theme` attribute
- [x] **T2c** Test: selecting a non-committed option sets `previewId` and mutates `document.documentElement.className`
- [x] **T2d** Test: selecting the already-committed theme does not render OK/Cancel
- [x] **T2e** Test: OK button calls `setTheme` with `previewId` and closes sidebar (`setIsOpen(false)`)
- [x] **T2f** Test: Cancel button reverts `document.documentElement.className` to committed theme and closes sidebar
- [x] **T2g** Test: Escape key while dropdown open with pending preview reverts class and closes dropdown
- [x] **T2h** Test: unmounting Header while preview is active reverts `document.documentElement.className`
- [x] **T2i** Test: trigger button has `aria-expanded="false"` when closed, `aria-expanded="true"` when open
- [x] **T2j** Test: options container has `role="listbox"`; each option has `role="option"` and correct `aria-selected`
- [x] **T2k** Test: ArrowDown/ArrowUp move focus to next/previous option
- [x] **T2l** Test: Enter selects the focused option

Verify tests fail before implementation: `npx vitest run src/components/__tests__/Header.test.tsx`

### T3 — Implement the custom dropdown in `Header.tsx`

- [x] **T3a** Add `previewId: ThemeId | null` local state (initially `null`)
- [x] **T3b** Add `dropdownOpen: boolean` local state for the dropdown panel visibility
- [x] **T3c** Add `useEffect` cleanup: when `previewId !== null` on unmount, revert `document.documentElement.className = theme`
- [x] **T3d** Implement `handleSelect(id: ThemeId)`: set `previewId` (if differs from committed); set `document.documentElement.className = id`; keep sidebar open
- [x] **T3e** Implement `handleOk()`: call `setTheme(previewId)`; set `previewId(null)`; call `setIsOpen(false)`
- [x] **T3f** Implement `handleCancel()`: revert `document.documentElement.className = theme`; set `previewId(null)`; call `setIsOpen(false)`
- [x] **T3g** Implement dropdown trigger button: shows current display theme label + chevron icon; `aria-expanded`
- [x] **T3h** Implement options list: `role="listbox"`, maps THEMES to `role="option"` elements with swatch `<span data-theme={t.id}>` and label
- [x] **T3i** Implement `onKeyDown` handler: ArrowDown/Up moves focus; Enter selects; Escape calls `handleCancel` and closes dropdown
- [x] **T3j** Implement click-outside listener: `useRef` on container + `useEffect` with `mousedown` event; on outside click call `handleCancel` if preview pending, else close dropdown
- [x] **T3k** Render OK/Cancel buttons conditionally: only when `previewId !== null && previewId !== theme`
- [x] **T3l** Remove old button-group (`THEMES.map(...)` flex row) from sidebar footer
- [x] **T3m** Style all elements with `var(--theme-*)` tokens; no hardcoded colors
- [x] **T3n** Run unit tests and confirm all T2 tests pass: `npx vitest run src/components/__tests__/Header.test.tsx`

### T4 — Write and run E2E tests

Tests live in `src/e2e/theme.spec.ts` alongside existing theme E2E tests.

- [x] **T4a** E2E: open sidebar, open dropdown — assert all 3 theme options visible
- [x] **T4b** E2E: select `light-warm` — assert `html` class becomes `light-warm` before OK pressed
- [x] **T4c** E2E: press OK — assert theme committed (class retained after sidebar close, localStorage updated)
- [x] **T4d** E2E: select `light-cool`, press Cancel — assert `html` class reverts to previous theme
- [x] **T4e** E2E: Escape key — assert dropdown closes and class reverts when preview pending
- [x] **T4f** Run: `npm run test:e2e` — all tests pass

## Validation

- [x] `npm run test` — all unit/integration tests pass (target: no regressions)
- [x] `npm run test:e2e` — all E2E tests pass including T4 scenarios
- [x] `npx tsc --noEmit` — no TypeScript errors
- [x] `npm run build` — build succeeds
- [ ] Manual: open sidebar, cycle through all themes, verify live preview and OK/Cancel behavior
- [ ] Manual: verify keyboard nav (Tab to trigger, Enter open, Arrow keys, Enter select, Escape cancel)
- [ ] All tasks marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass
- **E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to `feat/theme-dropdown-selector` and push to remote
- [x] Open PR from `feat/theme-dropdown-selector` to `main` — title: `feat: theme dropdown selector with live preview (#313)`
- [x] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [x] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [x] **Monitor PR comments** — poll autonomously; address comments, commit fixes, follow Remote push validation, push, wait 180 seconds, repeat until no unresolved comments
- [x] **Monitor CI checks** — poll autonomously; diagnose and fix failures, commit fixes, follow Remote push validation, push, wait 180 seconds, repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — never wait for a human to report merge; never force-merge

Ownership metadata:
- Implementer: Claude Code
- Reviewer(s): dougis-org
- Required approvals: 1

Blocking resolution flow:
- CI failure → fix → commit → Remote push validation → push → re-run checks
- Security finding → remediate → commit → Remote push validation → push → re-scan
- Review comment → address → commit → Remote push validation → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all remaining tasks complete (`- [x]`)
- [ ] Update `openspec/specs/` with any approved spec deltas from this change
- [ ] Archive the change: move `openspec/changes/theme-dropdown-selector/` to `openspec/changes/archive/YYYY-MM-DD-theme-dropdown-selector/` — stage both the new location and the deletion of the old location in a **single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-theme-dropdown-selector/` exists and `openspec/changes/theme-dropdown-selector/` is gone
- [ ] Commit and push the archive to `main` in one commit
- [ ] Prune merged local branch: `git fetch --prune` and `git branch -d feat/theme-dropdown-selector`
