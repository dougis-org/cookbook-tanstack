## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Granting library access

The system SHALL allow a user whose tier is Executive Chef to grant another registered
user read-only access to their entire library, and SHALL reject grant attempts from any
other caller.

#### Scenario: Executive Chef grants access to another user

- **Given** an authenticated, verified user "Owner" whose tier is `executive-chef`
- **And** a registered user "Recipient" who is not already a grantee of Owner
- **When** Owner calls `sharing.shareLibrary` with Recipient's user id
- **Then** a `LibraryShare` document is created with `ownerId` = Owner's id,
  `recipientId` = Recipient's id, `addedBy` = Owner's id, and `addedAt` set to the
  current time
- **And** the procedure returns the created grant

#### Scenario: Non-Executive-Chef caller is rejected

- **Given** an authenticated, verified user whose tier is `home-cook`, `prep-cook`, or
  `sous-chef`
- **When** that user calls `sharing.shareLibrary` with any target user id
- **Then** the call fails with a tRPC `FORBIDDEN` error
- **And** no `LibraryShare` document is created

#### Scenario: Duplicate grant is rejected

- **Given** an existing `LibraryShare` for the pair (Owner, Recipient)
- **When** Owner calls `sharing.shareLibrary` again with Recipient's user id
- **Then** the call fails with a tRPC `CONFLICT` error
- **And** exactly one `LibraryShare` document exists for that pair

#### Scenario: Self-share is rejected

- **Given** an authenticated, verified user "Owner" whose tier is `executive-chef`
- **When** Owner calls `sharing.shareLibrary` with their own user id
- **Then** the call fails with a tRPC `BAD_REQUEST` error
- **And** no `LibraryShare` document is created

### Requirement: ADDED Recipient visibility

The system SHALL make every private recipe and every cookbook owned by a sharing owner
readable by that owner's grantees, including content created after the grant, and SHALL
annotate such content with the owner's identity.

#### Scenario: Recipient sees the owner's private recipes

- **Given** Owner has an active grant to Recipient
- **And** Owner owns a recipe with `isPublic: false` and `hiddenByTier` not `true`
- **When** Recipient calls `recipes.list`
- **Then** the response includes that recipe
- **And** the recipe carries `sharedBy` = `{ id: <Owner id>, name: <Owner name> }`

#### Scenario: Recipient sees the owner's cookbooks

- **Given** Owner has an active grant to Recipient
- **And** Owner owns a cookbook with `isPublic: false`
- **When** Recipient calls `cookbooks.list`
- **Then** the response includes that cookbook with `sharedBy` populated

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

### Requirement: ADDED Read-only enforcement

The system SHALL reject every attempt by a grantee to modify, delete, or re-share
content belonging to the sharing owner.

#### Scenario: Recipient cannot update a shared recipe

- **Given** Owner has an active grant to Recipient
- **And** Owner owns a private recipe visible to Recipient
- **When** Recipient calls `recipes.update` for that recipe
- **Then** the call fails with a tRPC `FORBIDDEN` error
- **And** the recipe document is unchanged

#### Scenario: Recipient cannot delete shared content

- **Given** Owner has an active grant to Recipient
- **When** Recipient calls `recipes.delete` or `cookbooks.delete` for content owned by
  Owner
- **Then** the call fails with a tRPC `FORBIDDEN` error
- **And** the document is neither removed nor soft-deleted

#### Scenario: Recipient cannot modify a shared cookbook's contents

- **Given** Owner has an active grant to Recipient
- **And** Owner owns a cookbook visible to Recipient
- **When** Recipient attempts to add or remove a recipe entry in that cookbook
- **Then** the call fails with a tRPC `FORBIDDEN` error

#### Scenario: Recipient cannot re-share the owner's library

- **Given** Owner has an active grant to Recipient
- **And** Recipient's own tier is `executive-chef`
- **When** Recipient calls `sharing.shareLibrary` naming a third user
- **Then** only Recipient's own library is shared with the third user
- **And** the third user gains no visibility of Owner's content

### Requirement: ADDED Adding shared recipes to own cookbooks

The system SHALL allow a grantee to add a recipe owned by a sharing owner into a
cookbook the grantee owns, without copying the recipe and without consuming the
grantee's recipe quota.

