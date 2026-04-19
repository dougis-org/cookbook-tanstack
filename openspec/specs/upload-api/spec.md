## Purpose

Define authenticated recipe image upload and pending-upload deletion behavior for ImageKit-backed storage.

## Requirements

### Requirement: POST /api/upload uploads recipe images to ImageKit

The system SHALL accept an authenticated `multipart/form-data` POST request containing a JPEG, PNG, WebP, or
GIF `file` field, upload the file to ImageKit.io, persist uploaded `fileId` ownership for the authenticated user,
and return `{ url, fileId }`.

#### Scenario: Valid authenticated upload

- **GIVEN** an authenticated user session and a valid image file no larger than 10 MB
- **WHEN** `POST /api/upload` is called with the file as `multipart/form-data`
- **THEN** the response is HTTP 200 with JSON `{ url: string, fileId: string }`

#### Scenario: Unauthenticated upload attempt

- **GIVEN** no valid session
- **WHEN** `POST /api/upload` is called
- **THEN** the response is HTTP 401 with `{ error: "Unauthorized" }`
- **AND** no file is uploaded to ImageKit

#### Scenario: Missing file field

- **GIVEN** an authenticated user
- **WHEN** `POST /api/upload` is called without a `file` field
- **THEN** the response is HTTP 400 with `{ error: "No file provided" }`

#### Scenario: Unsupported file type

- **GIVEN** an authenticated user
- **WHEN** `POST /api/upload` is called with a non-JPEG, non-PNG, non-WebP, or non-GIF file
- **THEN** the response is HTTP 400 with `{ error: "File must be a JPEG, PNG, WebP, or GIF image" }`
- **AND** no file is uploaded to ImageKit

#### Scenario: ImageKit SDK error

- **GIVEN** an authenticated user with a valid image file
- **WHEN** the ImageKit SDK throws during upload
- **THEN** the response is HTTP 500 with `{ error: "Upload failed" }`
- **AND** no partial ownership state is persisted

### Requirement: DELETE /api/upload/:fileId deletes owned pending uploads

The system SHALL accept an authenticated DELETE request, verify the specified `fileId` belongs to the current
user, remove the specified file from ImageKit by `fileId`, and delete the local ownership record.

#### Scenario: Valid authenticated owner delete

- **GIVEN** an authenticated user and an existing ImageKit `fileId` owned by that user
- **WHEN** `DELETE /api/upload/:fileId` is called
- **THEN** the response is HTTP 200 with `{ success: true }`
- **AND** the file is removed from ImageKit

#### Scenario: Unauthenticated delete attempt

- **GIVEN** no valid session
- **WHEN** `DELETE /api/upload/:fileId` is called
- **THEN** the response is HTTP 401 with `{ error: "Unauthorized" }`

#### Scenario: Authenticated non-owner delete attempt

- **GIVEN** an authenticated user and a `fileId` owned by another user or unknown to the system
- **WHEN** `DELETE /api/upload/:fileId` is called
- **THEN** the response is HTTP 403 with `{ error: "Forbidden" }`
- **AND** no ImageKit deletion occurs

#### Scenario: ImageKit file already missing

- **GIVEN** an authenticated user and an owned `fileId` whose ImageKit file no longer exists
- **WHEN** `DELETE /api/upload/:fileId` is called
- **THEN** the response is HTTP 200 with `{ success: true }`
- **AND** the local ownership record is removed

### Requirement: Upload API keeps ImageKit private key server-side

The system SHALL use `IMAGE_KIT_API_KEY` only from server-side upload API code.

#### Scenario: Private key is absent from client bundle

- **GIVEN** a production build has completed
- **WHEN** client assets are searched for `IMAGE_KIT_API_KEY` or its configured value
- **THEN** no client asset contains the private key
