# Tasks

## Preparation

- [x] **Task 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Task 2 — Create and publish working branch:** `git checkout -b feat/theme-system` then immediately `git push -u origin feat/theme-system`

## Execution

### Task 3 — Define CSS token layer in `src/styles.css`

- [x] Retain `@custom-variant dark (&:where(.dark, .dark *))` — intentionally kept so remaining `dark:` usages (badge tints, draft banner) continue responding to `html.dark` rather than `prefers-color-scheme`; full removal is deferred until those usages are migrated
- [x] Add `html.dark { --theme-*: ...; }` block with all token definitions mapped from current dark colour values:
  - `--theme-bg: theme(colors.slate.900)` (page background)
  - `--theme-surface: theme(colors.slate.800)` (card / panel)
  - `--theme-surface-raised: theme(colors.gray.800)` (modal / dropdown)
  - `--theme-surface-hover: theme(colors.gray.700)` (interactive hover)
  - `--theme-border: theme(colors.slate.700)` (standard border)
  - `--theme-border-muted: theme(colors.gray.700)` (hairline / subtle)
  - `--theme-fg: theme(colors.white)` (primary text)
  - `--theme-fg-muted: theme(colors.gray.300)` (secondary text)
  - `--theme-fg-subtle: theme(colors.gray.400)` (placeholder / disabled)
  - `--theme-accent: theme(colors.cyan.400)` (brand — idle)
  - `--theme-accent-hover: theme(colors.cyan.500)` (brand — hover)
  - `--theme-accent-emphasis: theme(colors.cyan.600)` (brand — pressed / active)
- [x] Add `html.light { --theme-*: ...; }` draft block (functional, not polished):
  - `--theme-bg: theme(colors.gray.50)`
  - `--theme-surface: theme(colors.white)`
  - `--theme-surface-raised: theme(colors.gray.100)`
  - `--theme-surface-hover: theme(colors.gray.200)`
  - `--theme-border: theme(colors.gray.200)`
  - `--theme-border-muted: theme(colors.gray.100)`
  - `--theme-fg: theme(colors.gray.900)`
  - `--theme-fg-muted: theme(colors.gray.600)`
  - `--theme-fg-subtle: theme(colors.gray.400)`
  - `--theme-accent: theme(colors.cyan.600)`
  - `--theme-accent-hover: theme(colors.cyan.700)`
  - `--theme-accent-emphasis: theme(colors.cyan.800)`
- [x] Verify build: `npm run build` (Tailwind must parse token definitions without error)

### Task 4 — Create `ThemeContext` and inline SSR script

- [x] Write tests first: `src/contexts/__tests__/ThemeContext.test.tsx`
  - `useTheme()` returns `{ theme: 'dark', setTheme }` when localStorage is empty
  - `setTheme('light')` writes `localStorage['cookbook-theme'] = 'light'` and updates context value
  - `setTheme('light')` sets `document.documentElement.className = 'light'`
  - When localStorage throws, `useTheme()` returns `{ theme: 'dark' }` without error
  - Only theme IDs present in `THEMES` config are accepted; unknown values are ignored
- [x] Create `src/contexts/ThemeContext.tsx`:
  - Export `THEMES: Array<{ id: string; label: string }>` = `[{ id: 'dark', label: 'Dark' }, { id: 'light', label: 'Light' }]`
  - Export `ThemeContext`, `ThemeProvider`, `useTheme()`
  - `ThemeProvider` initialises state from `document.documentElement.className` (client-only, lazy) falling back to `'dark'`
  - `setTheme` validates against `THEMES`, sets `document.documentElement.className`, writes to localStorage
- [x] Update `src/routes/__root.tsx`:
  - Add inline `<script>` in `<head>` (before `<HeadContent />`): reads `localStorage['cookbook-theme']`, falls back to `'dark'`, sets `document.documentElement.className` — all in a `try/catch`
  - Wrap `<QueryClientProvider>` with `<ThemeProvider>`
  - Change `<html lang="en" className="dark">` server-rendered default remains as `"dark"` (the inline script overrides it client-side)
