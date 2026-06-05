## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Reusable Email Layout & Styling System

The system SHALL render all React-based emails with a dark Slate background, cyan highlights, clean font stacks, a centralized logo, and a footer with a link to the main site.

#### Scenario: Render layout with correct color theme

- **Given** a React-based email template wrapping the base `Layout` component
- **When** compiled via `@react-email/render`
- **Then** the resulting HTML contains inline styles specifying a dark slate background (`#0f172a` or `#1e293b`), white text, and a cyan accent color (`#22d3ee` or `#06b6d4`) for call-to-action buttons.

### Requirement: ADDED Specialized Tier Notification Emails

The system SHALL send a specialized, styled email notification when a user's culinary tier is modified (upgraded or downgraded) by an administrator.

#### Scenario: Trigger tier notification email on mutation

- **Given** an admin user logged in and a target user with a `home-cook` tier
- **When** the admin calls `admin.users.setTier` with `tier: "executive-chef"` for the target user
- **Then** the database is updated, content reconciliation is executed, and a `TierNotificationEmail` is sent asynchronously to the target user's email containing details of the Executive Chef tier benefits (2500 recipes, 200 cookbooks, and pricing of $9.99/mo).

## MODIFIED Requirements

### Requirement: MODIFIED Auth Verification and Password Reset Emails

The system SHALL send React Email templates instead of plain HTML strings for verification and password reset actions.

#### Scenario: Send verification email on sign up

- **Given** a new user registering an account
- **When** the registration process triggers the verification email callback
- **Then** the system compiles `VerificationEmail` into HTML and text using `@react-email/render` and delivers it via `sendEmail` with a valid verification link.

#### Scenario: Send password reset email on request

- **Given** a user requesting a password reset
- **When** the reset flow triggers the `sendResetPassword` callback
- **Then** the system compiles `PasswordResetEmail` into HTML and text using `@react-email/render` and delivers it via `sendEmail` with the reset URL and expiration warning.

## REMOVED Requirements

### Requirement: REMOVED Primitive plain HTML verification/reset messages

- **Reason for removal:** Replaced by responsive React Email components to improve user presentation, testing capability, and maintenance.

## Traceability

- **Proposal element:** Add dependencies -> **Requirement:** ADDED Reusable Email Layout & Styling System
- **Proposal element:** Implement Tier Notification template -> **Requirement:** ADDED Specialized Tier Notification Emails
- **Proposal element:** Implement Email Verification / Password Reset templates -> **Requirement:** MODIFIED Auth Verification and Password Reset Emails
- **Design decision:** Decision 1 -> **Requirement:** ADDED Reusable Email Layout & Styling System
- **Design decision:** Decision 2 -> **Requirement:** ADDED Reusable Email Layout & Styling System
- **Design decision:** Decision 3 -> **Requirement:** MODIFIED Auth Verification and Password Reset Emails
- **Design decision:** Decision 4 -> **Requirement:** ADDED Specialized Tier Notification Emails

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Compilation failure handling

- **Given** a compilation failure in the `@react-email/render` engine (e.g. invalid component tree)
- **When** `sendEmail` is called with a React element
- **Then** the system catches the error, logs it to console/errors, and degrades gracefully by falling back to text (or refusing to send, without throwing a generic uncaught rejection that crashes the main process).

### Requirement: Performance

#### Scenario: Async non-blocking delivery

- **Given** a tRPC request triggering a transactional email (e.g. tier mutation)
- **When** the action completes database writes
- **Then** the request is resolved to the client immediately, and the email compilation/SMTP delivery runs in the background without blocking the HTTP response thread.
