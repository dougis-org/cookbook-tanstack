## Context

- **Relevant architecture:**
  - `src/lib/mail.ts` provides the foundational `sendEmail` wrapper for nodemailer + Mailtrap transport.
  - Better-Auth (`src/lib/auth.ts`) handles user authentication, triggering reset password and email verification events.
  - `src/server/trpc/routers/admin.ts` implements the `setTier` mutation.
- **Dependencies:**
  - `react-email` (CLI for email previews).
  - `@react-email/components` (email-safe component library).
  - `@react-email/render` (compiler from React to email HTML/plain text).
- **Interfaces/contracts touched:**
  - `SendEmailOptions` interface in `src/lib/mail.ts` will be updated.
  - Better-Auth email sending callbacks (`sendVerificationEmail`, `sendResetPassword`) will invoke the new rendering flow.
  - Admin `setTier` mutation will invoke `sendEmail`.

## Goals / Non-Goals

### Goals

- Standardize HTML transactional email styling with a unified dark-first design system and cyan highlights to match the web application.
- Provide a developer-friendly local preview server for email template design.
- Dynamically compile React components into responsive, inline-styled email HTML and plain text.
- Implement specialized, styled templates for Verification, Password Reset, and Culinary Tier notifications.

### Non-Goals

- Migrating non-authentication or non-tier related email systems (like cookbook sharing invitations) as part of this initial PR.

## Decisions

### Decision 1: React Email Integration Strategy & Package Setup

- **Chosen:** Install the latest stable versions of `react-email`, `@react-email/components`, and `@react-email/render` as project dependencies.
- **Alternatives considered:** Hand-rolling HTML email strings using template strings.
- **Rationale:** Hand-rolled inline HTML is notoriously fragile across diverse mail clients (Outlook, Gmail, Apple Mail, etc.). React Email handles CSS inlining and safe table nesting structures automatically.
- **Trade-offs:** Adds dependencies to the project, but greatly increases safety and DX.

### Decision 2: Reusable Template Layout & Theming System

- **Chosen:** Design a base layout component `src/emails/Layout.tsx` that defines the viewport, colors (dark mode primary `#0f172a`, secondary card background `#1e293b`, cyan highlight `#22d3ee`, text white `#f8fafc`, muted text `#94a3b8`), padding, and font stacks. Specific emails will be components wrapper with `Layout`.
- **Alternatives considered:** Styling each email component separately.
- **Rationale:** Keeps design styles DRY and consistent, making future color/branding updates straightforward.
- **Trade-offs:** Customizing layout padding for a specific template requires passing props, but the consistency benefits outweigh this.

### Decision 3: Direct React Rendering inside mail.ts

- **Chosen:** Modify `sendEmail` options in `src/lib/mail.ts` to accept `react?: React.ReactElement`. If provided, compile the React tree using `@react-email/render` for both `html` and `text` values.
- **Alternatives considered:** Requiring the caller to render to string beforehand.
- **Rationale:** Minimizes boilerplate at calling sites (e.g. `src/lib/auth.ts` or `admin.ts`), as they can just pass the element to `sendEmail`.
- **Trade-offs:** Couples the mail library with React Email, which is appropriate for a React-focused TanStack Start project.

### Decision 4: Tier Notification Triggering

- **Chosen:** Trigger the email inside the `setTier` mutation handler in `src/server/trpc/routers/admin.ts` after the DB update and content reconciliation complete successfully.
- **Alternatives considered:** Triggering via a MongoDB change stream or separate job queue.
- **Rationale:** Simpler and more direct. Since the tier modification is initiated by the admin via this endpoint, executing it immediately after database update is the cleanest integration point.
- **Trade-offs:** Email sending is triggered in-process, but we run it asynchronously with a non-blocking Promise chain (`void sendEmail(...).catch(...)`).

## Proposal to Design Mapping

- **Proposal element:** Add dependencies: react-email, @react-email/components, @react-email/render.
  - **Design decision:** Decision 1 (React Email Integration Strategy & Package Setup).
  - **Validation approach:** `npm run email:dev` and compiler execution verification.
