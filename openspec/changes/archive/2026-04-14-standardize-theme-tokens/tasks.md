# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/standardize-theme-tokens` then immediately `git push -u origin feat/standardize-theme-tokens`

---

## Execution

### Phase 1: CSS token foundation

- [x] **1.1 — Create `src/styles/base.css`** with `:root` block containing:
  - Structural token defaults (copy from current theme files so light-cool is the base)
  - Status tokens: `--theme-error-{base,fg,bg,border}`, `--theme-success-{base,fg,bg}`, `--theme-warning-{base,fg,bg,border}` (bg/border derived via `color-mix()`)
  - Badge tokens: `--theme-badge-{meal,course,prep,classification}-{base,bg,text,border}` (bg/border derived)
  - Print tokens: `--theme-print-{bg,surface,fg,fg-muted,fg-subtle,border,accent}` (all hardcoded light values)
  - `[data-pdf-export]` block overriding `--theme-print-accent` to `theme(colors.cyan.700)`
  - File header comment documenting import order requirement

- [x] **1.2 — Update `src/styles/themes/dark.css`** — add overrides:
  - Status: `--theme-error-base: theme(colors.red.400)`, `--theme-success-base: theme(colors.green.400)`, `--theme-warning-base: theme(colors.amber.400)`
  - Badges: `--theme-badge-meal-{base,text}`, `--theme-badge-course-{base,text}`, `--theme-badge-prep-{base,text}`, `--theme-badge-classification-{base,text}`

- [x] **1.3 — Update `src/styles/print.css`** — add `@media print` block:
  - Override `--theme-print-fg-muted` to `theme(colors.gray.700)`
  - Override `--theme-print-border` to `theme(colors.gray.300)`

- [x] **1.4 — Update `src/styles.css`** (or equivalent entry point) — add `base.css` import before all theme imports; verify order with comment

- [ ] **1.5 — Verify cascade** — run `npm run dev` and confirm tokens resolve correctly in browser devtools for each theme (no `undefined` or `transparent` status colors)

### Phase 2: Component migration — existing structural tokens (gray/slate)

Replace all `text-gray-*`, `border-gray-*`, `text-slate-*` etc. that map to existing structural tokens. No new tokens needed.

- [x] **2.1 — Migrate `src/components/ui/Breadcrumb.tsx`**
  - `text-gray-400` → `text-[var(--theme-fg-subtle)]`
  - `text-gray-600` → `text-[var(--theme-fg-muted)]`
  - `text-gray-200` → `text-[var(--theme-fg)]` (this was dark-mode-only; token handles it)
  - `hover:text-cyan-400` → `hover:text-[var(--theme-accent)]`

- [x] **2.2 — Migrate `src/components/cookbooks/CookbookStandaloneLayout.tsx`** (print tokens)
  - All `text-gray-900` → `text-[var(--theme-print-fg)]`
  - All `text-gray-600` → `text-[var(--theme-print-fg-muted)]`
  - All `text-gray-500` → `text-[var(--theme-print-fg-subtle)]`
  - All `text-gray-400` → `text-[var(--theme-print-fg-subtle)]`
  - All `border-gray-200` → `border-[color:var(--theme-print-border)]`

### Phase 3: Component migration — status tokens

- [x] **3.1 — Migrate `src/components/ui/FormError.tsx`**
  - `bg-red-500/10` → `bg-[color:var(--theme-error-bg)]`
  - `text-red-400` → `text-[var(--theme-error)]`

- [x] **3.2 — Migrate `src/components/recipes/RecipeForm.tsx`**
  - `text-red-500` → `text-[var(--theme-error)]`
  - `bg-red-500/10` → `bg-[color:var(--theme-error-bg)]`
  - `border-red-500` → `border-[color:var(--theme-error-border)]`

- [x] **3.3 — Migrate `src/routes/recipes/$recipeId.tsx`**
  - Heart icon: `bg-red-500`, `hover:bg-red-600`, `text-red-500` — evaluate whether these are truly status/error or a distinct "favourite/like" semantic; if the latter, document as `/* theme-intentional */` or create a `--theme-like-*` token set

- [x] **3.4 — Migrate `src/routes/cookbooks.$cookbookId.tsx`**
  - `bg-red-900/50`, `text-red-300` → `bg-[color:var(--theme-error-bg)]`, `text-[var(--theme-error)]`

- [x] **3.5 — Migrate `src/components/recipes/StatusIndicator.tsx`**
  - `text-green-500` → `text-[var(--theme-success)]`
  - `text-cyan-500` → `text-[var(--theme-accent)]` (this is accent usage, not a new status)

- [x] **3.6 — Migrate `src/routes/recipes/new.tsx`**
  - `text-cyan-400`, `hover:text-cyan-300` → `text-[var(--theme-accent)]`, `hover:text-[var(--theme-accent-hover)]`

