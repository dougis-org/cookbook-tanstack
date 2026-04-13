# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/light-cool-theme` then immediately `git push -u origin feat/light-cool-theme`

## Execution

### Task 3 — Create per-file theme architecture

- [x] Create directory `src/styles/themes/`
- [x] Create `src/styles/themes/dark.css` — extract the `html.dark { --theme-* }` block from `src/styles.css` verbatim (no value changes), and add shadow tokens:
  - `--theme-shadow-sm: 0 0 0 0 transparent`
  - `--theme-shadow-md: 0 0 0 0 transparent`
- [x] Create `src/styles/themes/light-cool.css` — define `html.light-cool { --theme-* }` with the full color system:
  - `--theme-bg: theme(colors.slate.100)`
  - `--theme-surface: theme(colors.white)`
  - `--theme-surface-raised: theme(colors.slate.50)`
  - `--theme-surface-hover: theme(colors.blue.50)`
  - `--theme-border: theme(colors.slate.200)`
  - `--theme-border-muted: theme(colors.slate.100)`
  - `--theme-fg: theme(colors.slate.900)`
  - `--theme-fg-muted: theme(colors.slate.600)`
  - `--theme-fg-subtle: theme(colors.slate.500)`
  - `--theme-accent: theme(colors.blue.600)`
  - `--theme-accent-hover: theme(colors.blue.700)`
  - `--theme-accent-emphasis: theme(colors.blue.800)`
  - `--theme-shadow-sm: 0 1px 3px 0 rgb(15 23 42 / 0.08), 0 1px 2px -1px rgb(15 23 42 / 0.08)`
  - `--theme-shadow-md: 0 4px 6px -1px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.08)`
- [x] Verification: `npm run build` — Tailwind must parse the theme files without error

### Task 4 — Update `src/styles.css` to import theme files

- [x] Remove the `html.dark { }` block from `src/styles.css`
- [x] Remove the `html.light { }` block from `src/styles.css`
- [x] Add at the top (after `@import "tailwindcss";`):
  ```css
  @import "./styles/themes/dark.css";
  @import "./styles/themes/light-cool.css";
  ```
- [x] Retain `@custom-variant dark (&:where(.dark, .dark *));` and base `body`/`code` styles
- [x] Verification: `npm run build` passes; `npm run dev` shows dark theme working correctly

### Task 5 — Update `ThemeContext` for `light-cool` id

- [x] **Write tests first:** update `src/contexts/__tests__/ThemeContext.test.tsx`:
  - `THEMES` contains `{ id: 'light-cool', label: 'Light (cool)' }` and not `{ id: 'light', ... }`
  - `setTheme('light-cool')` sets `document.documentElement.className = 'light-cool'` and writes localStorage
  - `setTheme('light')` is rejected (not a valid theme id)
- [x] Update `src/contexts/ThemeContext.tsx`:
  - Replace `{ id: 'light', label: 'Light' }` with `{ id: 'light-cool', label: 'Light (cool)' }`
- [x] Run tests: `npx vitest run src/contexts/__tests__/ThemeContext.test.tsx`

### Task 6 — Update inline script in `__root.tsx`

- [x] In `src/routes/__root.tsx`, update the inline `<script>` that reads localStorage:
  - Add migration shim: if stored value is `'light'`, rewrite localStorage to `'light-cool'`
  - Update allowlist from `['dark', 'light']` to `['dark', 'light-cool']`
  - Keep `try/catch` wrapper; fallback to `'dark'` for unknown/unavailable values
- [x] Verification: `npx vitest run` — all ThemeContext tests pass; build succeeds

### Task 7 — Migrate filter components

Files: `src/routes/recipes/index.tsx` (`ActiveBadge`, `FilterToggle` inline), `src/components/recipes/filters/FilterRow1Quick.tsx`

- [x] **Write/update E2E test** in `src/e2e/theme.spec.ts`: assert active filter chip text is readable (blue, not cyan) in light-cool
- [x] `FilterToggle` inactive state: replace `bg-slate-800 border-slate-700 text-gray-400` with `bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-fg-muted)] hover:border-[var(--theme-accent)]`
- [x] `FilterToggle` active state: replace `bg-cyan-500/20 border-cyan-500 text-cyan-300` with `bg-[var(--theme-accent)]/10 border-[var(--theme-accent)] text-[var(--theme-accent)]`
- [x] `ActiveBadge`: replace `bg-cyan-500/20 border-cyan-500/50 text-cyan-300` with `bg-[var(--theme-accent)]/10 border-[var(--theme-accent)]/50 text-[var(--theme-accent)]`; update hover button to match
- [x] Audit `src/components/recipes/filters/FilterDropdowns.tsx` — migrate any hardcoded dark colours found
- [x] Run: `npx vitest run` and `npx playwright test src/e2e/theme.spec.ts`

### Task 8 — Migrate modal and overlay components

