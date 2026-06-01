## Context

- **Relevant architecture**: `src/server/trpc/routers/cookbooks.ts` (collaborator mutations), `src/lib/reconcile-user-content.ts` (revocation trigger), `src/lib/mail.ts` (Mailtrap delivery), `src/components/Header.tsx` (navigation header).
- **Dependencies**: Lucide React (bell icon), Mongoose (Notification model), tRPC (procedures for notifications).
- **Interfaces/contracts touched**: `AppRouter` registered endpoints, `Header` component layout, `sendEmail` utility, `reconcileCollaborationOnDowngrade` signature.

## Goals / Non-Goals

### Goals

- Create a performant, schema-validated database storage for notifications.
- Deliver instant in-app alerts and asynchronous email invitations to added collaborators.
- Alert cookbook owners when collaborators perform modifications (adding/removing recipes).
- Provide clean unread counts and a beautiful dropdown tray in the navigation header.
- Allow users to mark notifications as read individually or in bulk.

### Non-Goals

- Implementing push notifications via browser Service Workers.
- Real-time client syncing via WebSockets (standard refetching or navigation invalidation is sufficient).
- Advanced email preferences or toggle settings.

## Decisions

### Decision 1: Standalone `Notification` Schema

- **Chosen**: A separate `Notification` MongoDB collection with properties `{ userId, type, senderId, data, read, createdAt }`.
- **Alternatives considered**: Embedding `notifications[]` in the `User` collection.
- **Rationale**: An embedded array in the `User` collection is unbounded and can grow indefinitely, violating MongoDB document size limits and slowing down basic authentication lookups. Standalone documents keep user lookups fast and separate notifications concerns.
- **Trade-offs**: Requires one extra query to fetch notifications, which is highly acceptable with proper indexing.

### Decision 2: Compound Index on `Notification`

- **Chosen**: A compound index on `{ userId: 1, read: 1 }` and another on `{ userId: 1, createdAt: -1 }`.
- **Alternatives considered**: Single index on `userId`.
- **Rationale**: The header performs an unread count lookup on every navigation. A compound index on `{ userId: 1, read: 1 }` allows the database to count unread notifications via an **index-only scan**, completely bypassing document scans and returning instantly (under 5ms).
- **Trade-offs**: Minor index write overhead on notification creation.

### Decision 3: Asynchronous (Fire-and-Forget) Email Dispatch

- **Chosen**: Call `void sendEmail(...).catch(...)` asynchronously in tRPC mutations without awaiting the response.
- **Alternatives considered**: Awaiting email dispatch inside the mutation transaction.
- **Rationale**: SMTP delivery (especially via external tools like Mailtrap) can take hundreds of milliseconds or fail entirely due to network issues. If we awaited the dispatch, it would slow down user interactions or fail the DB operation on network blips. Fire-and-forget keeps the app fast and robust.
- **Trade-offs**: If SMTP fails, the user is created as a collaborator and gets an in-app card, but misses the email. This is an acceptable trade-off for high reliability.

### Decision 4: Client-side Header bell integration

- **Chosen**: Build a standalone `NotificationBell` component displaying a badge count, rendering a `NotificationDropdown` toggle container when clicked.
- **Alternatives considered**: Redirecting to a dedicated `/notifications` page.
- **Rationale**: A dropdown popup feels much more premium and does not disrupt the user's current reading/editing context.

---

## Proposal to Design Mapping

- **Proposal element**: In-App notifications for invited and removed collaborators.
  - **Design decision**: Decision 1 (Standalone Notification Schema).
  - **Validation approach**: Mongoose schema validations verify correct enum values and required object identifiers.
- **Proposal element**: Email invitations on collaborator addition.
  - **Design decision**: Decision 3 (Asynchronous dispatch).
  - **Validation approach**: Unit tests mock `sendEmail` to assert it is called with correct parameters.
- **Proposal element**: Interactive tray in the header with unread badge count.
  - **Design decision**: Decision 4 (Header bell dropdown).
  - **Validation approach**: Component test verifies bell badge renders count and dropdown expands on click.

---

## Functional Requirements Mapping

- **Requirement**: ADDED Collaboration Invitation In-App Notification
  - **Design element**: `Notification` model with type `'collaboration_invited'`.
  - **Acceptance criteria reference**: specs/collaboration-notifications/spec.md
  - **Testability notes**: Verify that calling `addCollaborator` creates a `Notification` record in the database.
- **Requirement**: ADDED Collaboration Invitation Email Alert
  - **Design element**: `sendEmail` called inside `addCollaborator` mutation.
  - **Acceptance criteria reference**: specs/collaboration-notifications/spec.md
  - **Testability notes**: Verify that Mailtrap transport is called asynchronously with correct templates.
- **Requirement**: ADDED Collaboration Activity Notification
  - **Design element**: `addRecipe` checks if `cookbook.userId !== ctx.user.id` and creates notification.
  - **Acceptance criteria reference**: specs/collaboration-notifications/spec.md
  - **Testability notes**: Verify notifications are created when editor adds a recipe, but omitted when owner does.

---

## Non-Functional Requirements Mapping

- **Requirement category**: Performance
  - **Requirement**: Unread count query must resolve in under 20ms under load.
  - **Design element**: Compound index `{ userId: 1, read: 1 }`.
  - **Acceptance criteria reference**: specs/collaboration-notifications/spec.md
  - **Testability notes**: Run `explain()` on the unread count query and assert it registers `IXSCAN` and `stage: "COUNT_SCAN"`.

---

## Risks / Trade-offs

- **Risk/trade-off**: Asynchronous fire-and-forget emails can fail silently.
  - **Impact**: User doesn't receive an email alert if SMTP is offline.
  - **Mitigation**: Log connection errors via `console.error`. The user will still receive the in-app notification when logging in.
- **Risk/trade-off**: Compound indexes take storage space.
  - **Impact**: Minor storage footprint increase.
  - **Mitigation**: Indexed keys are ObjectIds and booleans (very small, negligible size impact).

---

## Rollback / Mitigation

- **Rollback trigger**: Performance issues on MongoDB unread query, or SMTP crashes.
- **Rollback steps**:
  1. Remove `NotificationBell` from `Header.tsx`.
  2. Remove notification triggers from `cookbooks.ts` router.
  3. Revert `notificationsRouter` registration from `src/server/trpc/router.ts`.
- **Data migration considerations**: No data migrations needed; `Notification` collection can be truncated or dropped safely without affecting core app data.
- **Verification after rollback**: Ensure test suites for auth and basic cookbook management pass.

---

## Operational Blocking Policy

- **If CI checks fail**: Block merging. Fix lint/compilation issues immediately.
- **If security checks fail**: Stop work, escalate to repository owner immediately.
- **If required reviews are blocked/stale**: Direct ping after 24 hours.
- **Escalation path and timeout**: Escalate to `dougis` after 48 hours of stale review.

---

## Open Questions

None. All technical choices are fully aligned with the requirements.
