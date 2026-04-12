---
name: tests
description: Tests for the light-cool-theme change
---

# Tests

## Overview

This document outlines the tests for the `light-cool-theme` change. All work follows a strict TDD (Test-Driven Development) process: write a failing test, implement to make it pass, refactor.

## Testing Steps

For each task in `tasks.md`:
1. **Write a failing test** before writing any implementation code.
2. **Write the simplest code** to make the test pass.
3. **Refactor** while keeping the test green.

---

## Test Cases

### T5 — ThemeContext `light-cool` id (Unit)

- [ ] `THEMES` array contains `{ id: 'light-cool', label: 'Light (cool)' }` and does NOT contain `{ id: 'light', ... }`
- [ ] `setTheme('light-cool')` sets `document.documentElement.className = 'light-cool'`
- [ ] `setTheme('light-cool')` writes `localStorage['cookbook-theme'] = 'light-cool'`
- [ ] `setTheme('light')` is rejected — no class or localStorage change occurs
- [ ] `useTheme()` returns `{ theme: 'dark' }` when localStorage is empty (default unchanged)
- [ ] `useTheme()` returns `{ theme: 'light-cool' }` when localStorage contains `'light-cool'` after mount

  **Map:** `specs/theme-id-and-persistence.md` → MODIFIED Theme id / MODIFIED inline script allowlist
  **File:** `src/contexts/__tests__/ThemeContext.test.tsx`

### T6 — Inline script migration shim (E2E)

- [ ] Loading the page with `localStorage['cookbook-theme'] = 'light'` results in `html.light-cool` before hydration and rewrites localStorage to `'light-cool'`
- [ ] Loading the page with `localStorage['cookbook-theme'] = 'light-cool'` results in `html.light-cool` before hydration (idempotent — no unnecessary rewrite)
- [ ] Loading the page with `localStorage['cookbook-theme'] = 'solarized'` results in `html.dark` fallback
- [ ] Loading the page when localStorage is unavailable (mocked to throw) results in `html.dark` with no unhandled error

  **Map:** `specs/theme-id-and-persistence.md` → MODIFIED migration shim / MODIFIED inline script allowlist
  **File:** `src/e2e/theme.spec.ts`

### T3+T4 — Theme file architecture (Build + E2E)

- [ ] `npm run build` completes without error after `@import` restructure
- [ ] `src/styles/themes/dark.css` exists and contains `html.dark { --theme-* }` block
- [ ] `src/styles/themes/light-cool.css` exists and contains `html.light-cool { --theme-* }` block
- [ ] `src/styles.css` no longer contains `html.dark` or `html.light` blocks
- [ ] Existing dark theme E2E tests all pass without modification (regression)
- [ ] `var(--theme-shadow-sm)` resolves to a non-empty box-shadow string in light-cool (E2E: computed style check)
- [ ] `var(--theme-shadow-sm)` resolves to `0px 0px` (transparent) in dark

  **Map:** `specs/theme-file-architecture.md` → ADDED Per-file theme architecture / ADDED Shadow tokens
  **Files:** `src/styles/themes/dark.css`, `src/styles/themes/light-cool.css`, `src/e2e/theme.spec.ts`

### T7 — Filter components (E2E)

- [ ] With `light-cool` active: inactive filter chip (`FilterToggle`) has no hardcoded dark background — computed background matches `--theme-surface`
- [ ] With `light-cool` active: active filter chip text colour matches `--theme-accent` (blue, not cyan-300)
- [ ] With `light-cool` active: `ActiveBadge` label text colour matches `--theme-accent`
- [ ] With `dark` active: all filter components render identically to pre-PR state (regression)

  **Map:** `specs/component-token-migration.md` → MODIFIED Filter chips
  **File:** `src/e2e/theme.spec.ts`

### T8 — Modal and overlay components (E2E)

- [ ] With `light-cool` active: ConfirmDialog panel background is not dark (computed background is not `rgb(30, 41, 59)` or similar slate-800)
- [ ] With `light-cool` active: DeleteConfirmModal title and body text are visible (not white on white)
- [ ] With `light-cool` active: DeleteConfirmModal destructive button remains `bg-red-600` (semantic exempt)
- [ ] With `light-cool` active: ImportPreviewModal panel is not dark; metadata text is readable
- [ ] With `dark` active: all modal components render identically to pre-PR state (regression)

  **Map:** `specs/component-token-migration.md` → MODIFIED Modals and overlays
  **File:** `src/e2e/theme.spec.ts` or dedicated `src/e2e/light-cool-theme.spec.ts`

### T9 — Cookbook components (Vitest unit + E2E visual)

