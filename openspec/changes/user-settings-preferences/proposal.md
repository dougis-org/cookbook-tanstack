## GitHub Issues

- #609

## Why

- Problem statement: No user-facing settings surface or "persisted arbitrary preference" pattern exists in the app today. `src/routes/account.tsx` is read-only tier/usage info; there is no editable form anywhere for the current user's own record beyond an unused `updateProfile` mutation. #597 (Print preferences) needs somewhere to store five print-suppress booleans and a UI surface to toggle them, but that work is blocked until this foundation exists.
- Why now: #597 is queued and blocked on this. #608 (personal notes printability), the other blocker for #597, is already complete — this is now the only remaining prerequisite.
- Business/user impact: Users get their first self-service settings surface. Establishes a durable pattern (storage + write path + UI) that #597 and any future preference extends directly, instead of each feature improvising its own storage mechanism.

## Problem Space

- Current behavior:
  - `src/lib/auth.ts:52-65` — Better-Auth `user.additionalFields` currently defines `tier` and `isAdmin`. These flow into `session.user.*` automatically; `AccountPage` reads `session.user.tier` directly with no extra query.
  - `usersRouter.updateProfile` (`src/server/trpc/routers/users.ts:107-166`) writes `name`/`image` directly to the raw `user` Mongo collection via `findOneAndUpdate`/`updateOne` fallback, bypassing Better-Auth's own update path. It has **zero client callers** today (confirmed by repo-wide grep) — it exists only as server-side tested code with no UI to mirror.
  - Better-Auth's session is cached client-side for 5 minutes (`session.cookieCache.maxAge = 5 * 60`, `src/lib/auth.ts:69-72`). A write that bypasses Better-Auth's own update-user flow (as `updateProfile` does) would leave the cached session stale for up to 5 minutes after a save.
  - Theme (`src/contexts/ThemeContext.tsx`) is currently 100% client-side: `localStorage` plus an inline pre-hydration `<script>` in `__root.tsx` that sets `document.documentElement.className` before first paint to avoid a flash-of-wrong-theme. There is no server-side concept of theme today, and no cross-device sync.
- Desired behavior:
  - A new `/account/settings` route lets a logged-in user view and edit their preferences.
  - Preference writes go through Better-Auth's native `updateUser` client method (not a custom raw-Mongo tRPC mutation), so Better-Auth owns session-cache invalidation and the settings page reflects saved state correctly on save and on reload.
  - `theme` becomes the first real, server-persisted preference (via `additionalFields`), proving the end-to-end round trip (change → save → persist → reflect on reload) that #597 will reuse for its five print-suppress booleans.
  - `ThemeProvider` reconciles against `session.user.theme` after hydration; `localStorage` continues to win the first, pre-hydration paint so there is no regression to the current flash-free single-device experience.
