---
name: tests
description: Tests for the add-pricing-links change
---

# Tests

## Overview

This document outlines the tests for the `add-pricing-links` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1: Add Pricing link to Header.tsx sidebar nav

- [ ] **Test case 1.1:** Sidebar renders Pricing link for unauthenticated user
  - Map to: specs/sidebar-pricing-link.md → "Anonymous user sees Pricing in sidebar"
  - Write test in: `src/routes/__tests__/-pricing.test.tsx`
  - Assert: `screen.getByRole('link', { name: /pricing/i })` exists when session is null

- [ ] **Test case 1.2:** Sidebar renders Pricing link for authenticated user
  - Map to: specs/sidebar-pricing-link.md → "Authenticated user sees Pricing in sidebar"
  - Write test in: `src/routes/__tests__/-pricing.test.tsx`
  - Assert: Pricing link exists alongside Home, Recipes, Categories, Cookbooks, New Recipe, Import Recipe

- [ ] **Test case 1.3:** Pricing link navigates to /pricing
  - Map to: specs/sidebar-pricing-link.md → "Pricing link uses correct route"
  - Write test in: `src/routes/__tests__/-pricing.test.tsx`
  - Assert: Pricing link has `href` containing `/pricing`

- [ ] **Test case 1.4:** Pricing link shows active state on /pricing page
  - Map to: specs/sidebar-pricing-link.md → "Pricing link shows active state on /pricing"
  - Write test in: `src/routes/__tests__/-pricing.test.tsx`
  - Assert: When on `/pricing`, Pricing link has active styling class (`bg-[var(--theme-accent)]`)

### Task 2: Add "View Plans and Pricing" button to anonymous home hero

- [ ] **Test case 2.1:** Home page hero renders "View Plans and Pricing" button
  - Map to: specs/home-hero-pricing.md → "Anonymous visitor sees pricing button on home page"
  - Write test in: `src/routes/__tests__/-index.test.tsx`
  - Assert: `screen.getByRole('link', { name: /view plans and pricing/i })` exists

- [ ] **Test case 2.2:** Pricing button navigates to /pricing
  - Map to: specs/home-hero-pricing.md → "Pricing button uses correct route"
  - Write test in: `src/routes/__tests__/-index.test.tsx`
  - Assert: Button/link has `href` containing `/pricing`

- [ ] **Test case 2.3:** Pricing button uses outline style (not filled accent)
  - Map to: specs/home-hero-pricing.md → "Pricing button has outline style"
  - Write test in: `src/routes/__tests__/-index.test.tsx`
  - Assert: Button has `border-[var(--theme-accent)]` class and `text-[var(--theme-accent)]` class, not `bg-[var(--theme-accent)]`

- [ ] **Test case 2.4:** CTAs stack on mobile, side-by-side on sm+
  - Map to: specs/home-hero-pricing.md → "Buttons stack on mobile, sit side-by-side on desktop"
  - Write test in: `src/routes/__tests__/-index.test.tsx`
  - Assert: CTA container has `flex-col` and `sm:flex-row` classes

### Task 3: Update tests for home page

- [ ] **Test case 3.1:** Existing "Browse Recipes" link still present
  - Map to: specs/home-hero-pricing.md → "Two CTAs present"
  - Write test in: `src/routes/__tests__/-index.test.tsx`
  - Assert: `screen.getByRole('link', { name: /browse recipes/i })` still exists

- [ ] **Test case 3.2:** Both CTAs render in hero section
  - Map to: specs/home-hero-pricing.md → "Two CTAs present"
  - Write test in: `src/routes/__tests__/-index.test.tsx`
  - Assert: Exactly two CTA buttons/links exist in the hero section

### Task 4: Update tests for pricing page sidebar active state

- [ ] **Test case 4.1:** Sidebar Pricing link active state test (covered in 1.4)
  - Map to: specs/sidebar-pricing-link.md → "Pricing link shows active state on /pricing"
  - Already covered by Task 1 test cases

## TDD Workflow Reminder

For each test case:
1. Write the test FIRST (it should fail — red)
2. Implement the minimal code to pass (green)
3. Refactor if needed while keeping tests green
4. Commit with clear message
5. Move to next test case
