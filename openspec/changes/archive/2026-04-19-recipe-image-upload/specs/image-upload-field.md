# Spec: ImageUploadField Component

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Image file selection and inline upload

The system SHALL upload the selected image file to `/api/upload` immediately on file selection and display a
preview once the upload completes.

#### Scenario: User selects a valid image file

- **Given** `ImageUploadField` is rendered with no current image
- **When** the user selects a JPEG/PNG/WebP/GIF file ≤ 10 MB via the file input
- **Then** a loading spinner is shown, a `POST /api/upload` request is made with the file as
  `multipart/form-data`, and once the response resolves the image preview is rendered using the returned URL

#### Scenario: Upload fails with server error

- **Given** `ImageUploadField` is rendered with no current image
- **When** the user selects a valid file but `/api/upload` returns a non-2xx response
- **Then** no preview is shown, an inline error message is displayed, and `onUpload` callback is not called

### Requirement: ADDED File size validation before upload

The system SHALL reject files larger than 10 MB before any network request is made.

#### Scenario: User selects oversized file

- **Given** `ImageUploadField` is rendered
- **When** the user selects a file > 10 MB
- **Then** an inline error "File must be under 10 MB" is shown, no upload request is made, and component state is unchanged

### Requirement: ADDED Remove uploaded image

The system SHALL allow the user to remove the current image (whether pending upload or existing URL).

#### Scenario: User removes a pending upload

- **Given** the user has uploaded a new image (pendingUpload set)
- **When** the user clicks the Remove button
- **Then** a `DELETE /api/upload/:fileId` request is made, the preview is cleared, and `onRemove` callback is called

#### Scenario: User removes an existing saved image URL (no fileId)

- **Given** the field is initialised with a URL from `initialData` (no pendingUpload)
- **When** the user clicks the Remove button
- **Then** no DELETE request is made, the preview is cleared, and `onRemove` callback is called

### Requirement: ADDED Replace pending upload

The system SHALL delete the previously pending upload when the user selects a new file before saving.

#### Scenario: User uploads a second image

- **Given** the user already uploaded image A (pendingUpload = { fileId: "A", url: "..." })
- **When** the user selects a new image file B
- **Then** `DELETE /api/upload/A` is called, image B is uploaded, and pendingUpload is updated to image B's fileId

## MODIFIED Requirements

### Requirement: MODIFIED RecipeForm accepts and submits imageUrl

The system SHALL include `imageUrl` in the recipe form schema and pass it to `recipes.update` /
`recipes.create` mutations on save.

#### Scenario: Recipe saved with image

- **Given** the user uploaded an image in `RecipeForm` (imageUrl set in form state)
- **When** the user submits the form
- **Then** `imageUrl` is included in the tRPC mutation payload and the recipe document in MongoDB has
  `imageUrl` set to the ImageKit URL

## REMOVED Requirements

No requirements removed.

## Traceability

- Proposal: "inline upload with preview" → Requirement: ADDED Image file selection and inline upload
- Proposal: "10 MB limit" → Requirement: ADDED File size validation before upload
- Proposal: "Option B orphan cleanup — replace" → Requirement: ADDED Replace pending upload
- Design Decision 3 (inline upload + pendingUpload state) → Requirement: ADDED Image file selection and inline upload
- Design Decision 4 (Option B cleanup) → Requirement: ADDED Replace pending upload, ADDED Remove uploaded image
- Requirements → Tasks: task-3 (ImageUploadField component), task-5 (RecipeForm integration)

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Upload completes within reasonable time

- **Given** a 5 MB image file and a normal network connection
- **When** the user selects the file
- **Then** the upload completes and the preview renders within 5 seconds (ImageKit upload latency, not
  app-controllable — spinner shown throughout)

### Requirement: Security

#### Scenario: Upload request rejected without session

- **Given** an unauthenticated request (no session cookie)
- **When** a POST is made to `/api/upload`
- **Then** the response is HTTP 401 and no file is uploaded to ImageKit

### Requirement: Reliability

#### Scenario: Upload error does not block form submission

- **Given** `/api/upload` returns a 500 error
- **When** the upload fails
- **Then** the form remains fully submittable without an image; the user can still save the recipe (without imageUrl)
