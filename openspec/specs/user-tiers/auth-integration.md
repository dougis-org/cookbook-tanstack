# Spec: Auth Integration

Capability: `src/lib/auth.ts`, `src/lib/auth-client.ts` — Better-Auth `additionalFields` for `tier` and `isAdmin`

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED tier and isAdmin fields in Better-Auth config

The system SHALL declare `tier` (type: string, default: `'home-cook'`) and `isAdmin` (type: boolean, default: `false`) as `additionalFields` in the Better-Auth configuration.

#### Scenario: New user signup sets default tier

- **Given** a new user registers via email/password
- **When** the registration completes
- **Then** the `user` MongoDB document contains `tier: 'home-cook'` and `isAdmin: false`

#### Scenario: additionalFields are present in session

- **Given** an authenticated user with a valid session
- **When** `auth.api.getSession()` is called
- **Then** the returned user object contains `tier` and `isAdmin` fields with correct types

---

### Requirement: ADDED tier and isAdmin exposed in auth client

The system SHALL declare `tier` and `isAdmin` in the auth client configuration so that `useSession()` returns them with correct TypeScript types on the frontend.

#### Scenario: useSession returns typed tier field

- **Given** an authenticated user with a session cookie
- **When** `useSession()` is called in a React component
- **Then** `session.user.tier` is typed as `UserTier` (or `string`) and not `undefined | unknown`

#### Scenario: useSession returns typed isAdmin field

- **Given** an authenticated user with a session cookie
- **When** `useSession()` is called in a React component
- **Then** `session.user.isAdmin` is typed as `boolean` and not `undefined | unknown`

## MODIFIED Requirements

### Requirement: MODIFIED Better-Auth config in src/lib/auth.ts

The system SHALL preserve all existing configuration (emailAndPassword, session, username plugin, tanstackStartCookies plugin) while adding the `user.additionalFields` block.

#### Scenario: Existing auth behaviour is unchanged

- **Given** the modified auth config
- **When** a user signs in with email and password
- **Then** authentication succeeds and the existing session fields (email, name, username, etc.) remain unchanged

## REMOVED Requirements

None.

## Traceability

- Proposal element "Better-Auth additionalFields" → Requirement: ADDED tier and isAdmin fields in Better-Auth config
- Design Decision 2 (additionalFields via Better-Auth) → Requirement: ADDED tier and isAdmin fields in Better-Auth config
- Proposal element "Auth client update" → Requirement: ADDED tier and isAdmin exposed in auth client
- Requirement "tier in session" → Task: update src/lib/auth.ts additionalFields
- Requirement "tier in auth client" → Task: update src/lib/auth-client.ts

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Tier field cannot be set during signup by the client

- **Given** the Better-Auth signup endpoint
- **When** a client submits a registration request with a custom `tier` or `isAdmin` field in the body
- **Then** the field is ignored and the user is created with the default values (`home-cook`, `false`)

### Requirement: Reliability

#### Scenario: Missing additionalFields do not crash session retrieval

- **Given** a user document in MongoDB that has no `tier` or `isAdmin` field (pre-migration)
- **When** `auth.api.getSession()` is called for that user
- **Then** the session is returned successfully; `tier` may be `undefined` or the default value depending on Better-Auth behaviour (no crash)
