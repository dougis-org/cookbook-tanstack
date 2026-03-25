## ADDED Requirements

### Requirement: New Cookbook button hidden from unauthenticated users
The cookbooks list page SHALL hide the "New Cookbook" button in the page header when the user is not authenticated.

#### Scenario: Button hidden when logged out
- **WHEN** an unauthenticated user visits `/cookbooks`
- **THEN** the "New Cookbook" button is not rendered in the page header

#### Scenario: Button visible when logged in
- **WHEN** an authenticated user visits `/cookbooks`
- **THEN** the "New Cookbook" button is rendered in the page header

### Requirement: Empty-state create button hidden from unauthenticated users
The cookbooks list page SHALL hide the "Create your first cookbook" button in the empty state when the user is not authenticated.

#### Scenario: Empty-state button hidden when logged out
- **WHEN** an unauthenticated user visits `/cookbooks` and no public cookbooks exist
- **THEN** the "Create your first cookbook" button is not rendered

#### Scenario: Empty-state button visible when logged in
- **WHEN** an authenticated user visits `/cookbooks` and no cookbooks are visible
- **THEN** the "Create your first cookbook" button is rendered

### Requirement: Create form inaccessible to unauthenticated users
The inline `CreateCookbookForm` SHALL not be triggerable by unauthenticated users.

#### Scenario: Form cannot be opened when logged out
- **WHEN** an unauthenticated user visits `/cookbooks`
- **THEN** no interaction can open the create cookbook form

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
