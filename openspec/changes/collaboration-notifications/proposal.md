# Change Proposal: Collaboration Notifications (GH #458)

## GitHub Issues

- #458 (notifications)
- #420 (collaborative cookbooks integration)

## Why

- **Problem statement**: Collaborative cookbooks were implemented in GH #420, allowing Executive Chef owners to invite editors and viewers to their cookbooks. However, the collaboration flow is currently silent and disjointed. Collaborators have no way of knowing when they have been added/invited unless they manually check their collaborations list. Similarly, cookbook owners have no visibility when editor collaborators add or remove recipes.
- **Why now**: Social features require prompt feedback loops to be engaging. Without notifications, collaboration feels dead. Providing immediate email alerts (using the existing Mailtrap foundation) and a persistent in-app notification bell ensures the collaborative experience feels active, responsive, and premium.
- **Business/user impact**: Subscribing to the Executive Chef tier becomes much more valuable and interactive. Users are alerted instantly of shared actions, which drives collaboration frequency and increases customer retention for the premium tier.

## Problem Space

- **Current behavior**:
  - `addCollaborator` immediately saves a `Collaborator` record. The recipient receives no alert.
  - `addRecipe` and `removeRecipe` successfully modify the cookbook's recipe list, but the owner of the cookbook gets no notification that a collaborator made an edit.
  - Downgrading an owner's tier from Executive Chef silently deletes all collaborations via `reconcileCollaborationOnDowngrade()`, with no explanation to the collaborators.
- **Desired behavior**:
  1. **Addition Event**: When an owner adds a collaborator, the system:
     - Saves a database notification for the recipient.
     - Asynchronously sends a beautiful email invitation to the recipient using the Mailtrap transport, including a direct link to the cookbook.
  2. **Revocation Event**: When a collaborator is removed by the owner (or when access is deleted due to tier downgrade), the system:
     - Saves a database notification for the recipient explaining their access has ended.
  3. **Edit Events**: When a collaborator (editor) adds or removes a recipe:
     - The system saves a database notification for the cookbook owner (e.g. *"Sarah added Carbonara to Weekend Dinners"*).
     - *Note*: If the owner themselves adds/removes a recipe, no notification is sent to themselves.
  4. **Notification Center (In-App)**:
     - An unread notification count/badge is shown on a `NotificationBell` in the main `Header` component.
     - Clicking the bell displays a sleek, scrollable `NotificationDropdown` listing the 10 most recent notifications.
     - Clicking a notification marks it as read and redirects the user to the relevant cookbook detail page.
     - A "Mark all as read" button is available in the dropdown.
- **Constraints**:
  - Email sending must be asynchronous and fail-silent for the calling mutation (must not roll back the DB transaction or return an error if the email transport fails).
  - High performance is required for the header unread badge query; it will run on page load and on route transitions.
  - Dark-mode first aesthetics must be maintained with CSS variables (`var(--theme-accent)`, `var(--theme-surface-hover)`, etc.).
- **Assumptions**:
  - We assume Mailtrap environment variables (`MAILTRAP_API_TOKEN`) are configured for email delivery.
- **Edge cases considered**:
  - **Self-actions**: Owners editing their own cookbooks should not trigger notifications. Gated checks will verify `senderId !== recipientId`.
  - **Deleted cookbooks**: If a cookbook is deleted, associated notifications should remain in the history but clicking them should gracefully handle the missing cookbook (or notifications could cascade delete). For v1, basic check-for-existence or cascade delete during cookbook deletion is planned.
  - **Downgrades**: When an owner downgrades, multiple collaborations are deleted in one transaction. We should bulk-insert notification cards for all affected collaborators.

## Scope

### In Scope

- **Database Model**: New `Notification` collection and model.
- **Server Router**: `notificationsRouter` containing procedures:
  - `list` (paginated query, populating sender names).
  - `unreadCount` (highly optimized count query).
  - `markRead` (mutation, marking single or all read).
- **Mutation Hooks**:
  - `addCollaborator` triggers notification + email.
  - `removeCollaborator` triggers notification.
  - `addRecipe` & `removeRecipe` trigger notifications for the owner (if performed by a collaborator).
  - `reconcileCollaborationOnDowngrade` triggers notifications for all evicted collaborators.
