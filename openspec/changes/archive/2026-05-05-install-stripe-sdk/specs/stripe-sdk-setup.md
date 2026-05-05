# Stripe SDK Setup Specification

## ADDED Requirements

### Requirement: ADDED Stripe SDK must be installed and accessible

The system SHALL provide a server-side Stripe client singleton that is lazily initialized and throws a clear error if the secret key is missing.

#### Scenario: Happy path — Stripe client is created on first use

- **Given** `STRIPE_SECRET_KEY` environment variable is set to a valid test key
- **When** server code calls `getStripe()` from `src/lib/stripe.ts`
- **Then** a Stripe client instance is returned, configured with the secret key and API version `2026-04-22.dahlia`

#### Scenario: Error case — Missing secret key throws clear error

- **Given** `STRIPE_SECRET_KEY` is not set in the environment
- **When** server code calls `getStripe()`
- **Then** an Error is thrown with message `"STRIPE_SECRET_KEY env var not set."`

#### Scenario: Singleton caches the client instance

- **Given** `STRIPE_SECRET_KEY` is set and a Stripe client has been created via `getStripe()`
- **When** `getStripe()` is called a second time
- **Then** the same client instance is returned (no re-initialization)

### Requirement: ADDED Stripe SDK must not leak to client bundle

The system SHALL ensure that the Stripe Node.js SDK is only available to server-side code and is excluded from client bundles.

#### Scenario: Production build excludes Stripe SDK from client

- **Given** `src/lib/stripe.ts` is imported only in server functions
- **When** `npm run build` is executed
- **Then** the `.output/public` directory (client bundle) contains no Stripe SDK files or code

#### Scenario: TypeScript prevents client imports

- **Given** a developer attempts to import Stripe client in a client component (e.g., `src/routes/checkout.tsx`)
- **When** TypeScript type-checking runs
- **Then** import fails or produces a clear error indicating server-only usage

### Requirement: ADDED Environment variables are documented

The system SHALL document all Stripe-related environment variables in `.env.example` with clear descriptions.

#### Scenario: All 9 Stripe env vars are present in `.env.example`

- **Given** `.env.example` is reviewed
- **When** searching for Stripe-related variables
- **Then** all 9 vars are present:
  - `STRIPE_SECRET_KEY`
  - `VITE_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_PREP_COOK_MONTHLY`
  - `STRIPE_PRICE_PREP_COOK_ANNUAL`
  - `STRIPE_PRICE_SOUS_CHEF_MONTHLY`
  - `STRIPE_PRICE_SOUS_CHEF_ANNUAL`
  - `STRIPE_PRICE_EXEC_CHEF_MONTHLY`
  - `STRIPE_PRICE_EXEC_CHEF_ANNUAL`

#### Scenario: Environment variables have clear, actionable comments

- **Given** `.env.example` is read
- **When** a developer reads the Stripe section
- **Then** comments explain:
  - Which key is server-side only
  - Which key is safe for client
  - How to obtain webhook secret (Stripe CLI)
  - What price IDs are used for

### Requirement: ADDED Local sandbox setup is documented

The system SHALL provide clear instructions in README.md for developers to set up Stripe in local development.

#### Scenario: README includes Stripe setup section

- **Given** README.md is reviewed
- **When** searching for Stripe or billing setup
- **Then** a section exists with:
  - Link to create Stripe test account
  - Instructions to copy test mode keys
  - Stripe CLI installation link
  - Command to run: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
  - Instruction to copy webhook secret to `.env.local`
  - Mention that price IDs must be created in Stripe dashboard

#### Scenario: GitHub issue #422 naming is corrected

- **Given** GitHub issue #422 is reviewed
- **When** searching for environment variable names
- **Then** the issue body uses `VITE_STRIPE_PUBLISHABLE_KEY` (not `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)

### Requirement: ADDED Stripe SDK is pinned to a stable API version

The system SHALL pin the Stripe SDK to a specific API version to ensure forward compatibility.

#### Scenario: SDK initialization uses pinned API version

- **Given** `src/lib/stripe.ts` creates a new Stripe client
- **When** the client is instantiated
- **Then** it includes `apiVersion: "2026-04-22.dahlia"` in the Stripe constructor options

## MODIFIED Requirements

None at this time.

## REMOVED Requirements

None at this time.

## Traceability

| Proposal Element | Design Decision | Requirement | Task |
|---|---|---|---|
| Install `stripe@22.1.0` | Version pinning | SDK must be installed and accessible | Task 1: Install package |
| Server-side singleton | Singleton pattern | SDK must not leak to client | Task 1: Create `src/lib/stripe.ts` |
| Fix naming in issue #422 | Vite environment convention | Naming is corrected | Task 2: Update GitHub issue #422 |
| Add 9 env vars | Environment variable management | Environment variables documented | Task 3: Update `.env.example` |
| Add README instructions | Documentation | Local sandbox setup documented | Task 4: Update README.md |
| Lazy init with clear errors | Error handling design | SDK throws on missing secret key | Task 1: `getStripe()` implementation |

## Non-Functional Acceptance Criteria

### Requirement: Security — Secret key must not leak to client

#### Scenario: No Stripe SDK in client bundle

- **Given** the production build completes
- **When** the client bundle (`.output/public/**/*.js`) is analyzed
- **Then** no Stripe SDK code (e.g., `@stripe/*`, Stripe constants, API calls) is present

#### Scenario: TypeScript strict mode prevents server-only imports in client

- **Given** TypeScript strict mode is enabled (`noImplicitAny: true`, etc.)
- **When** a client component attempts to import from `src/lib/stripe.ts`
- **Then** TypeScript compilation fails with error about server-only imports or missing types

### Requirement: Reliability — Missing configuration produces immediate feedback

#### Scenario: Clear error message on missing env var

- **Given** `STRIPE_SECRET_KEY` is not set
- **When** `getStripe()` is called
- **Then** the thrown error message is actionable and includes the variable name

#### Scenario: No silent failures

- **Given** server code calls a Stripe operation without env vars set
- **When** the operation executes
- **Then** an error is thrown immediately (not a silent no-op or timeout)

### Requirement: Operability — Local development is unblocked

#### Scenario: README provides all Stripe setup steps

- **Given** a developer follows the README Stripe setup section
- **When** they complete all steps (account creation, Stripe CLI, webhook secret)
- **Then** they can run the app locally with Stripe configured for testing

#### Scenario: Stripe API version is explicitly documented

- **Given** `src/lib/stripe.ts` or README is reviewed
- **When** searching for API version
- **Then** the pinned version (`2026-04-22.dahlia`) is clearly stated
