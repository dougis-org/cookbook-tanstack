## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED IP-addressed Host headers pass through without redirect

The system SHALL return `null` from `getDomainRedirectUrl` when the request `Host` header resolves to an IPv4 or IPv6 address, regardless of the configured `APP_PRIMARY_URL`.

#### Scenario: IPv4 host passes through

- **Given** `APP_PRIMARY_URL` is `https://recipe.dougis.com`
- **When** `getDomainRedirectUrl` is called with a request whose `Host` header is `1.2.3.4` or `1.2.3.4:3000`
- **Then** the function returns `null`

#### Scenario: IPv6 host (bracketed, with port) passes through

- **Given** `APP_PRIMARY_URL` is `https://recipe.dougis.com`
- **When** `getDomainRedirectUrl` is called with a request whose `Host` header is `[fdaa:1e:bb7b:a7b:652:ebdb:c00e:2]:3000`
- **Then** the function returns `null`

#### Scenario: IPv6 loopback passes through

- **Given** `APP_PRIMARY_URL` is `https://recipe.dougis.com`
- **When** `getDomainRedirectUrl` is called with a request whose `Host` header is `[::1]:3000`
- **Then** the function returns `null`

#### Scenario: IPv4 loopback passes through

- **Given** `APP_PRIMARY_URL` is `https://recipe.dougis.com`
- **When** `getDomainRedirectUrl` is called with a request whose `Host` header is `127.0.0.1:3000`
- **Then** the function returns `null`

## MODIFIED Requirements

### Requirement: MODIFIED Named non-primary hostname still triggers redirect

The system SHALL still return a redirect URL when the `Host` header is a named (non-IP) hostname that differs from the primary URL hostname.

#### Scenario: fly.dev hostname still redirects

- **Given** `APP_PRIMARY_URL` is `https://recipe.dougis.com`
- **When** `getDomainRedirectUrl` is called with a request whose `Host` header is `cookbook-tanstack.fly.dev`
- **Then** the function returns a redirect URL beginning with `https://recipe.dougis.com`

#### Scenario: Primary hostname still passes through

- **Given** `APP_PRIMARY_URL` is `https://recipe.dougis.com`
- **When** `getDomainRedirectUrl` is called with a request whose `Host` header is `recipe.dougis.com`
- **Then** the function returns `null`

## REMOVED Requirements

No requirements removed.

## Traceability

- Proposal element "IP-address host passthrough" → Requirement ADDED IP-addressed Host headers pass through
- Design decision 1 (IPv4/IPv6 regex guard) → Requirement ADDED IP-addressed Host headers pass through
- Design decision 1 → Requirement MODIFIED Named non-primary hostname still redirects (regression)
- Requirement ADDED → Task: patch `src/lib/domain-redirect.ts`
- Requirement ADDED → Task: add unit tests in `src/lib/__tests__/domain-redirect.test.ts`

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: IP passthrough does not expose redirect bypass for crafted browser requests

- **Given** an external client sends a request with `Host: 1.2.3.4` (spoofed IP host)
- **When** the request reaches the domain redirect middleware
- **Then** the request passes through (not redirected) and the app serves normally — no sensitive behavior is exposed; no authorization is bypassed