Files: `src/components/ui/ConfirmDialog.tsx`, `src/components/recipes/DeleteConfirmModal.tsx`, `src/components/recipes/ImportPreviewModal.tsx`

- [x] **Write E2E test**: open a confirm dialog in light-cool; assert panel background is not dark
- [x] `ConfirmDialog`: replace `bg-slate-800` with `bg-[var(--theme-surface-raised)]`, `text-white` with `text-[var(--theme-fg)]`, `bg-gray-600 hover:bg-gray-500 text-white` (cancel button) with token equivalents; add `shadow-[var(--theme-shadow-md)]`
- [x] `DeleteConfirmModal`: replace `bg-slate-800 border border-slate-700` with `bg-[var(--theme-surface-raised)] border-[var(--theme-border)]`, `text-white` with `text-[var(--theme-fg)]`, `text-gray-300` with `text-[var(--theme-fg-muted)]`; add `shadow-[var(--theme-shadow-md)]`; keep `bg-red-600` on destructive button (exempt — semantic status colour)
- [x] `ImportPreviewModal`: replace `bg-slate-900 border-slate-700` with token equivalents, `text-white` / `text-gray-400` with `--theme-fg` / `--theme-fg-muted`; add `shadow-[var(--theme-shadow-md)]`
- [x] Run: `npx vitest run` and `npx playwright test src/e2e/theme.spec.ts`

### Task 9 — Migrate cookbook components

Files: `src/components/cookbooks/CookbookCard.tsx`, `src/components/cookbooks/CookbookRecipeCard.tsx`, `src/components/cookbooks/CookbookFields.tsx`

- [x] `CookbookCard`: replace `bg-slate-700 text-gray-300` (Private badge) with `bg-[var(--theme-surface-hover)] text-[var(--theme-fg-muted)]`; replace `text-gray-400` usages with `--theme-fg-muted` or `--theme-fg-subtle`; add `shadow-[var(--theme-shadow-sm)]` to card element
- [x] `CookbookRecipeCard`: replace `text-gray-500`, `text-gray-400`, `text-gray-300` with `--theme-fg-muted` / `--theme-fg-subtle`; replace drag handle `text-gray-500 hover:text-gray-300` with token equivalents
- [x] `CookbookFields`: replace `bg-gray-700 border-gray-600` (checkbox) with `bg-[var(--theme-surface-raised)] border-[var(--theme-border)]`; `text-cyan-500 focus:ring-cyan-500` → `text-[var(--theme-accent)]`
- [x] Run: `npx vitest run`

### Task 10 — Migrate auth components

Files: `src/components/auth/LoginForm.tsx`, `src/components/auth/RegisterForm.tsx`, `src/components/auth/ForgotPasswordForm.tsx`, `src/components/auth/ResetPasswordForm.tsx`, `src/components/auth/AuthPageLayout.tsx`, `src/components/auth/ProfileInfo.tsx`

- [x] All `text-cyan-400 hover:text-cyan-300` links → `text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)]`
- [x] `LoginForm` demo credential banner: `border-cyan-500/40 bg-cyan-500/10 text-cyan-300` → `border-[var(--theme-accent)]/40 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)]`
- [x] `LoginForm` checkbox: `text-cyan-500 focus:ring-cyan-500` → `text-[var(--theme-accent)]`
- [x] `AuthPageLayout` icon: `text-cyan-400` → `text-[var(--theme-accent)]`
- [x] `ProfileInfo` icons: `text-cyan-400` → `text-[var(--theme-accent)]`
- [x] Run: `npx vitest run`

### Task 11 — Migrate recipe components

Files: `src/components/recipes/RecipeForm.tsx`, `src/components/recipes/RecipeDetail.tsx`, `src/components/recipes/ImportDropzone.tsx`, `src/components/recipes/StatusIndicator.tsx`

- [x] `RecipeForm` CTA buttons: `bg-cyan-500 hover:bg-cyan-600 text-white` → `bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white` (white text on accent passes contrast)
- [x] `RecipeForm` checkbox: `text-cyan-500 bg-[var(--theme-surface-hover)]` → `text-[var(--theme-accent)]`
- [x] `RecipeForm` draft banner: **retain** `dark:text-cyan-300` — documented carve-out from #281
- [x] `RecipeDetail` step number circles: `bg-cyan-500 text-white` → `bg-[var(--theme-accent)] text-white`
- [x] `RecipeDetail` source link: `text-cyan-400 hover:text-cyan-300` → `text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)]`
- [x] `RecipeDetail` quantity controls: `border-slate-600` → `border-[var(--theme-border)]`
- [x] `RecipeDetail` stat value: `text-cyan-400` → `text-[var(--theme-accent)]`
- [x] `ImportDropzone`: `border-slate-600 hover:border-cyan-500` → `border-[var(--theme-border)] hover:border-[var(--theme-accent)]`; `text-white` → `text-[var(--theme-fg)]`; `text-gray-400` → `text-[var(--theme-fg-muted)]`
- [x] `StatusIndicator`: **retain** `green-600/dark:green-400` and `red-600/dark:red-400` — semantic status colours, exempt
- [x] Run: `npx vitest run`