- Constraints:
  - Better-Auth `additionalFields` are flat, individually-typed fields — not a nested object — so `theme` (and later, #597's five booleans) must each be their own top-level field entry in `src/lib/auth.ts`, not a nested `preferences: {...}` blob.
  - Must not touch or extend `usersRouter.updateProfile` — that mutation's consolidation onto the Better-Auth-native pattern is tracked separately in #613 and is explicitly out of scope here.
  - Must follow `design-system/CLAUDE.md`: theme tokens only, Title Case labels, Lucide icons, no emoji, verified against all four themes (`dark`, `dark-greens`, `light-cool`, `light-warm`).
- Assumptions:
  - Better-Auth's client SDK exposes an `updateUser` (or equivalently named) method capable of writing arbitrary `additionalFields` and triggering its own session cache refresh — this needs confirming against the installed Better-Auth version during design.
  - A one-page-load lag in cross-device theme sync (server value only reconciled post-hydration, not SSR-aware) is acceptable for this change; a flash-free, SSR-aware sync is deferred to follow-up work.
- Edge cases considered:
  - Anonymous/logged-out users: no session exists, so `/account/settings` requires auth (`requireAuth()` guard, same as `/account`); theme continues to work via `localStorage` only, unaffected by this change.
  - New device / empty `localStorage`, logged-in user with a previously saved server-side theme: post-hydration reconciliation will visibly correct the theme after first paint (a "flash," distinct from today's flash-free single-device behavior). Accepted as a known limitation, tracked as follow-up theme-sync work.
  - Save failure (network error, validation error): settings form must surface an explicit error state, not silently revert or lose the user's in-progress selection.

## Scope

### In Scope

- New route `src/routes/account/settings.tsx` (or equivalent path under the existing route convention), guarded by `requireAuth()`, following `design-system/CLAUDE.md`.
- Add `theme` to Better-Auth `user.additionalFields` in `src/lib/auth.ts`, alongside `tier`/`isAdmin`.
- Wire the settings form's save action through Better-Auth's native `updateUser` client method (or the closest equivalent the installed SDK exposes) — no new custom tRPC mutation for preferences.
- Update `ThemeProvider` (`src/contexts/ThemeContext.tsx`) to reconcile theme state against `session.user.theme` after hydration, without changing the existing pre-hydration inline-script/localStorage flash-avoidance behavior.
- Component/integration tests for the new settings route (loading, save, error handling) and for the updated `ThemeProvider` reconciliation behavior.

### Out of Scope

- The five print-preference boolean fields and their wiring into `RecipeDetail`'s print rendering — that's #597.
- Consolidating `usersRouter.updateProfile` (name/image) onto the Better-Auth-native pattern — tracked in #613.
- SSR-aware / flash-free cross-device theme sync — follow-up work, filed separately if not already tracked.
- Any settings unrelated to print preferences or theme; this change proves the pattern, not a general settings sprawl.

## What Changes

- `src/lib/auth.ts`: add `theme` to `user.additionalFields`.
- New route file for `/account/settings` with an editable preferences form (starting with theme selection).
- `src/contexts/ThemeContext.tsx`: add post-hydration reconciliation against the Better-Auth session's `theme` field.
- Client-side save path uses Better-Auth's native `updateUser` method instead of a new tRPC mutation.
- Tests covering the new route and the updated `ThemeProvider` behavior.

## Risks

- Risk: Better-Auth's client `updateUser` method may not support writing `additionalFields` in the version currently installed, or may have different invalidation semantics than assumed.
  - Impact: Would require either an SDK upgrade or falling back to a custom mutation with manual session invalidation, undermining the core rationale for this design.
  - Mitigation: Confirm `updateUser`'s behavior against installed Better-Auth version during design, before writing the form.
- Risk: Post-hydration theme reconciliation introduces a visible flash on new/second devices, which is a regression relative to today's flash-free (single-device-only) experience.
  - Impact: Minor visual glitch for users who use the app on multiple devices with different last-saved themes.
  - Mitigation: Explicitly accepted and documented as a known limitation; flagged for follow-up SSR-aware sync work rather than blocking this change.
- Risk: Introducing a second "current user update" pathway (Better-Auth-native) alongside the existing raw-Mongo `updateProfile` mutation could create confusion about which pattern to use for future fields.
  - Impact: Inconsistent conventions across the codebase until #613 lands.
  - Mitigation: #613 is already filed to consolidate `updateProfile` onto this change's pattern; this proposal documents that follow-up explicitly rather than leaving it implicit.

## Open Questions

- Question: Does the installed Better-Auth client SDK version expose an `updateUser` (or equivalent) method that can write custom `additionalFields`, and does it refresh the cached session automatically?
  - Needed from: Design-phase investigation (read Better-Auth version/docs in this repo).
  - Blocker for apply: yes
- Question: Should `/account/settings` be reachable from `/account` via a visible link/nav entry, or only via direct navigation for now?
  - Needed from: Product/UX call — reasonable default is a link from `/account`, but confirm before design finalizes the route/nav shape.
  - Blocker for apply: no

## Non-Goals

- Building out the five print-preference fields/toggle UI (#597).
- Making Personal Recipe Notes printable (#608 — already complete, not affected by this change).
- General settings sprawl beyond proving the preference-storage pattern.
- Consolidating `updateProfile` onto this pattern (#613).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
