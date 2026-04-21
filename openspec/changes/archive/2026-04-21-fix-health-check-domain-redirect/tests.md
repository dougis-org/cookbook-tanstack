---
name: tests
description: Tests for the fix-health-check-domain-redirect change
---

# Tests

## Overview

Tests for the domain-redirect IP passthrough fix. All work follows strict TDD: write failing test → implement → refactor.

Test file: `src/lib/__tests__/domain-redirect.test.ts`

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Add the test case, run `npx vitest run src/lib/__tests__/domain-redirect.test.ts`, confirm it fails.
2. **Write code to pass the test:** Add the IP-address guard to `src/lib/domain-redirect.ts`.
3. **Refactor:** Ensure guard is minimal and readable; run full test suite to confirm no regressions.

## Test Cases

### Fix A — IP passthrough in getDomainRedirectUrl

Spec traceability: `specs/domain-redirect-ip-passthrough.md`

- [ ] `getDomainRedirectUrl` returns `null` for IPv4 host `1.2.3.4` (no port)
  - Task: Fix A — add IPv4 guard
  - Scenario: "IPv4 host passes through"
- [ ] `getDomainRedirectUrl` returns `null` for IPv4 host `127.0.0.1:3000` (with port)
  - Task: Fix A — add IPv4 guard
  - Scenario: "IPv4 loopback passes through"
- [ ] `getDomainRedirectUrl` returns `null` for bracketed IPv6 `[fdaa:1e:bb7b:a7b:652:ebdb:c00e:2]:3000`
  - Task: Fix A — add IPv6 guard
  - Scenario: "IPv6 host (bracketed, with port) passes through"
- [ ] `getDomainRedirectUrl` returns `null` for IPv6 loopback `[::1]:3000`
  - Task: Fix A — add IPv6 guard
  - Scenario: "IPv6 loopback passes through"

### Regression — existing redirect behavior preserved

Spec traceability: `specs/domain-redirect-ip-passthrough.md` (MODIFIED section)

- [ ] `getDomainRedirectUrl` returns redirect URL for `Host: cookbook-tanstack.fly.dev` when `APP_PRIMARY_URL=https://recipe.dougis.com`
  - Task: Tests — regression coverage
  - Scenario: "fly.dev hostname still redirects"
- [ ] `getDomainRedirectUrl` returns `null` for `Host: recipe.dougis.com` (primary host unchanged)
  - Task: Tests — regression coverage
  - Scenario: "Primary hostname still passes through"

### Fix B — fly.toml (manual verification, no unit test)

Spec traceability: `specs/fly-health-check.md`

- [ ] **Post-deploy manual check:** `fly machines list --app cookbook-tanstack` shows `1/1` checks on both machines
  - Task: Post-Merge verification
  - Scenario: "Machine health checks pass after deploy"
- [ ] **Post-deploy manual check:** `curl -sI https://recipe.dougis.com/` returns 2xx
  - Task: Post-Merge verification
  - Scenario: "recipe.dougis.com serves content"
- [ ] **Post-deploy manual check:** `curl -sI https://cookbook-tanstack.fly.dev/` returns 301 → `recipe.dougis.com`
  - Task: Post-Merge verification
  - Scenario: "fly.dev domain redirects (not 503)"
