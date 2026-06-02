---
name: tests
description: Tests for the cookbook-collaborator-onboarding change
---

# Tests

## Overview

This document outlines the test plan and verification cases for the `cookbook-collaborator-onboarding` change. All work follows a strict TDD (Test-Driven Development) process: red, green, refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1: Update Collaborator Schema

- [ ] **Test Case 1.1: Verify default `onboarded` value**
  - **Given** valid collaborator model parameters (cookbookId, userId, addedBy)
  - **When** saving a new `Collaborator` record without specifying the `onboarded` field
  - **Then** the saved document's `onboarded` field resolves to `false`.
  - *Location*: `src/db/models/__tests__/collaborator.test.ts`

- [ ] **Test Case 1.2: Verify saving explicit `onboarded` values**
  - **Given** valid collaborator parameters with `onboarded` set to `true`
  - **When** saving the document
  - **Then** the saved document correctly stores the value `true` in the database.
  - *Location*: `src/db/models/__tests__/collaborator.test.ts`

### Task 2: Implement tRPC API updates

- [ ] **Test Case 2.1: Verify `cookbooks.byId` output exposes `onboarded` status**
  - **Given** a seeded cookbook with a collaborator who is not onboarded
  - **When** fetching the cookbook details via the `cookbooks.byId` procedure
  - **Then** the returned collaborator array includes the `onboarded: false` flag.
  - *Location*: `src/server/trpc/routers/__tests__/cookbooks.test.ts`

- [ ] **Test Case 2.2: Verify `cookbooks.onboardCollaborator` updates state**
  - **Given** an unonboarded collaborator logged in
  - **When** they execute the `cookbooks.onboardCollaborator` mutation
  - **Then** the mutation returns `{ success: true }` and updates the collaborator's `onboarded` status to `true` in the database.
  - *Location*: `src/server/trpc/routers/__tests__/cookbooks.test.ts`

- [ ] **Test Case 2.3: Verify `cookbooks.onboardCollaborator` access controls**
  - **Given** a user who is not a collaborator on a cookbook
  - **When** they attempt to trigger the `cookbooks.onboardCollaborator` mutation for that cookbook
  - **Then** the procedure fails, throwing a `NOT_FOUND` error.
  - *Location*: `src/server/trpc/routers/__tests__/cookbooks.test.ts`

### Task 3 & 4: Build and Integrate Onboarding Modal UI

- [ ] **Test Case 3.1: Verify Onboarding Modal renders correct Editor copy**
  - **Given** the onboarding modal is mounted with an `'editor'` collaborator role
  - **When** the component is rendered
  - **Then** the modal title displays Editor specific headers and lists editor capabilities (add, edit, delete recipes, organize chapters).
  - *Location*: `src/components/cookbooks/__tests__/CookbookDetail.test.tsx`

- [ ] **Test Case 3.2: Verify Onboarding Modal renders correct Viewer copy**
  - **Given** the onboarding modal is mounted with a `'viewer'` collaborator role
  - **When** the component is rendered
  - **Then** the modal title displays Viewer specific headers and lists viewer capabilities (read-only access, printing, bookmarking).
  - *Location*: `src/components/cookbooks/__tests__/CookbookDetail.test.tsx`

- [ ] **Test Case 4.1: Verify onboarding modal auto-triggers and dismisses correctly**
  - **Given** a logged-in collaborator who is not onboarded landing on the cookbook detail page
  - **When** the page finishes loading
  - **Then** the onboarding modal is shown automatically, and clicking the CTA button invokes the onboarding mutation.
  - *Location*: `src/components/cookbooks/__tests__/CookbookDetail.test.tsx`
