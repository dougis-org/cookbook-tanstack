---
name: tests
description: Tests for the reveal-private-source-name-input change
---

# Tests

## Overview

This document outlines the tests for the `reveal-private-source-name-input` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [x] **Test case 1.1 (tRPC list):** Ensure `sourcesRouter.list` query output contains `slug` for each item.
  - **Fails if**: `sourcesRouter.list()` result objects do not include a `slug` property.
  - **Verification**: Run `npm run test src/server/trpc/routers/__tests__/sources.test.ts`.

- [x] **Test case 1.2 (tRPC search):** Ensure `sourcesRouter.search` query output contains `slug` for each item.
  - **Fails if**: `sourcesRouter.search()` result objects do not include a `slug` property.
  - **Verification**: Run `npm run test src/server/trpc/routers/__tests__/sources.test.ts`.

- [x] **Test case 1.3 (tRPC byId):** Ensure `sourcesRouter.byId` query output contains `slug` for the item.
  - **Fails if**: `sourcesRouter.byId()` result object does not include a `slug` property.
  - **Verification**: Run `npm run test src/server/trpc/routers/__tests__/sources.test.ts`.

- [x] **Test case 2.1 (UI non-personal):** Check that the personal name text input is not rendered when the selected source does not have `slug === "personal"` or when no source is selected.
  - **Fails if**: An input field with label "Personal Name" is rendered in the DOM when `value=""` or `slug` is not `"personal"`.
  - **Verification**: Run `npm run test src/components/ui/__tests__/SourceSelector.test.tsx`.

- [x] **Test case 2.2 (UI personal render):** Check that the personal name text input group (input, label, placeholder, and helper text) renders correctly when the selected source has `slug === "personal"`.
  - **Fails if**: The input group is not rendered when the source's slug is `"personal"`.
  - **Verification**: Run `npm run test src/components/ui/__tests__/SourceSelector.test.tsx`.

- [x] **Test case 2.3 (UI callback):** Check that typing in the personal name input field correctly calls `onPersonalSourceNameChange` with the typed value.
  - **Fails if**: Typing text does not trigger the callback or calls it with incorrect arguments.
  - **Verification**: Run `npm run test src/components/ui/__tests__/SourceSelector.test.tsx`.

- [x] **Test case 2.4 (UI accessibility):** Verify that the helper text `"Only you can see this."` is associated with the input field via matching `aria-describedby` attribute.
  - **Fails if**: The input's `aria-describedby` attribute does not match the helper text element's `id`.
  - **Verification**: Run `npm run test src/components/ui/__tests__/SourceSelector.test.tsx`.