#### Scenario: Recipient adds a shared recipe to their own cookbook

- **Given** Owner has an active grant to Recipient
- **And** Recipient owns a cookbook
- **When** Recipient adds a recipe owned by Owner to that cookbook
- **Then** the cookbook's `recipes[]` gains an entry whose `recipeId` is the owner's
  recipe id
- **And** no new `Recipe` document is created
- **And** Recipient's recipe quota usage is unchanged

#### Scenario: Shared entry resolves with attribution

- **Given** Recipient's cookbook contains a cross-owner entry referencing Owner's recipe
- **When** Recipient calls `cookbooks.byId` for that cookbook
- **Then** the entry resolves to the recipe's current content
- **And** the resolved entry carries `sharedBy` = `{ id: <Owner id>, name: <Owner name> }`

#### Scenario: Owner's later edits are reflected

- **Given** Recipient's cookbook contains a cross-owner entry referencing Owner's recipe
- **When** Owner updates that recipe's instructions
- **And** Recipient calls `cookbooks.byId`
- **Then** the resolved entry shows the updated instructions

### Requirement: ADDED Revoking a share

The system SHALL allow an owner to revoke a grant at any time, and the revocation SHALL
take effect on the grantee's next request with no intervening background job.

#### Scenario: Owner revokes a grant

- **Given** Owner has an active grant to Recipient
- **When** Owner calls `sharing.revokeLibraryShare` for that grant
- **Then** the `LibraryShare` document is deleted
- **And** Recipient's next `recipes.list` call excludes all of Owner's private content

#### Scenario: Non-owner cannot revoke a grant

- **Given** a `LibraryShare` from Owner to Recipient
- **When** any user other than Owner calls `sharing.revokeLibraryShare` for that grant
- **Then** the call fails with a tRPC `FORBIDDEN` error
- **And** the grant remains

### Requirement: ADDED Tier downgrade suspends shares

The system SHALL suspend all of an owner's grants while that owner's tier is below
Executive Chef, without deleting the grant records, and SHALL restore them if the owner
returns to Executive Chef.

#### Scenario: Downgrade suspends access immediately

- **Given** Owner has an active grant to Recipient and Owner's tier is `executive-chef`
- **When** Owner's tier is changed to `sous-chef`
- **And** Recipient makes their next request to `recipes.list`
- **Then** the response excludes all of Owner's private content
- **And** the `LibraryShare` document still exists

#### Scenario: Re-upgrade restores access

- **Given** Owner's tier was downgraded below `executive-chef` with grants intact
- **When** Owner's tier is restored to `executive-chef`
- **And** Recipient makes their next request to `recipes.list`
- **Then** the response again includes Owner's private content
- **And** no new grant had to be created

### Requirement: ADDED Unavailable shared entries

The system SHALL preserve a cross-owner cookbook entry when access to the referenced
recipe ends, marking it unavailable rather than removing it or exposing its content.

#### Scenario: Entry becomes unavailable after revocation

- **Given** Recipient's cookbook contains a cross-owner entry referencing Owner's recipe
- **And** the entry has a specific `orderIndex` and `chapterId`
- **When** Owner revokes the grant
- **And** Recipient calls `cookbooks.byId` for that cookbook
- **Then** the entry is still present with its original `orderIndex` and `chapterId`
- **And** the entry is returned with `unavailable: true`
- **And** the entry exposes no recipe name, ingredients, or instructions

#### Scenario: Entry becomes unavailable after owner downgrade

- **Given** Recipient's cookbook contains a cross-owner entry referencing Owner's recipe
- **When** Owner's tier drops below `executive-chef`
- **And** Recipient calls `cookbooks.byId`
- **Then** the entry is returned with `unavailable: true`

#### Scenario: Entry becomes unavailable after the owner deletes the recipe

- **Given** Recipient's cookbook contains a cross-owner entry referencing Owner's recipe
- **And** the grant is still active
- **When** Owner soft-deletes that recipe
- **And** Recipient calls `cookbooks.byId`
- **Then** the entry is returned with `unavailable: true`

### Requirement: ADDED Hidden content stays hidden

