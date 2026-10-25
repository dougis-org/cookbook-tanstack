## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED PrivateRecipeNotes buttons are non-submitting

The system SHALL render every button in `PrivateRecipeNotes` (Save, Cancel, Add a note, Edit) with `type="button"` so it never submits an enclosing form.

#### Scenario: Buttons are non-submitting

- **Given** `PrivateRecipeNotes` rendered inside a `<form>` with an `onSubmit` spy
- **When** the user clicks Add a note, Save, Cancel, or Edit
- **Then** the form `onSubmit` spy is never called

### Requirement: ADDED PrivateRecipeNotes supports an embedded variant

The system SHALL accept `variant?: 'detail' | 'embedded'` (default `'detail'`) and an optional `onEditingChange?: (editing: boolean) => void`.

#### Scenario: Default variant unchanged

- **Given** `PrivateRecipeNotes` rendered without `variant`
- **When** it renders for an entitled user
- **Then** the output matches existing detail-page behavior and existing tests pass unmodified

#### Scenario: Embedded variant omits detail-card chrome

- **Given** `variant="embedded"`
- **When** it renders (panel, skeleton, or nudge)
- **Then** the wrapper has no `max-w-4xl`, `rounded-b-lg`, or `shadow-lg` classes and uses `--theme-*` border/surface tokens

#### Scenario: Editing state is reported

- **Given** `onEditingChange` is provided
- **When** the user enters and leaves edit mode
- **Then** the callback is called with `true` then `false`

## Traceability

- Design Decisions 2, 3 -> these requirements
- Requirements -> Tasks: Tasks 1-2 in tasks.md

## Non-Functional Acceptance Criteria

See functional scenarios above; no additional non-functional criteria.
