## ADDED Requirements

### Requirement: Chapter mutations are owner-only
The `createChapter`, `renameChapter`, `deleteChapter`, and `reorderChapters` tRPC procedures SHALL be protected by `protectedProcedure` and SHALL verify cookbook ownership before executing, consistent with existing recipe mutation gating.

#### Scenario: Unauthenticated user cannot call chapter mutations
- **WHEN** an unauthenticated request is made to any chapter mutation procedure
- **THEN** the server returns an UNAUTHORIZED error

#### Scenario: Authenticated non-owner cannot call chapter mutations
- **WHEN** an authenticated user who does not own the cookbook calls any chapter mutation
- **THEN** the server returns a FORBIDDEN error

#### Scenario: Owner can call all chapter mutations
- **WHEN** the authenticated owner calls `createChapter`, `renameChapter`, `deleteChapter`, or `reorderChapters`
- **THEN** the mutation executes successfully
