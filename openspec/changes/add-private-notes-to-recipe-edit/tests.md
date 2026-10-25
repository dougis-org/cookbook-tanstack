---
name: tests
description: Tests for add-private-notes-to-recipe-edit
---

# Tests

## Overview

This document outlines the tests for the `add-private-notes-to-recipe-edit` change. All work follows strict TDD.

## Testing Steps

For each task in `openspec/changes/add-private-notes-to-recipe-edit/tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

Test files: `src/components/recipes/PrivateRecipeNotes.test.tsx`, `src/components/recipes/__tests__/RecipeForm.test.tsx`, `src/e2e/recipes-crud.spec.ts` (or sibling spec). Run single files with `npx vitest run <path>`.

## Test Cases

### Task 1 — non-submitting buttons (spec: private-recipe-notes-component "Buttons are non-submitting")

- [ ] T1: Render `PrivateRecipeNotes` inside `<form onSubmit={spy}>`; click Add a note, Save, Cancel, and Edit; assert spy never called.

### Task 2 — variant / onEditingChange (spec: private-recipe-notes-component)

- [ ] T2a: Default variant renders unchanged (existing tests pass unmodified; wrapper keeps `max-w-4xl` and `rounded-b-lg`).
- [ ] T2b: `variant="embedded"` wrapper lacks `max-w-4xl`, `rounded-b-lg`, `shadow-lg` for panel, skeleton, and each nudge state.
- [ ] T2c: `onEditingChange` called with `true` on entering edit mode and `false` on cancel and on successful save.

### Task 3 — panel / hint in RecipeForm (spec: recipe-edit-private-notes)

- [ ] T3a: Edit mode, entitled user: "Private Notes" panel rendered below the Notes field.
- [ ] T3b: Create mode: hint "Save this recipe first to add private notes." shown; `privateRecipeNotes.get` not called.
- [ ] T3c: Edit mode, below-tier, no note: "below-tier" nudge shown; no textarea; no Move button.
- [ ] T3d: Edit mode, below-tier, `hasNote: true`: "hidden-by-downgrade" nudge; no note body in DOM.
- [ ] T3e: Clicking panel Save calls `privateRecipeNotes.upsert` and does NOT call `recipes.update`.
- [ ] T3f: All pre-existing RecipeForm tests pass unmodified.

### Task 4 — Move to Private Notes (spec: recipe-edit-private-notes "Move to Private Notes")

- [ ] T4a: No existing private note: upsert body equals public notes; on success Notes field is empty and form is dirty.
- [ ] T4b: Existing private note: upsert body is `existing + "\n\n" + public`.
- [ ] T4c: Upsert rejects: public Notes unchanged, inline error shown.
- [ ] T4d: Combined length > 10000: upsert not called, error shown, public unchanged.
- [ ] T4e: Button hidden when public notes empty/whitespace, below tier, or create mode.
- [ ] T4f: Button disabled while panel is in edit mode (via `onEditingChange`).
- [ ] T4g: After a successful Move, autosave/submit sends `notes` empty (assert `recipes.update` payload).
- [ ] T4h: Cache invalidated: panel shows the moved text in read mode after success.

### Task 5 — E2E (spec: recipe-edit-private-notes; NFAC theming)

- [ ] E1: Sous Chef owner opens edit screen, adds a private note via the panel, reloads detail page, note visible; recipe fields unchanged.
- [ ] E2: Owner with public notes clicks "Move to Private Notes", saves recipe; detail page shows private note and no public notes.
- [ ] E3: Below-tier user sees the upgrade nudge on the edit screen.
- [ ] E4: `/recipes/new` shows the save-first hint.

### Task 6 — follow-up issue

- [ ] F1: Follow-up issue exists and is linked in the PR body (manual check at PR time).

### Non-functional

- [ ] N1: Manual check of all four themes for panel, hint, Move action; grep diff for hard-coded hex/slate/cyan classes and emoji (none).
