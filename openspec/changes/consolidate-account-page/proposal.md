## GitHub Issues

- dougis-org/cookbook-tanstack#655

## Why

- Problem statement: Account-related functionality is split across three routes — `/auth/profile` (name/email/avatar/username), `/account` (tier, usage limits, upgrade CTA), and `/account/settings` (theme + 5 print-preference toggles) — but only `/auth/profile` is linked from anywhere in the app (the Header user link). `/account` and `/account/settings` are dead ends reachable only by typing the URL directly; `/account/settings` is additionally only reachable via a link *from* `/account`, compounding the unreachability.
- Why now: Users have no way to see their tier/usage or change theme/print preferences through normal navigation. This is a discoverability bug, not a missing-feature request — the pages and logic already exist and work; they're just not connected to the app's navigation.
- Business/user impact: Users cannot self-serve on upgrade CTAs (revenue-adjacent — the usage/upgrade page is invisible) and cannot discover theme/print preferences without out-of-band knowledge of the URL.

## Problem Space

- Current behavior:
  - `/auth/profile` (`src/routes/auth/profile.tsx`) renders `ProfileInfo` (`src/components/auth/ProfileInfo.tsx`): avatar, name, "member since" date, and other profile fields. Linked from `Header.tsx:307-313` (desktop + mobile-width header bar, one link element that renders at all viewports).
  - `/account` (`src/routes/account.tsx`, `AccountPage`): tier display, usage progress bars (via `trpc.usage.getOwned`), upgrade CTA, next-tier preview. Not linked from anywhere in the app. Contains an internal link to `/account/settings`.
  - `/account/settings` (`src/routes/account_.settings.tsx`, `SettingsPage`): theme radiogroup (5 themes) + 5 print-preference toggles, saved via `authClient.updateUser`. Reachable only via the link inside `/account`, which is itself unreachable. Uses the trailing-underscore route convention (`account_.settings`), meaning it does **not** nest under `account.tsx`'s layout today.
  - `grep -rn 'to="/account"' src/` returns zero results outside `account.tsx`/`account_.settings.tsx` themselves — confirms no other in-app entry point exists.
- Desired behavior: One consolidated `/account` page presenting Profile, Status, and Preferences as stacked sections on a single scroll, reachable via the existing Header user link (repointed from `/auth/profile`). Old routes (`/auth/profile`, `/account/settings`) become redirects to `/account` so existing bookmarks/links/e2e references keep working.
- Constraints:
  - Must preserve `authClient.updateUser` save/error behavior exactly as implemented today in `SettingsPage.handleSave` (error shown without reverting selection, success reflected immediately without waiting on `cookieCache`).
  - Must preserve `requireAuth()` guard behavior on all routes, including the new redirect-only routes (logged-out visitor hitting `/auth/profile` or `/account/settings` still gets the auth redirect, not a pass-through to the `/account` redirect).
  - Consolidated page must remain fully usable at mobile width — no section clipped or requiring desktop width.
  - "No navigation required" to reach any section beyond scrolling — rules out multi-route tabs; stacked sections satisfy this directly.
- Assumptions:
  - The Header's single user-link element already covers both desktop and narrow/mobile widths (icon-only below `sm`, icon+text at `sm:` and above) — there is no separate mobile-drawer entry to repoint, despite the issue text mentioning "mobile drawer." Confirmed by reading `Header.tsx`: the drawer `<aside>` nav has no profile/account link today.
  - Section order is Profile → Status → Preferences, per the issue's own acceptance-criteria ordering.
- Edge cases considered:
  - Logged-out visitor requesting `/auth/profile`, `/account/settings`, or `/account` directly — all three must still redirect to login via `requireAuth()`, not leak through to a redirect chain that bypasses auth.
  - User with unrecognized/missing tier value on `session.user.tier` — existing fallback to `"home-cook"` in `AccountPage` must be preserved unchanged.
  - Usage query loading/error states (`isLoading`, `isError` from `trpc.usage.getOwned`) must be preserved unchanged in the extracted Status section.
  - Theme/print-preference local edit state must not be clobbered by an async session refresh before save (existing `hasEdited` guard in `SettingsPage` — must carry over to the extracted Preferences section).

## Scope

### In Scope

