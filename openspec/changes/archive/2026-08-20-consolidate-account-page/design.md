## Context

Three routes currently carry account-related UI: `src/routes/auth/profile.tsx`
(profile identity), `src/routes/account.tsx` (tier/usage/upgrade), and
`src/routes/account_.settings.tsx` (theme + print preferences). Only the first
is linked from the app (`Header.tsx`). This change merges all three into
`src/routes/account.tsx` as stacked sections, turns the other two into
redirect-only routes, and repoints the Header link.

Relevant existing code (read during exploration, not yet modified):

- `src/routes/account.tsx` — `AccountPage`, uses `useAuth()`, `trpc.usage.getOwned`,
  `TIER_LIMITS`/`TIER_DESCRIPTIONS`/`TIER_DISPLAY_NAMES`/`TIER_PRICING` from
  `@/lib/tier-entitlements`. `validateSearch` handles a `reason` search param
  for redirect-reason banners (`auth-required`, `tier-limit-reached`).
- `src/components/auth/ProfileInfo.tsx` — default export `ProfileInfo`, reads
  `useAuth()` directly, renders avatar/name/member-since/etc, has its own
  `isPending` skeleton and `if (!session) return null` guard.
- `src/routes/account_.settings.tsx` — `SettingsPage`, local state
  (`selectedTheme`, `printPreferences`, `hasEdited`, `status`, `errorMessage`),
  a `useEffect` that hydrates from `session.user.theme` /
  `resolvePrintPreferences(session)` but only when `!hasEdited` (this is the
  guard that prevents an async session refresh from clobbering an in-progress
  edit — see project decision "Do not let session refreshes overwrite unsaved
  settings edits"), and `handleSave` which calls `authClient.updateUser` with
  both theme and print-preference fields in one call, with distinct
  success/error/unexpected-exception handling.
- `src/components/Header.tsx:307-313` — the user link, one JSX element that
  renders at all viewport widths (icon always shown, name/email text hidden
  below `sm:`). No separate mobile-drawer entry exists for it today.

## Goals / Non-Goals

**Goals:**
- One `/account` route rendering Profile → Status → Preferences as stacked
  sections, each independently comprehensible, all reachable without a route
  change.
- Zero behavioral regression in tier/usage display, theme/print-preference
  save semantics, or auth guarding.
- `/auth/profile` and `/account/settings` keep working as redirects, so old
  links/bookmarks/e2e references don't 404.

**Non-Goals:**
- No visual redesign beyond what's needed to make three previously
  full-page sections coexist on one page (see Decisions below for the
  specific per-section header treatment).
- No change to `authClient.updateUser`, `trpc.usage.getOwned`, or any
  server-side contract.
- No tabs, accordions, or client-side routing between sections.

## Decisions

### 1. Component extraction boundaries

Extract three presentational/section components, each owning its own data
fetching and local state exactly as its source page did, composed by
`AccountPage`:

- `src/components/account/ProfileSection.tsx` — body of current
  `ProfileInfo.tsx` (same `useAuth()` call, same skeleton/guard logic),
  default-exported as `ProfileSection`. `ProfileInfo.tsx` is deleted; nothing
  else imports it (`src/routes/auth/profile.tsx` becomes a redirect and no
  longer renders it).
- `src/components/account/StatusSection.tsx` — the tier/usage/upgrade-CTA
  JSX currently inline in `AccountPage` (lines ~89–164), including the
  `ProgressBar` helper, `useQuery` call, and the `reason` banner. Takes no
  props beyond what it derives itself from `useAuth()`/`Route.useSearch()` —
  actually `reason` comes from route search state, so `StatusSection` either
  reads `Route.useSearch()` itself (coupling it to the `/account` route) or
  receives `reason` as a prop from `AccountPage`. **Decision: pass `reason`
  as a prop** — keeps `StatusSection` reusable/testable independent of the
  route and matches the project's existing pattern of resolving route/session
  concerns at the route layer and passing plain props down (see project
  decision "Keep RecipeDetail presentational; resolve personal notes in the
  route").
- `src/components/account/PreferencesSection.tsx` — the theme radiogroup +
  print-preference toggles + save button from `SettingsPage`, including its
  full local state (`selectedTheme`, `printPreferences`, `hasEdited`,
  `status`, `errorMessage`) and the `handleSave` function, ported verbatim.
  This component owns its own `useAuth()` call and its own hydration
  `useEffect` — it does not receive session/theme as props from `AccountPage`,
  because the `hasEdited` guard needs to react to the *same* session object
  this component observes, and splitting that across a prop boundary risks
  exactly the staleness bug the guard exists to prevent.

Alternative considered: pass `session` down from `AccountPage` to all three
sections instead of each calling `useAuth()` independently. Rejected — three
sections calling the same cached `useAuth()` hook is not a meaningful
duplication cost, and keeping each section self-sufficient means the
extraction is closer to a pure move than a refactor, which lowers regression
risk for this change.

### 2. `AccountPage` composition and per-section chrome

`AccountPage` keeps the route's `beforeLoad: requireAuth()` and
`validateSearch`. Its render body becomes:

```
<PageLayout>
  <div className="max-w-2xl mx-auto py-12 px-6 space-y-10">
    <div className="flex items-center gap-4">
      <User .../>
      <h1>Account</h1>
    </div>
    <ProfileSection />
    <StatusSection reason={reason} />
    <PreferencesSection />
  </div>
</PageLayout>
```

Each section keeps its own card wrapper (`rounded-xl border ... bg-surface
p-6`) and its own `<h2>` sub-heading (e.g. "Profile", tier display name,
"Preferences") but **not** its own page-level icon+`<h1>` — that's now
owned once by `AccountPage` itself. This is the one presentational delta
flagged as in-scope in proposal.md: `ProfileInfo` and `SettingsPage`
currently each render inside `AuthPageLayout`/`PageLayout` with their own
big icon header; those page-level headers are dropped in favor of each
section's existing `<h2>` (Profile section either reuses "Profile" as an
`<h2>` or omits it if the avatar+name already reads as the section title —
implementation's call, not a design decision that needs to be fixed here).

### 3. Redirect-only routes

Both `src/routes/auth/profile.tsx` and `src/routes/account_.settings.tsx`
become:

```ts
export const Route = createFileRoute("/auth/profile")({
  beforeLoad: (args) => {
    requireAuth()(args)
    throw redirect({ to: "/account" })
  },
})
```

Verified against `src/lib/auth-guard.ts`: `requireAuth()` returns a
synchronous `GuardFn` (`(args: GuardArgs) => void`) built on
`withAuthenticatedSession`, which itself calls `throwLoginRedirect()`
(a `never`-returning throw) when `context.session` is absent. Because it's a
synchronous throw rather than a Promise rejection, calling
`requireAuth()(args)` directly in the redirect route's `beforeLoad` — before
the unconditional `throw redirect({ to: "/account" })` — is sufficient: a
logged-out visitor never reaches the `/account` redirect line at all. No
`async`/`await` needed, and no risk of a double-redirect round trip.

No `component` is needed on these routes since `beforeLoad` always throws.

### 4. Header link

`Header.tsx:308` changes `to="/auth/profile"` to `to="/account"`. No other
change to that JSX block — same icon, same `session.user.name ||
session.user.email` text, same responsive classes. Confirmed during
exploration that no separate mobile-drawer entry exists to update; the issue
text's "mobile drawer" mention is satisfied by this single element already
rendering at drawer-open widths.

### 5. Internal "Settings" link removal

`account.tsx`'s current `<Link to="/account/settings">Settings</Link>`
(lines 74–80) is deleted with no replacement — there's nothing to link to
once Preferences is a section on the same page.

## Risks / Trade-offs

- [Risk] Porting `PreferencesSection`'s `useEffect`/`hasEdited` hydration
  logic incorrectly (e.g. accidentally sourcing `session` from a prop instead
  of the section's own `useAuth()` call) reintroduces the exact
  session-refresh-clobbers-edit bug the guard was written to prevent.
  → Mitigation: decision above requires `PreferencesSection` to own its
  `useAuth()` call directly, not receive session via props; tasks.md includes
  a dedicated task to port this logic verbatim before any other change to it.
- [Risk] The redirect-only routes need explicit test coverage proving the
  logged-out case actually short-circuits before reaching `/account` (the
  code shape is now verified against `auth-guard.ts`, but that doesn't
  substitute for a regression test).
  → Mitigation: tasks.md includes explicit test coverage for the
  logged-out-visitor-hits-old-route case from proposal.md's edge cases.
- [Risk] Three independent `useAuth()` calls in one page tree could produce
  a visible layout shift if their loading states (`isPending`) resolve at
  slightly different times relative to each other and to `StatusSection`'s
  `useQuery`.
  → Mitigation: not a functional regression (each section already has its
  own skeleton), but worth a manual check during implementation; not blocking
  for this design.

## Migration Plan

No data migration. This is a client-side route/component reorganization.
Deploy is a normal PR merge; no feature flag needed since old routes remain
functional (as redirects) throughout, so there's no window where a bookmark
or in-flight link breaks. Rollback is a normal revert.

## Open Questions

None outstanding — all decisions needed to implement are captured above.
