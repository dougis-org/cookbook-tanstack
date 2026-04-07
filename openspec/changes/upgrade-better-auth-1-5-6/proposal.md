## GitHub Issues

- #257

## Why

- Problem statement: `better-auth` is at 1.4.18, `@tanstack/devtools-vite`
  at 0.3.12, and `@tanstack/react-devtools` at 0.7.11. All three have newer
  stable releases with bug fixes and features that reduce risk vs. remaining
  on old versions.
- Why now: better-auth 1.6.0 shipped today (2026-04-06) with a breaking
  `cookieCache` change that would require a config migration. Upgrading to
  1.5.6 now locks in the stable 1.5.x line before 1.6.x becomes the
  "obvious" upgrade path, and gives us the full set of 1.5.x bug fixes
  (cookie encoding, session freshness, MongoDB adapter fixes) while keeping
  our `cookieCache` behavior unchanged.
- Business/user impact: Users benefit from security fixes
  (revoked-session restoration was possible with cookieCache enabled; now
  blocked in 1.5.6) and session stability improvements (stale session data
  preserved on network errors). Devtools upgrade is invisible to end users.

## Problem Space

- Current behavior: Running better-auth 1.4.18 and missing all 1.5.x bug
  fixes, including a security fix for revoked session restoration, a cookie
  double-encoding fix, and the MongoDB BSON UUID storage change.
- Desired behavior: Running better-auth 1.5.6 with all 1.5.x fixes in place, devtools packages updated to latest stable.
- Constraints:
  - Must NOT upgrade to better-auth 1.6.0. Its BREAKING change aligns
    `cookieCache` freshness to session creation time, which would change auth
    behavior for active users.
  - Must verify against the MongoDB UUID format change in 1.5.6. The
    mongo-adapter now stores UUIDs as native BSON UUIDs. Existing auth
    collections (users, sessions, accounts) created before upgrade may have
    string UUIDs that become unresolvable.
  - `tanstackStartCookies()` plugin must continue to function correctly alongside cookie-handling changes in 1.5.2.
- Assumptions:
  - Dev database is seeded via `npm run db:seed`, which only seeds taxonomy
    data, not auth collections. Any existing dev auth data (users, sessions)
    can be safely cleared pre-upgrade.
  - No production deployment yet. MongoDB UUID migration risk is
    dev-environment only.
  - The `mongodbAdapter` import path (`better-auth/adapters/mongodb`)
    remains stable; 1.5.4 fixed bundler resolution for this path.
- Edge cases considered:
  - 1.5.5 changed behavior: custom session fields are now preserved on focus
    refresh, and stale session data is preserved on network errors. Tests
    must cover these paths.
  - `skipOriginCheck` array handling was fixed in 1.5.6 — not used in this project's auth config but noted.

## Scope

### In Scope

- Upgrade `better-auth` from `^1.4.18` → pinned `1.5.6`
- Upgrade `@tanstack/devtools-vite` from `^0.3.11` → `^0.5.5`
- Upgrade `@tanstack/react-devtools` from `^0.7.0` → `^0.10.1`
- Clear dev auth collections (users, sessions, accounts, verifications) to
  avoid BSON UUID mismatch post-upgrade
- Verify all auth flows manually (sign-up, sign-in, sign-out, session persistence)
- Run full test suite (`npm run test` and `npm run test:e2e`)

### Out of Scope

- Upgrading to better-auth 1.6.0 (tracked separately)
- Any config changes to auth options (cookieCache, session TTL, plugins)
- Adding new better-auth plugins or features introduced in 1.5.x
- Upgrading other TanStack packages beyond devtools

## What Changes

- `package.json`: three version bumps
- `package-lock.json`: updated lockfile
- Dev MongoDB auth collections cleared (not a code change, just a procedural
  step)
- Application auth flow updated so sign-out redirects to `/auth/login` after
  completion
- Test files renamed/added to cover the updated auth behavior and dependency
  upgrade

## Risks

- Risk: MongoDB BSON UUID storage format change in 1.5.6
  - Impact: Existing dev auth records (string UUIDs) become unresolvable
    after upgrade; sign-in fails for existing dev users
  - Mitigation: Drop auth collections before running the upgraded server for
    the first time, then re-create test users via sign-up

- Risk: Cookie behavior changes (1.5.2 double-encoding fix, Set-Cookie header parsing)
  - Impact: `tanstackStartCookies()` plugin interaction could break session cookies in TanStack Start
  - Mitigation: Manual end-to-end auth flow testing after upgrade; E2E tests cover sign-in/sign-out

- Risk: Session freshness behavior changed in 1.5.5 (custom fields preserved on focus refresh)
  - Impact: Session tests that assert on field presence after refresh may behave differently
  - Mitigation: Run unit tests for auth; review any test that touches session refresh behavior

- Risk: better-auth 1.5.6 introduces "Agent auth plugin" — unused, but new code in the dep
  - Impact: Negligible
  - Mitigation: None needed

## Open Questions

No unresolved ambiguity. All risks have identified mitigations and no design
decisions require stakeholder input. The only deferred item (1.6.0 upgrade)
is explicitly out of scope.

## Non-Goals

- Migrating to better-auth 1.6.0's new cookieCache freshness semantics
- Evaluating or adopting new better-auth 1.5.x plugins (Agent auth, email OTP resend strategy, etc.)
- Modifying auth configuration, session settings, or plugin list

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
