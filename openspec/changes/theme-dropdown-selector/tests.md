---
name: tests
description: Tests for the theme-dropdown-selector change
---

# Tests

## Overview

This document outlines the tests for the `theme-dropdown-selector` change. All work follows a strict TDD process: failing tests are written first, then implementation, then refactor.

## Testing Steps

For each task group in `tasks.md`:

1. **Write a failing test** — before any implementation, write a test that captures the requirement. Run it and confirm it fails.
2. **Write code to pass the test** — write the simplest code to make it pass.
3. **Refactor** — improve code quality while keeping the test green.

## Test Cases

### Unit Tests — `src/components/__tests__/Header.test.tsx`

Mapped to tasks T2a–T2j and specs `dropdown-behavior.md` / `accessibility.md`.

#### Dropdown rendering

- [ ] **T2a** — Dropdown renders one option per THEMES entry; each option's label text is visible
  - Spec: `dropdown-behavior.md` § MODIFIED Theme selector — "All registered themes are accessible"
- [ ] **T2b** — Each option contains a `<span>` with `data-theme` attribute matching the theme id; span has no children
  - Spec: `swatch-css-scoping.md` § ADDED Color swatch, ADDED Swatches are leaf elements

#### Preview state

- [ ] **T2c** — Selecting a non-committed option sets `document.documentElement.className` to the selected id (DOM preview fires before OK)
  - Spec: `dropdown-behavior.md` § ADDED Live theme preview on option select — happy path
- [ ] **T2d** — Selecting the already-committed theme does not render OK or Cancel buttons
  - Spec: `dropdown-behavior.md` § ADDED Live preview — "Selecting the already-committed theme"

#### OK / Cancel

- [ ] **T2e** — Clicking OK calls `setTheme` with `previewId` and calls `setIsOpen(false)`
  - Spec: `dropdown-behavior.md` § ADDED OK commits and closes sidebar
- [ ] **T2f** — Clicking Cancel reverts `document.documentElement.className` to the committed theme and calls `setIsOpen(false)`
  - Spec: `dropdown-behavior.md` § ADDED Cancel reverts and closes sidebar

#### Keyboard and cleanup

- [ ] **T2g** — Pressing Escape while dropdown is open with a pending preview reverts `document.documentElement.className` and closes the dropdown
  - Spec: `accessibility.md` § ADDED Keyboard navigation — "Escape closes dropdown and reverts preview"
- [ ] **T2h** — Unmounting Header while `previewId !== null` reverts `document.documentElement.className` to the committed theme
  - Spec: `dropdown-behavior.md` § ADDED Unmount cleanup reverts preview

#### ARIA

- [ ] **T2i** — Trigger button has `aria-expanded="false"` when dropdown is closed; `aria-expanded="true"` when open
  - Spec: `accessibility.md` § ADDED ARIA roles — "Trigger reflects expanded state"
- [ ] **T2j** — Options container has `role="listbox"`; committed-theme option has `aria-selected="true"`; others have `aria-selected="false"`
  - Spec: `accessibility.md` § ADDED ARIA roles — "Options container role" + "Each option role and selection state"

---

### E2E Tests — `src/e2e/theme.spec.ts`

Mapped to tasks T4a–T4f and specs `dropdown-behavior.md` / `accessibility.md`.

- [ ] **T4a** — Open sidebar, open dropdown — assert all registered theme options are visible
  - Spec: `dropdown-behavior.md` § MODIFIED Theme selector — "All registered themes are accessible"
- [ ] **T4b** — Select `light-warm` from dropdown — assert `html` element has class `light-warm` before OK is pressed
  - Spec: `dropdown-behavior.md` § ADDED Live theme preview — happy path
- [ ] **T4c** — Select `light-warm`, press OK — assert sidebar closes and theme persists after re-open (localStorage updated)
  - Spec: `dropdown-behavior.md` § ADDED OK commits and closes sidebar
- [ ] **T4d** — Select `light-cool` (committed: `dark`), press Cancel — assert `html` class reverts to `dark` and sidebar closes
  - Spec: `dropdown-behavior.md` § ADDED Cancel reverts and closes sidebar
- [ ] **T4e** — Select a theme to preview, press Escape — assert dropdown closes and `html` class reverts to committed theme
  - Spec: `accessibility.md` § ADDED Keyboard navigation — "Escape closes dropdown and reverts preview"
- [ ] **T4f** — Select a theme to preview, click outside dropdown — assert dropdown closes and `html` class reverts
  - Spec: `accessibility.md` § ADDED Outside-click closes dropdown and reverts preview

---

### CSS / Visual Verification

These are verified manually or via E2E screenshot comparisons.

- [ ] Swatch `<span data-theme="light-warm">` background resolves to `light-warm`'s `--theme-bg` even when `html.dark` is active — verify via `getComputedStyle` in an E2E `evaluate()` call
  - Spec: `swatch-css-scoping.md` § ADDED `data-theme` selector — "light-warm exposes tokens via data-theme"
- [ ] Dropdown and OK/Cancel buttons are styled exclusively with `var(--theme-*)` tokens — verify by inspection during E2E theme-cycling test
  - Spec: `design.md` § Decision 3
