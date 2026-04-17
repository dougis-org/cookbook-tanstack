## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Transactional Email Service

The system SHALL provide a centralized `sendEmail` utility that allows sending plain-text and HTML emails via SMTP.

#### Scenario: Successfully send a plain-text email

- **Given** valid `MAILTRAP_*` credentials in the environment.
- **When** the `sendEmail` utility is called with a destination address, subject, and text content.
- **Then** `nodemailer` successfully establishes a connection and delivers the message to the Mailtrap sandbox.
- **And** the function returns a successful response metadata.

#### Scenario: Handle SMTP connection failure

- **Given** invalid SMTP credentials or network unavailability.
- **When** the `sendEmail` utility is called.
- **Then** the utility throws or returns an error indicating the failure.

### Requirement: ADDED BetterAuth Email Hooks

The system SHALL trigger the configured `sendEmail` utility during password reset and email verification events initiated by BetterAuth.

#### Scenario: BetterAuth triggers password reset email

- **Given** a user requests a password reset via the `authClient`.
- **When** BetterAuth generates a reset token and URL.
- **Then** the `sendResetPassword` hook fires.
- **And** it calls the foundational `sendEmail` utility with the reset URL.
- **And** the email arrives in the Mailtrap inbox.

#### Scenario: BetterAuth triggers email verification

- **Given** a new user registers an account.
- **When** BetterAuth generates a verification token.
- **Then** the `sendVerificationEmail` hook fires.
- **And** it calls the foundational `sendEmail` utility with the verification URL.

## Traceability

- **Proposal element** (Shared email utility) -> **Requirement**: Transactional Email Service.
- **Design decision** (Decision 1: Nodemailer SMTP) -> **Requirement**: Transactional Email Service.
- **Design decision** (Decision 2: Fire-and-forget) -> **Requirement**: BetterAuth Email Hooks.
- **Requirement** (Transactional Email Service) -> **Task**: Implement src/lib/mail.ts.
- **Requirement** (BetterAuth Email Hooks) -> **Task**: Update src/lib/auth.ts.

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Credentials are not hardcoded

- **Given** the source code is reviewed.
- **When** checking `src/lib/mail.ts` and `src/lib/auth.ts`.
- **Then** no SMTP passwords or API keys are found as literal strings.
- **And** all sensitive values are retrieved via `process.env`.

### Requirement: Performance

#### Scenario: Auth response time remains low

- **Given** a user is registering an account.
- **When** the verification email is triggered.
- **Then** the HTTP response from the registration API is returned within 500ms (on local/staging), regardless of SMTP latency.

### Requirement: Reliability

#### Scenario: Environment variable validation

- **Given** the server is starting up.
- **When** `MAILTRAP_HOST` is missing.
- **Then** the system logs a clear warning or error about missing email configuration.