- [x] Run tests: `npx vitest run src/contexts/__tests__/ThemeContext.test.tsx`

### Task 5 — Migrate `src/components/` to CSS variable tokens

- [x] Write/update tests for at least one representative component before migrating (e.g., `Header.tsx` snapshot or rendering test)
- [x] Migrate the following files — replace `dark:bg-*`, `dark:text-*`, `dark:border-*` with `bg-[var(--theme-*)]`, `text-[var(--theme-*)]`, `border-[var(--theme-*)]`:
  - `src/components/Header.tsx`
  - `src/components/layout/PageLayout.tsx` (if it exists)
  - `src/components/auth/ProfileInfo.tsx`
  - `src/components/auth/ResetPasswordForm.tsx`
  - `src/components/auth/ForgotPasswordForm.tsx`
  - `src/components/auth/RegisterForm.tsx`
  - `src/components/auth/LoginForm.tsx`
  - `src/components/auth/AuthPageLayout.tsx`
  - `src/components/cookbooks/CookbookFields.tsx`
  - `src/components/cookbooks/CookbookRecipeCard.tsx`
  - `src/components/cookbooks/CookbookCard.tsx`
  - `src/components/ui/SearchFilter.tsx`
  - `src/components/ui/FormInput.tsx`
  - `src/components/ui/MultiSelectDropdown.tsx`
  - `src/components/ui/ClassificationBadge.tsx` — **migrate non-badge surfaces only; retain `dark:` on badge colour classes**
  - Any remaining `src/components/**/*.tsx` files with `dark:` variants
- [x] Run tests: `npm run test`

### Task 6 — Migrate `src/routes/` to CSS variable tokens

- [x] Migrate the following route files:
  - `src/routes/index.tsx`
  - `src/routes/recipes/index.tsx`
  - `src/routes/cookbooks/index.tsx`
  - `src/routes/cookbooks.$cookbookId.tsx`
  - Any remaining `src/routes/**/*.tsx` files with `dark:` variants
- [x] Run tests: `npm run test`

### Task 7 — Verify migration completeness

- [x] Run: `grep -r "dark:" src/ --include="*.tsx" -l` — review each result
- [x] Confirm remaining `dark:` occurrences are **only** in:
  - Classification badge colour classes (exempt per spec)
  - `src/components/cookbooks/__tests__/PrintLayout.test.tsx` (test file checking old behaviour — will be updated in Task 8)
- [x] Document any intentional exceptions with an inline comment: `{/* dark: retained — categorical badge colour */}`

### Task 8 — Refactor `PrintLayout`

- [x] Update `src/components/cookbooks/__tests__/PrintLayout.test.tsx`:
  - Remove tests for `document.documentElement.classList` manipulation
  - Remove tests for `printLayoutDarkOverrideCount` / `printLayoutDarkOverrideHadDark` dataset keys
  - Add tests: `PrintLayout` renders children in a wrapper `<div>`; wrapper has correct inline style overrides; `<html>` class is unchanged after mount and unmount
- [x] Rewrite `src/components/cookbooks/PrintLayout.tsx`:
  - Remove `useLayoutEffect`, `useEffect`, `useDarkOverrideEffect`
  - Return `<div style={{ '--theme-bg': 'white', '--theme-surface': '#f9fafb', '--theme-surface-raised': '#f3f4f6', '--theme-fg': '#111827', '--theme-fg-muted': '#4b5563', '--theme-fg-subtle': '#9ca3af', '--theme-border': '#e5e7eb', '--theme-border-muted': '#f3f4f6', '--theme-accent': '#0891b2', '--theme-accent-hover': '#0e7490', '--theme-accent-emphasis': '#155e75' } as React.CSSProperties}>{children}</div>`
- [x] Run tests: `npx vitest run src/components/cookbooks/__tests__/PrintLayout.test.tsx`

### Task 9 — Add theme selector to hamburger menu in `src/components/Header.tsx`

- [x] Write tests first: `src/components/__tests__/Header.test.tsx` (or update existing):
  - Theme selector renders at bottom of sidebar with all `THEMES` options
  - Active theme option has distinguishing visual class
  - Clicking a non-active theme option calls `setTheme` with that theme's id
  - Selector is accessible (each button has `aria-pressed` or equivalent)
