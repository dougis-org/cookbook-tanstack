## GitHub Issues

- #344

## Why

- **Problem statement**: Multiple authentication and notification features (Password Reset, Email Verification, Tier Notifications) require email capabilities. Currently, the project lacks a foundational email service, meaning tokens are generated and stored in the database but never sent to users.
- **Why now**: This is a critical prerequisite for completing #341, #342, and #333. Without it, the core user lifecycle (registration, recovery, management) is broken.
- **Business/user impact**: Users cannot verify their accounts or recover lost passwords, leading to a complete blocker for production readiness.

## Problem Space

- **Current behavior**: BetterAuth is configured with email/password support, but the hooks for sending emails are not implemented. The database contains a `verification` collection, but it's effectively a "black hole."
- **Desired behavior**: A centralized, reusable email utility that can be called by BetterAuth hooks or other server-side functions to send transactional emails via Mailtrap.
- **Constraints**:
    - Must use Mailtrap as the provider.
    - Must use `nodemailer` for SMTP transport (as requested in #344).
    - Must not leak credentials.
- **Assumptions**:
    - Mailtrap credentials will be provided via environment variables.
    - BetterAuth v1 hooks are the primary consumers.
- **Edge cases considered**:
    - Network failure during SMTP connection.
    - Missing environment variables in production.

## Scope

### In Scope

- Adding `nodemailer` dependency.
- Creating a shared email utility in `src/lib/mail.ts`.
- Configuring Mailtrap SMTP transport.
- Implementing BetterAuth hooks (`sendResetPassword`, `sendVerificationEmail`) in `src/lib/auth.ts`.
- Documenting required environment variables in `.env.example`.

### Out of Scope

- Implementing rich HTML templates with React Email (this is deferred to #345).
- Completing the full logic for #341 (Password Reset) or #342 (Verification) beyond the "send" hook.
- Implementing the Tier Notification feature (#333) itself.

## What Changes

- `package.json`: Add `nodemailer`.
- `src/lib/mail.ts`: New utility for sending emails.
- `src/lib/auth.ts`: Configuration of email hooks.
- `.env.example`: Add `MAILTRAP_*` keys.

## Risks

- **Risk**: SMTP connection latency affecting API response times.
  - **Impact**: Slow login/registration flows.
  - **Mitigation**: Follow BetterAuth guidance to not `await` email sending in the main request flow (fire-and-forget or use `waitUntil`).
- **Risk**: Credentials leakage.
  - **Impact**: Unauthorized use of the Mailtrap account.
  - **Mitigation**: Use strict environment variable management and ensure `.env` is ignored.

## Open Questions

- Should we implement a basic HTML wrapper for the initial foundation, or strictly plain text? 
  - *Recommendation*: Basic plain text + simple HTML link for now, until #345 is addressed.

## Non-Goals

- Building a complex template management system.
- Integrating with multiple email providers (Mailtrap only for now).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
