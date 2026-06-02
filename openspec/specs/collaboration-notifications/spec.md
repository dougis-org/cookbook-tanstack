## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Collaboration Invitation In-App Notification

The system SHALL save a persistent notification card in the database for the recipient when they are added as a collaborator to a cookbook.

#### Scenario: Collaborator added successfully
- **Given** an authenticated Executive Chef user owns a cookbook
- **When** they add another user as an editor or viewer collaborator
- **Then** a `Notification` record is created in the database with recipient `userId`, type `'collaboration_invited'`, and `senderId` set to the owner's ID
- **And** the notification's payload contains the `cookbookId` and the `cookbookTitle`

#### Scenario: Removed collaborator is notified
- **Given** a user is a collaborator on a cookbook
- **When** the owner removes them from the collaborators list
- **Then** a `Notification` record is created for the removed user with type `'collaboration_removed'` and the sender set to the owner

---

### Requirement: ADDED Collaboration Invitation Email Alert

The system SHALL send an immediate email alert to the invited user when they are added as a collaborator.

#### Scenario: Deliver email alert using Mailtrap
- **Given** a collaborator is successfully added to a cookbook
- **When** the database transaction commits
- **Then** the server asynchronously triggers the email transport
- **And** sends an email to the collaborator's registered address containing the inviter's name, the cookbook name, the role, and a direct link to the cookbook detail page

---

### Requirement: ADDED Collaboration Activity Notification

The system SHALL notify the cookbook owner when an editor collaborator performs a modification on the cookbook.

#### Scenario: Collaborator adds a recipe to a shared cookbook
- **Given** User A is an editor collaborator on a cookbook owned by User B
- **When** User A adds a recipe to the cookbook
- **Then** a `Notification` record of type `'recipe_added'` is created for User B, identifying User A as the sender
- **And** the payload contains the `cookbookId`, `cookbookTitle`, `recipeId`, and `recipeTitle`

#### Scenario: Owner modifies their own cookbook
- **Given** User B is the owner of a cookbook
- **When** User B adds a recipe to their own cookbook
- **Then** no notification is created

---

## Traceability

- **Proposal element**: In-App Notifications on addition and removal.
  - -> **Requirement**: ADDED Collaboration Invitation In-App Notification
- **Proposal element**: Email alerts on collaborator addition.
  - -> **Requirement**: ADDED Collaboration Invitation Email Alert
- **Proposal element**: Collaborative edits activity tracking.
  - -> **Requirement**: ADDED Collaboration Activity Notification
- **Requirement** -> **Task(s)**:
  - ADDED Collaboration Invitation In-App Notification -> Task 1: Create `Notification` model, Task 3: Trigger notifications in `addCollaborator` / `removeCollaborator`
  - ADDED Collaboration Invitation Email Alert -> Task 2: Implement mail dispatcher helper, Task 4: Call helper asynchronously in `addCollaborator`
  - ADDED Collaboration Activity Notification -> Task 5: Trigger owner notification inside `addRecipe` / `removeRecipe` mutations if caller is a collaborator

---

## Non-Functional Acceptance Criteria

### Requirement: Performance (Unread Count Query)

#### Scenario: Fetching header unread notifications count
- **Given** a user has multiple notifications in the database
- **When** they navigate between pages
- **Then** the `unreadCount` query resolves via an index-only scan on `{ userId: 1, read: 1 }` without scanning any table documents
- **And** the query response returns in less than 20 milliseconds under standard load
