## ADDED Requirements

### Requirement: ADDED Collaborator model

The system SHALL export a `Collaborator` model from `src/db/models/collaborator.ts` representing a cookbook collaborator relationship.

#### Scenario: collaborator record structure

- **Given** the `Collaborator` model is imported
- **When** a collaborator document is created with `{ cookbookId, userId, role: 'editor', addedBy }`
- **Then** the document has fields `cookbookId`, `userId`, `role`, `addedAt` (auto-set), `addedBy`

#### Scenario: unique constraint prevents duplicate collaborators

- **Given** a collaborator record exists for `cookbookId=X, userId=Y`
- **When** a second `addCollaborator` call attempts to create a duplicate
- **Then** the operation fails with a duplicate key error

#### Scenario: role is either editor or viewer

- **Given** the `Collaborator` model schema is defined
- **When** a document with `role: 'admin'` is inserted
- **Then** validation fails

---

### Requirement: ADDED collabCookbookIds to Context

The system SHALL include `collabCookbookIds: string[]` in the tRPC Context for authenticated users.

#### Scenario: unauthenticated user has empty collabCookbookIds

- **Given** `createContext` is called without a session
- **When** the context is built
- **Then** `collabCookbookIds` is an empty array

#### Scenario: authenticated user has their collaborator cookbook IDs

- **Given** a user has two Collaborator records for cookbook A (editor) and cookbook B (viewer)
- **When** `createContext` is called with that user's session
- **Then** `collabCookbookIds` contains `[cookbookA._id.toString(), cookbookB._id.toString()]`

---

### Requirement: ADDED visibilityFilter accepts collabCookbookIds

The system SHALL export a `visibilityFilter` function in `src/server/trpc/routers/_helpers.ts` that accepts an optional `collabCookbookIds` parameter.

#### Scenario: returns correct filter for unauthenticated user

- **Given** `visibilityFilter(null)` is called
- **When** the filter is applied to a `Cookbook.find()`
- **Then** only `{ isPublic: true, hiddenByTier: { $ne: true } }` documents are returned

#### Scenario: returns correct filter for authenticated user who is not a collaborator

- **Given** a user with no Collaborator records
- **When** `visibilityFilter(user, [])` is called
- **Then** documents matching `{ $or: [ { isPublic: true, hiddenByTier: { $ne: true } }, { userId: user.id, hiddenByTier: { $ne: true } } ] }` are returned

#### Scenario: returns correct filter for authenticated user who is a collaborator

- **Given** a user with Collaborator record linking them to cookbook C
- **When** `visibilityFilter(user, ['cookbookCId'])` is called
- **Then** documents matching `{ $or: [ { isPublic: true, hiddenByTier: { $ne: true } }, { userId: user.id, hiddenByTier: { $ne: true } }, { _id: { $in: ['cookbookCId'] }, hiddenByTier: { $ne: true } } ] }` are returned

---

### Requirement: ADDED reconcileCollaborationOnDowngrade

The system SHALL export `reconcileCollaborationOnDowngrade(session, userId)` from `src/lib/reconcile-user-content.ts`.

#### Scenario: deletes all collaborators when owner downgrades from executive-chef

- **Given** a user owns cookbook X with 3 collaborators (Alice, Bob, Charlie)
- **When** `reconcileUserContent` is called with `direction: 'downgrade'` and `oldTier: 'executive-chef'`
- **Then** after reconciliation, the Collaborator collection has no records for cookbook X

#### Scenario: does nothing when downgrading from non-executive-chef tier

- **Given** a Sous Chef owner of cookbook X with 1 collaborator
- **When** `reconcileUserContent` is called with `direction: 'downgrade'` and `oldTier: 'sous-chef'`
- **Then** the collaborator record for cookbook X is NOT deleted

---

### Requirement: ADDED cookbooks.addCollaborator procedure

The system SHALL export an `addCollaborator` mutation on `cookbooksRouter` gated to `executive-chef` tier.

#### Scenario: executive-chef owner can add an editor collaborator

- **Given** a user with `tier: 'executive-chef'` owns cookbook X
- **When** `cookbooks.addCollaborator` is called with `{ cookbookId: X, userId: targetUser, role: 'editor' }`
- **Then** a Collaborator document exists with `{ cookbookId: X, userId: targetUser, role: 'editor', addedBy: ownerId }`

