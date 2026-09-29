## ADDED Requirements

This document details *changes* to requirements and is additive to the
[`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Recipient visibility

The system SHALL make every private recipe and every cookbook owned by a sharing
owner readable by that owner's grantees via `recipes.list`, `recipes.byId`,
`cookbooks.list`, and `cookbooks.byId`, including content created after the grant,
and SHALL annotate such content with the owner's identity.

#### Scenario: Recipient sees the owner's private recipes

- **Given** Owner has an active grant to Recipient
- **And** Owner owns a recipe with `isPublic: false` and `hiddenByTier` not `true`
- **When** Recipient calls `recipes.list`
- **Then** the response includes that recipe
- **And** the recipe carries `sharedBy` = `{ id: <Owner id>, name: <Owner name> }`

#### Scenario: Recipient sees an individual shared recipe by id

- **Given** Owner has an active grant to Recipient
- **And** Owner owns a private recipe
- **When** Recipient calls `recipes.byId` for that recipe's id
- **Then** the call succeeds and the response carries `sharedBy` populated

#### Scenario: Recipient sees the owner's cookbooks

- **Given** Owner has an active grant to Recipient
- **And** Owner owns a cookbook with `isPublic: false`
- **When** Recipient calls `cookbooks.list`
- **Then** the response includes that cookbook with `sharedBy` populated

#### Scenario: Recipient sees an individual shared cookbook by id

- **Given** Owner has an active grant to Recipient
- **And** Owner owns a private cookbook
- **When** Recipient calls `cookbooks.byId` for that cookbook's id
- **Then** the call succeeds and the response carries `sharedBy` populated

#### Scenario: Content created after the grant is included

- **Given** Owner has an active grant to Recipient
- **When** Owner creates a new private recipe after the grant was created
- **And** Recipient calls `recipes.list`
- **Then** the response includes the newly created recipe

#### Scenario: Non-grantee sees nothing

- **Given** Owner has an active grant to Recipient
- **And** a registered user "Stranger" who holds no grant from Owner
- **When** Stranger calls `recipes.list` and `cookbooks.list`
- **Then** neither response includes any of Owner's private content

#### Scenario: Owned and public content is not annotated

- **Given** Recipient owns their own recipe and a public recipe exists
- **When** Recipient calls `recipes.list`
- **Then** both of those recipes carry `sharedBy` = `null`

#### Scenario: Owner attribution exposes no other owner data

- **Given** an active grant from Owner to Recipient
- **When** Recipient reads any shared recipe or cookbook via any of the four touched
  endpoints
- **Then** the only owner attributes present anywhere in the payload are the owner's
  id and display name
- **And** the owner's email address and tier are absent from the payload

### Requirement: ADDED Read-only enforcement

The system SHALL reject every attempt by a grantee to modify, delete, or re-share
content belonging to the sharing owner, and this guarantee SHALL be verified by a
test suite that enumerates mutation procedures from the `recipes` and `cookbooks`
router definitions rather than a hand-authored list.

#### Scenario: Every enumerated recipe mutation is rejected

- **Given** Owner has an active grant to Recipient
- **And** Owner owns a private recipe visible to Recipient
- **When** Recipient invokes each mutation procedure registered on the `recipes`
  router against that recipe, as enumerated from the router definition
- **Then** every invocation fails with a tRPC `FORBIDDEN` or `NOT_FOUND` error
- **And** the recipe document is unchanged after each invocation

#### Scenario: Every enumerated cookbook mutation is rejected

- **Given** Owner has an active grant to Recipient
- **And** Owner owns a cookbook visible to Recipient
- **When** Recipient invokes each mutation procedure registered on the `cookbooks`
  router against that cookbook, as enumerated from the router definition
- **Then** every invocation fails with a tRPC `FORBIDDEN` or `NOT_FOUND` error
- **And** the cookbook document is unchanged after each invocation

#### Scenario: Recipient cannot modify a shared cookbook's recipe entries

- **Given** Owner has an active grant to Recipient
- **And** Owner owns a cookbook visible to Recipient
- **When** Recipient attempts to add or remove a recipe entry in that cookbook
- **Then** the call fails with a tRPC `FORBIDDEN` error

#### Scenario: Recipient cannot manage a shared cookbook's collaborators

- **Given** Owner has an active grant to Recipient
- **And** Owner owns a cookbook visible to Recipient with no existing collaborators
- **When** Recipient attempts to add or remove a collaborator on that cookbook
- **Then** the call fails with a tRPC `FORBIDDEN` error

#### Scenario: Recipient cannot re-share the owner's library

- **Given** Owner has an active grant to Recipient
- **And** Recipient's own tier is `executive-chef`
- **When** Recipient calls `sharing.shareLibrary` naming a third user
- **Then** only Recipient's own library is shared with the third user
- **And** the third user gains no visibility of Owner's content

#### Scenario: Collaborator write access on one cookbook survives alongside read-only sharing

- **Given** Owner has an active grant to Recipient covering Owner's whole library
- **And** Recipient is also a `Collaborator` on one specific cookbook owned by Owner
- **When** Recipient edits that one collaborated cookbook
- **Then** the edit succeeds
- **When** Recipient attempts the same kind of edit on any other cookbook owned by
  Owner
- **Then** the call fails with a tRPC `FORBIDDEN` error

### Requirement: ADDED Adding shared recipes to own cookbooks

The system SHALL allow a grantee to add a recipe they can see (owned by a sharing
owner, public, or via collaboration) into a cookbook the grantee owns, without
copying the recipe, without consuming the grantee's recipe quota, and without any
schema change to the cookbook's recipe-entry shape.

#### Scenario: Recipient adds a shared recipe to their own cookbook

- **Given** Owner has an active grant to Recipient
- **And** Recipient owns a cookbook
- **When** Recipient adds a recipe owned by Owner to that cookbook
- **Then** the cookbook's `recipes[]` gains an entry whose `recipeId` is the owner's
  recipe id
- **And** no new `Recipe` document is created
- **And** Recipient's recipe quota usage is unchanged

#### Scenario: Shared entry resolves with attribution

- **Given** Recipient's cookbook contains a cross-owner entry referencing Owner's
  recipe
- **When** Recipient calls `cookbooks.byId` for that cookbook
- **Then** the entry resolves to the recipe's current content
- **And** the resolved entry carries `sharedBy` = `{ id: <Owner id>, name: <Owner name> }`

#### Scenario: Owner's later edits are reflected

- **Given** Recipient's cookbook contains a cross-owner entry referencing Owner's
  recipe
- **When** Owner updates that recipe's instructions
- **And** Recipient calls `cookbooks.byId`
- **Then** the resolved entry shows the updated instructions

#### Scenario: Recipient cannot add a recipe they cannot see

- **Given** Owner owns a private recipe with no grant or public flag making it
  visible to Recipient
- **When** Recipient attempts to add that recipe to a cookbook they own
- **Then** the call fails with a tRPC `FORBIDDEN` or `NOT_FOUND` error
- **And** the cookbook's `recipes[]` is unchanged

### Requirement: ADDED Unavailable shared entries

The system SHALL preserve a cross-owner cookbook entry when access to the referenced
recipe ends, marking it unavailable rather than removing it or exposing its content,
resolving this state at read time from the recipe's current `userId` and live share
status rather than from any persisted flag.

#### Scenario: Entry becomes unavailable after revocation

- **Given** Recipient's cookbook contains a cross-owner entry referencing Owner's
  recipe
- **And** the entry has a specific `orderIndex` and `chapterId`
- **When** Owner revokes the grant
- **And** Recipient calls `cookbooks.byId` for that cookbook
- **Then** the entry is still present with its original `orderIndex` and `chapterId`
- **And** the entry is returned as `{ recipeId, unavailable: true }`
- **And** the entry exposes no recipe name, ingredients, or instructions

#### Scenario: Entry becomes unavailable after owner downgrade

- **Given** Recipient's cookbook contains a cross-owner entry referencing Owner's
  recipe
- **When** Owner's tier drops below `executive-chef`
- **And** Recipient calls `cookbooks.byId`
- **Then** the entry is returned with `unavailable: true`

#### Scenario: Entry becomes unavailable after the owner deletes the recipe

- **Given** Recipient's cookbook contains a cross-owner entry referencing Owner's
  recipe
- **And** the grant is still active
- **When** Owner soft-deletes that recipe
- **And** Recipient calls `cookbooks.byId`
- **Then** the entry is returned with `unavailable: true`

#### Scenario: Every other consumer of `Cookbook.recipes[]` resolves through visibility

- **Given** an audit of the codebase identifies every consumer of
  `Cookbook.recipes[]` beyond `cookbooks.byId`
- **When** each identified consumer reads a cookbook containing a cross-owner entry
  whose recipe has become inaccessible
- **Then** each consumer either resolves the entry as unavailable or excludes it —
  none renders the entry's recipe content directly from the stored array without a
  visibility check

#### Scenario: The print route excludes cross-owner entries

- **Given** a cookbook owned by Recipient contains a cross-owner entry referencing a
  recipe owned by Owner, visible via an active grant
- **When** the print route (`src/routes/cookbooks.$cookbookId_.print.tsx`) renders
  that cookbook
- **Then** the cross-owner entry is excluded from the rendered output entirely
- **And** it is not rendered as an `unavailable` placeholder or by any other means
- **And** this exclusion remains in place until #669 defines print-view attribution

### Requirement: ADDED Hidden content stays hidden in shared reads

The system SHALL NOT expose content that is hidden by tier or soft-deleted to
grantees at any of the four touched endpoints, regardless of an active share.

#### Scenario: Tier-hidden content is not shared

- **Given** Owner has an active grant to Recipient
- **And** Owner owns a recipe with `hiddenByTier: true`
- **When** Recipient calls `recipes.list`
- **Then** the response excludes that recipe

#### Scenario: Soft-deleted content is not shared

- **Given** Owner has an active grant to Recipient
- **And** Owner owns a recipe with `deleted: true`
- **When** Recipient calls `recipes.list`
- **Then** the response excludes that recipe

## Traceability

- Proposal element: Thread `sharedOwnerIds` through every `visibilityFilter` call
  site -> Requirement: ADDED Recipient visibility
- Proposal element: `sharedBy` on read payloads via single batched lookup ->
  Requirement: ADDED Recipient visibility (owner-attribution scenarios); NFAC
  Performance
- Proposal element: Recipient adds shared recipe to own cookbook; unavailable
  fallback -> Requirement: ADDED Adding shared recipes to own cookbooks; ADDED
  Unavailable shared entries
- Proposal element: Table-driven, router-derived read-only enforcement sweep ->
  Requirement: ADDED Read-only enforcement
- Design decision: Decision 1 (explicit-parameter threading) -> Requirement: ADDED
  Recipient visibility
- Design decision: Decision 2 (batched `$lookup` for `sharedBy`) -> Requirement:
  ADDED Recipient visibility (owner-attribution scenarios); NFAC Performance
- Design decision: Decision 3 (derived cross-owner state) -> Requirement: ADDED
  Adding shared recipes to own cookbooks; ADDED Unavailable shared entries
- Design decision: Decision 4 (router-introspecting enforcement test) -> Requirement:
  ADDED Read-only enforcement
- Requirement: ADDED Recipient visibility -> Task(s): 3.1, 3.2
- Requirement: ADDED Read-only enforcement -> Task(s): 3.4
- Requirement: ADDED Adding shared recipes to own cookbooks -> Task(s): 3.3
- Requirement: ADDED Unavailable shared entries -> Task(s): 3.3
- Requirement: ADDED Hidden content stays hidden in shared reads -> Task(s): 3.1

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: `sharedBy` resolution is batched, not per-row

- **Given** a `recipes.list` or `cookbooks.list` response containing N items owned
  by shared owners
- **When** the response is assembled
- **Then** owner display names for `sharedBy` are resolved via exactly one
  additional batched database query, not N queries

### Requirement: Security

#### Scenario: Access control

- See functional scenarios: all scenarios under ADDED Read-only enforcement;
  "Non-grantee sees nothing" under ADDED Recipient visibility; "Recipient cannot add
  a recipe they cannot see" under ADDED Adding shared recipes to own cookbooks; and
  both scenarios under ADDED Hidden content stays hidden in shared reads.

#### Scenario: Owner identity is the only owner data exposed

- See functional scenario: "Owner attribution exposes no other owner data" under
  ADDED Recipient visibility.

#### Scenario: Revoked access is not recoverable from client state

- **Given** a grantee whose client holds a previously fetched payload of shared
  content
- **When** the grant is revoked and the client re-requests that content by id
- **Then** `recipes.byId`/`cookbooks.byId` resolve to `null` for each shared document
  (their existing, pre-change contract for anything the caller can't see — they are
  public queries and don't throw `NOT_FOUND`)
- **And** no shared content is returned from any endpoint

### Requirement: Reliability

#### Scenario: Orphaned grants are inert

- **Given** a `LibraryShare` whose `recipientId` refers to a user account that no
  longer exists
- **When** any of the four touched endpoints is called by any user
- **Then** the grant grants access to no caller
- **And** no error is raised by its presence
