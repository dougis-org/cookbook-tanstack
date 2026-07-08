---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `recipe-form-source-picker` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1 — `sources.listPage` server procedure

- [ ] Given >100 `Source` documents, `sources.listPage({ cursor: 0 })` returns exactly 100 items sorted by `name` ascending, plus a non-null `nextCursor` — maps to spec scenario "listPage returns a bounded, sorted page"
- [ ] Given fewer than `limit` remaining documents, `sources.listPage` returns the remainder and `nextCursor: null`
- [ ] `sources.listPage({ cursor: -1 })` is rejected by input validation before querying MongoDB — maps to spec scenario "listPage rejects invalid pagination input"
- [ ] `sources.listPage({ limit: 101 })` is rejected by input validation before querying MongoDB — maps to spec scenario "listPage rejects invalid pagination input"
- [ ] `sources.list`'s existing test suite passes unmodified, confirming no behavior drift — maps to spec scenario "sources.list and the recipes filter bar are unaffected"

### Task 2 — Bound `sources.search`

- [ ] Given >10 matching `Source` documents, `sources.search({ query })` with no explicit `limit` returns up to 100 results sorted by `name` ascending — maps to spec scenario "search returns up to the validated limit, sorted by name"
- [ ] `sources.search({ query: "" })` is rejected by input validation — maps to spec scenario "search rejects invalid query or limit input"
- [ ] `sources.search({ query: "x".repeat(256) })` is rejected by input validation — maps to spec scenario "search rejects invalid query or limit input"
- [ ] `sources.search({ query: "a", limit: 0 })` and `sources.search({ query: "a", limit: 101 })` are both rejected by input validation — maps to spec scenario "search rejects invalid query or limit input"

### Task 3 — `PaginatedSingleSelectDropdown` primitive

- [ ] Opening the dropdown triggers exactly one call to the injected page-fetcher with the initial cursor, and renders returned items in the order received — maps to spec scenario "Opening the picker loads the first page of sources"
- [ ] Scrolling the open listbox to its bottom (with a full first page loaded) triggers a second page-fetcher call with the next cursor, and appends results after existing items without reordering them — maps to spec scenario "Scrolling to the bottom loads the next page"
- [ ] Typing into the search input, after the debounce interval, calls the injected search-fetcher and replaces the displayed list with its results — maps to spec scenario "Typing a query performs a server-side search"
- [ ] Starting a search while a browsing-mode next-page fetch is in flight, then resolving the stale page fetch after the search resolves, results in the displayed list reflecting only the search results (stale response discarded) — maps to spec scenario "Switching between browsing and searching does not show stale results"
- [ ] Clearing the search input after viewing search results restores the previously-loaded browsing-mode pages without a new page-1 fetch — maps to spec scenario "Clearing the search query resumes browsing mode"
- [ ] With no scroll or search interaction after opening, only one page-fetcher call has occurred and at most 100 items are held in component state — maps to NFAC scenario "Initial load is bounded to one page"

### Task 4 — `RecipeSourcePicker` composite component

- [ ] Selecting the option resolving to `slug === "personal"` reveals a "Personal Name" input with placeholder "e.g. Aunt Mary", `maxLength=80`, and helper text "Only you can see this." — maps to spec scenario "Selecting Personal reveals the personal name field"
- [ ] Selecting a different (non-personal) source after "Personal Name" is visible removes the input and helper text from the DOM — maps to spec scenario "Selecting a non-personal source hides the personal name field"
- [ ] Typing "Grandma's recipe book" into the visible "Personal Name" input invokes `onPersonalSourceNameChange("Grandma's recipe book")` — maps to spec scenario "Typing a personal source name invokes the callback"
- [ ] Changing the selected source away from "personal" does not invoke `onPersonalSourceNameChange` with an empty string (retains prior value in parent state) — regression check carried over from retired `source-selector` capability
- [ ] Clearing the selected source does not invoke `onPersonalSourceNameChange` with an empty string — regression check carried over from retired `source-selector` capability
- [ ] The rendered dropdown trigger and listbox markup follow the same click-to-open/sorted pattern as `CategoryPickerDropdown` (structural parity check) — maps to spec scenario "Source dropdown opens sorted alphabetically"

### Task 5 — `AddSourceModal` standalone create flow

- [ ] The "Add New Source" button's DOM node is not a descendant of the dropdown's `role="listbox"` container or its popover wrapper — maps to spec scenario "Add New Source opens a standalone creation modal"
- [ ] Activating "Add New Source" with prior picker search text "Bon Appetit Magazine" opens the modal with the name field pre-filled to "Bon Appetit Magazine" — maps to spec scenario "Typed search text pre-fills the creation modal"
- [ ] Submitting the modal with a valid name, given a mocked successful `sources.create`, closes the modal, sets the picker's selected value to the created source, and triggers invalidation of `sources.listPage`/`sources.search` query caches — maps to spec scenario "Creating a source selects it and closes the modal"
- [ ] With a search query typed that matches zero results, the empty-results state in the dropdown popover contains no inline "Create `<name>`" option — maps to spec scenario "No inline create-on-type affordance remains"

### Task 6 — Wire `RecipeForm.tsx` to the new picker and remove `SourceSelector`

- [ ] `RecipeForm` renders `RecipeSourcePicker` (not `SourceSelector`) for the Source field, and submitting the form includes `sourceId`/`personalSourceName` in the mutation payload as before
- [ ] `RecipeForm`'s Category field still renders `CategoryPickerDropdown` unchanged, with no "Add New" affordance present — maps to spec scenario "Category field behavior is unchanged"
- [ ] After this task, no remaining source imports/usages of `src/components/ui/SourceSelector.tsx` exist in the codebase (grep-verified), and its dedicated test file is removed

### Task 7 — E2E coverage

- [ ] `personal-source-privacy.spec.ts` (or its extension) asserts, via direct tRPC response inspection, that `personalSourceName` is absent from responses to unauthorized viewers when the new `RecipeSourcePicker` path is used — maps to NFAC scenario "Personal source name is not exposed to unauthorized viewers"
- [ ] E2E: open the recipe edit form, open the Source dropdown, select an existing source, save, and confirm persistence
- [ ] E2E: open the recipe edit form, use "Add New Source" to create a source, confirm it is selected and the recipe saves with the new `sourceId`
- [ ] E2E: confirm the Category field's existing edit flow (select/save a classification) still passes unmodified