- [ ] With `light-cool` active: CookbookCard "Private" badge is visible (background not dark slate)
- [ ] With `light-cool` active: CookbookRecipeCard numbering and metadata text are readable
- [ ] With `light-cool` active: CookbookFields checkbox uses accent colour, not hardcoded cyan
- [ ] With `dark` active: cookbook components render identically to pre-PR state (regression)

  **Map:** `specs/component-token-migration.md` → MODIFIED CookbookCard, CookbookRecipeCard, CookbookFields
  **File:** `src/e2e/light-cool-theme.spec.ts`

### T10 — Auth form components (E2E)

- [ ] With `light-cool` active: "Forgot password?" link in LoginForm has blue colour, not cyan-400
- [ ] With `light-cool` active: "Create one" link in LoginForm has blue colour
- [ ] With `light-cool` active: all auth form links use `--theme-accent` (blue-600 family)
- [ ] With `light-cool` active: demo credential banner in LoginForm uses accent tint (blue, not cyan)
- [ ] With `dark` active: auth forms render identically to pre-PR state (regression)

  **Map:** `specs/component-token-migration.md` → MODIFIED Auth form link colours
  **File:** `src/e2e/light-cool-theme.spec.ts`

### T11 — Recipe components (E2E)

- [ ] With `light-cool` active: RecipeForm save/publish button is blue (`--theme-accent`)
- [ ] With `light-cool` active: RecipeDetail step number circles are blue
- [ ] With `light-cool` active: RecipeDetail stat values are blue accent
- [ ] With `light-cool` active: ImportDropzone border and text are readable
- [ ] RecipeForm draft banner retains `dark:text-cyan-300` — renders correctly in both themes
- [ ] StatusIndicator green/red colours are unchanged in both themes (exempt)
- [ ] With `dark` active: recipe components render identically to pre-PR state (regression)

  **Map:** `specs/component-token-migration.md` → MODIFIED RecipeDetail, RecipeForm, ImportDropzone
  **File:** `src/e2e/light-cool-theme.spec.ts`

### T12 — PageLayout, home page, Header (E2E)

- [ ] With `light-cool` active: home page feature cards are visually distinct from page background (computed card background is white; page background is `rgb(241, 245, 249)`)
- [ ] With `light-cool` active: "CookBook" hero title is visible (not white text on white background)
- [ ] With `light-cool` active: Header sign-in button uses blue accent background
- [ ] With `light-cool` active: hero CTA "Browse Recipes" button uses blue accent
- [ ] With `dark` active: home page renders identically to pre-PR state (regression)
- [ ] Page background is flat (no visible gradient band) in both themes after `PageLayout` change

  **Map:** `specs/component-token-migration.md` → MODIFIED Home page hero, Header; `specs/color-system.md` → MODIFIED PageLayout gradient
  **File:** `src/e2e/light-cool-theme.spec.ts`

### T14 — Post-migration audit (Automated grep as part of validation)

- [ ] Grep command (defined in tasks T14) returns zero matches in non-exempt component files
- [ ] TypeScript type-check (`npx tsc --noEmit`) passes with zero errors
- [ ] `npm run build` passes — confirms no tree-shaking or Tailwind parse issues with new token usage patterns

  **Map:** `specs/component-token-migration.md` → REMOVED Hardcoded dark colours
  **Execution:** part of Task 14 validation step

### Cross-cutting — WCAG contrast (E2E)

- [ ] Recipes page subtitle (`--theme-fg-subtle`) contrast ≥ 4.5:1 on `--theme-bg` background in light-cool
- [ ] Auth form link colour contrast ≥ 4.5:1 on form background in light-cool
- [ ] Active filter chip text contrast ≥ 4.5:1 on chip background in light-cool
- [ ] Modal text contrast ≥ 4.5:1 on modal panel background in light-cool

  **Map:** `specs/color-system.md` → ADDED WCAG AA compliance
  **File:** `src/e2e/light-cool-theme.spec.ts`

### Cross-cutting — Theme selector UI (E2E, extends existing theme.spec.ts)

- [ ] Theme selector shows "Dark" and "Light (cool)" buttons — no "Light" button without qualifier
- [ ] Clicking "Light (cool)" sets `html.light-cool` class and stores `'light-cool'` in localStorage
- [ ] Reloading with `'light-cool'` stored shows "Light (cool)" as `aria-pressed="true"` in selector

  **Map:** `specs/theme-id-and-persistence.md` → MODIFIED Theme id
  **File:** `src/e2e/theme.spec.ts` (update existing selector test)

### Cross-cutting — Print isolation (E2E, existing test must pass unchanged)

- [ ] `PrintLayout` renders with `--theme-bg: white` override regardless of active theme, including `light-cool`

  **Map:** `specs/theme-file-architecture.md` → Non-Functional Reliability — print isolation
  **File:** `src/e2e/theme.spec.ts` (existing test — must pass without modification)
