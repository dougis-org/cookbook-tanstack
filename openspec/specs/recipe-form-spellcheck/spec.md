## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../changes/archive/2026-07-06-recipe-form-native-spellcheck/design.md) document, not a replacement.

### Requirement: ADDED Editable text fields in the recipe form enable native spellcheck

The system SHALL enable the native browser `spellcheck` attribute (via the bare `spellCheck` JSX boolean shorthand) on every editable free-text field in `RecipeForm.tsx`: `name` (title), `notes`, `ingredients`, `instructions`.

#### Scenario: Title field spellcheck enabled

- **Given** a user has `RecipeForm` rendered (create or edit mode)
- **When** the `name` (title) text input is inspected
- **Then** it has the attribute `spellcheck="true"`

#### Scenario: Free-text field spellcheck enabled

- **Given** a user has `RecipeForm` rendered (create or edit mode)
- **When** the `notes`, `ingredients`, and `instructions` textareas are inspected
- **Then** each has the attribute `spellcheck="true"`

#### Scenario: Non-text fields are unaffected

- **Given** a user has `RecipeForm` rendered
- **When** numeric inputs (`prepTime`, `cookTime`, `servings`, `calories`, `fat`, `cholesterol`, `sodium`, `protein`) and non-text controls (`classificationId`, `sourceId`, `difficulty` selects, `isPublic` checkbox) are inspected
- **Then** none of them have a `spellCheck` prop added by this change

### Requirement: ADDED No functional regression to recipe form behavior

The system SHALL preserve all existing `react-hook-form` registration, validation, and submission behavior for every field touched by this change.

#### Scenario: Form submission unaffected

- **Given** a user fills out and submits `RecipeForm` in create mode
- **When** the form is submitted
- **Then** the submitted payload and validation behavior are identical to pre-change behavior (no new required/optional field semantics, no changed submit handler)

#### Scenario: No new build or dev-server warnings

- **Given** the updated `RecipeForm.tsx`
- **When** `npm run dev` and `npm run build` are run
- **Then** no new compilation errors or warnings are introduced relative to the pre-change baseline

## MODIFIED Requirements

### Requirement: MODIFIED Recipe form free-text fields use lint-conformant spellcheck syntax

The system SHALL express the `spellCheck` attribute using the bare JSX boolean shorthand (`spellCheck`) rather than the explicit `spellCheck={true}` form, on the `notes`, `ingredients`, and `instructions` fields introduced in PR #570.

#### Scenario: DeepSource antipattern resolved

- **Given** PR #570's `notes`, `ingredients`, and `instructions` fields previously used `spellCheck={true}`
- **When** the fields are updated to the bare `spellCheck` shorthand
- **Then** DeepSource's JavaScript analysis no longer reports the "value must be omitted for boolean attribute `spellCheck`" finding on any of the three lines

## Traceability

- Proposal element: "Add `spellCheck` to `name`, `notes`, `ingredients`, `instructions`" -> Requirement: "ADDED Editable text fields in the recipe form enable native spellcheck"
- Proposal element: "Fix `spellCheck={true}` to bare shorthand" -> Requirement: "MODIFIED Recipe form free-text fields use lint-conformant spellcheck syntax"
- Proposal element: "No regression to form state/validation" -> Requirement: "ADDED No functional regression to recipe form behavior"
- Design decision 1 (bare shorthand) -> Requirement: "MODIFIED Recipe form free-text fields use lint-conformant spellcheck syntax"
- Design decision 2 (title field addition) -> Requirement: "ADDED Editable text fields in the recipe form enable native spellcheck" (Scenario: Title field spellcheck enabled)
- Requirement: "ADDED Editable text fields..." -> Task(s): update `RecipeForm.tsx`, extend `RecipeForm.test.tsx`
- Requirement: "MODIFIED ... lint-conformant spellcheck syntax" -> Task(s): fix existing three fields, resolve DeepSource review threads on PR #570

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: CI and review-thread gating

- **Given** PR #570 has 3 open DeepSource review threads and a failing JavaScript CI check caused by the `spellCheck={true}` antipattern
- **When** the fixes in this change are pushed to the PR's branch
- **Then** the DeepSource JavaScript check reports success and all 3 review threads are explicitly resolved before merge is enabled, per this repo's `required_review_thread_resolution` branch protection rule
