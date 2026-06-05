## Context

- **Relevant architecture:** TanStack Start, React 19, MongoDB, nodemailer + Mailtrap email transporter.
- **Dependencies:** `@react-email/components`, `@react-email/render`, `better-auth`.
- **Interfaces/contracts touched:**
  - Email templates: `src/emails/TierNotificationEmail.tsx` and `src/emails/Layout.tsx`.
  - Server endpoints: `src/server/trpc/routers/admin.ts` (`admin.users.setTier` mutation).

## Goals / Non-Goals

### Goals

- Support dynamic, parameterized emails for upgrading, downgrading, and admin changes.
- Provide a footer that explains transactional mail rules and links to account settings.
- Pass user-reconciliation metrics (hidden/public counts) to the email template.
- Write unit and integration tests verifying rendering and trigger logic.

### Non-Goals

- Developing Stripe webhook payment processing (handled separately in F01).
- Unsubscribing from transactional tier change notifications themselves (as they are critical billing/entitlement notifications).

## Decisions

### Decision 1: Dynamic Email Types

- **Chosen:** Add a `changeType` prop (`'upgrade' | 'downgrade' | 'admin-change' | 'trial-expiring'`) to `TierNotificationEmailProps`. Wording and header change dynamically in the email component based on the `changeType`.
- **Alternatives considered:** Separate email files for each type of notification.
- **Rationale:** Single file is easier to maintain and share common layout styles.
- **Trade-offs:** Minor logic complexity in JSX, easily managed with clean conditional rendering.

### Decision 2: Asynchronous Delivery

- **Chosen:** Trigger email delivery in `admin.users.setTier` using `void sendEmail(...).catch(...)` without awaiting, logging errors.
- **Alternatives considered:** Await the `sendEmail` promise.
- **Rationale:** If Mailtrap is slow/unavailable, it shouldn't block user tier update DB mutation or return TRPC errors to client.
- **Trade-offs:** Minor risk of silent failures if email is not delivered, solved by server console logs.

## Proposal to Design Mapping

- **Proposal element:** Update email template to support upgrade/downgrade
  - **Design decision:** Decision 1
  - **Validation approach:** Vitest unit tests in `src/emails/__tests__/TierNotificationEmail.test.tsx`
- **Proposal element:** Pass reconciliation metrics to email
  - **Design decision:** In `admin.users.setTier`, read returned counts from `reconcileUserContent` and pass them to the template component.
  - **Validation approach:** Integration test in `src/server/trpc/routers/__tests__/admin.test.ts`

## Functional Requirements Mapping

- **Requirement:** Upgrade email tells user limits and welcomes them.
  - **Design element:** `TierNotificationEmail` renders upgraded limits & pricing.
  - **Acceptance criteria reference:** Upgrade template renders limit/price.
  - **Testability notes:** Render template with `'upgrade'` and assert limits are in output.
- **Requirement:** Downgrade email lists hidden items.
  - **Design element:** `TierNotificationEmail` lists count of hidden recipes/cookbooks.
  - **Acceptance criteria reference:** Downgrade template renders hidden counts.
  - **Testability notes:** Render template with `'downgrade'` and counts, assert counts are in output.

## Non-Functional Requirements Mapping

- **Requirement category:** reliability
  - **Requirement:** Email sending does not block tier updates.
  - **Design element:** Decision 2 (Asynchronous fire-and-forget).
  - **Acceptance criteria reference:** Non-blocking send operation.
  - **Testability notes:** Verify `setTier` succeeds even if email transporter throws.

## Risks / Trade-offs

- **Risk/trade-off:** User updates tier but email fails to send due to SMTP error.
  - **Impact:** User doesn't receive notification.
  - **Mitigation:** Error is logged on server; since this is fire-and-forget, the DB write persists.

## Rollback / Mitigation

- **Rollback trigger:** Production email failures or build failures due to React Email compilation.
- **Rollback steps:** Revert modifications to `src/emails/TierNotificationEmail.tsx` and `src/server/trpc/routers/admin.ts`.
- **Data migration considerations:** None.
- **Verification after rollback:** Verify admin setTier works without throwing.

## Operational Blocking Policy

- **If CI checks fail:** Do not merge PR. Fix lint or test failure.
- **If security checks fail:** Remediate any Snyk issues.
- **If required reviews are blocked/stale:** Ping reviewer.
- **Escalation path and timeout:** Standard repository guidelines.

## Open Questions

- None.
