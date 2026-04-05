## ADDED Requirements

### Requirement: useAuth hook returns canonical auth state
The system SHALL provide a `useAuth` hook in `src/hooks/useAuth.ts` that wraps `useSession` from Better Auth and returns `{ session, isPending, isLoggedIn, userId }` as the canonical frontend auth state interface.

#### Scenario: Authenticated user
- **WHEN** a user is logged in and `useSession` returns a session with a user object
- **THEN** `useAuth` SHALL return `isLoggedIn: true` and `userId` equal to the session user's id

#### Scenario: Unauthenticated user
- **WHEN** no user is logged in and `useSession` returns `{ data: null }`
- **THEN** `useAuth` SHALL return `isLoggedIn: false` and `userId: null`

#### Scenario: Pending state
- **WHEN** `useSession` returns `isPending: true`
- **THEN** `useAuth` SHALL return `isPending: true`

### Requirement: All production components use useAuth instead of useSession
All frontend components and routes that need auth state SHALL import `useAuth` from `@/hooks/useAuth` rather than calling `useSession` from `@/lib/auth-client` directly.

#### Scenario: Component receives isLoggedIn
- **WHEN** a component needs to conditionally render based on auth state
- **THEN** it SHALL destructure `isLoggedIn` from `useAuth()` rather than deriving `!!session?.user` locally

#### Scenario: Component receives userId
- **WHEN** a component needs the current user's ID (e.g., for `isOwner` comparison)
- **THEN** it SHALL destructure `userId` from `useAuth()` rather than accessing `session?.user?.id` directly

### Requirement: Test mocks target useAuth
All component and route tests that mock auth state SHALL mock `@/hooks/useAuth` directly, returning the canonical shape `{ session, isPending, isLoggedIn, userId }`.

#### Scenario: Logged-in mock
- **WHEN** a test needs an authenticated user
- **THEN** the mock SHALL return `{ isLoggedIn: true, userId: '<id>', isPending: false, session: <session> }`

#### Scenario: Logged-out mock
- **WHEN** a test needs an unauthenticated state
- **THEN** the mock SHALL return `{ isLoggedIn: false, userId: null, isPending: false, session: null }`

### Requirement: useAuth has unit tests
The `useAuth` hook SHALL have unit tests in `src/hooks/__tests__/useAuth.test.ts` covering authenticated, unauthenticated, and pending states.

#### Scenario: Hook unit test coverage
- **WHEN** `useSession` returns a session with a user
- **THEN** `useAuth` unit tests SHALL verify `isLoggedIn` is `true` and `userId` matches

#### Scenario: Hook null state coverage
- **WHEN** `useSession` returns `{ data: null }`
- **THEN** `useAuth` unit tests SHALL verify `isLoggedIn` is `false` and `userId` is `null`
