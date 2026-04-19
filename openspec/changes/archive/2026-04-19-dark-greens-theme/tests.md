---
name: tests
description: TDD test cases for dark-greens-theme change
---

# Tests

## Overview

Test cases for the `dark-greens-theme` change. All work follows strict TDD: write failing test → implement → refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** before any implementation code. Run it; confirm it fails.
2. **Write the simplest code** to make the test pass.
3. **Refactor** — improve code quality while keeping tests green.

## Test Cases

### T1 — THEMES array: four entries with correct labels

- [ ] Task ref: I1 (`ThemeContext.tsx`)
- [ ] Spec ref: `specs/theme-selection/spec.md` — "Four themes visible in picker"
- [ ] File: `src/contexts/__tests__/ThemeContext.test.tsx`
- [ ] Assert `THEMES.length === 4`
- [ ] Assert `THEMES` includes `{ id: 'dark', label: 'Dark (blues)' }`
- [ ] Assert `THEMES` includes `{ id: 'dark-greens', label: 'Dark (greens)' }`
- [ ] Assert `THEMES` includes `{ id: 'light-cool', label: 'Light (cool)' }`
- [ ] Assert `THEMES` includes `{ id: 'light-warm', label: 'Light (warm)' }`

### T2 — setTheme: dark-greens sets correct className

- [ ] Task ref: I1 (`ThemeContext.tsx`)
- [ ] Spec ref: `specs/theme-selection/spec.md` — "Selecting Dark (greens) applies Selenized colours"
- [ ] File: `src/contexts/__tests__/ThemeContext.test.tsx`
- [ ] Call `setTheme('dark-greens')` → assert `document.documentElement.className === 'dark-greens'`
- [ ] Assert `localStorage.getItem('cookbook-theme') === 'dark-greens'`

### T3 — setTheme: unknown ID rejected

- [ ] Task ref: I1 (`ThemeContext.tsx`)
- [ ] Spec ref: `specs/theme-persistence/spec.md` — "Unknown ID still falls back to dark"
- [ ] File: `src/contexts/__tests__/ThemeContext.test.tsx`
- [ ] Call `setTheme('does-not-exist')` → assert `document.documentElement.className` unchanged
- [ ] Assert localStorage not updated

### T4 — localStorage: stored dark continues working

- [ ] Task ref: I1 (`ThemeContext.tsx`)
- [ ] Spec ref: `specs/theme-selection/spec.md` — "Stored dark theme continues working"
- [ ] File: `src/contexts/__tests__/ThemeContext.test.tsx`
- [ ] Seed `localStorage` with `'dark'` → mount `ThemeProvider` → assert `theme === 'dark'`
- [ ] Assert `document.documentElement.className === 'dark'`

### T5 — E2E: theme picker shows four options

- [ ] Task ref: T3 (E2E tests)
- [ ] Spec ref: `specs/theme-selection/spec.md` — "Four themes visible in picker"
- [ ] File: `src/e2e/theme.spec.ts`
- [ ] Navigate to home page → open theme picker
- [ ] Assert picker contains exactly 4 options
- [ ] Assert option labels include `Dark (blues)` and `Dark (greens)`

### T6 — E2E: selecting Dark (greens) applies class and background

- [ ] Task ref: T4 (E2E tests)
- [ ] Spec ref: `specs/theme-selection/spec.md` — "Selecting Dark (greens) applies Selenized colours"
- [ ] File: `src/e2e/theme.spec.ts`
- [ ] Click `Dark (greens)` option
- [ ] Assert `document.documentElement.className === 'dark-greens'`
- [ ] Assert computed `background-color` of `<html>` equals `rgb(16, 60, 72)` (`#103c48`)

### T7 — E2E: dark-greens persists across page reload

- [ ] Task ref: T5 (E2E tests)
- [ ] Spec ref: `specs/theme-persistence/spec.md` — "dark-greens persists after reload"
- [ ] File: `src/e2e/theme.spec.ts`
- [ ] Select `Dark (greens)` → reload page
- [ ] Assert `document.documentElement.className === 'dark-greens'`
- [ ] Assert theme picker shows `Dark (greens)` as active

### T8 — E2E: FOUC prevention — dark-greens background before hydration

- [ ] Task ref: T6 (E2E FOUC test)
- [ ] Spec ref: `specs/fouc-prevention/spec.md` — "Correct background on first paint"
- [ ] File: `src/e2e/fouc-prevention.spec.ts`
- [ ] Set localStorage `'dark-greens'` via `page.evaluate`
- [ ] Navigate (disable JS if possible, or check inline style before bundle executes)
- [ ] Assert `<html>` has class `dark-greens` before React hydration

### T9 — criticalCss contains dark-greens rule

- [ ] Task ref: I4 (`__root.tsx`)
- [ ] Spec ref: `specs/fouc-prevention/spec.md` — "criticalCss covers dark-greens"
- [ ] File: `src/e2e/fouc-prevention.spec.ts` or snapshot test
- [ ] Navigate to home page
- [ ] Assert `<style data-id="critical-theme">` inner text contains `html.dark-greens{background:#103c48;color:#adbcbc}`

### T10 — Visual QC: dark-greens badge colours

- [ ] Task ref: I2 (`dark-greens.css`)
- [ ] Spec ref: `specs/theme-selection/spec.md` — "Badge colours on dark-greens theme"
- [ ] Run `openwolf designqc` with `dark-greens` theme active
- [ ] Visually verify: meal (yellow), course (violet), prep (orange), classification (cyan) on recipe list page

### T11 — Visual QC: theme picker mobile layout

- [ ] Task ref: I1 + I2
- [ ] Spec ref: `specs/theme-selection/spec.md` — "Theme selector renders with four items on mobile viewport"
- [ ] Open browser at 375px width → open theme picker
- [ ] Assert all four options visible without overflow or horizontal scroll
