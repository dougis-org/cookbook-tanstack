---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `add-recipe-share-button` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### ShareButton Component & Unit Tests (Task 1 & Task 2)

- [ ] **Test Case Unit 1: Basic Render**
  - **Given** the `ShareButton` is rendered
  - **When** the page loads
  - **Then** the button contains a `Link` icon and the label "Share".
  
- [ ] **Test Case Unit 2: Successful Clipboard API Copy**
  - **Given** the modern `navigator.clipboard.writeText` API is mockable
  - **When** the Share button is clicked
  - **Then** the current location URL is written to the clipboard, the button text updates to "Copied!", and the icon updates to a `Check` icon.
  
- [ ] **Test Case Unit 3: Success Confirmation State Reset**
  - **Given** fake timers are enabled
  - **When** the clipboard copy is triggered and 2000ms advances
  - **Then** the button text and icon revert to their original "Share" and `Link` icon state.
  
- [ ] **Test Case Unit 4: Graceful Legacy Copy Fallback**
  - **Given** `navigator.clipboard` is absent and `document.execCommand` is mocked
  - **When** the Share button is clicked
  - **Then** the fallback sequence executes `document.execCommand('copy')` successfully and shows the "Copied!" state.

- [ ] **Test Case Unit 5: Graceful Manual Alert Fallback**
  - **Given** all automated copying APIs are blocked/unavailable
  - **When** the Share button is clicked
  - **Then** `window.alert` is called with instructions showing the raw page URL.

- [ ] **Test Case Unit 6: Print View CSS Hiding**
  - **Given** the Share button is rendered
  - **When** examining the class list
  - **Then** the class `print:hidden` must be present.

### Page Integration (Task 3)

- [ ] **Test Case Unit 7: Mount on Recipe Detail Page**
  - **Given** the recipe detail page is rendered
  - **When** the action list is loaded
  - **Then** `<ShareButton />` is visible directly next to `<PrintButton />`.

### E2E Integration (Task 4)

- [ ] **Test Case E2E 1: End-to-End Share Flow**
  - **Given** a real browser instance navigated to a newly created recipe page
  - **When** clicking the Share button
  - **Then** the button state is visually verified as "Copied!", it resets back to "Share" after a timeout, and evaluating the mocked clipboard content matches the browser's address URL.
