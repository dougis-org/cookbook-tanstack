## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED LibraryShare grant storage

The system SHALL provide a `LibraryShare` collection storing one document per
(owner, recipient) grant pair, uniquely constrained on that pair, with indexes
supporting lookup by either party.

#### Scenario: Duplicate pair is rejected at the storage layer

- **Given** a `LibraryShare` document exists with `ownerId` = A and `recipientId` = B
- **When** a second `LibraryShare` document is inserted with the same `ownerId` and
  `recipientId`
- **Then** the insert fails with a MongoDB duplicate-key error
- **And** exactly one document exists for the pair

#### Scenario: Required fields are enforced

- **Given** an attempt to create a `LibraryShare` document
- **When** `ownerId`, `recipientId`, or `addedBy` is omitted
- **Then** the document fails validation

#### Scenario: `addedAt` defaults without being supplied

- **Given** a valid `LibraryShare` document is created without an explicit `addedAt`
- **When** the document is persisted
- **Then** `addedAt` is set to the time of creation

### Requirement: ADDED Live owner-eligibility resolution in one query

The system SHALL resolve, for each authenticated request, the set of owners currently
sharing their library with the caller — filtered to owners whose tier is Executive
Chef at the moment of the request — using exactly one additional database round trip
beyond what the request already performs, and zero additional round trips when the
caller holds no grants.

#### Scenario: Eligible owner appears in the resolved set

- **Given** a `LibraryShare` document with `ownerId` = Owner and `recipientId` =
  Recipient
- **And** Owner's current tier is `executive-chef`
- **When** a request context is created for Recipient
- **Then** `ctx.sharedOwnerIds` contains Owner's id

#### Scenario: Downgraded owner is excluded without deleting the grant

- **Given** a `LibraryShare` document with `ownerId` = Owner and `recipientId` =
  Recipient
- **And** Owner's current tier is `sous-chef`
- **When** a request context is created for Recipient
- **Then** `ctx.sharedOwnerIds` does not contain Owner's id
- **And** the `LibraryShare` document still exists unmodified

#### Scenario: Re-upgraded owner is included again with no new grant

- **Given** a `LibraryShare` document with `ownerId` = Owner and `recipientId` =
  Recipient, created while Owner's tier was `executive-chef`
- **And** Owner's tier was later changed to `sous-chef` and then back to
  `executive-chef`
- **When** a request context is created for Recipient
- **Then** `ctx.sharedOwnerIds` contains Owner's id
- **And** no new `LibraryShare` document was created during either tier change

#### Scenario: Recipient with no grants performs no owner lookup

- **Given** a caller holding zero `LibraryShare` documents as recipient
- **When** a request context is created for that caller
- **Then** `ctx.sharedOwnerIds` is an empty array
- **And** no aggregation or query against `LibraryShare` or the owner-tier data is
  issued for that purpose

#### Scenario: Owner-tier resolution is a single round trip

- **Given** a caller holding one or more `LibraryShare` documents as recipient
- **When** a request context is created for that caller
- **Then** exactly one additional database round trip is issued to resolve
  `ctx.sharedOwnerIds`, projecting only the owner id field

### Requirement: ADDED Visibility filter shared-owner clause

The system SHALL extend `visibilityFilter` to accept a set of shared-owner ids and, when
non-empty, treat documents owned by any of those ids as visible to the caller, subject
to the same hidden-content exclusion applied to every other visibility clause.

#### Scenario: Shared-owner clause is added when ids are supplied

- **Given** an authenticated caller and a non-empty list of shared-owner ids
- **When** `visibilityFilter` is invoked with that list
- **Then** the returned filter's `$or` array contains a clause matching
  `userId: { $in: <shared-owner ids as ObjectIds> }`
- **And** that clause also requires `hiddenByTier: { $ne: true }`

#### Scenario: Omitting the new parameter preserves prior behavior exactly

- **Given** a call to `visibilityFilter` with only the first two parameters (as every
  call site does today)
- **When** the filter is produced
- **Then** it is structurally identical to the filter produced before this change

#### Scenario: Invalid ids are discarded before reaching the query

- **Given** a shared-owner id list containing at least one string that is not a valid
  MongoDB ObjectId
- **When** `visibilityFilter` is invoked with that list
- **Then** the invalid entries are excluded from the resulting `$in` clause
- **And** no invalid value is passed to the underlying query

#### Scenario: Collaborator clause is unaffected when both parameters are supplied

