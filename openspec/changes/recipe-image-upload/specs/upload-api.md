# Spec: Upload API Routes

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED POST /api/upload — upload file to ImageKit

The system SHALL accept a `multipart/form-data` POST request containing a `file` field, upload it to ImageKit.io,
and return `{ url, fileId }`.

#### Scenario: Valid authenticated upload

- **Given** an authenticated user session and a valid image file ≤ 10 MB
- **When** `POST /api/upload` is called with the file as `multipart/form-data`
- **Then** the response is HTTP 200 with JSON `{ url: string, fileId: string }` where `url` is the ImageKit CDN URL

#### Scenario: Unauthenticated upload attempt

- **Given** no valid session (missing or expired cookie)
- **When** `POST /api/upload` is called
- **Then** the response is HTTP 401 with `{ error: "Unauthorized" }` and no file is uploaded to ImageKit

#### Scenario: Missing file field

- **Given** an authenticated user
- **When** `POST /api/upload` is called with empty form data (no `file` field)
- **Then** the response is HTTP 400 with `{ error: "No file provided" }`

#### Scenario: ImageKit SDK error

- **Given** an authenticated user with a valid file
- **When** the ImageKit SDK throws during upload
- **Then** the response is HTTP 500 with `{ error: "Upload failed" }` and no partial state is left

### Requirement: ADDED DELETE /api/upload/:fileId — delete file from ImageKit

The system SHALL accept an authenticated DELETE request and remove the specified file from ImageKit by fileId.

#### Scenario: Valid authenticated delete

- **Given** an authenticated user and an existing ImageKit fileId
- **When** `DELETE /api/upload/:fileId` is called
- **Then** the response is HTTP 200 with `{ success: true }` and the file is removed from ImageKit

#### Scenario: Unauthenticated delete attempt

- **Given** no valid session
- **When** `DELETE /api/upload/:fileId` is called
- **Then** the response is HTTP 401 with `{ error: "Unauthorized" }`

#### Scenario: FileId not found in ImageKit

- **Given** an authenticated user and a fileId that does not exist in ImageKit
- **When** `DELETE /api/upload/:fileId` is called
- **Then** the response is HTTP 404 with `{ error: "File not found" }`

## MODIFIED Requirements

No existing requirements modified.

## REMOVED Requirements

No requirements removed.

## Traceability

- Proposal: "Upload endpoint — separate Nitro route" → Requirement: ADDED POST /api/upload
- Proposal: "Option B orphan cleanup" → Requirement: ADDED DELETE /api/upload/:fileId
- Proposal: "API key never client-side" → Non-Functional: Security scenarios
- Design Decision 1 (Nitro routes, not tRPC) → Both ADDED requirements
- Design Decision 5 (auth via Better-Auth session) → Unauthenticated scenarios
- Requirements → Tasks: task-1 (POST route), task-2 (DELETE route)

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: IMAGE_KIT_API_KEY not in client bundle

- **Given** the production build is complete (`npm run build`)
- **When** the client bundle output is searched for `IMAGE_KIT_API_KEY` or the API key value
- **Then** no match is found — the key appears only in server-side Nitro output

#### Scenario: Only authenticated users can delete files

- **Given** an unauthenticated request
- **When** `DELETE /api/upload/:fileId` is called
- **Then** HTTP 401 is returned and no ImageKit deletion occurs

### Requirement: Reliability

#### Scenario: Upload route handles ImageKit timeout gracefully

- **Given** ImageKit SDK call times out or throws a network error
- **When** `POST /api/upload` is processing
- **Then** HTTP 500 is returned with `{ error: "Upload failed" }`; no partial state persisted
