## MODIFIED Requirements

### Requirement: Named non-primary hostname triggers redirect to primary domain

The system SHALL redirect requests whose `Host` header contains a named hostname that differs from the configured `APP_PRIMARY_URL` hostname, returning an absolute URL pointing to the primary origin.

#### Scenario: fly.dev hostname redirects to primary

- **Given** `APP_PRIMARY_URL` is `https://www.mycookbooks.us`
- **When** `getDomainRedirectUrl` is called with a request whose `Host` header is `cookbook-tanstack.fly.dev`
- **Then** the function returns a redirect URL beginning with `https://www.mycookbooks.us`

#### Scenario: Primary hostname passes through

- **Given** `APP_PRIMARY_URL` is `https://www.mycookbooks.us`
- **When** `getDomainRedirectUrl` is called with a request whose `Host` header is `www.mycookbooks.us`
- **Then** the function returns `null`

#### Scenario: Path and query string are preserved on redirect

- **Given** `APP_PRIMARY_URL` is `https://www.mycookbooks.us`
- **When** `getDomainRedirectUrl` is called with a request for `/recipes/123?ref=email` on a non-primary host
- **Then** the returned URL is `https://www.mycookbooks.us/recipes/123?ref=email`

#### Scenario: Retired primary hostname redirects to new primary (soft cutover)

- **Given** `APP_PRIMARY_URL` is `https://www.mycookbooks.us`
- **When** `getDomainRedirectUrl` is called with a request whose `Host` header is `recipe.dougis.com`
- **Then** the function returns a redirect URL beginning with `https://www.mycookbooks.us`, since `recipe.dougis.com` is now just another non-primary named host

### Requirement: IP-addressed Host headers pass through without redirect

The system SHALL return `null` from `getDomainRedirectUrl` when the request `Host` header is itself an IPv4 or bracketed IPv6 literal (checked via pattern match, not DNS resolution), regardless of the configured `APP_PRIMARY_URL`. IP-addressed Host headers indicate system/internal traffic (health checks, load balancer pings).

#### Scenario: IPv4 host passes through

- **Given** `APP_PRIMARY_URL` is `https://www.mycookbooks.us`
- **When** `getDomainRedirectUrl` is called with a request whose `Host` header is `1.2.3.4` or `1.2.3.4:3000`
- **Then** the function returns `null`

#### Scenario: IPv6 host (bracketed, with port) passes through

- **Given** `APP_PRIMARY_URL` is `https://www.mycookbooks.us`
- **When** `getDomainRedirectUrl` is called with a request whose `Host` header is `[fdaa:1e:bb7b:a7b:652:ebdb:c00e:2]:3000`
- **Then** the function returns `null`

#### Scenario: IPv6 loopback passes through

- **Given** `APP_PRIMARY_URL` is `https://www.mycookbooks.us`
- **When** `getDomainRedirectUrl` is called with a request whose `Host` header is `[::1]:3000`
- **Then** the function returns `null`

#### Scenario: IPv4 loopback passes through

- **Given** `APP_PRIMARY_URL` is `https://www.mycookbooks.us`
- **When** `getDomainRedirectUrl` is called with a request whose `Host` header is `127.0.0.1:3000`
- **Then** the function returns `null`

