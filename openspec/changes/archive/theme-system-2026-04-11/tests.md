---
name: tests
description: Tests for the theme-system change
---

# Tests

## Overview

This document outlines the tests for the `theme-system` change. All work follows strict TDD: write a failing test first, implement to make it pass, then refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 3 — CSS token layer (`src/styles.css`)

No unit test file — validated by build and visual inspection.

- [ ] `npm run build` completes without error after token definitions are added
- [ ] `html.dark` block defines all 12 `--theme-*` tokens (grep verification)
- [ ] `html.light` block defines all 12 `--theme-*` tokens (grep verification)

**Spec reference:** `specs/theme-persistence.md`, `specs/component-migration.md`

---

### Task 4 — `ThemeContext` and inline SSR script

**Test file:** `src/contexts/__tests__/ThemeContext.test.tsx`

- [ ] `useTheme()` returns `theme: 'dark'` when `localStorage` is empty
  - Spec: `specs/theme-persistence.md` — "Default theme is dark"
- [ ] `useTheme()` returns the stored theme when `localStorage['cookbook-theme']` is `'light'`
  - Spec: `specs/theme-persistence.md` — "Theme persists across page reloads"
- [ ] `setTheme('light')` sets `localStorage['cookbook-theme']` to `'light'`
  - Spec: `specs/theme-persistence.md` — "Theme selection persists to localStorage"
- [ ] `setTheme('light')` sets `document.documentElement.className` to `'light'`
  - Spec: `specs/theme-persistence.md` — "Theme selection persists to localStorage"
- [ ] `setTheme` with an unknown theme id (not in `THEMES`) does not change the active theme
  - Spec: `specs/theme-extensibility.md` — "Unknown theme name in localStorage is handled gracefully"
- [ ] When `localStorage.getItem` throws, `useTheme()` returns `theme: 'dark'` without error
  - Spec: `specs/theme-persistence.md` — "localStorage is unavailable"
- [ ] `THEMES` array contains exactly `[{ id: 'dark', label: 'Dark' }, { id: 'light', label: 'Light' }]`
  - Spec: `specs/theme-extensibility.md` — "Theme selector renders all registered themes"

**SSR script — verified by E2E (Task 10), not unit test**

---

### Task 5 — Component migration (`src/components/`)

**Test files:** Existing component tests pass after migration (no regressions).

- [ ] All existing unit tests in `src/components/**/__tests__/` pass after migration
  - Spec: `specs/component-migration.md` — "All themed surfaces use `--theme-*` CSS variables"
- [ ] `grep -r "dark:" src/components/ --include="*.tsx"` — only badge exemptions remain
  - Spec: `specs/component-migration.md` — "`dark:` variants removed from migrated components"

---

### Task 6 — Route migration (`src/routes/`)

- [ ] All existing unit/integration tests in `src/routes/` pass after migration
- [ ] `grep -r "dark:" src/routes/ --include="*.tsx"` — zero results
  - Spec: `specs/component-migration.md` — "`dark:` variants removed from migrated components"

---

### Task 7 — Migration completeness

- [ ] `grep -r "dark:" src/ --include="*.tsx" -l` — output matches exactly the known-exempt badge file list
  - Spec: `specs/component-migration.md` — "Post-migration grep finds no unexpected `dark:` variants"

---

### Task 8 — `PrintLayout` refactor

**Test file:** `src/components/cookbooks/__tests__/PrintLayout.test.tsx`

- [ ] `PrintLayout` renders children inside a wrapping `<div>`
  - Spec: `specs/print-isolation.md` — "PrintLayout uses CSS variable scoped overrides"
- [ ] The wrapper `<div>` has `style` prop with `--theme-bg: white` (or equivalent)
  - Spec: `specs/print-isolation.md` — "Print layout renders with light colours regardless of active theme"
- [ ] `document.documentElement.className` is unchanged after `PrintLayout` mounts
  - Spec: `specs/print-isolation.md` — "PrintLayout no longer manipulates `<html>` class"
- [ ] `document.documentElement.className` is unchanged after `PrintLayout` unmounts
  - Spec: `specs/print-isolation.md` — "No cleanup effect on PrintLayout unmount"
- [ ] No `dataset.printLayoutDarkOverrideCount` or `dataset.printLayoutDarkOverrideHadDark` keys are set on `document.documentElement`
  - Spec: `specs/print-isolation.md` — "REMOVED useLayoutEffect ref-count DOM manipulation"
- [ ] Two `PrintLayout` instances mounted simultaneously do not throw or conflict
  - Spec: `specs/print-isolation.md` — "Multiple nested PrintLayout instances do not conflict"

---

### Task 9 — Theme selector in hamburger menu

**Test file:** `src/components/__tests__/Header.test.tsx` (create or update)

- [ ] Theme selector renders inside the sidebar with one button per `THEMES` entry
  - Spec: `specs/theme-extensibility.md` — "Theme selector renders all registered themes"
- [ ] The active theme button has a distinguishing class (e.g., `aria-pressed="true"` or an accent class)
  - Spec: `specs/theme-extensibility.md` — "Active theme highlighted on open"
- [ ] Clicking an inactive theme button calls `setTheme` with that theme's id
  - Spec: `specs/theme-extensibility.md` — "Active indicator updates on theme change"
- [ ] Each theme button has an accessible label (button text matches theme `label`)
  - Spec: `specs/component-migration.md` (accessibility)
- [ ] The theme selector section is inside the `<aside>` after the `<nav>` (bottom of sidebar)

---

### Task 10 — E2E tests

**Test file:** `src/e2e/theme.spec.ts`

- [ ] No stored preference → `html.dark` on load
  - Spec: `specs/theme-persistence.md` — "No stored preference — default to dark"
- [ ] `localStorage['cookbook-theme'] = 'light'` → page loads with `html.light`
  - Spec: `specs/theme-persistence.md` — "Light theme stored, page loads"
- [ ] Selecting light theme → reload → `html.light` persists, selector shows Light active
  - Spec: `specs/theme-persistence.md` — "User selects a theme and reloads"
- [ ] `html.light` class present in initial HTML before React hydration (flash prevention)
  - Spec: `specs/theme-persistence.md` — "No theme flash on SSR page load"
- [ ] Hamburger menu contains "Dark" and "Light" buttons
  - Spec: `specs/theme-extensibility.md` — "Theme selector renders all registered themes"
- [ ] Clicking "Light" in hamburger → header and page surfaces update to light token colours
  - Spec: `specs/component-migration.md` — "Theme switch changes all site surfaces"
- [ ] Switch to light, open cookbook print route → print surface has white background
  - Spec: `specs/print-isolation.md` — "Print layout renders with light colours regardless of active theme"
- [ ] Badge colours unchanged after switching themes
  - Spec: `specs/component-migration.md` — "Badge colours unchanged after theme switch"
