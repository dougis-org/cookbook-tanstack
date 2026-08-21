This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

## MODIFIED Requirements

### Requirement: MODIFIED `users.search` and `users.updateProfile` access the `user` collection via the shared singleton accessor

The system SHALL access the MongoDB `user` collection in the `search` and `updateProfile` tRPC procedures (`src/server/trpc/routers/users.ts`) exclusively through `getBetterAuthCollection("user")` (defined in `src/db/index.ts`). Neither procedure SHALL call `getMongoClient().db().collection("user")` directly.

#### Scenario: `search` returns matching users using the shared collection accessor

- **Given** an authenticated, email-verified `executive-chef`-tier user, and at least one other user in the database whose name matches a search prefix
- **When** the caller invokes `users.search({ query: <matching prefix> })`
- **Then** the matching user is returned in the result array
- **And** the underlying collection access is performed via `getBetterAuthCollection("user")`, not a direct `getMongoClient().db().collection("user")` call

#### Scenario: `updateProfile` persists changes using the shared collection accessor

- **Given** an authenticated user with a valid session
- **When** the caller invokes `users.updateProfile({ name: "New Name" })`
- **Then** the user's `name` field is updated and the transformed document is returned
- **And** the underlying collection access is performed via `getBetterAuthCollection("user")`, not a direct `getMongoClient().db().collection("user")` call

### Requirement: MODIFIED `users.search` query input is trimmed and length-bounded

The system SHALL validate the `search` procedure's `query` input as a string that is trimmed of leading/trailing whitespace, then required to be at least 2 characters and at most 254 characters after trimming. Inputs that violate either bound after trimming SHALL be rejected with a validation error before any database query is executed.

#### Scenario: Query at the minimum boundary is accepted

- **Given** an authenticated, email-verified `executive-chef`-tier user
- **When** the caller invokes `users.search({ query: "ab" })` (exactly 2 characters, no whitespace)
- **Then** the call succeeds and returns matching results (or an empty array if none match)

#### Scenario: Query at the maximum boundary is accepted

- **Given** an authenticated, email-verified `executive-chef`-tier user
- **When** the caller invokes `users.search({ query: <a string of exactly 254 characters> })`
- **Then** the call succeeds (does not throw a validation error)

#### Scenario: Query exceeding the maximum boundary is rejected

- **Given** an authenticated, email-verified `executive-chef`-tier user
- **When** the caller invokes `users.search({ query: <a string of 255 characters> })`
- **Then** the call rejects with a validation error
- **And** no database query is executed against the `user` collection

#### Scenario: Whitespace-padded query is trimmed before length validation

- **Given** an authenticated, email-verified `executive-chef`-tier user
- **When** the caller invokes `users.search({ query: "  ab  " })` (2 significant characters padded with whitespace to 6 total)
- **Then** the call succeeds, behaving identically to `users.search({ query: "ab" })`

#### Scenario: Query that is too short after trimming is rejected

- **Given** an authenticated, email-verified `executive-chef`-tier user
- **When** the caller invokes `users.search({ query: " a" })` (1 significant character after trimming)
- **Then** the call rejects with a validation error, even though the untrimmed input is 2 characters long

## Traceability

- Proposal element: "Finding 1: Direct MongoDB access instead of the db singleton" -> Requirement: "MODIFIED `users.search` and `users.updateProfile` access the `user` collection via the shared singleton accessor"
- Proposal element: "Finding 2: `search` query has no maximum length" + requester decision to add `.trim()` -> Requirement: "MODIFIED `users.search` query input is trimmed and length-bounded"
- Design decision: Decision 1 (design.md) -> Requirement: "MODIFIED `users.search` and `users.updateProfile` access the `user` collection via the shared singleton accessor"
- Design decision: Decision 2 (design.md) -> Requirement: "MODIFIED `users.search` query input is trimmed and length-bounded"
- Requirement -> Task(s): see tasks.md, "Execution" section (implementation of both requirements is a single combined code change to `src/server/trpc/routers/users.ts` plus test additions in `users.test.ts`)

## Non-Functional Acceptance Criteria

### Requirement: Security

The system SHALL bound the `search` query length to reduce unnecessary resource-usage / attack-surface exposure from arbitrarily long strings reaching the MongoDB `$regex` prefix match, for the `executive-chef`-tier, `verifiedProcedure`-gated `search` endpoint.

#### Scenario: Over-length query never reaches the database

See functional scenario: "Query exceeding the maximum boundary is rejected" — Zod validation rejects the input before the `search` handler body (and therefore before any `.find()` call against the `user` collection) executes.
