# Spec: usage tRPC Router

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED `usage.getOwned` returns authenticated user's content counts

The system SHALL expose a protected tRPC procedure `usage.getOwned` that returns `{ recipeCount: number, cookbookCount: number }` for the calling user, excluding documents where `hiddenByTier: true`.

#### Scenario: Returns counts for authenticated user

- **Given** a user with 7 recipes (1 `hiddenByTier: true`) and 2 cookbooks
- **When** `usage.getOwned` is called with a valid session
- **Then** the response is `{ recipeCount: 6, cookbookCount: 2 }` (hidden recipe excluded)

#### Scenario: Returns zero counts for new user

- **Given** an authenticated user with no recipes or cookbooks
- **When** `usage.getOwned` is called
- **Then** the response is `{ recipeCount: 0, cookbookCount: 0 }`

#### Scenario: Rejects unauthenticated call

- **Given** no active session
- **When** `usage.getOwned` is called
- **Then** a `UNAUTHORIZED` TRPCError is thrown

---

### Requirement: ADDED Usage count predicate matches `enforceContentLimit` predicate

The system SHALL use the same count predicate `{ userId, hiddenByTier: { $ne: true } }` in `usage.getOwned` as is used in `enforceContentLimit`, via a shared helper in `src/server/trpc/routers/_helpers.ts`.

#### Scenario: Shared helper used by both callers

- **Given** the source code of `usage.getOwned` and `enforceContentLimit`
- **When** reviewed
- **Then** both call the same exported helper from `_helpers.ts` for count queries; neither duplicates the `countDocuments` predicate

---

### Requirement: ADDED `usage` router registered in tRPC root

The system SHALL register the `usage` router under the `usage` namespace in `src/server/trpc/root.ts`.

#### Scenario: `trpc.usage.getOwned` callable from client

- **Given** the tRPC client
- **When** `trpc.usage.getOwned.useQuery()` is called in a component
- **Then** no TypeScript error; query resolves to `{ recipeCount, cookbookCount }`

## MODIFIED Requirements

No existing requirements are modified.

## REMOVED Requirements

No requirements are removed.

## Traceability

- Proposal: single usage query for account page → Requirement: `usage.getOwned`
- Proposal: extensible for future items → Requirement: dedicated `usage.ts` router
- Design Decision 2 → `usage.ts` router
- Design Decision 3 → shared count predicate
- Requirements → Tasks: `src/server/trpc/routers/usage.ts`, `src/server/trpc/routers/__tests__/usage.test.ts`, `src/server/trpc/root.ts`

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: `getOwned` cannot return another user's counts

- **Given** user A is authenticated
- **When** `usage.getOwned` is called
- **Then** counts are scoped to `ctx.user.id`; no way to pass a different `userId` from the client

### Requirement: Reliability

#### Scenario: Counts remain correct after `hiddenByTier` migration

- **Given** documents with `hiddenByTier` field missing (pre-migration state)
- **When** `usage.getOwned` is called
- **Then** the predicate `{ $ne: true }` treats missing field as `false`; those documents ARE counted (correct behavior — they are not hidden)
