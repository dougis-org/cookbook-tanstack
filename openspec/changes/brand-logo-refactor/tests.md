---
name: tests
description: Tests for the brand-logo-refactor change
---

# Tests

## Overview

This document outlines the tests for the `brand-logo-refactor` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] **Test Case 1 for Task 1 (Verify brand mark component renders):**
  - **File:** `src/components/ui/__tests__/LogoMark.test.tsx`
  - **Action:** Assert that `<LogoMark />` renders an SVG element with a `viewBox="0 0 64 64"` and defaults to size `24`.
  - **Maps to:** Task 1 & ADDED Brand Mark Component (LogoMark).
- [ ] **Test Case 2 for Task 1 (Verify brand mark custom sizing and classes):**
  - **File:** `src/components/ui/__tests__/LogoMark.test.tsx`
  - **Action:** Assert that `<LogoMark size={48} className="text-cyan-400" />` renders with `width="48"`, `height="48"`, and containing the class `"text-cyan-400"`.
  - **Maps to:** Task 1 & Scenario "Renders with custom size and class".
- [ ] **Test Case 3 for Task 2 (Hero brand mark E2E verification):**
  - **File:** `src/e2e/home-page-revamp.spec.ts`
  - **Action:** Assert that landing page hero renders the brand mark SVG and does not contain the Lucide `ChefHat` icon element.
  - **Maps to:** Task 2 & MODIFIED Landing Page Hero Branding.
- [ ] **Test Case 4 for Task 3 (Header brand marks rendering verification):**
  - **File:** `src/components/__tests__/Header.test.tsx`
  - **Action:** Assert that the main desktop header and the mobile sidebar drawer both render the `<LogoMark>` component and no longer include the Lucide `ChefHat` icons.
  - **Maps to:** Task 3 & MODIFIED Chrome Header Branding.
