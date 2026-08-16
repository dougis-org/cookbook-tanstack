## 1. Extract ProfileSection

- [ ] 1.1 Create `src/components/account/ProfileSection.tsx`: move the body of
      `src/components/auth/ProfileInfo.tsx` into it verbatim (same `useAuth()`
      call, same `isPending` skeleton, same `if (!session) return null` guard),
      named export or default export `ProfileSection`.
- [ ] 1.2 Delete `src/components/auth/ProfileInfo.tsx` and its test file (or
      move/rename the test alongside the new component — see task 6.x).

## 2. Extract StatusSection

- [ ] 2.1 Create `src/components/account/StatusSection.tsx`: move the
      tier/usage/upgrade-CTA JSX and the `ProgressBar` helper out of
      `src/routes/account.tsx`'s `AccountPage`, including the
      `trpc.usage.getOwned` `useQuery` call and the tier-fallback logic
      (`rawTier` → `"home-cook"` default).
- [ ] 2.2 `StatusSection` accepts `reason?: RedirectReason` as a prop (per
      design.md decision 1) rather than reading `Route.useSearch()` itself;
      render the existing `REDIRECT_REASON_MESSAGES[reason]` banner when
      present.

## 3. Extract PreferencesSection

- [ ] 3.1 Create `src/components/account/PreferencesSection.tsx`: move the
      theme radiogroup, print-preference toggles, save button, and all local
      state (`selectedTheme`, `printPreferences`, `hasEdited`, `status`,
      `errorMessage`) from `SettingsPage` in
      `src/routes/account_.settings.tsx`, verbatim.
- [ ] 3.2 Port the `handleSave` function and its `useAuth()`/session-hydration
      `useEffect` (including the `!hasEdited` guard) verbatim — do not change
      state ownership or pull `session`/`theme` in as props (see design.md
      decision 1's rationale on the session-refresh-clobbers-edit risk).
- [ ] 3.3 Confirm `PreferencesSection` still imports `DEFAULT_THEME`,
      `isValidThemeId`, `THEMES` from `@/contexts/ThemeContext`, and
      `DEFAULT_PRINT_PREFERENCES`, `resolvePrintPreferences`, `PrintPreferences`
      from `@/lib/printPreferences` unchanged.

## 4. Compose the consolidated `/account` page

- [ ] 4.1 Update `src/routes/account.tsx`: keep `beforeLoad: requireAuth()`
      and the existing `validateSearch` (the `reason` search param), remove
      the tier/usage JSX and `ProgressBar` now owned by `StatusSection`.
- [ ] 4.2 Render `<ProfileSection />`, `<StatusSection reason={reason} />`,
      `<PreferencesSection />` in that order inside `AccountPage`, under a
      single page-level `<h1>Account</h1>` with icon (per design.md decision
      2's composition sketch).
- [ ] 4.3 Delete the internal `<Link to="/account/settings">Settings</Link>`
      block (previously `account.tsx:74-80`) with no replacement.
- [ ] 4.4 Verify each section's card wrapper (`rounded-xl border ... p-6`) and
      its own `<h2>` sub-heading are preserved so the page doesn't lose visual
      hierarchy now that the page-level `<h1>`/icon is deduplicated.

## 5. Convert old routes to redirect-only

- [ ] 5.1 Read `src/lib/auth-guard.ts` to confirm `requireAuth()`'s exact
      synchronous-throw signature before writing the redirect `beforeLoad`s
      (already verified in design.md — re-check only if `auth-guard.ts` has
      changed since).
- [ ] 5.2 Rewrite `src/routes/auth/profile.tsx`: `beforeLoad` calls
      `requireAuth()(args)` then unconditionally `throw redirect({ to:
      "/account" })`; remove the `component`, `ProfilePage` function, and the
      `ProfileInfo`/`AuthPageLayout` imports.
- [ ] 5.3 Rewrite `src/routes/account_.settings.tsx`: same pattern —
      `requireAuth()(args)` then `throw redirect({ to: "/account" })`; remove
      `SettingsPage`, all its local state/imports, and the `component` export.

## 6. Header link

- [ ] 6.1 In `src/components/Header.tsx`, change the user link's `to=` prop
      from `"/auth/profile"` to `"/account"` (line ~308). No other change to
      that block's JSX, classes, or icon.

## 7. Update existing tests

- [ ] 7.1 Update `src/routes/__tests__/-account.test.tsx` to assert against
      the new composed `AccountPage` (all three sections present) instead of
      just the status/tier content, and to assert the internal Settings link
      is gone.
- [ ] 7.2 Update or remove `src/routes/__tests__/-account-settings.test.tsx`:
      convert its route-level assertions into a redirect test for
      `/account/settings` (see task 8.x), and move any remaining
      form-behavior assertions (save success/error, `hasEdited` guard) into a
      new test file for `PreferencesSection`.
- [ ] 7.3 Update `src/components/__tests__/Header.test.tsx` and
      `src/components/auth/__tests__/Header.test.tsx` to assert the user link
      targets `/account`, not `/auth/profile`.
- [ ] 7.4 Update `src/e2e/header-sidebar.spec.ts` to follow the Header user
      link to `/account` and assert the consolidated page content, replacing
      any assertions that expected `/auth/profile`.
- [ ] 7.5 Grep the full repo for the string literals `/auth/profile` and
      `/account/settings` (`grep -rn "'/auth/profile'\|\"/auth/profile\"\|'/account/settings'\|\"/account/settings\""` `src/`) and update any
      remaining references not already covered by 7.1–7.4.

## 8. New test coverage

- [ ] 8.1 Add a test for `src/components/account/PreferencesSection.tsx`
      asserting an in-progress, unsaved theme/print-preference edit survives
      a simulated session-object refresh (the `hasEdited` guard) — ports the
      intent of the existing `user-settings` spec's session-refresh
      requirement into the new component's test suite.
- [ ] 8.2 Add redirect tests for `/auth/profile`: authenticated visitor is
      redirected to `/account`; unauthenticated visitor is redirected to
      `/auth/login` (not to `/account` as an intermediate step).
- [ ] 8.3 Add redirect tests for `/account/settings`: same two cases as 8.2.
- [ ] 8.4 Add a test (or extend 7.1) confirming `/account` renders correctly
      at a mobile viewport width with no clipped section.

## 9. Verification

- [ ] 9.1 Run `npm run test` and confirm all unit/integration tests pass.
- [ ] 9.2 Run `npm run test:e2e` and confirm `header-sidebar.spec.ts` and any
      other affected e2e specs pass.
- [ ] 9.3 Run `npm run build` and confirm no TypeScript errors from the
      route/component restructuring.
- [ ] 9.4 Manually walk the golden path in a browser: log in, click the
      Header user link, land on `/account`, see all three sections, change
      theme and a print preference, save, confirm persistence; then visit
      `/auth/profile` and `/account/settings` directly and confirm both
      redirect to `/account`.
