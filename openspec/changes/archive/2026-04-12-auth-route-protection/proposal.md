## GitHub Issues

- dougis-org/cookbook-tanstack#299

## Why

- **Problem statement:** Unauthenticated users can access `/recipes/new` and `/import` routes directly via client-side navigation (hamburger menu links), bypassing server-only middleware. The hamburger menu also shows "New Recipe" and "Import Recipe" links regardless of login state.
- **Why now:** This is a security/UX bug — unauthenticated users can reach create/import flows and attempt mutations. Fixing it now also establishes the extensible auth guard foundation required for future user-tier enforcement (free tier limits, premium features).
- **Business/user impact:** Unauthenticated users should never see recipe creation/import UI. Once tiers are added, users at their limit should be directed to upgrade rather than hitting a runtime error.

## Problem Space

- **Current behavior:**
  - `/recipes/new` has `server.middleware: [authMiddleware]` — protects SSR/direct URL access only; client-side SPA navigation bypasses it entirely.
  - `/recipes/$recipeId/edit` has the same server-only middleware gap.
  - `/import` has **no auth protection at all** — neither server nor client.
  - The hamburger nav always renders "New Recipe" and "Import Recipe" links, regardless of session state.
  - The login page ignores why a user was redirected and always redirects to `/` after login.
- **Desired behavior:**
  - All three routes protected via TanStack Router `beforeLoad` — fires on both server and client navigation.
  - Unauthenticated users redirected to `/auth/login` with `reason=auth-required` and `from=<attempted-path>`.
  - Login page displays a contextual message explaining the redirect and returns to `from` after successful login.
  - Hamburger nav hides "New Recipe" and "Import Recipe" when session is absent.
  - Design extensible so future `requireTier()` guard redirects already-logged-in users to `/account` with `reason=tier-limit-reached`.
- **Constraints:**
  - TanStack Start SSR: session must be loaded on both server (via `auth.api.getSession`) and client (via HTTP call) — `createServerFn` handles this isomorphically.
  - `authClient` has no `baseURL`, so it cannot be used server-side; server-side session loading must use `auth.api.getSession({ headers })`.
  - TypeScript strict mode — router context must be fully typed.
  - The `server.middleware` pattern in `middleware.ts` is replaced, not extended.
- **Assumptions:**
  - User tier data will eventually live on `session.user` (Better-Auth user record), not a separate DB lookup, so `requireTier()` can read it from context without extra queries.
  - No existing tests cover the currently-broken auth protection gaps on these routes.
- **Edge cases considered:**
  - User logs out while on a protected page — next navigation will re-check session via root `beforeLoad` and redirect.
  - `from` param after login — only trusted relative paths should be followed; absolute URLs must be rejected to prevent open-redirect attacks.
  - Session cache (Better-Auth `cookieCache: maxAge: 5min`) means the root `beforeLoad` won't always hit the DB.

## Scope

### In Scope

- Add `RouterContext` type with `session` field; wire into `createRouter` and `createRootRouteWithContext`.
- Root `beforeLoad` loads session via `createServerFn` (isomorphic: inline on server, RPC on client).
- New `src/lib/auth-guard.ts` with `requireAuth()` returning a `beforeLoad`-compatible function; stub `requireTier()` commented for future use.
- Redirect system: `reason` + `from` search params on `/auth/login`; `validateSearch` added to login route; `LoginForm` reads params, shows banner, redirects to `from` after success (relative paths only).
- Protect `/recipes/new`, `/recipes/$recipeId/edit`, `/import` with `beforeLoad: requireAuth()`.
- Remove `server.middleware` from all routes; delete `src/lib/middleware.ts`.
- Hide "New Recipe" and "Import Recipe" in hamburger nav when `session` is null.

### Out of Scope

- User tier model, tier enforcement, or `requireTier()` implementation (stub only).
- Protecting any routes beyond the three listed above.
- Protecting tRPC procedures (separate concern, separate change).
- Profile/account page changes (future tier-redirect destination).
- Any UX for the login page beyond the redirect banner and `from` redirect.

## What Changes

- **New files:** `src/lib/get-session.ts`, `src/types/router.ts`, `src/lib/auth-guard.ts`
- **Deleted files:** `src/lib/middleware.ts`
- **Modified files:** `src/router.tsx`, `src/routes/__root.tsx`, `src/routes/recipes/new.tsx`, `src/routes/recipes/$recipeId_.edit.tsx`, `src/routes/import/index.tsx`, `src/components/Header.tsx`, `src/routes/auth/login.tsx`, `src/components/auth/LoginForm.tsx`

## Risks

- **Risk:** Root `beforeLoad` fires on every client-side navigation, adding a server round-trip for session on each route change.
  - **Impact:** Slight latency on navigations; Better-Auth `cookieCache` (5 min) mitigates DB load but the HTTP call still occurs.
  - **Mitigation:** `createServerFn` call is cheap (cookie validation, no DB hit within cache window). Accept for now; can optimize with TanStack Query session caching if latency is measured as problematic.
- **Risk:** `from` redirect param could be exploited as an open redirect if not validated.
  - **Impact:** Phishing / credential harvesting if an attacker constructs a login URL pointing to an external domain.
  - **Mitigation:** `LoginForm` must validate `from` is a relative path (starts with `/`, no `//` or protocol) before using it.
- **Risk:** Removing `server.middleware` from edit route leaves a brief window if `beforeLoad` has a bug.
  - **Impact:** Unauthenticated user could reach the edit form.
  - **Mitigation:** Both `beforeLoad` and the tRPC mutation it calls already require auth server-side (tRPC protection is unchanged); belt-and-suspenders remain.

## Open Questions

No unresolved ambiguity. All design decisions were confirmed during exploration:
- Router context approach confirmed over per-route `getSession()` fetch.
- `createServerFn` confirmed as the isomorphic session-loading mechanism.
- Redirect messaging system (reason + from params) confirmed.
- Tier redirect destination (`/account`) confirmed for future implementation.

## Non-Goals

- Enforcing user tiers or recipe limits.
- Protecting read-only routes (recipe detail, recipe list, etc.).
- Adding any form of role-based access control beyond auth/tier.
- Changing the Better-Auth configuration or session duration.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