#### Scenario: non-executive-chef owner receives FORBIDDEN

- **Given** a user with `tier: 'sous-chef'` owns cookbook X
- **When** `cookbooks.addCollaborator` is called with `{ cookbookId: X, userId: targetUser, role: 'editor' }`
- **Then** the response is a FORBIDDEN error

#### Scenario: non-owner receives FORBIDDEN

- **Given** a user is an editor collaborator on cookbook X (not the owner)
- **When** `cookbooks.addCollaborator` is called with `{ cookbookId: X, userId: targetUser, role: 'viewer' }`
- **Then** the response is a FORBIDDEN error

#### Scenario: adding duplicate collaborator fails

- **Given** a collaborator record already exists for `cookbookId: X, userId: targetUser, role: 'viewer'`
- **When** `cookbooks.addCollaborator` is called with `{ cookbookId: X, userId: targetUser, role: 'editor' }`
- **Then** the response is an error (duplicate key)

---

### Requirement: ADDED cookbooks.removeCollaborator procedure

The system SHALL export a `removeCollaborator` mutation on `cookbooksRouter` gated to `executive-chef` tier.

#### Scenario: owner can remove a collaborator

- **Given** a user with `tier: 'executive-chef'` owns cookbook X; Alice is an editor collaborator
- **When** `cookbooks.removeCollaborator` is called with `{ cookbookId: X, userId: aliceId }`
- **Then** the Collaborator record for Alice is deleted

#### Scenario: non-owner receives FORBIDDEN

- **Given** a user is a viewer collaborator on cookbook X (not the owner)
- **When** `cookbooks.removeCollaborator` is called with `{ cookbookId: X, userId: aliceId }`
- **Then** the response is a FORBIDDEN error

---

### Requirement: ADDED cookbooks.myCollaborations procedure

The system SHALL export a `myCollaborations` query on `cookbooksRouter` returning cookbooks where the current user is a collaborator.

#### Scenario: returns all cookbooks where user is a collaborator with role

- **Given** a user is an editor on cookbook A and a viewer on cookbook B
- **When** `cookbooks.myCollaborations` is called
- **Then** the response includes `[{ id: A._id, name: A.name, role: 'editor' }, { id: B._id, name: B.name, role: 'viewer' }]`

#### Scenario: excludes cookbooks hidden by tier

- **Given** a user is a collaborator on cookbook C which has `hiddenByTier: true`
- **When** `cookbooks.myCollaborations` is called
- **Then** cookbook C is NOT in the response

---

### Requirement: ADDED collaboratorCount to cookbooks.list

The system SHALL return `collaboratorCount: number` in the `cookbooks.list` response for each cookbook.

#### Scenario: returns accurate collaborator count

- **Given** cookbook X has 3 collaborators
- **When** `cookbooks.list` is called
- **Then** the entry for cookbook X has `collaboratorCount: 3`

#### Scenario: returns 0 for cookbook with no collaborators

- **Given** cookbook Y has no collaborators
- **When** `cookbooks.list` is called
- **Then** the entry for cookbook Y has `collaboratorCount: 0`

---

### Requirement: ADDED collaborators array to cookbooks.byId

The system SHALL return `collaborators: Array<{ id: string; name: string; role: 'editor' | 'viewer'; addedAt: Date }>` in the `cookbooks.byId` response.

#### Scenario: returns all collaborators for a cookbook

- **Given** cookbook X has Alice (editor, added 2026-01-01) and Bob (viewer, added 2026-02-01)
- **When** `cookbooks.byId` is called with `{ id: X }`
- **Then** the response includes `collaborators: [{ id: aliceId, name: 'Alice', role: 'editor', addedAt: '2026-01-01' }, { id: bobId, name: 'Bob', role: 'viewer', addedAt: '2026-02-01' }]`

#### Scenario: collaborators is empty array when no collaborators exist

- **Given** cookbook Y has no collaborators
- **When** `cookbooks.byId` is called with `{ id: Y }`
- **Then** the response has `collaborators: []`

---

### Requirement: ADDED users.search procedure

The system SHALL export a `search` query on `usersRouter` that returns users matching an email or name prefix, excluding the caller.

#### Scenario: returns users matching email prefix

- **Given** users Alice (alice@example.com) and Bob (bob@example.com) exist
- **When** `users.search` is called with `{ query: 'ali' }`
- **Then** the response includes `[{ id: aliceId, name: 'Alice', email: 'alice@example.com' }]`

