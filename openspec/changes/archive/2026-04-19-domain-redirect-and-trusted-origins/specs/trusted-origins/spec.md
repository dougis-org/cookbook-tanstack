## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Env-driven trusted origins for Better Auth

The system SHALL populate Better Auth's `trustedOrigins` from the `BETTER_AUTH_TRUSTED_ORIGINS` environment variable (comma-separated list of origin URLs), with an empty-array default when the variable is not set.

#### Scenario: Trusted origins populated from env var

- **Given** `BETTER_AUTH_TRUSTED_ORIGINS` is `https://recipe.dougis.com,https://cookbook-tanstack.fly.dev`
- **When** the auth instance is constructed
- **Then** `auth.options.trustedOrigins` contains both `https://recipe.dougis.com` and `https://cookbook-tanstack.fly.dev`

#### Scenario: Trusted origins empty when env var not set — secure default

- **Given** `BETTER_AUTH_TRUSTED_ORIGINS` is not set
- **When** the auth instance is constructed
- **Then** `auth.options.trustedOrigins` is `[]` — Better Auth falls back to trusting only `BETTER_AUTH_URL`

#### Scenario: Whitespace trimmed from entries

- **Given** `BETTER_AUTH_TRUSTED_ORIGINS` is `https://recipe.dougis.com , https://cookbook-tanstack.fly.dev`
- **When** the auth instance is constructed
- **Then** entries are `['https://recipe.dougis.com', 'https://cookbook-tanstack.fly.dev']` — no leading/trailing spaces

## MODIFIED Requirements

### Requirement: MODIFIED Better Auth configuration

The `betterAuth()` call in `src/lib/auth.ts` SHALL include a `trustedOrigins` field.

#### Scenario: Auth config includes trustedOrigins field

- **Given** `src/lib/auth.ts` is loaded
- **When** the module is inspected
- **Then** the `betterAuth()` call includes `trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',').map(s => s.trim()) ?? []`

## REMOVED Requirements

_None._

## Traceability

- Proposal element "Better Auth multi-domain trusted origins" -> Requirement: ADDED Env-driven trusted origins
- Design decision 2 (env-driven `trustedOrigins`) -> Requirement: ADDED Env-driven trusted origins + MODIFIED Better Auth configuration
- Requirement -> Tasks: "Add trustedOrigins to Better Auth config in src/lib/auth.ts", "Update .env.example with BETTER_AUTH_TRUSTED_ORIGINS"

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Default is deny (empty origins) when env var absent

- **Given** `BETTER_AUTH_TRUSTED_ORIGINS` is not set in the environment
- **When** a request arrives from an origin not matching `BETTER_AUTH_URL`
- **Then** Better Auth blocks the request — the secure-by-default behavior is preserved

#### Scenario: Only explicitly listed origins are trusted

- **Given** `BETTER_AUTH_TRUSTED_ORIGINS` lists two specific origins
- **When** a request arrives from a third unlisted origin
- **Then** Better Auth blocks the request

### Requirement: Operability

#### Scenario: Adding a new domain requires only env var change

- **Given** the application is deployed with `BETTER_AUTH_TRUSTED_ORIGINS=https://recipe.dougis.com`
- **When** a new domain `https://app.dougis.com` is added via Fly secret update + machine restart
- **Then** the new domain is trusted — no code change or redeployment of application code required

### Requirement: Reliability

#### Scenario: Malformed env var does not crash auth initialization

- **Given** `BETTER_AUTH_TRUSTED_ORIGINS` contains an entry that is not a valid URL
- **When** the auth module loads
- **Then** the module loads without throwing — Better Auth receives the raw strings (its own validation applies)