- **Header Badge**: Sleek notification bell icon in `Header.tsx` showing the unread count.
- **Interactive Tray**: Premium interactive dropdown component in the header for displaying notifications, marking them read, and navigating.

### Out of Scope

- **Real-Time Push**: WebSockets or Server-Sent Events (SSE). Client-side query invalidation on route transitions or standard periodic polling is sufficient for v1.
- **User Notification Preferences**: Email toggles or opt-outs (all events send both in-app and email notifications in v1).
- **SMS Notifications**.

## What Changes

### Data Model
- `src/db/models/notification.ts` — new `Notification` model and `INotification` interface.
- `src/db/models/index.ts` — export `Notification` model.

### tRPC API
- `src/server/trpc/routers/notifications.ts` — new router for fetching and managing notifications.
- `src/server/trpc/router.ts` — register `notifications: notificationsRouter`.
- `src/server/trpc/routers/cookbooks.ts` — add triggers within `addCollaborator`, `removeCollaborator`, `addRecipe`, and `removeRecipe`.
- `src/lib/reconcile-user-content.ts` — add trigger inside `reconcileCollaborationOnDowngrade`.

### UI Components
- `src/components/notifications/NotificationBell.tsx` — bell icon + badge count component.
- `src/components/notifications/NotificationDropdown.tsx` — premium interactive dropdown component.
- `src/components/Header.tsx` — render `NotificationBell` in the header action group.

---

## Architecture Visualizations

### Data Flow for Add Collaborator Notification
```
┌──────────────┐         1. Invite          ┌─────────────────┐
│  Owner (UI)  ├───────────────────────────▶│  cookbooksRouter │
└──────────────┘                            └────────┬────────┘
                                                     │
                                           ┌─────────┴─────────┐
                                           │                   │
                                   2. Save │           3. Save │
                                           ▼                   ▼
                                   ┌──────────────┐    ┌──────────────┐
                                   │ Collaborator │    │ Notification │
                                   │  Collection  │    │  Collection  │
                                   └──────────────┘    └───────┬──────┘
                                                               │
                                                     4. Send   │
                                                     (Async)   ▼
                                                        ┌──────────────┐
                                                        │  sendEmail() │
                                                        └──────┬───────┘
                                                               │
                                                               ▼
                                                        ┌──────────────┐
                                                        │   Recipient  │
                                                        │   (Inbox)    │
                                                        └──────────────┘
```

### Notification Retrieval Flow
```
┌─────────────────────────────────┐
│           Header.tsx            │
└────────────────┬────────────────┘
                 │
        5. Poll/Fetch Count
                 ▼
┌─────────────────────────────────┐
│   trpc.notifications.unreadCount │
└────────────────┬────────────────┘
                 │
        6. Index-only Scan
                 ▼
┌─────────────────────────────────┐
│     Notification Collection     │
│   Index: { userId: 1, read: 1 } │
└─────────────────────────────────┘
```

---

## Risks

- **Risk: Increased database lookup overhead on every page load.**
  - *Impact*: Latency spike on header load.
  - *Mitigation*: Create a compound index on `{ userId: 1, read: 1 }` for the `Notification` collection. The count query will be resolved via an index-only scan, requiring virtually zero document parses.
- **Risk: Mailtrap SMTP/API failure blocking cookbook invitations.**
  - *Impact*: Failed invites due to email issues.
  - *Mitigation*: Trigger email dispatch in a fire-and-forget manner using `void sendEmail(...).catch(...)` so that failures to connect to SMTP do not throw tRPC errors or block DB operations.
- **Risk: Cascade deletions leaving orphaned notification pointers.**
  - *Impact*: Broken redirects or database bloat if a cookbook or user is deleted.
  - *Mitigation*: Ensure `reconcileCollaborationOnDowngrade` deletes collaborator notifications, and add middleware or hooks to cleanup notifications on cookbook/recipe deletion.

## Open Questions

No unresolved ambiguity. The notification events and integration points have been mapped precisely to the existing collaboration design constraints.

## Non-Goals

- Implementing push notifications or browser service workers.
- Building custom SMTP delivery (Mailtrap is fully sufficient).
- Custom notification sounds or micro-vibrations.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