- Consolidate Profile, Status, and Preferences into a single `/account` route (`src/routes/account.tsx`), rendered as three stacked sections in that order.
- Extract a `ProfileSection` component (from `src/components/auth/ProfileInfo.tsx`) composed by the consolidated `AccountPage`.
- Extract a `PreferencesSection` component (from the settings logic in `src/routes/account_.settings.tsx`) composed by the consolidated `AccountPage`, preserving `handleSave` behavior exactly.
- Keep the existing Status content (tier/usage/upgrade CTA) in `account.tsx`, optionally factored into its own `StatusSection` component for consistency with the other two extractions.
- Delete the internal "Settings" link inside `AccountPage` (`account.tsx:74-80`) — no replacement anchor/scroll-to link.
- Convert `src/routes/auth/profile.tsx` and `src/routes/account_.settings.tsx` into thin redirect-only routes: `beforeLoad` runs `requireAuth()` then throws a redirect to `/account`. Files are not deleted.
- Repoint `Header.tsx`'s existing user link (`to="/auth/profile"`) to `to="/account"`. No new nav item added anywhere.
- Update existing unit/e2e tests referencing old shapes/routes: `src/routes/__tests__/-account.test.tsx`, `src/routes/__tests__/-account-settings.test.tsx`, `src/components/__tests__/Header.test.tsx`, `src/components/auth/__tests__/Header.test.tsx`, `src/e2e/header-sidebar.spec.ts`.
- Add redirect-behavior test coverage for the two now-thin routes (logged-in → redirected to `/account`; logged-out → still gated by `requireAuth()`).

### Out of Scope

- Listing/revoking OAuth clients the user has authorized (e.g. the Alexa skill via `/oauth/consent`) — tracked separately per the issue, requires new server-side capability.
- Any change to the underlying tier/usage/theme/print-preference data model, tRPC procedures, or `authClient.updateUser` contract — this is a UI consolidation only.
- Any new preference or account-status feature not already present in one of the three source pages.
- Redesigning the visual style of any individual section beyond what's needed to sit coherently as a stacked section (e.g. removing a now-redundant full-page icon/title header per section in favor of one page-level header) — see design.md for the specific presentational deltas.

## What Changes

- `src/routes/account.tsx` becomes the canonical, single account page composing `ProfileSection`, the Status content, and `PreferencesSection`.
- New component files for the extracted sections (exact paths finalized in design.md).
- `src/routes/auth/profile.tsx` and `src/routes/account_.settings.tsx` become redirect-only route files.
- `src/components/Header.tsx` user link target changes from `/auth/profile` to `/account`.
- Test files listed above are updated to match the new route/component shape.

## Risks

- Risk: Extracting `SettingsPage`'s save logic into a `PreferencesSection` component could subtly change the `hasEdited`/session-sync `useEffect` behavior if state ownership moves incorrectly (e.g. session hydration racing a user's in-progress edit).
  - Impact: Silent data loss on save, or a preference edit getting reverted by a stale session refresh — a regression the issue's acceptance criteria explicitly guards against.
  - Mitigation: Port the existing `useEffect`/`hasEdited` guard logic verbatim into the extracted component rather than rewriting it; add/keep a regression test asserting an in-progress edit survives a session-object update.
- Risk: `account_.settings.tsx`'s trailing-underscore route convention means it currently does *not* share layout with `account.tsx`. Converting it to a redirect-only route needs to preserve `requireAuth()` behavior without accidentally inheriting or duplicating the parent route's data loading.
  - Impact: Logged-out users could see a broken or double-redirect experience hitting `/account/settings` directly.
  - Mitigation: Keep `beforeLoad: requireAuth()` in place on both redirect-only routes before the redirect throw; add explicit test coverage for logged-out access to both old routes.
- Risk: Test/e2e fallout is broader than the five files identified during exploration if other specs assert against `/auth/profile` or `/account/settings` text/DOM incidentally.
  - Impact: CI red after merge from an untracked test.
  - Mitigation: Full-repo grep for `/auth/profile` and `/account/settings` string literals as a tasks.md step before considering the change done, not just the five files already found.

## Open Questions

- None blocking. All open questions raised during the `/opsx:explore` session (layout shape, redirect target, mobile-drawer link duplication, internal Settings-link fate, sub-component extraction) were resolved by the requester before this proposal was written.

## Non-Goals

- Building any UI for OAuth client management (explicitly deferred, tracked separately).
- Changing tier limits, pricing, or upgrade-flow logic.
- Introducing tabbed or accordion navigation within the page — stacked sections only, per the resolved layout decision.
- Renaming or restructuring the `/account` URL itself.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
