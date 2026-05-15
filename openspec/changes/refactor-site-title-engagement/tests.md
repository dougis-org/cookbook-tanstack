---
name: tests
description: Tests for the My CookBooks refactor
---

# Tests

## Overview

This document outlines the tests for the `refactor-site-title-engagement` change. All work follows a strict TDD process to ensure the new "My CookBooks" identity is correctly implemented and visually stable.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing implementation code, write a test that captures the requirement. Ensure it fails.
2.  **Implement:** Write code to pass the test.
3.  **Refactor:** Polish code while maintaining passing status.

## Test Cases

### Branding & Identity

- [ ] **Test Header Text (Unit):**
  - **Task:** Update Header
  - **Spec:** MODIFIED Application Branding (Scenario: Header Logo)
  - **Check:** `src/components/__tests__/Header.test.tsx` should be updated to expect "My CookBooks" instead of "CookBook".
- [ ] **Test Home Page Heading (E2E):**
  - **Task:** Update Tests
  - **Spec:** MODIFIED Application Branding (Scenario: Home Page Hero)
  - **Check:** `src/e2e/home-page-revamp.spec.ts` should fail when looking for "CookBook" and pass after the heading is updated.
- [ ] **Test Document Title (E2E):**
  - **Task:** Update Metadata
  - **Spec:** MODIFIED Application Branding (Scenario: Browser Tab Title)
  - **Check:** Add a Playwright test to verify `document.title` contains "My CookBooks".

### Typography

- [ ] **Test Font Family Application (Unit):**
  - **Task:** Implement Typography
  - **Spec:** MODIFIED Global Typography (Scenario: Font Application)
  - **Check:** Use `vitest` with `jsdom` to verify that `h1` elements have `font-family: Fraunces` in their computed styles.

### Responsive Stability

- [ ] **Test Mobile Layout (E2E):**
  - **Task:** Update Header
  - **Spec:** Non-Functional Acceptance Criteria (Scenario: Mobile Header Integrity)
  - **Check:** Playwright test at 375px width to ensure the "My CookBooks" title is visible and does not overlap the menu button or search trigger.
