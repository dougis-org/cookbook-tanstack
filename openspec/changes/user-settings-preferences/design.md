## Context

- Relevant architecture:
  - `src/lib/auth.ts` — Better-Auth server config; `user.additionalFields` currently defines `tier`, `isAdmin`.
  - `src/lib/auth-client.ts` — Better-Auth client; already wires `inferAdditionalFields<Auth>()`, which types `authClient.updateUser` and `session.user` against whatever is in `Auth`'s `user.additionalFields` automatically. Adding `theme` server-side requires no client-plugin change.
  - `src/hooks/useAuth.ts` — thin wrapper over `AuthContext` exposing `{ session, isPending, isLoggedIn, userId }`; `session` already carries `user.tier`/`user.isAdmin` today with no extra `me` query, confirming the same will hold for `user.theme`.
  - `src/contexts/ThemeContext.tsx` — client-only theme state today: `localStorage` + inline pre-hydration `<script>` in `src/routes/__root.tsx` sets `document.documentElement.className` before first paint.
  - `src/routes/account.tsx` — existing read-only tier/usage route; file-based routing convention for a nested route is flat dot-notation (`account.settings.tsx`, matching existing patterns like `cookbooks.$cookbookId_.print.tsx`).
- Dependencies: Better-Auth `^1.6.2` (confirmed via `package.json`). Context7 docs for this version confirm:
  - `authClient.updateUser(body)` posts to a generic `/update-user` endpoint (`updateUserBodySchema = z.record(z.string(), z.any())`), typed as `Partial<AdditionalUserFieldsInput<O>>` — **not** hardcoded to `name`/`image`. Any `user.additionalFields` entry, including `theme`, is writable through it.
  - `updateUser` triggers Better-Auth's internal session-refresh signal by default (the `disableSignal: true` opt-out only exists because the default is signal-on), so `useSession()`/`useAuth()` reflects the new value immediately after a successful call — no reliance on the 5-minute `cookieCache.maxAge` expiring.
