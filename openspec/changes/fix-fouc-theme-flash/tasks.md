# Tasks

## Preparation

- [x] **Task 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Task 2 — Create and publish working branch:** `git checkout -b fix/fouc-theme-flash` then immediately `git push -u origin fix/fouc-theme-flash`

## Execution

### Task 3 — Write Playwright test for FOUC (TDD first)

Write E2E tests in a new file `src/e2e/fouc-prevention.spec.ts` covering FR-1 through FR-4 before touching any application code. Tests will initially fail — that is expected.

- Verify `<html>` computed background matches dark token before CSS loads (throttled network)
- Verify `<html>` computed background for `light-cool` (set localStorage before navigation)
- Verify `<html>` computed background for `light-warm` (set localStorage before navigation)
- Verify `<link rel="preload" as="style">` is present in page HTML for `appCss`
- Verify fallback to dark when localStorage is unavailable

Run: `npm run test:e2e` — tests must be visible and failing before proceeding to Task 4.

### Task 4 — Add inline critical CSS block to `src/routes/__root.tsx`

Add a `criticalCss` constant and `<style>` element immediately after the existing `themeInitScript` in `RootDocument`:

```
/* ─────────────────────────────────────────────────────────────────
   CRITICAL CSS — Theme flash prevention
   These values MUST stay in sync with the CSS token files.

   When adding a new theme OR changing an existing theme's background:
     1. Add/update the entry in THIS constant (hex values below)
     2. Update src/styles/themes/<theme>.css  (--theme-bg, --theme-fg)
     3. Update src/contexts/ThemeContext.tsx   (THEMES array)
     4. Update docs/theming.md                (maintenance checklist)

   Current theme backgrounds (Tailwind reference → hex):
     dark       slate.900  #0f172a   fg: white      #ffffff
     light-cool slate.100  #f1f5f9   fg: slate.900  #0f172a
     light-warm amber.50   #fffbeb   fg: stone.900  #1c1917
     <slot for 4th theme — add here when that change ships>
   ──────────────────────────────────────────────────────────────── */
html{background:#0f172a;color:#fff}
html.light-cool{background:#f1f5f9;color:#0f172a}
html.light-warm{background:#fffbeb;color:#1c1917}
```

The `<style>` element goes between `themeInitScript` and the React HMR preamble script (dev-only). Reference: `src/routes/__root.tsx`.

### Task 5 — Add `rel="preload"` links to `head()` in `src/routes/__root.tsx`

In the `head()` function's `links` array, add preload entries before the existing stylesheet entries:

```
{ rel: 'preload', as: 'style', href: appCss },
{ rel: 'preload', as: 'style', href: printCss },
```

These must appear before `{ rel: 'stylesheet', href: appCss }` and `{ rel: 'stylesheet', href: printCss }`.

### Task 6 — Create `docs/theming.md`

Create (or update) `docs/theming.md` with a `## Theme Maintenance Checklist` section. Content must include:

**When adding a new theme:**
1. Create `src/styles/themes/<theme-name>.css` with all `--theme-*` tokens
2. Add theme to `THEMES` array in `src/contexts/ThemeContext.tsx` (with `id`, `label`)
3. Add theme entry to `criticalCss` constant in `src/routes/__root.tsx` — background-color and color hex values (source from `--theme-bg` and `--theme-fg` in the new CSS file)
4. Update this checklist with the new theme's hex values

**When changing an existing theme's background color:**
1. Update `src/styles/themes/<theme-name>.css` (`--theme-bg`, `--theme-fg`)
2. Update the corresponding entry in `criticalCss` in `src/routes/__root.tsx`
3. Update the hex reference table in this file

**Current theme background reference table:**
| Theme class | CSS file | `--theme-bg` | Hex | `--theme-fg` | Hex |
|---|---|---|---|---|---|
| `dark` | `dark.css` | `slate.900` | `#0f172a` | `white` | `#ffffff` |
| `light-cool` | `light-cool.css` | `slate.100` | `#f1f5f9` | `slate.900` | `#0f172a` |
| `light-warm` | `light-warm.css` | `amber.50` | `#fffbeb` | `stone.900` | `#1c1917` |
| *(4th theme)* | *(TBD)* | *(TBD)* | *(TBD)* | *(TBD)* | *(TBD)* |

## Validation

- [x] `npm run test:e2e` — all FOUC prevention tests pass (FR-1 through FR-4)
- [x] `npm run test` — no regressions in unit/integration tests
- [x] `npm run build` — production build succeeds
- [ ] Manual browser check: throttle network to Slow 3G, hard-reload, confirm no white flash for each of the three themes
- [x] Inspect HTML source in production build: confirm `<link rel="preload" as="style">` present before `<link rel="stylesheet">`
- [x] Confirm inline `<style>` block is present in HTML source with minified content
- [x] `docs/theming.md` exists and contains maintenance checklist

## Remote push validation

Verification requirements (all must pass before PR or pushing updates):

- **Unit tests** — `npm run test` — all must pass
- **E2E tests** — `npm run test:e2e` — all must pass
- **Build** — `npm run build` — must succeed with no errors
- If **ANY** of the above fail, iterate and fix before pushing

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to `fix/fouc-theme-flash` and push to remote
- [x] Open PR from `fix/fouc-theme-flash` to `main` — title: `fix(theme): prevent flash of unstyled content on first load (#351)`
- [x] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [x] Enable auto-merge: `gh pr merge --auto --merge`
- [ ] **Monitor PR comments** — poll autonomously; address comments, commit fixes, validate locally, push; wait 180 seconds, repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll autonomously; on failure, diagnose and fix, commit, validate locally, push; wait 180 seconds, repeat until all checks pass
- [ ] **Poll for merge** — run `gh pr view --json state` after each iteration; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify user

Ownership metadata:

- Implementer: Doug Hubbard
- Reviewer(s): auto-merge enabled — CodeRabbit + Codacy bot reviews + required human approval
- Required approvals: per repository branch protection rules

Blocking resolution flow:

- CI failure → fix → `npm run test && npm run test:e2e && npm run build` → commit → push → re-run checks
- Security finding → remediate → commit → validate → push → re-scan
- Review comment → address → commit → validate → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify inline critical CSS and preload links are present in main branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec deltas: copy `openspec/changes/fix-fouc-theme-flash/specs/` content to `openspec/specs/` (global spec directory)
- [ ] Archive the change: move `openspec/changes/fix-fouc-theme-flash/` to `openspec/changes/archive/YYYY-MM-DD-fix-fouc-theme-flash/` — stage both new location and deletion of old location in **one single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-fouc-theme-flash/` exists and `openspec/changes/fix-fouc-theme-flash/` is gone
- [ ] Push archive commit to main
- [ ] `git fetch --prune` and `git branch -d fix/fouc-theme-flash`