The system SHALL NOT expose content that is hidden by tier or soft-deleted to grantees,
regardless of an active share.

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

### Requirement: ADDED Managing shares

The system SHALL provide an account-level surface where a user can see and revoke every
grant they have made, see every library shared with them, and see their existing
cookbook collaborations.

#### Scenario: Owner views and revokes grants

- **Given** an authenticated Executive Chef user with two active grants
- **When** the user opens the "Sharing & Collaboration" section of the account page
- **Then** both grantees are listed with name and grant date
- **And** activating the revoke control for one grantee removes that grant and updates
  the list

#### Scenario: Recipient views libraries shared with them

- **Given** an authenticated user who is the grantee of two owners
- **When** the user opens the "Sharing & Collaboration" section of the account page
- **Then** both sharing owners are listed

#### Scenario: Existing collaborations are visible in the same section

- **Given** an authenticated user who is a collaborator on a cookbook
- **When** the user opens the "Sharing & Collaboration" section of the account page
- **Then** that cookbook collaboration is listed alongside the library shares
- **And** the listing links to the cookbook where collaborator management occurs

#### Scenario: Grant flow warns about scope

- **Given** an Executive Chef user opening the share flow
- **When** the invite control is displayed
- **Then** the interface states that the grant covers the user's entire library,
  including private content created in the future

### Requirement: ADDED Quota displays exclude shared content

The system SHALL compute tier quota usage from content the user owns, excluding content
visible to them through a library share.

#### Scenario: Shared recipes do not count toward the recipient's limit

- **Given** Recipient's tier is `home-cook` with a limit of 10 recipes
- **And** Recipient owns 3 recipes
- **And** Owner has shared a library containing 50 private recipes with Recipient
- **When** Recipient's quota usage is displayed or evaluated
- **Then** the usage reported is 3 of 10
- **And** Recipient can still create additional recipes up to the limit

## MODIFIED Requirements

### Requirement: MODIFIED Content visibility filtering

The system SHALL determine read visibility for user-owned content from four conditions:
public content, content the caller owns, cookbooks the caller collaborates on, and
content owned by a user who currently shares their library with the caller.

#### Scenario: Visibility filter includes the shared-owner clause

- **Given** an authenticated caller with a non-empty set of sharing owners
- **When** `visibilityFilter` is invoked for that caller
- **Then** the returned filter contains an `$or` clause matching documents whose
  `userId` is one of those owners
- **And** that clause also requires `hiddenByTier` to not be `true`

#### Scenario: Omitting the new parameter preserves prior behavior

- **Given** a call site that invokes `visibilityFilter` without the shared-owners
  argument
- **When** the filter is produced
- **Then** it is equivalent to the filter produced before this change

#### Scenario: Anonymous callers are unaffected

- **Given** an unauthenticated caller
- **When** `visibilityFilter` is invoked
- **Then** the returned filter restricts results to public, non-hidden,
  non-pending-verification content only

### Requirement: MODIFIED Request context composition

The system SHALL resolve, for each authenticated request, the set of owners who
currently share their library with the caller, filtered to owners whose tier is still
Executive Chef.

#### Scenario: Context exposes only currently-eligible owners

- **Given** a caller holding grants from two owners, one `executive-chef` and one
  `sous-chef`
- **When** the request context is created
- **Then** `ctx.sharedOwnerIds` contains only the `executive-chef` owner's id

#### Scenario: Callers without grants incur no extra query

- **Given** an authenticated caller who holds no `LibraryShare` grants
- **When** the request context is created
- **Then** `ctx.sharedOwnerIds` is an empty array
- **And** no owner-tier lookup is performed

## REMOVED Requirements

No requirements are removed by this change.

## Traceability

- Proposal element "New `LibraryShare` collection" -> Requirement: ADDED Granting
  library access; ADDED Revoking a share
- Proposal element "`ctx.sharedOwnerIds` filtered by owner tier" -> Requirement:
  MODIFIED Request context composition; ADDED Tier downgrade suspends shares
- Proposal element "`visibilityFilter` gains shared clause" -> Requirement: MODIFIED
  Content visibility filtering; ADDED Recipient visibility
- Proposal element "Recipients may add shared recipes to own cookbooks" -> Requirement:
  ADDED Adding shared recipes to own cookbooks; ADDED Unavailable shared entries
