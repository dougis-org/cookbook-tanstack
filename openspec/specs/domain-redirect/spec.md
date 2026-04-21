## ADDED Requirements

### Requirement: Named non-primary hostname triggers redirect to primary domain

The system SHALL redirect requests whose `Host` header contains a named hostname that differs from the configured `APP_PRIMARY_URL` hostname, returning an absolute URL pointing to the primary origin.

#### Scenario: fly.dev hostname redirects to primary

- **Given** `APP_PRIMARY_URL` is `https://recipe.dougis.com`
- **When** `getDomainRedirectUrl` is called with a request whose `Host` header is `cookbook-tanstack.fly.dev`
- **Then** the function returns a redirect URL beginning with `https://recipe.dougis.com`

#### Scenario: Primary hostname passes through

- **Given** `APP_PRIMARY_URL` is `https://recipe.dougis.com`
- **When** `getDomainRedirectUrl` is called with a request whose `Host` header is `recipe.dougis.com`
- **Then** the function returns `null`

#### Scenario: Path and query string are preserved on redirect

- **Given** `APP_PRIMARY_URL` is `https://recipe.dougis.com`
- **When** `getDomainRedirectUrl` is called with a request for `/recipes/123?ref=email` on a non-primary host
- **Then** the returned URL is `https://recipe.dougis.com/recipes/123?ref=email`

---

### Requirement: IP-addressed Host headers pass through without redirect

The system SHALL return `null` from `getDomainRedirectUrl` when the request `Host` header resolves to an IPv4 or IPv6 address, regardless of the configured `APP_PRIMARY_URL`. IP-addressed Host headers indicate system/internal traffic (health checks, load balancer pings).

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

## Non-Functional Acceptance Criteria

### Requirement: Security — IP passthrough does not expose redirect bypass

#### Scenario: IP passthrough does not expose redirect bypass for crafted browser requests

- **Given** an external client sends a request with `Host: 1.2.3.4` (spoofed IP host)
- **When** the request reaches the domain redirect middleware
- **Then** the request passes through (not redirected) and the app serves normally — no sensitive behavior is exposed; no authorization is bypassed

## Implementation Notes

- Guard lives in `src/lib/domain-redirect.ts` (`getDomainRedirectUrl`)
- IPv4 detection: `/^((25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/`
- IPv6 detection: `requestHostname.startsWith("[")` — WHATWG URL `.hostname` includes brackets for IPv6
- Guards run after `new URL()` hostname extraction, before named-host comparison