### Task 12 — Fix PageLayout, home page hero, and Header

Files: `src/components/layout/PageLayout.tsx`, `src/routes/index.tsx`, `src/components/Header.tsx`

- [x] `PageLayout`: replace gradient `bg-gradient-to-b from-[var(--theme-bg)] via-[var(--theme-surface)] to-[var(--theme-bg)]` with flat `bg-[var(--theme-bg)]` — visual depth provided by card shadows
- [x] Home page `src/routes/index.tsx`:
  - Hero `<h1>`: remove hardcoded `text-white`; keep gradient span with clip; ensure gradient uses accent range colours that work in both themes (`from-[var(--theme-accent)] to-blue-400` or similar)
  - Feature cards: add `shadow-[var(--theme-shadow-sm)]` to card element
  - CTA buttons: `bg-cyan-500 hover:bg-cyan-600` → `bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)]`
- [x] `Header`: sign-in button `bg-cyan-600 hover:bg-cyan-700 text-white` → `bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white` (white on blue-600 passes contrast)
- [x] Verify: start dev server, manually confirm home page features section cards are visually distinct from page background in light-cool; confirm no regression in dark

### Task 13 — Add shadow adoption to remaining cards

Files: `src/components/recipes/RecipeCard.tsx`, `src/components/cookbooks/CookbookCard.tsx` (if not done in T9)

- [x] `RecipeCard`: add `shadow-[var(--theme-shadow-sm)]` to the card container
- [x] Verify: recipe list page in light-cool shows cards floating above `slate-100` background

### Task 14 — Post-migration audit grep

- [x] Run grep to confirm no unexpected hardcoded dark colours remain in non-exempt files:
  ```bash
  grep -rn "\bslate-[78]\|bg-gray-[678]\|text-white\b\|text-cyan-[123]\b" \
    src/components src/routes \
    --include="*.tsx" \
    | grep -v "__tests__\|\.test\.\|\.spec\.\|// \|dark:\|TaxonomyBadge\|ClassificationBadge\|MultiSelectDropdown\|StatusIndicator\|RecipeForm.*draft"
  ```
- [x] Any matches must be assessed: migrate to token or add explicit exempt comment
- [x] Run: `npm run build` — TypeScript strict mode, `noUnusedLocals`, `noUnusedParameters` must all pass

## Validation

- [x] `npm run test` — all unit and integration tests pass
- [x] `npm run test:e2e` — full E2E suite passes (dark theme tests unaffected; new light-cool tests pass)
- [x] `npx tsc --noEmit` — zero type errors
- [x] `npm run build` — production build succeeds
- [ ] Manual visual review: start dev server, switch to Light (cool), check each major page:
  - Home page — hero visible, feature cards float with shadow, CTAs in blue
  - Recipes page — filter chips readable, active chip in blue accent
  - Recipe detail — stat values, step circles, source link all visible
  - Recipe form — save button visible, draft banner readable (cyan tint acceptable)
  - Cookbook list and detail — Private badge readable, recipe list readable
  - Login / register / forgot password — links in blue accent
  - Confirm dialog — panel not dark
- [ ] Manual dark theme regression check — no visual change from pre-PR state
- [x] Post-migration audit grep (Task 14) returns zero unexpected matches
- [ ] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **E2E tests** — `npm run test:e2e` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [ ] Commit all changes to `feat/light-cool-theme` and push to remote
- [ ] Open PR from `feat/light-cool-theme` to `main` — title: `feat: Light (cool) theme — comprehensive redesign (#302)`
- [ ] Wait 120 seconds for agentic reviewers to post comments
- [ ] **Monitor PR comments** — address each one, commit fixes, validate locally, push; repeat until no unresolved comments remain
- [ ] Enable auto-merge once no blocking review comments remain
- [ ] **Monitor CI checks** — diagnose failures, fix, validate locally, push; repeat until all checks pass
- [ ] Wait for PR to merge — **never force-merge**

Ownership metadata:
- Implementer: agent (Claude Code)
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:
- CI failure → fix → `npm run test && npm run build` → push → re-run checks
- Security finding → remediate → push → re-scan
- Review comment → address → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on main branch
- [ ] Mark all remaining tasks as complete
- [ ] Sync approved spec deltas to `openspec/specs/` — update theme persistence, component migration, and color system specs in the global spec directory
- [ ] Archive: move `openspec/changes/light-cool-theme/` to `openspec/changes/archive/2026-04-12-light-cool-theme/` **as a single atomic commit** (stage both copy and deletion together — never split)
- [ ] Confirm `openspec/changes/archive/2026-04-12-light-cool-theme/` exists and `openspec/changes/light-cool-theme/` is gone
- [ ] Push archive commit to main
- [ ] Prune merged local branch: `git fetch --prune` and `git branch -d feat/light-cool-theme`
