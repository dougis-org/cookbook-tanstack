---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `register-benefits-sidebar` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] **Test Case 1 (for Task 1 — AuthPageLayout customizable width):**
  - **Description:** Verify that passing `maxWidth="max-w-3xl"` successfully applies the custom width wrapper class to `<AuthPageLayout>`.
  - **Failing state:** The component only uses hardcoded `"max-w-md"` or does not accept a `maxWidth` prop.
  - **Passing state:** Container renders with `"max-w-3xl"` class.
- [ ] **Test Case 2 (for Task 2 — RegisterForm Grid structure):**
  - **Description:** Verify that the primary container in `RegisterForm` is a responsive grid layout.
  - **Failing state:** RegisterForm has a simple standard linear layout wrapper.
  - **Passing state:** Outer div possesses layout classes `grid`, `md:grid-cols-[1fr_280px]`, `gap-8`.
- [ ] **Test Case 3 (for Task 3 — Benefits sidebar rendering):**
  - **Description:** Verify that the benefits header `"Why join My CookBooks?"` and all 5 key bullet points are successfully rendered in the DOM with their respective check icons.
  - **Failing state:** No benefits title or list exists on registration screen.
  - **Passing state:** Title text and all 5 bulleted items are fully queryable and visible.
- [ ] **Test Case 4 (for Task 4 — Legal microcopy stubs):**
  - **Description:** Verify that the legal consent text and two link stubs for Terms and Privacy Policy appear underneath the "Create Account" submit button.
  - **Failing state:** No consent text or stub links are rendered.
  - **Passing state:** Consent text renders with anchors displaying `"Terms"` and `"Privacy Policy"` pointing to `"#"`.