- Interfaces/contracts touched:
  - `src/lib/auth.ts` (`user.additionalFields`) — add `theme`.
  - New route `src/routes/account.settings.tsx`.
  - `src/contexts/ThemeContext.tsx` — add post-hydration reconciliation against `session.user.theme`.
  - No tRPC router changes — this change intentionally does not touch `usersRouter` (see #613 for that consolidation).

## Goals / Non-Goals

### Goals

- Prove a server-persisted, user-editable preference end-to-end: form → `authClient.updateUser` → Better-Auth session refresh → reflected on reload.
- Land `theme` as that first real preference, replacing (for logged-in users) the client-only `localStorage` source of truth with a server-backed one, while preserving today's flash-free first paint via `localStorage`-first pre-hydration.
- Establish the route location and form conventions #597 will extend with five more toggles.

### Non-Goals

- SSR-aware, fully flash-free cross-device theme sync (deferred; tracked as follow-up).
- Any print-preference fields or `RecipeDetail` wiring (#597).
- Touching `usersRouter.updateProfile` or unifying it with this change's pattern (#613).

## Decisions

### Decision 1: Use `authClient.updateUser` directly from the settings form; no new tRPC mutation

- Chosen: The settings form's save handler calls `authClient.updateUser({ theme })` directly. No `usersRouter.updatePreferences` (or similar) tRPC procedure is added.
- Alternatives considered: A tRPC mutation that itself calls `auth.api.updateUser` server-side, or a tRPC mutation that writes to Mongo directly (mirroring `updateProfile`).
- Rationale: `updateUser` already validates against `user.additionalFields`' declared types (via Better-Auth's schema), handles the DB write, and triggers session-signal refresh — a tRPC wrapper would only add indirection without adding validation or behavior. Direct client call is the minimal-surface-area choice and is the pattern Better-Auth's own docs demonstrate for exactly this "theme"/"language" preference use case.
- Trade-offs: The write path for preferences (`authClient.updateUser`) now visibly differs from the write path for profile fields (`trpc.users.updateProfile`) until #613 consolidates them. This divergence is documented in the proposal's Risks section and tracked, not silently introduced.

### Decision 2: `theme` type is a string enum matching `THEMES` ids, with `input: false` disabled (i.e. `input` left default/true) so the client can set it directly

- Chosen: In `src/lib/auth.ts`:
  ```ts
  theme: {
    type: "string" as const,
    defaultValue: "dark",
    required: false,
  },
  ```
  Validation of the value being one of the four valid theme ids happens client-side (`ThemeContext`'s existing `THEMES.some(...)` guard, reused in the settings form) before calling `updateUser`.
- Alternatives considered: A dedicated Better-Auth plugin/hook (`databaseHooks.user.update.before`) enforcing the enum server-side.
- Rationale: Better-Auth's `additionalFields` `type` option supports a literal array (`type: ["user", "admin"]` per docs) for enum-like validation, but introducing that here — versus the simple existing client-side guard already used by `ThemeContext.setTheme` — is more machinery than four low-stakes string values warrant. If a bad value is ever persisted, `ThemeContext`'s `THEMES.some(...)` check already ignores unrecognized values and falls back to `'dark'`, so the failure mode is contained.
- Trade-offs: A malicious or buggy client could technically write an arbitrary string to `user.theme`; blast radius is a no-op fallback to `'dark'` on read, not a crash or security issue.

### Decision 3: Post-hydration reconciliation, not SSR-aware sync

- Chosen: `ThemeProvider`'s existing post-mount effect (`src/contexts/ThemeContext.tsx:37-45`) is extended: after resolving `localStorage`, if a session is available and `session.user.theme` differs from the resolved local value, prefer the session value, update the DOM class, and persist it to `localStorage` (so subsequent loads on this device are consistent going forward).
- Alternatives considered: SSR loader (`beforeLoad`) reading `session.user.theme` and threading it into the inline pre-hydration script.
- Rationale: Matches the proposal's accepted scope — this change proves the storage/write pattern, not a flash-free multi-device experience. SSR-aware sync touches `__root.tsx`'s inline script and the route loader chain, materially larger surface area, and is explicitly deferred.
- Trade-offs: A user who last set their theme on device A, then opens the app on device B for the first time, will see device B's default/localStorage theme flash briefly before correcting to the server value post-hydration. Documented and accepted in the proposal.

### Decision 4: New route `src/routes/account.settings.tsx`, linked from `/account`

- Chosen: New file-based route at `/account/settings`, guarded by `beforeLoad: requireAuth()` (same as `/account`). Add a "Settings" link from `AccountPage` into the new route so it's discoverable via normal navigation, not only direct URL entry.
- Alternatives considered: Extending `account.tsx` in place with an editable section.
- Rationale: Matches the proposal's decision — this surface is expected to grow (five more toggles from #597), and `account.tsx` is presently a clean, read-only tier/billing surface; mixing concerns there would need to be undone later anyway.
- Trade-offs: One more route/nav entry to maintain; negligible given the file-based routing convention already in place.

## Proposal to Design Mapping

- Proposal element: Preference writes go through Better-Auth's native `updateUser`, not a custom tRPC mutation.
  - Design decision: Decision 1.
  - Validation approach: Component/integration test asserting the settings form calls `authClient.updateUser` (mocked) with the expected payload on save, and that no new tRPC procedure is introduced (covered implicitly by absence of new router code).
- Proposal element: `theme` is the first real preference field, added to `user.additionalFields`.
  - Design decision: Decision 2.
  - Validation approach: Unit test on `src/lib/auth.ts` config shape (or integration test hitting `/update-user` in a test harness) confirming `theme` round-trips; existing `ThemeContext` guard tests extended to cover server-sourced values.
- Proposal element: Post-hydration reconciliation against `session.user.theme`; accepted flash on new devices.
  - Design decision: Decision 3.
  - Validation approach: Component test on `ThemeProvider` mounting with a mocked session whose `user.theme` differs from `localStorage`, asserting the DOM class and `localStorage` are updated post-mount to match the session value.
- Proposal element: New `/account/settings` route, `account.tsx` unchanged (aside from a nav link).
  - Design decision: Decision 4.
  - Validation approach: Route/component test for `account.settings.tsx` (loading state, save, error handling, per proposal's testing scope) and an assertion that `AccountPage` renders a link to it.
- Proposal element: `usersRouter.updateProfile` untouched; consolidation deferred to #613.
  - Design decision: Implicit in Decision 1 (no changes to `src/server/trpc/routers/users.ts` in this change).
  - Validation approach: Existing `users.test.ts` suite continues to pass unmodified — regression signal that this change didn't touch that file.

## Functional Requirements Mapping

- Requirement: A logged-in user can view and change their theme preference at `/account/settings`, and it persists across reloads.
  - Design element: Decision 4 (route) + Decision 1 (write path).
  - Acceptance criteria reference: specs (to be authored) — settings-page capability.
  - Testability notes: Component test mounts the route, selects a theme, asserts `updateUser` called and success state shown; a second mount (simulating reload) with a mocked session reflecting the new value confirms persistence.
- Requirement: Saving a preference reflects immediately in the app's session state (no 5-minute staleness).
  - Design element: Decision 1 (relies on Better-Auth's default signal-based session refresh).
  - Acceptance criteria reference: specs — session-refresh behavior.
  - Testability notes: Test asserts `useSession`/`useAuth`-consuming component re-renders with new `theme` value shortly after `updateUser` resolves, without manually calling `refetch()`.
- Requirement: A logged-out/anonymous user's theme experience is unchanged (localStorage only, no flash).
  - Design element: Decision 3 (reconciliation only runs when a session exists).
  - Acceptance criteria reference: specs — anonymous theme behavior.
  - Testability notes: Existing `theme.spec.ts` E2E coverage re-run unmodified for logged-out flows; extend only for logged-in reconciliation case.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: A failed save (network/validation error) must show an explicit error and must not silently revert or discard the user's in-progress selection.
  - Design element: Settings form local state holds the pending selection independently of session state until save succeeds or fails; error path leaves the selection visible with an inline error message.
  - Acceptance criteria reference: specs — save-error handling.
  - Testability notes: Component test mocks `updateUser` rejecting, asserts error message rendered and selected value unchanged in the form.
- Requirement category: security
  - Requirement: `/account/settings` must not be reachable without authentication.
  - Design element: `beforeLoad: requireAuth()`, identical guard to `/account`.
  - Acceptance criteria reference: specs — route auth guard.
  - Testability notes: Route test asserting redirect for unauthenticated access, mirroring existing `-account.test.tsx` patterns.

## Risks / Trade-offs

- Risk/trade-off: Two divergent "update the current user" write paths exist in the codebase until #613 lands (raw-Mongo `updateProfile` for name/image, Better-Auth-native `updateUser` for preferences).
  - Impact: Contributor confusion about which pattern to extend for a new field, in the window between this change and #613.
  - Mitigation: Documented explicitly in this change's proposal and in #613's issue body; #613 is the follow-up that closes the gap.
- Risk/trade-off: Post-hydration-only theme reconciliation causes a visible flash for users switching devices with divergent last-saved themes.
  - Impact: Minor visual glitch, multi-device users only, first load on a new/cleared device only.
  - Mitigation: Explicitly accepted per proposal; flagged for separate SSR-aware follow-up if/when prioritized.

## Rollback / Mitigation

- Rollback trigger: Settings form causes session-refresh regressions elsewhere (e.g. unexpected re-renders on unrelated pages), or `theme` field corruption is observed in the `user` collection.
- Rollback steps: Revert the `account.settings.tsx` route and its nav link; revert `theme` addition to `user.additionalFields` in `src/lib/auth.ts`; revert `ThemeProvider` reconciliation effect. No other routers/collections touched, so rollback is a straightforward revert of this change's commits.
- Data migration considerations: `theme` is `required: false` with a `defaultValue`, so existing user documents need no migration — the field is simply absent until a user saves a preference, and Better-Auth's own default-value handling covers reads. No destructive migration in either direction.
- Verification after rollback: Confirm `/account/settings` 404s (route removed), `AccountPage` renders without the settings link, and no lingering `theme` field is written by any remaining code path.

## Operational Blocking Policy

- If CI checks fail: Fix in the same PR before merge; this change has no urgency justifying bypassing CI given it's purely additive (new route + one field) with no shared-surface risk.
- If security checks fail: Treat as blocking — `additionalFields` and auth-adjacent code changes get no exception; investigate and resolve before merge.
- If required reviews are blocked/stale: Follow standard repo PR process (`docs/standards/ci-cd.md`); ping reviewer or escalate per existing team norms — no special-cased path for this change.
- Escalation path and timeout: Standard repo PR review timeout/escalation; nothing in this change requires an expedited path.

## Open Questions

- None blocking. The proposal's blocking open question (whether `updateUser` supports arbitrary `additionalFields` and triggers session refresh) is resolved above via Context7-sourced Better-Auth `^1.6.x` documentation and confirmed compatible with the existing `inferAdditionalFields<Auth>()` client plugin already wired in `src/lib/auth-client.ts`.
- Non-blocking, deferred to product/UX (per proposal): exact placement/wording of the `/account/settings` nav link from `AccountPage` — default to a simple text link near the top of the page; can be refined in review.
