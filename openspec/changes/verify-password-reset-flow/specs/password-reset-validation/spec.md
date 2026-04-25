## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Password Reset Request Verification

The system SHALL verify that the forgot-password UI sends password reset requests using the existing Better Auth client contract and provides clear success and error feedback.

#### Scenario: Forgot-password request uses the reset route

- **Given** a user submits a valid email address in `src/components/auth/ForgotPasswordForm.tsx`
- **When** the form calls the Better Auth client
- **Then** it sends `requestPasswordReset` with `redirectTo` set to `/auth/reset-password`
- **And** the request includes the submitted email address

#### Scenario: Forgot-password request shows a neutral success state

- **Given** the password reset request succeeds
- **When** the form finishes submission
- **Then** the UI shows the existing neutral confirmation message
- **And** it does not reveal whether the email address exists

#### Scenario: Forgot-password request surfaces a client error

- **Given** the Better Auth client returns an error during password reset request
- **When** the form handles the failure
- **Then** the UI shows a human-readable error message

### Requirement: ADDED Password Reset Completion Verification

The system SHALL verify that the reset-password UI and route correctly handle reset tokens and password submission.

#### Scenario: Reset route rejects a missing token

- **Given** a user opens `/auth/reset-password` without a `token` search parameter
- **When** the route renders
- **Then** it shows the invalid-or-missing-token state
- **And** it does not render the reset form

#### Scenario: Reset form submits the new password with the token

- **Given** a user opens `/auth/reset-password?token=valid-token`
- **When** the user submits a valid new password and confirmation
- **Then** the form calls `authClient.resetPassword` with `newPassword` and the route token
- **And** it redirects the user to `/auth/login` on success

#### Scenario: Reset form rejects mismatched passwords

- **Given** a user enters different password and confirmation values
- **When** the form is submitted
- **Then** the UI shows a mismatch error
- **And** it does not call `authClient.resetPassword`

### Requirement: ADDED Issue Closure Traceability

The system SHALL make the GitHub issue relationship explicit when this verification work is delivered.

#### Scenario: Implementation PR closes the issue

- **Given** a PR is opened for the implementation of this change
- **When** the PR body is prepared for review
- **Then** it includes `Closes #341`
- **And** the PR description explains that the feature already existed and this change adds verification and closure evidence

## MODIFIED Requirements

### Requirement: MODIFIED Password Reset Delivery Confidence

The system SHALL treat password reset as incomplete until automated UI verification and manual Mailtrap smoke validation both exist.

#### Scenario: Manual Mailtrap smoke test is recorded

- **Given** valid Mailtrap credentials are available in the environment
- **When** a reviewer or implementer requests a password reset through the UI
- **Then** the reset email is observed in Mailtrap
- **And** the reset link opens the app with a tokenized `/auth/reset-password` URL
- **And** completing the form updates the password successfully

## REMOVED Requirements

### Requirement: REMOVED Password Reset Requires New Architecture

Reason for removal:

- The current repo already contains Better Auth and Mailtrap password reset wiring, so this change does not require a fresh architecture build-out.

## Traceability

- Proposal element -> Requirement:
  - Add focused automated coverage -> ADDED Password Reset Request Verification
  - Validate token handling and reset submission -> ADDED Password Reset Completion Verification
  - Tie delivery back to GitHub issue -> ADDED Issue Closure Traceability
  - Require manual Mailtrap smoke verification -> MODIFIED Password Reset Delivery Confidence
- Design decision -> Requirement:
  - Decision 1 -> REMOVED Password Reset Requires New Architecture
  - Decision 2 -> ADDED Password Reset Request Verification; ADDED Password Reset Completion Verification
  - Decision 3 -> MODIFIED Password Reset Delivery Confidence
  - Decision 4 -> ADDED Issue Closure Traceability
- Requirement -> Task(s):
  - ADDED Password Reset Request Verification -> Task group 1
  - ADDED Password Reset Completion Verification -> Task groups 2 and 3
  - ADDED Issue Closure Traceability -> PR and Merge tasks
  - MODIFIED Password Reset Delivery Confidence -> Validation tasks

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Verification tests stay lightweight

- **Given** the password reset verification suite runs in local development or CI
- **When** the focused auth tests are executed
- **Then** they complete using mocked auth boundaries without depending on live SMTP or inbox polling

### Requirement: Security

#### Scenario: Forgot-password success messaging avoids account enumeration

- **Given** a password reset request is submitted from the forgot-password form
- **When** the request succeeds
- **Then** the UI uses neutral success messaging
- **And** it does not confirm whether the email belongs to an existing user

### Requirement: Reliability

#### Scenario: Mail delivery is validated before issue closure

- **Given** the automated tests pass
- **When** the change is prepared for merge
- **Then** a manual Mailtrap smoke test is completed in an environment with valid credentials
- **And** the result is recorded in the PR validation notes
