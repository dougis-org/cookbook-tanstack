## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Granting library access

The system SHALL allow a user whose tier is Executive Chef to grant another registered
user read-only access to their entire library via `sharing.shareLibrary`, and SHALL
reject grant attempts from any other caller or for any invalid pairing.

#### Scenario: Executive Chef grants access to another user

- **Given** an authenticated, verified user "Owner" whose tier is `executive-chef`
- **And** a registered user "Recipient" who is not already a grantee of Owner
- **When** Owner calls `sharing.shareLibrary` with Recipient's user id
- **Then** a `LibraryShare` document is created with `ownerId` = Owner's id,
  `recipientId` = Recipient's id, `addedBy` = Owner's id, and a populated `addedAt`
- **And** the procedure returns the created grant

#### Scenario: Non-Executive-Chef caller is rejected

- **Given** an authenticated, verified user whose tier is `home-cook`, `prep-cook`, or
  `sous-chef`
- **When** that user calls `sharing.shareLibrary` with any target user id
- **Then** the call fails with a tRPC `FORBIDDEN` error
- **And** no `LibraryShare` document is created

#### Scenario: Unauthenticated caller is rejected

- **Given** a request with no valid session
- **When** `sharing.shareLibrary` is called with any input
- **Then** the call fails with a tRPC `UNAUTHORIZED` error

#### Scenario: Self-share is rejected before any recipient lookup

- **Given** an authenticated, verified user "Owner" whose tier is `executive-chef`
- **When** Owner calls `sharing.shareLibrary` naming their own user id as recipient
- **Then** the call fails with a tRPC `BAD_REQUEST` error
- **And** no `LibraryShare` document is created
- **And** no database lookup for the recipient's existence is required to reach this
  rejection

#### Scenario: Unknown recipient is rejected

- **Given** an authenticated, verified user "Owner" whose tier is `executive-chef`
- **When** Owner calls `sharing.shareLibrary` naming a user id that does not exist
- **Then** the call fails with a tRPC `NOT_FOUND` error
- **And** no `LibraryShare` document is created

#### Scenario: Duplicate grant is rejected

- **Given** an existing `LibraryShare` for the pair (Owner, Recipient)
- **When** Owner calls `sharing.shareLibrary` again naming Recipient
- **Then** the call fails with a tRPC `CONFLICT` error
- **And** exactly one `LibraryShare` document exists for that pair

### Requirement: ADDED Revoking a share

The system SHALL allow only the owner of a grant to revoke it via
`sharing.revokeLibraryShare`, deleting the grant row, and SHALL reject revocation by
any other caller including the grant's recipient.

#### Scenario: Owner revokes a grant

- **Given** a `LibraryShare` document from Owner to Recipient
- **When** Owner calls `sharing.revokeLibraryShare` naming that grant
- **Then** the `LibraryShare` document is deleted

#### Scenario: Non-owner cannot revoke a grant

- **Given** a `LibraryShare` document from Owner to Recipient
- **When** any user other than Owner calls `sharing.revokeLibraryShare` naming that
  grant
- **Then** the call fails with a tRPC `FORBIDDEN` error
- **And** the grant document still exists

#### Scenario: The recipient cannot revoke their own received grant

- **Given** a `LibraryShare` document from Owner to Recipient
- **When** Recipient calls `sharing.revokeLibraryShare` naming that grant
- **Then** the call fails with a tRPC `FORBIDDEN` error
- **And** the grant document still exists

#### Scenario: Revoking a non-existent grant is distinguished from a forbidden one

- **Given** no `LibraryShare` document exists with the given id
- **When** any authenticated user calls `sharing.revokeLibraryShare` naming that id
- **Then** the call fails with a tRPC `NOT_FOUND` error

### Requirement: ADDED Managing shares (server half)

The system SHALL provide `sharing.myLibraryShares` (grants the caller has given) and
`sharing.mySharedLibraries` (grants the caller has received), each exposing the other
party's display name and excluding any grant whose owner is not currently
Executive Chef.

#### Scenario: Owner lists grants they have given

- **Given** an authenticated user "Owner" who has granted access to two recipients
- **When** Owner calls `sharing.myLibraryShares`
- **Then** the response lists both grants
- **And** each entry includes the recipient's display name

#### Scenario: Recipient lists libraries shared with them

- **Given** an authenticated user "Recipient" who holds grants from two owners
- **When** Recipient calls `sharing.mySharedLibraries`
- **Then** the response lists both grants
- **And** each entry includes the owner's display name

#### Scenario: A downgraded owner's grant is excluded from both listings

- **Given** Owner granted access to Recipient while Owner's tier was
  `executive-chef`
- **And** Owner's tier has since dropped below `executive-chef`
- **When** Owner calls `sharing.myLibraryShares`
- **And** Recipient calls `sharing.mySharedLibraries`
- **Then** neither response includes the grant
- **And** the underlying `LibraryShare` document still exists in both cases

#### Scenario: A re-upgraded owner's grant reappears with no re-grant

- **Given** Owner's grant to Recipient was excluded from both listings per a prior
  downgrade
- **When** Owner's tier is restored to `executive-chef`
- **And** Owner calls `sharing.myLibraryShares`
- **And** Recipient calls `sharing.mySharedLibraries`
- **Then** both responses include the grant again
- **And** no new `LibraryShare` document was created to make this happen

## Traceability

- Proposal element: `shareLibrary` grant procedure -> Requirement: ADDED Granting
  library access
- Proposal element: `revokeLibraryShare`, `myLibraryShares`, `mySharedLibraries` ->
  Requirement: ADDED Revoking a share; ADDED Managing shares (server half)
- Design decision: Decision 8 (shared eligibility helper) -> Requirement: ADDED
  Managing shares (server half), scenarios "downgraded owner's grant is excluded"
  and "re-upgraded owner's grant reappears"
- Design decision: Decision 9 (`execChefProcedure` promotion) -> Requirement: ADDED
  Granting library access, scenario "Non-Executive-Chef caller is rejected"
- Design decision: Decision 10 (validation order) -> Requirement: ADDED Granting
  library access, scenarios "Self-share is rejected", "Unknown recipient is
  rejected", "Duplicate grant is rejected"
- Design decision: Decision 11 (revoke authorization shape) -> Requirement: ADDED
  Revoking a share, scenarios "Non-owner cannot revoke", "recipient cannot revoke",
  "distinguished from a forbidden one"
- Design decision: Decision 12 (no email/tier projection) -> Non-Functional
  Acceptance Criteria, Security
- Requirement: ADDED Granting library access -> Task(s): 2.1
- Requirement: ADDED Revoking a share -> Task(s): 2.2
- Requirement: ADDED Managing shares (server half) -> Task(s): 2.2

## Non-Functional Acceptance Criteria

### Requirement: Security

The system SHALL NOT expose the other party's email address or subscription tier in
any `sharing.*` response payload.

#### Scenario: Listings never include email or tier

- **Given** Owner has granted access to Recipient
- **When** Owner calls `sharing.myLibraryShares` and Recipient calls
  `sharing.mySharedLibraries`
- **Then** no entry in either response contains an `email` field
- **And** no entry in either response contains a `tier` field

For access-control rejection behavior, see functional scenarios: "Non-Executive-Chef
caller is rejected", "Unauthenticated caller is rejected", "Non-owner cannot revoke a
grant", "The recipient cannot revoke their own received grant".
