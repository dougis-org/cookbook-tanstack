# Spec: RecipeForm Image Integration

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED RecipeForm renders ImageUploadField

The system SHALL render `ImageUploadField` within `RecipeForm`, wired to `imageUrl` in the form schema and
`pendingUpload` state.

#### Scenario: New recipe form shows empty image upload field

- **Given** `RecipeForm` rendered without `initialData`
- **When** the form is displayed
- **Then** `ImageUploadField` is visible with idle/empty state (no preview)

#### Scenario: Edit recipe form pre-populates image from existing data

- **Given** `RecipeForm` rendered with `initialData` containing a non-null `imageUrl`
- **When** the form is displayed
- **Then** `ImageUploadField` shows the existing image preview; `pendingUpload` is `null`

### Requirement: ADDED Pending upload deleted on navigation-away (blocker)

The system SHALL delete the pending upload when the user navigates away from the form with unsaved changes and
confirms leaving.

#### Scenario: User uploads image then navigates away and confirms

- **Given** user has uploaded an image (`pendingUpload` set) and has not saved
- **When** user triggers navigation away and confirms via the blocker dialog
- **Then** `DELETE /api/upload/:fileId` is called with the pending fileId before navigation proceeds

#### Scenario: User uploads image then navigates away but cancels

- **Given** user has uploaded an image and triggers navigation away
- **When** user clicks "Cancel" in the blocker dialog (stays on page)
- **Then** no DELETE is called; `pendingUpload` is unchanged; user remains on form

### Requirement: ADDED Pending upload deleted on revert (edit mode)

The system SHALL delete the pending upload when the user clicks Revert in edit mode.

#### Scenario: User uploads image then reverts

- **Given** user is in edit mode, has uploaded a new image (`pendingUpload` set)
- **When** user clicks the Revert button
- **Then** `DELETE /api/upload/:fileId` is called, `imageUrl` reverts to `initialData.imageUrl`, `pendingUpload` is cleared

### Requirement: ADDED imageUrl included in recipe save payload

The system SHALL include `imageUrl` in both create and update mutation payloads when set.

#### Scenario: Recipe created with image

- **Given** user fills RecipeForm, uploads an image (imageUrl set), and submits
- **When** `recipes.create` mutation fires
- **Then** payload includes `imageUrl` matching the ImageKit URL; DB document has imageUrl set

#### Scenario: Recipe saved without image (imageUrl null/undefined)

- **Given** user fills RecipeForm without uploading an image
- **When** mutation fires
- **Then** `imageUrl` is omitted or null in payload; existing DB behavior unchanged

## MODIFIED Requirements

### Requirement: MODIFIED RecipeFormValues zod schema

The system SHALL include `imageUrl: z.string().optional()` in `recipeFormSchema`.

#### Scenario: Schema validates imageUrl as optional string

- **Given** `recipeFormSchema` is applied
- **When** form data includes `imageUrl: "https://..."` (or omits it)
- **Then** validation passes in both cases

## REMOVED Requirements

No requirements removed.

## Traceability

- Proposal: "RecipeForm has no imageUrl field" (gap) → Requirement: ADDED RecipeForm renders ImageUploadField
- Proposal: "Option B — cleanup on cancel/blocker/revert" → ADDED Pending upload deleted on navigation-away,
  ADDED Pending upload deleted on revert
- Design Decision 3 (pendingUpload state) → ADDED RecipeForm renders ImageUploadField, ADDED imageUrl in save payload
- Design Decision 4 (Option B cleanup) → ADDED navigate-away and revert scenarios
- Requirements → Tasks: task-4 (recipeFormSchema), task-5 (RecipeForm integration), task-6
  (blocker/revert cleanup)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: DELETE on cancel is non-blocking

- **Given** user confirms navigation-away after uploading
- **When** `DELETE /api/upload/:fileId` is called
- **Then** navigation proceeds immediately; DELETE runs fire-and-forget (does not delay route transition)

### Requirement: Security

#### Scenario: Existing saved imageUrl not deleted on cancel

- **Given** user is editing a recipe with `initialData.imageUrl` set, and has NOT uploaded a new image
- **When** user cancels or navigates away
- **Then** no DELETE request is made; existing image in ImageKit is unaffected
