---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `pricing-page-v2` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] **Test case 1: Toggle mount and initial state (Sub-task 1)**
  - Verify that the Monthly/Annual toggle renders on the page and defaults to active "Annual" state.
  - Maps to: `specs/pricing-page-display.md` -> Scenario: Annual Billing Selected by Default
- [ ] **Test case 2: Toggle state transition (Sub-task 1)**
  - Verify that clicking "Monthly" and "Annual" updates the active toggle state dynamically.
  - Maps to: `specs/pricing-page-display.md` -> Scenario: User Swaps to Monthly Billing
- [ ] **Test case 3: Dynamic monthly pricing calculation (Sub-task 2)**
  - Verify that the card displays the annual-equivalent price (e.g. `$2.33/mo`) with a `"Billed annually · $27.99/yr"` caption under Annual mode.
  - Verify that swapping to Monthly mode shows `$2.99/mo` directly with no annual caption.
  - Maps to: `specs/pricing-page-display.md` -> Scenario: User Swaps to Monthly Billing
- [ ] **Test case 4: Prep Cook Highlight (Sub-task 3)**
  - Verify that the Prep Cook card contains the absolute-positioned "Most popular" badge and is styled with accent colors.
  - Maps to: `specs/pricing-page-display.md` -> Scenario: Prep Cook Visual Layout
- [ ] **Test case 5: Disabled CTA for Active Tier (Sub-task 4)**
  - Verify that the user's current tier card displays a disabled CTA button with `"Current plan"`.
  - Maps to: `specs/pricing-page-display.md` -> Scenario: CTA Action for Active Tier Card
- [ ] **Test case 6: Active links for Non-Active Tiers (Sub-task 4)**
  - Verify that all cards other than the user's current tier display an active Link pointing to `/change-tier`.
  - Maps to: `specs/pricing-page-display.md` -> Scenario: CTA Action for Non-Active Tier Card
- [ ] **Test case 7: Reassurance trust items (Sub-task 5)**
  - Verify that the 3 reassurance columns are present with correct titles and Lucide icons.
  - Maps to: `specs/pricing-page-display.md` -> Scenario: Reassurance Row Rendering
- [ ] **Test case 8: FAQ accordion default state and toggling (Sub-task 6)**
  - Verify that the first FAQ question is expanded by default, and others are collapsed.
  - Verify that clicking a collapsed item header collapses the previously expanded item and expands the clicked one.
  - Maps to: `specs/pricing-page-display.md` -> Scenario: FAQ Default State and Interaction
