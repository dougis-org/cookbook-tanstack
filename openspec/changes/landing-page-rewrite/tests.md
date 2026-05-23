---
name: tests
description: Tests for the landing page rewrite
---

# Tests

## Overview

This document outlines the tests for the `landing-page-rewrite` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] **Test Case 1 (for Task 1) — Brand Casing & Hero Casing:**
  - **Type:** Playwright E2E
  - **Failing state:** Test fails if the hero title does not display "My CookBooks" exactly or does not use the `.brand-wordmark` class.
  - **Success state:** Page displays `h1.brand-wordmark` with text "My CookBooks" and the correct brand SVG markup.
  - **Scenario link:** `specs/landing-page.md` -> Scenario: Verify hero brand casing and sub-tagline copy

- [ ] **Test Case 2 (for Task 1) — Hero Sub-tagline:**
  - **Type:** Playwright E2E
  - **Failing state:** Test fails if the sub-tagline does not display "Save every recipe. Build cookbooks. Cook from any device.".
  - **Success state:** Section contains a paragraph matching the sub-tagline content exactly.
  - **Scenario link:** `specs/landing-page.md` -> Scenario: Verify hero brand casing and sub-tagline copy

- [ ] **Test Case 3 (for Task 2) — Primary CTA Redirection:**
  - **Type:** Playwright E2E
  - **Failing state:** Test fails if the primary button text is not "Start Free — No Credit Card" or does not point to `/auth/register`.
  - **Success state:** Locator `page.getByRole('link', { name: 'Start Free — No Credit Card' })` resolves, is visible, and links to `/auth/register`.
  - **Scenario link:** `specs/landing-page.md` -> Scenario: Verify CTA text and redirection links

- [ ] **Test Case 4 (for Task 2) — Secondary CTA Redirection:**
  - **Type:** Playwright E2E
  - **Failing state:** Test fails if the secondary button text is not "Browse Public Recipes" or does not point to `/recipes`.
  - **Success state:** Locator `page.getByRole('link', { name: 'Browse Public Recipes' })` resolves, is visible, and links to `/recipes`.
  - **Scenario link:** `specs/landing-page.md` -> Scenario: Verify CTA text and redirection links

- [ ] **Test Case 5 (for Task 2) — Pricing Indicator Presence:**
  - **Type:** Playwright E2E
  - **Failing state:** Test fails if "Plans start at $2.99/mo." text is missing or the "View Plans" link does not navigate to `/pricing`.
  - **Success state:** Text node is present and the link targets `/pricing` with correct styling.
  - **Scenario link:** `specs/landing-page.md` -> Scenario: Verify presence of plans teaser and link

- [ ] **Test Case 6 (for Task 3) — Image Slot Render:**
  - **Type:** Playwright E2E
  - **Failing state:** Test fails if there is no custom `<image-slot>` tag with ID `landing-screenshot`.
  - **Success state:** DOM queries resolve `image-slot#landing-screenshot[placeholder="Add a screenshot of /recipes"]` as fully visible.
  - **Scenario link:** `specs/landing-page.md` -> Scenario: Verify presence of screenshot placeholder slot

- [ ] **Test Case 7 (for Task 4) — Features Row Casing and Count:**
  - **Type:** Playwright E2E
  - **Failing state:** Test fails if the feature cards do not render exactly 4 links, or if their titles (Save, Organise, Import, Print) and descriptions are incorrect.
  - **Success state:** Locator parses 4 features links that navigate to `/auth/register` with correct Title Case headers.
  - **Scenario link:** `specs/landing-page.md` -> Scenario: Verify features list structure and interactivity
