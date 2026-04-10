---
name: tests
description: Tests for the header-search-consolidation change
---

# Tests

## Overview

This document outlines the tests for the `header-search-consolidation` change. All work follows a strict TDD process: write a failing test first, implement the minimum code to pass it, then refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — before any implementation code, write a test capturing the task's requirement. Run it and confirm it fails.
2. **Write code to pass the test** — implement the minimum code to make the test pass.
3. **Refactor** — improve quality and structure while keeping the test green.

---

## Test Cases

### Task 4 — Header search state and URL sync

- [ ] **E2E: Header input populates from URL on load**
  - File: `src/e2e/recipes-list.spec.ts` (new test)
  - Steps: Navigate to `/recipes?search=tacos` → assert `data-testid="header-search-input"` has value "tacos"
  - Spec: `specs/header-search.md` — "Header input syncs from URL" / "User navigates directly to a search URL"

- [ ] **E2E: Header input updates when URL changes via back/forward**
  - File: `src/e2e/recipes-list.spec.ts` (new test)
  - Steps: Navigate to `/recipes?search=soup`, then navigate away, then back → assert header input value is "soup"
  - Spec: `specs/header-search.md` — "URL search param changes externally"

- [ ] **E2E: Typing in header auto-filters recipes without pressing Enter**
  - File: `src/e2e/recipes-list.spec.ts` (update existing search test)
  - Steps: Navigate to `/recipes` → fill `data-testid="header-search-input"` → wait 400ms → assert URL contains `?search=<value>` and recipe cards update
  - Spec: `specs/header-search.md` — "User types into header search input"

- [ ] **E2E: Clearing header input removes search param**
  - File: `src/e2e/recipes-list.spec.ts` (new test)
  - Steps: Navigate to `/recipes?search=chicken` → clear `data-testid="header-search-input"` → wait 400ms → assert URL has no `search` param
  - Spec: `specs/header-search.md` — "User clears the header search input"

### Task 5 — Desktop: always visible + cyan dot

- [ ] **E2E: Header search input is visible on desktop without interaction**
  - File: `src/e2e/recipes-list.spec.ts` (new test)
  - Steps: Set viewport to 1280×800 → navigate to `/recipes` → assert `data-testid="header-search-input"` is visible
  - Spec: `specs/header-search.md` — "Desktop header always shows search input"

- [ ] **E2E: Cyan dot visible on desktop when search is active**
  - File: `src/e2e/recipes-list.spec.ts` (new test)
  - Steps: Navigate to `/recipes?search=pasta` → assert `data-testid="header-search-dot"` is visible
  - Spec: `specs/header-search.md` — "Search is active — dot is visible"

- [ ] **E2E: Cyan dot hidden on desktop when no search**
  - File: `src/e2e/recipes-list.spec.ts` (new test)
  - Steps: Navigate to `/recipes` (no search param) → assert `data-testid="header-search-dot"` is not present/hidden
  - Spec: `specs/header-search.md` — "Search is cleared — dot is hidden"

### Task 6 — Mobile overlay

- [ ] **E2E: Mobile shows icon button, not input field**
  - File: `src/e2e/recipes-list.spec.ts` (new test)
  - Steps: Set viewport to 375×667 → navigate to `/recipes` → assert `data-testid="header-search-input"` not visible → assert `data-testid="header-search-icon-btn"` is visible
  - Spec: `specs/header-search.md` — "Mobile search overlay" (pre-condition)

- [ ] **E2E: Tapping search icon opens overlay with focused input**
  - File: `src/e2e/recipes-list.spec.ts` (new test)
  - Steps: Set viewport 375×667 → click `data-testid="header-search-icon-btn"` → assert `data-testid="header-search-input"` is visible and focused
  - Spec: `specs/header-search.md` — "User taps the search icon on mobile" / "Overlay input is auto-focused"

- [ ] **E2E: Close button (✕) closes overlay**
  - File: `src/e2e/recipes-list.spec.ts` (new test)
  - Steps: Open overlay → click `data-testid="header-search-close-btn"` → assert input is no longer visible → assert normal header is restored (logo visible)
  - Spec: `specs/header-search.md` — "User closes the mobile overlay with the close button"

- [ ] **E2E: Escape key closes overlay**
  - File: `src/e2e/recipes-list.spec.ts` (new test)
  - Steps: Open overlay on mobile → press Escape → assert overlay closes
  - Spec: `specs/header-search.md` — "User closes the mobile overlay with Escape"

- [ ] **E2E: Cyan dot visible on mobile icon when search is active**
  - File: `src/e2e/recipes-list.spec.ts` (new test)
  - Steps: Set viewport 375×667 → navigate to `/recipes?search=pasta` → assert `data-testid="header-search-dot"` is visible on the icon button
  - Spec: `specs/header-search.md` — "Search is active — dot is visible"

### Task 7 — Remove recipe page search input

- [ ] **E2E: `data-testid="recipe-search-input"` no longer exists in DOM**
  - File: `src/e2e/recipes-list.spec.ts` (assertion in updated tests)
  - Steps: Navigate to `/recipes` → assert `page.getByTestId("recipe-search-input")` count is 0
  - Spec: `specs/header-search.md` — REMOVED "Recipe page search input"

### Task 8 — Updated E2E selectors

- [ ] **E2E: Existing search filter test uses header input**
  - File: `src/e2e/recipes-list.spec.ts`
  - Steps: Replace `getByTestId("recipe-search-input")` with `getByTestId("header-search-input")` in both existing search tests → confirm tests still pass end-to-end

### Task 9 — Type safety and dead code

- [ ] **Type check passes cleanly**
  - Command: `npx tsc --noEmit`
  - Expected: zero errors
  - Covers: removal of unused state/refs/imports from `recipes/index.tsx` and `Header.tsx`

- [ ] **Build succeeds**
  - Command: `npm run build`
  - Expected: build completes with no errors or warnings related to this change

---

## Test Data Attributes to Add

During Task 4–6 implementation, add the following `data-testid` attributes to `Header.tsx`:

| Element | `data-testid` |
|---|---|
| Desktop `<input>` (and mobile overlay `<input>`) | `header-search-input` |
| Mobile icon button | `header-search-icon-btn` |
| Mobile overlay close button (✕) | `header-search-close-btn` |
| Cyan dot span | `header-search-dot` |
