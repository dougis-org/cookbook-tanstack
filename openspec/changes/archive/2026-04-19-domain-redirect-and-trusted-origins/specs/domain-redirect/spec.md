## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Domain redirect middleware

The system SHALL redirect any HTTP request whose `Host` header does not match the hostname of `APP_PRIMARY_URL` to the equivalent URL under `APP_PRIMARY_URL`, preserving path and query string. GET and HEAD requests receive a 301 (permanent redirect); all other methods receive a 308 (permanent redirect, method-preserving) to avoid inadvertently converting POST auth flows to GET.

#### Scenario: Request to old domain redirects with path preserved

- **Given** `APP_PRIMARY_URL` is `https://recipe.dougis.com`
- **When** a request arrives with `Host: cookbook-tanstack.fly.dev` and path `/recipes/123?q=foo`
- **Then** the response has status `301` (GET) or `308` (non-GET/HEAD) and `Location: https://recipe.dougis.com/recipes/123?q=foo`

#### Scenario: Request to primary domain passes through unchanged

- **Given** `APP_PRIMARY_URL` is `https://recipe.dougis.com`
- **When** a request arrives with `Host: recipe.dougis.com` and path `/recipes/123`
- **Then** the middleware calls `next()` and the response is the normal application response (not a redirect)

#### Scenario: Request with no Host header passes through

- **Given** `APP_PRIMARY_URL` is `https://recipe.dougis.com`
- **When** a request arrives with no `Host` header
- **Then** the middleware calls `next()` — no redirect is issued

#### Scenario: `APP_PRIMARY_URL` not set — middleware skips redirect

- **Given** `APP_PRIMARY_URL` is undefined/empty
- **When** any request arrives
- **Then** the middleware calls `next()` — no redirect is issued, no runtime error thrown

#### Scenario: Query string is preserved on redirect

- **Given** `APP_PRIMARY_URL` is `https://recipe.dougis.com`
- **When** a request arrives with `Host: cookbook-tanstack.fly.dev` and path `/search?q=pasta&page=2`
- **Then** `Location` header is `https://recipe.dougis.com/search?q=pasta&page=2`

## MODIFIED Requirements

_None — this is a net-new capability._

## REMOVED Requirements

_None._

## Traceability

- Proposal element "301 redirect from old domain preserving path + query" -> Requirement: ADDED Domain redirect middleware
- Design decision 1 (TanStack Start `requestMiddleware`) -> Requirement: ADDED Domain redirect middleware
- Design decision 3 (redirect only on explicit host mismatch) -> Scenarios: no-Host passthrough, `APP_PRIMARY_URL` unset passthrough
- Requirement -> Tasks: "Create src/start.ts with domain redirect middleware"

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Redirect adds negligible overhead for primary domain requests

- **Given** the app is serving traffic on `recipe.dougis.com`
- **When** middleware runs the host comparison
- **Then** no measurable latency is added (single string comparison, no I/O)

### Requirement: Security

#### Scenario: Redirect uses absolute URL with explicit scheme

- **Given** `APP_PRIMARY_URL` is `https://recipe.dougis.com`
- **When** a redirect is issued
- **Then** the `Location` header is an absolute HTTPS URL — not a relative path or protocol-relative URL

#### Scenario: Redirect target is controlled by server env var, not request input

- **Given** any request with any `Host` header value
- **When** the redirect fires
- **Then** the redirect target hostname is always derived from `APP_PRIMARY_URL` (server-side env), never from the request itself — preventing open redirect attacks

### Requirement: Reliability

#### Scenario: Middleware error does not crash the request

- **Given** `APP_PRIMARY_URL` is malformed (e.g., not a valid URL)
- **When** the middleware attempts to parse it
- **Then** the error is caught and `next()` is called — request is not dropped and no error is thrown