- Proposal element "`sharedBy` on read payloads" -> Requirement: ADDED Recipient
  visibility
- Proposal element "Read-only enforcement" -> Requirement: ADDED Read-only enforcement
- Proposal element "Sharing & Collaboration account section" -> Requirement: ADDED
  Managing shares
- Proposal element "Executive-Chef-only sharing, no recipient tier floor" ->
  Requirement: ADDED Granting library access; ADDED Recipient visibility
- Design Decision 1 (separate collection) -> Requirement: ADDED Granting library access
- Design Decision 2 (live tier check) -> Requirement: ADDED Tier downgrade suspends
  shares; MODIFIED Request context composition
- Design Decision 3 (derived cross-owner entries) -> Requirement: ADDED Unavailable
  shared entries; ADDED Adding shared recipes to own cookbooks
- Design Decision 4 (read-only by omission) -> Requirement: ADDED Read-only enforcement
- Design Decision 5 (single account section) -> Requirement: ADDED Managing shares
- Design Decision 6 (no recipient tier floor) -> Requirement: ADDED Recipient visibility
- Design Decision 7 (mixed lists with badge) -> Requirement: ADDED Recipient
  visibility; ADDED Quota displays exclude shared content
- Requirement: ADDED Granting library access -> Tasks 2.1, 2.2, 3.1
- Requirement: ADDED Recipient visibility -> Tasks 1.1, 1.2, 3.2, 4.1
- Requirement: ADDED Read-only enforcement -> Task 3.4
- Requirement: ADDED Adding shared recipes to own cookbooks -> Tasks 3.3, 4.3
- Requirement: ADDED Revoking a share -> Tasks 2.2, 5.2
- Requirement: ADDED Tier downgrade suspends shares -> Task 1.2
- Requirement: ADDED Unavailable shared entries -> Tasks 3.3, 4.3
- Requirement: ADDED Hidden content stays hidden -> Task 1.1
- Requirement: ADDED Managing shares -> Tasks 5.1, 5.2, 5.3
- Requirement: ADDED Quota displays exclude shared content -> Task 4.4
- Requirement: MODIFIED Content visibility filtering -> Task 1.1
- Requirement: MODIFIED Request context composition -> Task 1.2

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Context creation query budget

- **Given** an authenticated request from a caller who holds at least one grant
- **When** the request context is created
- **Then** at most one additional indexed query is issued to resolve grants beyond the
  queries issued before this change
- **And** that query projects only the `ownerId` field

#### Scenario: No added cost for callers without grants

- See functional scenario: "Callers without grants incur no extra query" under
  MODIFIED Request context composition.

### Requirement: Security

#### Scenario: Access control

- See functional scenarios: "Non-Executive-Chef caller is rejected" and "Self-share is
  rejected" under ADDED Granting library access; "Non-grantee sees nothing" under ADDED
  Recipient visibility; all scenarios under ADDED Read-only enforcement; "Non-owner
  cannot revoke a grant" under ADDED Revoking a share; and all scenarios under ADDED
  Hidden content stays hidden.

#### Scenario: Revoked access is not recoverable from client state

- **Given** a grantee whose client holds a previously fetched payload of shared content
- **When** the grant is revoked and the client re-requests that content by id
- **Then** the server responds `NOT_FOUND` for each shared document
- **And** no shared content is returned from any endpoint

#### Scenario: Owner identity is the only owner data exposed

- **Given** an active grant from Owner to Recipient
- **When** Recipient reads any shared recipe or cookbook
- **Then** the only owner attributes present in the payload are the owner's id and
  display name
- **And** the owner's email address and tier are absent from the payload

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** the owner-tier lookup used to build `ctx.sharedOwnerIds` fails or times out
- **When** the request proceeds
- **Then** `ctx.sharedOwnerIds` is treated as empty
- **And** the caller sees only their own and public content rather than an error
- **And** no shared content is exposed as a result of the failure

#### Scenario: Orphaned grants are inert

- **Given** a `LibraryShare` whose `recipientId` refers to a user account that no longer
  exists
- **When** any request is processed
- **Then** the grant grants access to no caller
- **And** no error is raised by its presence
