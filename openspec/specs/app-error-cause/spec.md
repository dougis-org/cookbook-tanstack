## Requirements

### Requirement: AppErrorCause type and tRPC errorFormatter

The system SHALL attach a typed `appError` field to all tRPC error responses when the throwing code provides a structured `cause` object.

#### Scenario: Tier-wall error carries structured cause on client

- **Given** a tRPC mutation throws `new TRPCError({ code: 'PAYMENT_REQUIRED', cause: { type: 'tier-wall', reason: 'count-limit' } })`
- **When** the client receives the error response
- **Then** `error.data.appError` equals `{ type: 'tier-wall', reason: 'count-limit' }` with full TypeScript types

#### Scenario: Non-cause error has null appError

- **Given** a tRPC mutation throws `new TRPCError({ code: 'NOT_FOUND', message: 'Recipe not found' })` with no cause
- **When** the client receives the error response
- **Then** `error.data.appError` is `null`

#### Scenario: Ownership FORBIDDEN is unaffected

- **Given** a tRPC mutation throws `FORBIDDEN` via `verifyOwnership` (ownership violation, no cause)
- **When** the client receives the error response
- **Then** `error.data?.code` is `'FORBIDDEN'` and `error.data.appError` is `null`

### Requirement: Tier enforcement error code

The system SHALL throw `PAYMENT_REQUIRED` (not `FORBIDDEN`) for all tier-limit violations, with a typed cause payload.

#### Scenario: Count-limit enforcement in recipe/cookbook creation

- **Given** a `sous-chef` user who has reached their recipe limit attempts to create a recipe
- **When** the `create` mutation calls `enforceContentLimit`
- **Then** a `PAYMENT_REQUIRED` error is thrown with `cause: { type: 'tier-wall', reason: 'count-limit' }`

#### Scenario: Private-content enforcement in cookbook update

- **Given** a `prep-cook` user attempts to set a cookbook to private
- **When** the `update` mutation checks `canCreatePrivate`
- **Then** a `PAYMENT_REQUIRED` error is thrown with `cause: { type: 'tier-wall', reason: 'private-content' }`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Formatter does not break on unexpected cause shape

- **Given** a TRPCError is thrown with a non-object cause (e.g., a string or Error instance)
- **When** the errorFormatter processes it
- **Then** `shape.data.appError` is `null` and no exception is thrown by the formatter itself

### Requirement: Security

#### Scenario: Formatter does not leak internal error details

- **Given** an unexpected server error with a complex cause object
- **When** the errorFormatter processes it
- **Then** only the explicitly typed `AppErrorCause` fields are forwarded; no raw stack traces or internal messages are added to `data.appError`