- **Given** both a non-empty `collabCookbookIds` list and a non-empty shared-owner id
  list
- **When** `visibilityFilter` is invoked with both
- **Then** the returned filter contains both the collaborator clause and the
  shared-owner clause, each unchanged in shape from its single-parameter form

#### Scenario: Anonymous callers are unaffected

- **Given** an unauthenticated caller
- **When** `visibilityFilter` is invoked, regardless of what is passed for the
  shared-owner parameter
- **Then** the returned filter restricts results to public, non-hidden,
  non-pending-verification content only

### Requirement: ADDED Owner-eligibility lookup fails closed

The system SHALL treat a failure in resolving owner tier eligibility as an empty
shared-owner set for that request, rather than propagating the failure or granting
unintended access.

#### Scenario: A failed eligibility lookup does not fail the request

- **Given** the aggregation used to resolve owner eligibility throws or times out
- **When** a request context is created for a caller holding grants
- **Then** context creation completes successfully
- **And** `ctx.sharedOwnerIds` is an empty array for that request

#### Scenario: A failed eligibility lookup does not expose shared content

- **Given** the same failure condition as above
- **When** the resulting context is used to build a visibility filter
- **Then** the filter contains no shared-owner clause for that request

## MODIFIED Requirements

No existing requirement is modified by this change in a way that alters observed
behavior for any current caller; the `visibilityFilter` and context-composition
requirements from the epic spec (`openspec/changes/share-my-library/specs/library-sharing/spec.md`)
are extended additively, as described in the ADDED requirements above.

## REMOVED Requirements

No requirements are removed by this change.

## Traceability

- Proposal element "New `LibraryShare` collection" -> Requirement: ADDED LibraryShare
  grant storage
- Proposal element "`ctx.sharedOwnerIds` costs one query" -> Requirement: ADDED Live
  owner-eligibility resolution in one query
- Proposal element "`visibilityFilter` fourth clause, defaulted parameter" ->
  Requirement: ADDED Visibility filter shared-owner clause
- Proposal element "Fail-closed tier lookup" -> Requirement: ADDED Owner-eligibility
  lookup fails closed
- Proposal element "Relocate `userLookupStages`" -> covered under NFAC Operability
  below (regression guard, not a new user-facing requirement)
- Design Decision 1 (one aggregation) -> Requirement: ADDED Live owner-eligibility
  resolution in one query
- Design Decision 3 (grants never deleted) -> Requirement: ADDED Live
  owner-eligibility resolution in one query (downgrade/re-upgrade scenarios)
- Design Decision 4 (fail closed) -> Requirement: ADDED Owner-eligibility lookup fails
  closed
- Requirement: ADDED LibraryShare grant storage -> Task 1.2 (model)
- Requirement: ADDED Live owner-eligibility resolution in one query -> Task 1.2
  (context)
- Requirement: ADDED Visibility filter shared-owner clause -> Task 1.1
- Requirement: ADDED Owner-eligibility lookup fails closed -> Task 1.2 (context)

## Non-Functional Acceptance Criteria

> NFAC scenarios below express only genuinely non-functional properties not already
> covered by the functional scenarios above. The query-count and fail-closed behaviors
> are already fully specified as functional scenarios under ADDED Live
> owner-eligibility resolution in one query and ADDED Owner-eligibility lookup fails
> closed; see those instead of duplicating them here.

### Requirement: Performance

#### Scenario: No query-count regression for existing call sites

- **Given** a call site of `visibilityFilter` that does not pass the new shared-owner
  parameter
- **When** that call site executes
- **Then** it issues the same number of queries as before this change

### Requirement: Security

#### Scenario: Access control

- See functional scenarios: "Downgraded owner is excluded without deleting the grant"
  and "Recipient with no grants performs no owner lookup" under ADDED Live
  owner-eligibility resolution in one query; "Invalid ids are discarded before reaching
  the query" and "Anonymous callers are unaffected" under ADDED Visibility filter
  shared-owner clause.

### Requirement: Reliability

#### Scenario: Recovery behavior

- See functional scenarios under ADDED Owner-eligibility lookup fails closed.

### Requirement: Operability

#### Scenario: Relocating a shared helper does not regress its existing caller

- **Given** `userLookupStages` is moved from `cookbooks.ts` to `_helpers.ts` and
  exported
- **When** `cookbooks.ts`'s existing collaborator-name aggregation
  (`fetchCollaboratorsWithUsers`) runs against its pre-existing test suite
- **Then** every test in that suite continues to pass with no changes to its
  assertions
