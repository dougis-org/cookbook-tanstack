---
name: tests
description: Tests for domain-redirect-and-trusted-origins
---

# Tests

## Overview

Tests for the `domain-redirect-and-trusted-origins` change. All work follows strict TDD: write failing test first, run it (confirm red), implement to pass (green), refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before any implementation code, write the test. Run it — confirm it fails.
2. **Write code to pass the test:** Simplest code that makes it green.
3. **Refactor:** Improve structure while keeping tests green.

## Test Cases

### Capability 1: Domain Redirect Middleware

File: `src/__tests__/domain-redirect.test.ts`
Task ref: tasks.md §1.1 → §1.3
Spec ref: `specs/domain-redirect/spec.md`

- [ ] **Test 1.1** — Old host redirects 301 with path preserved
  - Construct mock `Request` with `Host: cookbook-tanstack.fly.dev`, `url: http://cookbook-tanstack.fly.dev/recipes/123`
  - Set `APP_PRIMARY_URL=https://recipe.dougis.com`
  - Assert response status is `301`
  - Assert `Location` header is `https://recipe.dougis.com/recipes/123`
  - Spec scenario: "Request to old domain redirects with path preserved"

- [ ] **Test 1.2** — Old host + query string preserved on redirect
  - `url: http://cookbook-tanstack.fly.dev/search?q=pasta&page=2`
  - Assert `Location: https://recipe.dougis.com/search?q=pasta&page=2`
  - Spec scenario: "Query string is preserved on redirect"

- [ ] **Test 1.3** — Primary host passes through, no redirect
  - `Host: recipe.dougis.com`, `APP_PRIMARY_URL=https://recipe.dougis.com`
  - Assert `next()` is called
  - Assert no `Response` returned directly by middleware
  - Spec scenario: "Request to primary domain passes through unchanged"

- [ ] **Test 1.4** — No Host header passes through
  - `Request` with no `Host` header
  - Assert `next()` called, no redirect
  - Spec scenario: "Request with no Host header passes through"

- [ ] **Test 1.5** — `APP_PRIMARY_URL` not set → no redirect, no error
  - Unset `APP_PRIMARY_URL` (or set to empty string)
  - Assert `next()` called, no error thrown
  - Spec scenario: "`APP_PRIMARY_URL` not set — middleware skips redirect"

- [ ] **Test 1.6** — Malformed `APP_PRIMARY_URL` → catch error, call next
  - Set `APP_PRIMARY_URL=not-a-url`
  - Assert `next()` called (not thrown)
  - Spec scenario (non-functional reliability): "Middleware error does not crash the request"

- [ ] **Test 1.7** — Redirect `Location` uses `APP_PRIMARY_URL` scheme, not request scheme
  - Verify `Location` header starts with `https://recipe.dougis.com` regardless of request scheme
  - Spec scenario (security): "Redirect uses absolute URL with explicit scheme"

### Capability 2: Better Auth Trusted Origins

File: `src/lib/__tests__/auth-config.test.ts` (create or extend existing)
Task ref: tasks.md §2.1 → §2.3
Spec ref: `specs/trusted-origins/spec.md`

- [ ] **Test 2.1** — `trustedOrigins` populated from env var
  - Set `BETTER_AUTH_TRUSTED_ORIGINS=https://recipe.dougis.com,https://cookbook-tanstack.fly.dev`
  - Import/construct auth config
  - Assert `trustedOrigins` contains both values
  - Spec scenario: "Trusted origins populated from env var"

- [ ] **Test 2.2** — `trustedOrigins` is `[]` when env var not set
  - Unset `BETTER_AUTH_TRUSTED_ORIGINS`
  - Assert `trustedOrigins` is `[]`
  - Spec scenario: "Trusted origins empty when env var not set — secure default"

- [ ] **Test 2.3** — Whitespace trimmed from entries
  - Set `BETTER_AUTH_TRUSTED_ORIGINS=https://recipe.dougis.com , https://cookbook-tanstack.fly.dev`
  - Assert entries are `['https://recipe.dougis.com', 'https://cookbook-tanstack.fly.dev']` (no spaces)
  - Spec scenario: "Whitespace trimmed from entries"

- [ ] **Test 2.4** — Single entry parsed correctly (no split artifact)
  - Set `BETTER_AUTH_TRUSTED_ORIGINS=https://recipe.dougis.com`
  - Assert `trustedOrigins` is `['https://recipe.dougis.com']` (array of one, not split on something else)

### Capability 3: No Hardcoded Domains (code review / grep)

Task ref: tasks.md §3.2

- [ ] **Test 3.1** — Grep `src/` for `recipe.dougis.com` — confirm zero matches outside test fixtures
- [ ] **Test 3.2** — Grep `src/` for `cookbook-tanstack.fly.dev` — confirm zero matches outside test fixtures
