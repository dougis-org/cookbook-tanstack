## Purpose

Define how recipe forms collect, persist, clear, and clean up recipe image URLs and pending uploads.

## Requirements

### Requirement: RecipeForm renders ImageUploadField

The system SHALL render `ImageUploadField` within `RecipeForm`, wired to `imageUrl` in the form schema and
pending upload state.

#### Scenario: New recipe form shows empty image upload field

- **GIVEN** `RecipeForm` is rendered without `initialData`
- **WHEN** the form is displayed
- **THEN** `ImageUploadField` is visible with an idle empty state
- **AND** no preview is shown

#### Scenario: Edit recipe form pre-populates image from existing data

- **GIVEN** `RecipeForm` is rendered with `initialData.imageUrl`
- **WHEN** the form is displayed
- **THEN** `ImageUploadField` shows the existing image preview
- **AND** pending upload state is empty

### Requirement: RecipeForm validates optional imageUrl

The system SHALL include `imageUrl: z.string().nullable().optional()` in `recipeFormSchema`.

#### Scenario: Schema validates imageUrl as optional or nullable string

- **GIVEN** `recipeFormSchema` validates form data
- **WHEN** the data includes `imageUrl: "https://..."`, `imageUrl: null`, or omits `imageUrl`
- **THEN** validation passes

### Requirement: RecipeForm includes imageUrl in recipe save payloads

The system SHALL include `imageUrl` in create and update mutation payloads when it is set, and SHALL clear it
when the user removes an existing image.

#### Scenario: Recipe created with image

- **GIVEN** the user fills `RecipeForm`, uploads an image, and submits
- **WHEN** the create mutation fires
- **THEN** the payload includes `imageUrl` matching the uploaded ImageKit URL

#### Scenario: Recipe updated with image

- **GIVEN** the user edits a recipe, uploads an image, and submits
- **WHEN** the update mutation fires
- **THEN** the payload includes `imageUrl` matching the uploaded ImageKit URL

#### Scenario: Recipe saved without image

- **GIVEN** the user fills `RecipeForm` without uploading an image
- **WHEN** the mutation fires
- **THEN** `imageUrl` is omitted or null according to existing form behavior

#### Scenario: Existing recipe image removed

- **GIVEN** the user edits a recipe with an existing `imageUrl`
- **WHEN** the user removes the image and submits
- **THEN** the update payload includes `imageUrl: null`
- **AND** the recipe document has `imageUrl` cleared

### Requirement: RecipeForm deletes pending upload on confirmed navigation-away

The system SHALL delete a pending upload when the user navigates away from the form with unsaved changes and confirms leaving.

#### Scenario: User uploads image then navigates away and confirms

- **GIVEN** the user has uploaded an image and has not saved
- **WHEN** the user triggers navigation away and confirms through the blocker dialog
- **THEN** `DELETE /api/upload/:fileId` is called for the pending `fileId`
- **AND** navigation proceeds

#### Scenario: User uploads image then cancels navigation-away

- **GIVEN** the user has uploaded an image and triggers navigation away
- **WHEN** the user cancels the blocker dialog
- **THEN** no DELETE request is made
- **AND** pending upload state is unchanged
- **AND** the user remains on the form

### Requirement: RecipeForm deletes pending upload on revert

The system SHALL delete the pending upload when the user clicks Revert in edit mode.

#### Scenario: User uploads image then reverts

- **GIVEN** the user is editing a recipe and has uploaded a new pending image
- **WHEN** the user clicks Revert
- **THEN** `DELETE /api/upload/:fileId` is called
- **AND** `imageUrl` reverts to `initialData.imageUrl`
- **AND** pending upload state is cleared

### Requirement: RecipeForm preserves existing saved images on cancel

The system SHALL NOT delete existing saved recipe images when no new pending upload exists.

#### Scenario: Existing saved imageUrl not deleted on cancel

- **GIVEN** the user edits a recipe with `initialData.imageUrl` set and has not uploaded a new image
- **WHEN** the user cancels or navigates away
- **THEN** no DELETE request is made
- **AND** the existing ImageKit image is unaffected
