## Purpose

Define the reusable recipe image upload field behavior for inline uploads, preview, removal, replacement, and
validation.

## Requirements

### Requirement: ImageUploadField uploads selected images inline

The `ImageUploadField` component SHALL upload a selected recipe image to `/api/upload` immediately on file
selection and display a preview once the upload completes.

#### Scenario: User selects a valid image file

- **GIVEN** `ImageUploadField` is rendered with no current image
- **WHEN** the user selects a JPEG, PNG, WebP, or GIF file no larger than 10 MB
- **THEN** a loading state is shown
- **AND** a `POST /api/upload` request is made with the file as `multipart/form-data`
- **AND** the returned URL is shown as an image preview
- **AND** `onUpload(url, fileId)` is called

#### Scenario: Upload fails with server error

- **GIVEN** `ImageUploadField` is rendered with no current image
- **WHEN** the user selects a valid file but `/api/upload` returns a non-2xx response
- **THEN** no preview is shown
- **AND** an inline error message is displayed
- **AND** `onUpload` is not called

### Requirement: ImageUploadField validates file size before upload

The component SHALL reject files larger than 10 MB before any network request is made.

#### Scenario: User selects oversized file

- **GIVEN** `ImageUploadField` is rendered
- **WHEN** the user selects a file larger than 10 MB
- **THEN** an inline error `File must be under 10 MB` is shown
- **AND** no upload request is made
- **AND** component image state is unchanged

### Requirement: ImageUploadField removes current images

The component SHALL allow the user to remove the current image, whether it is a pending upload or an existing saved URL.

#### Scenario: User removes a pending upload

- **GIVEN** the user has uploaded a new image and the component has a pending `fileId`
- **WHEN** the user clicks Remove
- **THEN** a `DELETE /api/upload/:fileId` request is made
- **AND** the preview is cleared
- **AND** `onRemove` is called

#### Scenario: User removes an existing saved image URL

- **GIVEN** the field is initialized with a saved URL and no pending `fileId`
- **WHEN** the user clicks Remove
- **THEN** no DELETE request is made
- **AND** the preview is cleared
- **AND** `onRemove` is called

### Requirement: ImageUploadField replaces pending uploads

The component SHALL delete the previous pending upload when the user selects a new image before saving.

#### Scenario: User uploads a second image

- **GIVEN** the user already uploaded image A and it has pending `fileId` A
- **WHEN** the user selects image B
- **THEN** `DELETE /api/upload/A` is called
- **AND** image B is uploaded
- **AND** the preview and pending `fileId` are updated to image B

### Requirement: ImageUploadField upload errors do not block form submission

The component SHALL keep the surrounding recipe form usable after upload failure.

#### Scenario: Upload fails but recipe form remains usable

- **GIVEN** `/api/upload` returns a server error
- **WHEN** the upload fails
- **THEN** the field shows an error
- **AND** the surrounding form remains submittable without an image URL
