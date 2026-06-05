## GitHub Issues

- dougis-org/cookbook-tanstack#333

## Why

- **Problem statement:** Currently, user tier changes on the server (like admin-initiated tier updates) do not notify the user about their changed status, updated limits, or what features were unlocked or hidden.
- **Why now:** The backend tier data model (#282) and admin tier management actions are implemented. Introducing professional, structured transactional emails for tier changes now prevents stale notifications and aligns with the recently added Mailtrap email template system.
- **Business/user impact:** Improves customer trust and onboarding clarity. Users are explicitly notified of upgrades (celebratory welcome + limit info) and downgrades (what content was hidden and how to re-upgrade).

## Problem Space

- **Current behavior:** `admin.users.setTier` changes the tier, runs reconciliation, logs audit details, and fires a generic template that states "An administrator has updated your culinary tier to...". It does not support self-service changes or distinguish between upgrades and downgrades.
- **Desired behavior:** Dynamic and fully parameterized tier change notifications supporting upgrades, downgrades, admin-initiated changes, and grace period expirations. Incorporates precise counts of hidden or made-public content from the reconciliation stage.
- **Constraints:**
  - Must use nodemailer + Mailtrap configuration.
  - React 19.2.0 compatibility.
  - Must use React Email component rendering.
- **Assumptions:**
  - User has a valid email address.
  - Transactional emails are critical and bypass marketing opt-out, but users should be provided with a link to manage other preferences.
- **Edge cases considered:**
  - Email address not provided (bypass sending).
  - Downgrade with no hidden content vs. downgrade with hidden content (tailor wording dynamically).

## Scope

### In Scope

- Update `src/emails/TierNotificationEmail.tsx` to support `changeType` (`upgrade`, `downgrade`, `admin-change`, `trial-expiring`) and reconciliation metrics (`recipesHidden`, `cookbooksHidden`, `madePublic`).
- Update the email Layout footer to clarify transactional nature and link to `/account` settings.
- Update `src/server/trpc/routers/admin.ts` to pass the reconciliation results and `changeType: 'admin-change'` to the email sender.
- Add unit/integration tests for template rendering and router email dispatch.

### Out of Scope

- Building the Stripe webhook (F01) which will handle user-initiated changes (out of scope for this change, but the email templates will be designed to support it).

## What Changes

- Modify `src/emails/TierNotificationEmail.tsx`
- Modify `src/emails/Layout.tsx` (footer link to account preferences)
- Modify `src/server/trpc/routers/admin.ts`
- Modify `src/emails/__tests__/TierNotificationEmail.test.tsx`
- Modify `src/server/trpc/routers/__tests__/admin.test.ts`

## Risks

- **Risk:** Email delivery failures due to third-party Mailtrap/SMTP issues.
  - **Impact:** Awaiting or blocking on email delivery could hang the setTier mutation.
  - **Mitigation:** Trigger `sendEmail` asynchronously as a fire-and-forget promise with `.catch()` block.

## Open Questions

- **Question:** Should we implement a dedicated "Unsubscribe from non-critical notifications" settings page in this PR?
  - **Needed from:** User
  - **Blocker for apply:** no (We propose linking to the `/account` page in the transactional footer and indicating that transactional emails are mandatory, which is standard product behavior).

## Non-Goals

- Developing user-facing subscription billing pages.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
