# password-reset-validation Specification

## Purpose
TBD - created by archiving change verify-password-reset-flow. Update Purpose after archive.
## Requirements
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