- [x] **3.7 — Migrate `src/components/recipes/ImportPreviewModal.tsx`**
  - `border-amber-500/50` → `border-[color:var(--theme-warning-border)]`
  - `bg-amber-500/10` → `bg-[color:var(--theme-warning-bg)]`
  - `text-amber-200` → `text-[var(--theme-warning)]`

### Phase 4: Component migration — badge tokens

- [x] **4.1 — Migrate `src/components/ui/ClassificationBadge.tsx`**
  - Remove `dark:` variants
  - `bg-cyan-100 text-cyan-700 border border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30`
  - → `bg-[color:var(--theme-badge-classification-bg)] text-[var(--theme-badge-classification-text)] border border-[color:var(--theme-badge-classification-border)]`

- [x] **4.2 — Migrate `src/components/ui/TaxonomyBadge.tsx`**
  - Remove all `dark:` variants from meal/course/prep color maps
  - Replace each category's hardcoded triple with `--theme-badge-{meal,course,prep}-{bg,text,border}` tokens

### Phase 5: Remaining files

- [x] **5.1 — Audit remaining 18 files** from issue #316 list not covered by phases 2–4:
  - `src/routes/auth/reset-password.tsx`
  - `src/routes/import/index.tsx`
  - `src/routes/cookbooks/index.tsx`
  - `src/routes/categories.$categoryId.tsx`
  - `src/routes/cookbooks.$cookbookId_.toc.tsx`
  - `src/routes/sources.$sourceId.tsx`
  - `src/routes/cookbooks.$cookbookId_.print.tsx`
  - `src/routes/recipes/$recipeId_.edit.tsx`
  - `src/routes/categories/index.tsx`
  - `src/components/cookbooks/CookbookFields.tsx`
  - `src/components/cookbooks/CookbookRecipeCard.tsx`
  - `src/components/ui/FormInput.tsx`
  - `src/components/ui/MultiSelectDropdown.tsx`
  - `src/components/recipes/DeleteConfirmModal.tsx`
  - `src/components/recipes/ImportDropzone.tsx`
  - `src/components/recipes/RecipeCard.tsx`
  - For each: replace hardcoded classes with appropriate token; document any intentional exceptions with `/* theme-intentional */`

---

## Validation

- [x] **Grep check** — confirm zero hardcoded color matches: `grep -rE "(text|bg|border)-(red|blue|cyan|amber|orange|green|gray|slate|zinc|neutral|stone|violet|emerald)-[0-9]+" src/ --include="*.tsx"` — any remaining matches must have `/* theme-intentional */` justification
- [x] **TypeScript check** — `npx tsc --noEmit` — zero errors
- [x] **Unit/integration tests** — `npm run test` — all pass
- [x] **E2E tests** — `npm run test:e2e` — all pass, including:
  - Dark theme screenshot of a page with status states (error form, warning modal)
  - Dark theme screenshot of `CookbookStandaloneLayout` (assert no dark values)
  - All-theme screenshot of badge components
- [x] **Build check** — `npm run build` — succeeds with no errors
- [x] **Visual check** — run `npm run dev`, manually verify dark / light-cool / light-warm for:
  - Form error state
  - Import preview warning
  - Taxonomy badges (meal / course / prep)
  - Classification badge
  - Breadcrumb navigation
  - Cookbook print/TOC layout in dark theme
- [x] **PDF export token check** — in devtools: apply `document.documentElement.setAttribute('data-pdf-export', 'true')`, inspect `--theme-print-accent` — confirms `cyan-700`
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **Integration tests** — `npm run test` — all tests must pass
- **E2E tests** — `npm run test:e2e` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure before pushing

---

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to `feat/standardize-theme-tokens` and push to remote
- [x] Open PR from `feat/standardize-theme-tokens` to `main` — title: `refactor: standardize theme tokens with semantic CSS custom properties (closes #316)`
- [x] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [x] Enable auto-merge: `gh pr merge --auto --merge`
- [x] **Monitor PR comments** — poll autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation], push, wait 180 seconds, repeat
- [x] **Monitor CI checks** — poll autonomously; when any check fails, diagnose and fix, commit fixes, follow all steps in [Remote push validation], push, wait 180 seconds, repeat
- [x] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — never force-merge

Ownership metadata:
- Implementer: Doug Hubbard
- Reviewer(s): automated (Codacy, Snyk) + human approval
- Required approvals: 1

Blocking resolution flow:
- CI failure → fix → commit → validate locally (all steps in Remote push validation) → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

---

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Sync approved spec deltas into `openspec/specs/` (global spec) if applicable
- [ ] Archive the change: move `openspec/changes/standardize-theme-tokens/` to `openspec/changes/archive/YYYY-MM-DD-standardize-theme-tokens/` — **stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-standardize-theme-tokens/` exists and `openspec/changes/standardize-theme-tokens/` is gone
- [ ] Commit and push the archive commit to `main`
- [ ] Prune merged branch: `git fetch --prune` and `git branch -d feat/standardize-theme-tokens`