#### Scenario: excludes the calling user

- **Given** the authenticated user is Alice
- **When** `users.search` is called with `{ query: 'ali' }`
- **Then** Alice is NOT in the response

#### Scenario: rejects query shorter than 2 characters

- **Given** an authenticated user
- **When** `users.search` is called with `{ query: 'a' }`
- **Then** the response is a validation error

#### Scenario: returns at most 10 results

- **Given** 15 users with names matching "smith"
- **When** `users.search` is called with `{ query: 'smith' }`
- **Then** the response contains exactly 10 entries

---

### Requirement: ADDED "Invited by" display in collaborators panel

The system SHALL display "Invited by [name]" for each collaborator in the CookbookDetail collaborators panel, using the `addedBy` field resolved to the inviting user's display name.

#### Scenario: collaborators panel shows inviter name

- **Given** Alice (owner) invited Bob as an editor, with `addedBy: aliceId`
- **When** the CookbookDetail page renders for any user with access
- **Then** Bob's row in the collaborators panel shows "Invited by Alice"

---

## MODIFIED Requirements

### Requirement: MODIFIED cookbooks.byId to include accessLevel derivation hint

The system SHALL make `accessLevel` computable from `cookbooks.byId` response by comparing `cookbook.userId === currentUser.id` and matching `collaborators[]`.

#### Scenario: owner sees accessLevel as owner

- **Given** user U owns cookbook X and calls `cookbooks.byId` with `{ id: X }`
- **When** the response is received
- **Then** `accessLevel` can be derived as `cookbook.userId === currentUser.id` → `'owner'`

#### Scenario: editor sees accessLevel as editor

- **Given** user U is an editor collaborator on cookbook X and calls `cookbooks.byId` with `{ id: X }`
- **When** the response is received
- **Then** `accessLevel` can be derived by finding `collaborators.find(c => c.id === currentUser.id).role` → `'editor'`

#### Scenario: viewer sees accessLevel as viewer

- **Given** user U is a viewer collaborator on cookbook X and calls `cookbooks.byId` with `{ id: X }`
- **When** the response is received
- **Then** `accessLevel` can be derived by finding `collaborators.find(c => c.id === currentUser.id).role` → `'viewer'`

---

## Traceability

- Proposal: "Collaborator model" → Requirement: ADDED Collaborator model
- Proposal: "Context augmentation" → Requirement: ADDED collabCookbookIds to Context
- Proposal: "visibilityFilter collaborator clause" → Requirement: ADDED visibilityFilter accepts collabCookbookIds
- Proposal: "Downgrade revocation" → Requirement: ADDED reconcileCollaborationOnDowngrade
- Proposal: "invite/remove procedures" → Requirements: ADDED cookbooks.addCollaborator, ADDED cookbooks.removeCollaborator
- Proposal: "myCollaborations" → Requirement: ADDED cookbooks.myCollaborations
- Proposal: "CookbookCard +collaboratorCount" → Requirement: ADDED collaboratorCount to cookbooks.list
- Proposal: "CookbookDetail collaborators panel" → Requirement: ADDED collaborators array to cookbooks.byId
- Proposal: "UI access level gating" → Requirement: MODIFIED cookbooks.byId to include accessLevel derivation hint
- Proposal: "users.search for invite modal" → Requirement: ADDED users.search procedure
- Proposal: "Attribution display" → Requirement: ADDED "Invited by" display in collaborators panel

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Collaborator queries use indexes

- **Given** `Collaborator.find({ userId: user.id })` is called
- **When** `explain()` is run on the query
- **Then** the query uses an index on `userId` field

#### Scenario: visibilityFilter calls are backward compatible

- **Given** existing code calls `visibilityFilter(ctx.user)`
- **When** TypeScript compilation runs
- **Then** no errors because `collabCookbookIds` has a default value of `[]`

### Requirement: Operability

#### Scenario: All collaborator-related exports are centrally located

- **Given** `Collaborator` model is imported
- **When** reviewing the exports
- **Then** the model is exported from `src/db/models/index.ts`

#### Scenario: Collab context addition is documented

- **Given** `src/server/trpc/context.ts` is read
- **When** reviewing the collabCookbookIds population
- **Then** a comment explains the purpose and query pattern used