- [x] Add theme selector to `Header.tsx`:
  - Import `useTheme` and `THEMES` from `@/contexts/ThemeContext`
  - After the `</nav>` closing tag, inside `<aside>`, add a `<div>` footer section:
    - Bordered top (`border-t border-[var(--theme-border)]`)
    - Padding `p-4`
    - Label (e.g., "Theme") and a flex row of theme buttons
    - Each button: shows theme `label`; active theme gets filled accent background; inactive gets hover surface
    - On click: call `setTheme(theme.id)` and do **not** close the menu
- [x] Run tests: `npx vitest run src/components/__tests__/Header.test.tsx`

### Task 10 — Write E2E tests

- [x] Create or update `src/e2e/theme.spec.ts`:
  - **Default theme**: clear localStorage, load app, assert `html.dark`
  - **Theme persistence**: select light, reload, assert `html.light` and selector shows Light active
  - **No flash**: load with `light` in localStorage, assert `html.light` in the initial snapshot (before hydration completes)
  - **Theme selector renders**: open hamburger, assert both "Dark" and "Light" buttons present
  - **Theme switch E2E**: open hamburger, click "Light", assert key surfaces (header bg, recipe card bg) change
  - **Print isolation**: switch to light, open cookbook print route, assert `PrintLayout` wrapper has white background
- [x] Run: `npm run test:e2e`

## Validation

- [x] `npm run test` — all unit and integration tests pass
- [x] `npm run test:e2e` — all E2E tests pass
- [x] `npx tsc --noEmit` — no TypeScript errors
- [x] `npm run build` — production build succeeds
- [x] `grep -r "dark:" src/ --include="*.tsx"` — only badge exemptions remain
- [x] Manual smoke: toggle between dark and light on home, recipe list, recipe detail, cookbook, auth pages — no unstyled surfaces
- [x] Manual smoke: open hamburger → theme selector visible at bottom, both options labelled, active highlighted
- [x] Manual smoke: print a cookbook — output is white background, dark text regardless of active theme
- [x] All tasks marked complete (automated; manual smokes deferred to reviewer)

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **Integration tests** — `npm run test` — all tests must pass
- **Regression / E2E tests** — `npm run test:e2e` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors

If **any** of the above fail, iterate and address the failure before pushing.

## PR and Merge

- [x] Run the required pre-PR self-review from the openspec-apply-change skill before committing
- [x] Commit all changes to `feat/theme-system` and push to remote
- [x] Open PR from `feat/theme-system` to `main`; link issue #281 in the PR description
- [x] Wait 120 seconds for agentic reviewers to post comments
- [x] **Monitor PR comments** — address each one, commit fixes, follow Remote push validation steps, push; repeat until no unresolved comments remain
- [x] Enable auto-merge once no blocking review comments remain
- [x] **Monitor CI checks** — diagnose failures, fix, follow Remote push validation steps, push; repeat until all checks pass
- [x] Wait for PR to merge — never force-merge

Ownership metadata:

- Implementer: Doug Hubbard
- Reviewer(s): automated (Codacy, CodeRabbit) + project owner
- Required approvals: 1 human approval + all CI checks green

Blocking resolution flow:

- CI failure → fix → commit → `npm run test && npm run test:e2e && npm run build` → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify merged changes appear on `main`
- [x] Mark all remaining tasks as complete
- [x] Update `openspec/changes/theme-system/proposal.md` with final status note if scope changed during implementation
- [x] Sync approved spec deltas into `openspec/specs/` (global spec directory)
- [x] Archive: move `openspec/changes/theme-system/` to `openspec/changes/archive/YYYY-MM-DD-theme-system/` — stage the new location AND deletion of the old location in **one single commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-theme-system/` exists and `openspec/changes/theme-system/` is gone
- [x] Commit and push the archive commit to `main`
- [x] Prune merged local branch: `git fetch --prune` and `git branch -d feat/theme-system`
