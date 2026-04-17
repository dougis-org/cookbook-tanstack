## Context

- **Relevant architecture**: TanStack Start (SSR) with BetterAuth v1 for authentication. Data layer is MongoDB/Mongoose.
- **Dependencies**: 
    - `better-auth`: Auth framework.
    - `nodemailer`: SMTP client (to be added).
    - `dotenv`: For local environment variables.
- **Interfaces/contracts touched**: 
    - `src/lib/auth.ts`: BetterAuth configuration.
    - `.env`: Environment configuration.

## Goals / Non-Goals

### Goals

- Establish a reliable SMTP connection to Mailtrap.
- Provide a unified `sendEmail` helper for the entire server.
- Enable Password Reset and Email Verification hooks in BetterAuth.

### Non-Goals

- Implementing React-based email templates (HTML strings will be used for now).
- Tracking email delivery status in the database.

## Decisions

### Decision 1: Use Nodemailer for SMTP Transport

- **Chosen**: `nodemailer` library with SMTP configuration.
- **Alternatives considered**: Mailtrap SDK/API, Resend SDK.
- **Rationale**: SMTP via Nodemailer is highly portable and follows the explicit requirement in #344. It allows for easy mocking in tests.
- **Trade-offs**: Slightly more configuration than a proprietary SDK, but more standard.

### Decision 2: Fire-and-Forget for Transactional Hooks

- **Chosen**: Do not `await` the `sendEmail` call within BetterAuth hooks.
- **Alternatives considered**: Await email sending, use a message queue (Redis/BullMQ).
- **Rationale**: BetterAuth recommends not awaiting to prevent timing attacks and latency issues. A queue is overkill for the current prototype stage.
- **Trade-offs**: Emails might fail silently if the SMTP connection drops; however, this is acceptable for the foundational stage.

### Decision 3: Centralized `MailOptions` Utility

- **Chosen**: A reusable `src/lib/mail.ts` that exports a `sendEmail` function.
- **Rationale**: Prevents duplication across BetterAuth hooks and future notification services (e.g., #333).

## Proposal to Design Mapping

- **Proposal element**: Shared email utility
  - **Design decision**: Decision 3 (src/lib/mail.ts)
  - **Validation approach**: Unit test with a mock SMTP transport.
- **Proposal element**: Mailtrap SMTP transport
  - **Design decision**: Decision 1 (nodemailer)
  - **Validation approach**: Integration test with Mailtrap sandbox credentials.
- **Proposal element**: BetterAuth hooks
  - **Design decision**: Decision 2 (fire-and-forget)
  - **Validation approach**: Manual verification of email arrival in Mailtrap dashboard.

## Functional Requirements Mapping

- **Requirement**: Send password reset email
  - **Design element**: `emailAndPassword.sendResetPassword` hook in `auth.ts`.
  - **Acceptance criteria reference**: `mailtrap-email-foundation/specs/foundation.md`
  - **Testability notes**: Verify hook is triggered when calling `authClient.forgotPassword`.
- **Requirement**: Send verification email
  - **Design element**: `emailVerification.sendVerificationEmail` hook in `auth.ts`.
  - **Acceptance criteria reference**: `mailtrap-email-foundation/specs/foundation.md`
  - **Testability notes**: Verify hook is triggered on user registration.

## Non-Functional Requirements Mapping

- **Requirement category**: Security
  - **Requirement**: Prevent credential leakage.
  - **Design element**: Use `process.env` and update `.env.example`.
  - **Acceptance criteria reference**: CI secrets check.
- **Requirement category**: Performance
  - **Requirement**: Do not block auth response.
  - **Design element**: Fire-and-forget `sendEmail` calls.
  - **Testability notes**: Measure API response time with/without email triggered.

## Risks / Trade-offs

- **Risk/trade-off**: SMTP connection pooling.
  - **Impact**: Creating a new connection per email can be slow.
  - **Mitigation**: Reuse the transporter instance in `src/lib/mail.ts`.

## Rollback / Mitigation

- **Rollback trigger**: Repeated SMTP timeout errors or auth failures in CI.
- **Rollback steps**: Revert `src/lib/auth.ts` changes and remove `nodemailer`.
- **Data migration considerations**: None.
- **Verification after rollback**: Ensure `BetterAuth` still functions for basic login (without email).

## Operational Blocking Policy

- **If CI checks fail**: Deployment is blocked. SMTP configuration must be validated.
- **If security checks fail**: Immediate fix required for any exposed credentials.
- **If required reviews are blocked/stale**: Escalate to @dougis.

## Open Questions

- None at this stage. The requirements in #344 are specific and the implementation path is clear.
