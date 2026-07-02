---
name: tests
description: Tests for the private-recipe-notes-component change
---

# Tests

## Overview

All tests for `PrivateRecipeNotes` are React Testing Library (RTL) unit tests in
`src/components/recipes/PrivateRecipeNotes.test.tsx`. Follow strict TDD: write each
failing test first, then implement the minimum code to pass it, then refactor.

Test infrastructure: Vitest + RTL. Mock tRPC via `@trpc/react-query` test utilities
or by mocking `@/lib/trpc` and `@/hooks/useTierEntitlements` with `vi.mock`.

## Testing Steps

For each test case:

1. **Write a failing test** — before any implementation code, write the test and confirm it fails (`npx vitest run src/components/recipes/PrivateRecipeNotes.test.tsx`)
2. **Write code to pass the test** — implement the minimum component logic to make it pass
3. **Refactor** — clean up without breaking the test

## Test Cases

### Task 1 + Task 3 — Non-entitled user

Spec scenario: "Non-entitled user sees no component"

- [ ] **Test: component returns null for non-entitled user**
  - Mock `useTierEntitlements` to return `{ canUsePrivateRecipeNotes: false }`
  - Render `<PrivateRecipeNotes recipeId="abc123" />`
  - Assert: nothing is rendered (container is empty)
  - Assert: `trpc.privateRecipeNotes.get` query is NOT called (`enabled` is false)

### Task 2 + Task 3 — Loading skeleton

Spec scenario: "Loading state shown while query is in flight"

- [ ] **Test: loading skeleton renders while query is pending**
  - Mock `useTierEntitlements` to return `{ canUsePrivateRecipeNotes: true }`
  - Mock `useQuery` to return `{ isLoading: true, data: undefined }`
  - Render `<PrivateRecipeNotes recipeId="abc123" />`
  - Assert: a skeleton/placeholder element is present in the DOM (e.g., `animate-pulse` class or test-id `private-notes-skeleton`)

### Task 2 + Task 3 — Empty state

Spec scenario: "Empty state for entitled user with no note"

- [ ] **Test: empty state renders 'Add a note' affordance**
  - Mock `useTierEntitlements` to return `{ canUsePrivateRecipeNotes: true }`
  - Mock `useQuery` to return `{ isLoading: false, data: { hasNote: false, note: null } }`
  - Render `<PrivateRecipeNotes recipeId="abc123" />`
  - Assert: "Private Notes" heading is visible
  - Assert: "Add a note" button/text is visible
  - Assert: no note body text is present

### Task 2 + Task 3 — Read mode with note

Spec scenario: "Read mode renders note body"

- [ ] **Test: read mode displays saved note body**
  - Mock `useQuery` returning `{ hasNote: true, note: { body: "My note text", updatedAt: new Date() } }`
  - Render `<PrivateRecipeNotes recipeId="abc123" />`
  - Assert: "My note text" is visible in the DOM
  - Assert: Pencil edit button is present (accessible via `aria-label="Edit note"`)
  - Assert: no textarea is visible

### Task 2 + Task 3 — Enter edit mode

Spec scenario: "Entering edit mode from read mode"

- [ ] **Test: clicking edit button shows textarea with current body**
  - Render with note `{ body: "Existing text", updatedAt: ... }`
  - Click the Pencil edit button
  - Assert: textarea is visible with value "Existing text"
  - Assert: counter shows "13 / 10000"
  - Assert: Save button is present
  - Assert: Cancel button is present

- [ ] **Test: clicking 'Add a note' from empty state shows textarea**
  - Render with `{ hasNote: false, note: null }`
  - Click the "Add a note" button
  - Assert: textarea is visible with empty value
  - Assert: counter shows "0 / 10000"

### Task 2 + Task 3 — Character counter

Spec scenario: "Character counter updates as user types"

- [ ] **Test: character counter updates on input**
  - Enter edit mode (click edit button with existing or empty note)
  - Clear textarea and type "Hello"
  - Assert: counter shows "5 / 10000"
  - Type " World"
  - Assert: counter shows "11 / 10000"

### Task 2 + Task 3 — Save button disabled states

Spec scenario: "Save button disabled when body is unchanged" / "Save button enabled after change"

- [ ] **Test: Save disabled initially when body is unchanged**
  - Render with note `{ body: "Original text", updatedAt: ... }`; click edit button
  - Assert: Save button is `disabled` (body has not changed)

- [ ] **Test: Save enabled after editing**
  - Render with note `{ body: "Original text", ... }`; click edit button
  - Clear textarea and type "Changed text"
  - Assert: Save button is NOT `disabled`

- [ ] **Test: Save disabled for empty note edit with empty textarea**
  - Render with `{ hasNote: false, note: null }`; click "Add a note"
  - Assert: Save button is `disabled` (empty body = unchanged from empty note)

### Task 2 + Task 3 — Save success

Spec scenario: "Save succeeds with optimistic update"

- [ ] **Test: Save calls upsert and returns to read mode**
  - Mock `useMutation` upsert resolving successfully
  - Render with note; enter edit mode; change body to "Updated text"; click Save
  - Assert: `upsert` mutation called with `{ recipeId: "abc123", body: "Updated text" }`
  - Assert: component returns to read mode (textarea gone)
  - Assert: "Updated text" visible in read mode (optimistic update applied)

### Task 2 + Task 3 — Save disabled while pending

Spec scenario: "Save button disabled while mutation is pending"

- [ ] **Test: Save disabled while mutation is in flight**
  - Mock `useMutation` to return `{ isPending: true }`
  - Enter edit mode with a changed body
  - Assert: Save button is `disabled`

### Task 2 + Task 3 — Save failure and rollback

Spec scenario: "Save fails — error shown, optimistic update rolled back"

- [ ] **Test: Save failure shows inline error and rolls back**
  - Mock `useMutation` upsert rejecting with an error message "Server error"
  - Render with note `{ body: "Original text", ... }`; enter edit mode; change body; click Save
  - Assert: inline error message visible (contains "Server error" or generic failure text)
  - Assert: still in edit mode (textarea still visible)
  - Assert: optimistic cache update rolled back (query cache restored to original body)

### Task 2 + Task 3 — Cancel

Spec scenario: "Cancel reverts changes"

- [ ] **Test: Cancel returns to read mode with original body**
  - Render with note `{ body: "Original text", ... }`; enter edit mode; change body to "Something else"; click Cancel
  - Assert: textarea is gone
  - Assert: "Original text" is still shown (unchanged)
  - Assert: upsert mutation was NOT called

- [ ] **Test: Cancel from empty state returns to empty state**
  - Render with `{ hasNote: false, note: null }`; click "Add a note"; type something; click Cancel
  - Assert: textarea is gone
  - Assert: "Add a note" affordance is shown again

### Task 5 — Route integration

Spec scenario: "Notes panel appears in correct position"

- [ ] **Test: PrivateRecipeNotes is rendered in the recipe detail route** (integration-level)
  - Render `RecipeDetailPage` with mocked route params and data
  - Assert: `PrivateRecipeNotes` is mounted in the component tree
  - Assert: it appears after `RecipeDetail` and before the action buttons section
  - *Note: This test is lower priority; manual visual verification is acceptable if wiring test is complex to set up.*

## Test File Location

`src/components/recipes/PrivateRecipeNotes.test.tsx`

## Run Command

```bash
npx vitest run src/components/recipes/PrivateRecipeNotes.test.tsx
```

Or for watch mode during TDD:

```bash
npx vitest src/components/recipes/PrivateRecipeNotes.test.tsx
```