- **Proposal element:** Create an emails/ directory for template components.
  - **Design decision:** Decision 2 (Reusable Template Layout & Theming System).
  - **Validation approach:** Verify folder layout under `src/emails`.
- **Proposal element:** Implement Email Verification, Password Reset, and Tier Notification templates.
  - **Design decision:** Decision 2 (Reusable Template Layout & Theming System).
  - **Validation approach:** Visual review via the preview server.
- **Proposal element:** Update src/lib/mail.ts to accept a React.ReactElement and handle the conversion to HTML.
  - **Design decision:** Decision 3 (Direct React Rendering inside mail.ts).
  - **Validation approach:** Unit tests in `src/lib/__tests__/mail.test.ts` verifying rendering behavior.
- **Proposal element:** Set up a local preview script.
  - **Design decision:** Decision 1 (React Email Integration Strategy & Package Setup).
  - **Validation approach:** Verify `email:dev` starts up correctly.

## Functional Requirements Mapping

- **Requirement:** Email Verification template needs Logo, welcome message, and action button.
  - **Design element:** `src/emails/VerificationEmail.tsx`.
  - **Acceptance criteria reference:** Verification Email spec.
  - **Testability notes:** Visual inspection using `email:dev` + unit tests asserting text/link presence.
- **Requirement:** Password Reset template needs Security notice, reset button, and expiration warning.
  - **Design element:** `src/emails/PasswordResetEmail.tsx`.
  - **Acceptance criteria reference:** Password Reset Email spec.
  - **Testability notes:** Verify that the expiration message is displayed and the reset link maps to the provided url.
- **Requirement:** Tier Notification template needs specialized templates for culinary tiers.
  - **Design element:** `src/emails/TierNotificationEmail.tsx`.
  - **Acceptance criteria reference:** Tier Notification Email spec.
  - **Testability notes:** Assert correct pricing, limits, and descriptions are rendered for `prep-cook`, `sous-chef`, and `executive-chef`.

## Non-Functional Requirements Mapping

- **Requirement category:** reliability
  - **Requirement:** Transactional emails must degrade gracefully. If rendering fails, fail-safe mechanisms must log the error.
  - **Design element:** Error boundaries inside the rendering logic inside `src/lib/mail.ts` and `catch` blocks on email send actions.
  - **Acceptance criteria reference:** Render fail-safe spec.
  - **Testability notes:** Mock `@react-email/render` to throw and assert that the error is logged and process doesn't crash.
- **Requirement category:** performance
  - **Requirement:** Compilation from React elements to HTML should not block the request path.
  - **Design element:** Run email rendering and sending asynchronously (non-awaited promises with `.catch`).
  - **Acceptance criteria reference:** Async delivery spec.
  - **Testability notes:** Benchmark tRPC/Auth responses to ensure latency is not increased by SMTP wait times.

## Risks / Trade-offs

- **Risk/trade-off:** CSS / Image Assets not loading.
  - **Impact:** Emails will look broken and unstyled.
  - **Mitigation:** Rely on inline Tailwind styles compiled via React Email and use fully qualified absolute URLs for all images/assets hosted on our public domain or CDN.

## Rollback / Mitigation

- **Rollback trigger:** Email rendering crashes at runtime in production or causes server-side memory leaks.
- **Rollback steps:** Revert the commits modifying `src/lib/mail.ts` and `src/lib/auth.ts`, reverting back to inline raw HTML strings.
- **Data migration considerations:** None.
- **Verification after rollback:** Run the test suite and verify sign-up/reset password flows send successfully.

## Operational Blocking Policy

- **If CI checks fail:** The PR is blocked. Fix the failures before merge.
- **If security checks fail:** Code scanning alerts must be remediated or officially snoozed with a security team override.
- **If required reviews are blocked/stale:** Re-request review. Do not bypass reviews.
- **Escalation path and timeout:** Contact the team lead if a review is pending for more than 24 hours.

## Open Questions

- **Question:** Do we need custom inline CSS properties beyond what standard tailwind handles?
  - **Answer:** No, React Email's styling wrapper handles inline stylesheet translation well. We can stick to standard CSS-in-JS style objects or Tailwind inline styling components provided by `@react-email/components` if needed.
