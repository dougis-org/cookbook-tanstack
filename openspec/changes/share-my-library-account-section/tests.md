---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `share-my-library-account-section`
change. All work should follow a strict TDD (Test-Driven Development) process:
write the failing test first, write the simplest code to pass it, then refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a
   test that captures the requirements of the task. Run the test and ensure it
   fails.
2. **Write code to pass the test:** Write the simplest possible code to make
   the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test
   still passes.

## Test Cases

### Phase 1 — `SharingSection` component scaffold (Task 1.1 / 1.2 / 1.3)

- [ ] `SharesIGiveList` renders every grant from a seeded `myLibraryShares`
      response with recipient name and grant date
      — spec: ADDED Managing-shares gating by tier and received-share state
- [ ] `SharesIGiveList` renders its empty state when `myLibraryShares` returns `[]`
- [ ] `SharedWithMeList` renders every owner from a seeded `mySharedLibraries`
      response — spec: parent change's ADDED Managing shares, "Recipient views
      libraries shared with them"
- [ ] `SharedWithMeList` renders its empty state when `mySharedLibraries` returns `[]`
- [ ] `MyCollaborationsList` renders every collaboration from a seeded
      `myCollaborations` response, each linking to `/cookbooks/:id` — spec:
      parent change's ADDED Managing shares, "Existing collaborations are
      visible in the same section"
- [ ] `MyCollaborationsList` renders its empty state when `myCollaborations`
      returns `[]`
- [ ] `/account` route renders `SharingSection` after `PreferencesSection`

### Phase 2 — Gating matrix (Task 2.1 / 2.2 / 2.3)

- [ ] Executive Chef user: `SharingSection` renders the "I share" list and
      invite control, plus the other two lists
      — spec: ADDED Managing-shares gating by tier and received-share state,
      "Executive Chef sees the full section"
- [ ] Non-Executive-Chef user with a non-empty `mySharedLibraries` result:
      "shared with me" list renders, "I share" list and invite control do not
      render
      — spec: ADDED Managing-shares gating by tier and received-share state,
      "Non-Executive-Chef user with received shares sees everything but the
      invite affordance"
- [ ] Non-Executive-Chef user with a non-empty `myCollaborations` result (and
      empty `mySharedLibraries`): "my collaborations" list renders, "I share"
      list and invite control do not render
      — spec: same as above, collaborations branch
- [ ] Non-Executive-Chef user with both `mySharedLibraries` and
      `myCollaborations` empty: upgrade affordance renders in place of all
      three lists
      — spec: ADDED Managing-shares gating by tier and received-share state,
      "Non-Executive-Chef user with nothing shared sees an upgrade affordance"
- [ ] Upgrade affordance's root element uses an `.up-*` classname; rendered
      output contains no `.ad-*`, `.promo-*`, or `.sponsor-*` classname
      — spec: same scenario, adblock-safety assertion

### Phase 3 — Invite flow (Task 3.1 / 3.2 / 3.3 / 3.4)

- [ ] Typing 2+ characters into the invite field invokes `trpc.users.search`
      with the (debounced) query string
      — spec: ADDED Invite flow uses single-field search, no role selection,
      "Searching invokes the existing user-search procedure"
- [ ] Typing fewer than 2 characters does not invoke `users.search`
      (mirrors the existing `enabled: debouncedSearch.length >= 2` guard in
      `InviteCollaboratorModal`)
- [ ] Selecting a search result and confirming calls `sharing.shareLibrary`
      with that recipient's id
      — spec: ADDED Invite flow uses single-field search, no role selection,
      "Selecting a result creates a grant"
- [ ] On a successful `shareLibrary` mutation, the new grant appears in the "I
      share" list without a full page reload
      — spec: same scenario
- [ ] Rendered invite UI contains no role selector / radio group (regression
      guard distinguishing this from `InviteCollaboratorModal`)
- [ ] Scope-warning copy stating the grant covers the entire library, including
      future private content, is present and visible whenever the invite
      control is rendered
      — spec: ADDED Invite flow uses single-field search, no role selection,
      "Scope-warning copy is present"
- [ ] While `shareLibrary` mutation is pending, the invite control is disabled
      and shows a pending label
      — spec: Non-Functional Acceptance Criteria, "Invite/revoke mutations use
      pending-state UI, not optimistic UI with rollback"
- [ ] On a failed `shareLibrary` mutation, an inline error message renders, the
      invite control returns to its enabled state, and the "I share" list is
      unchanged (no row was ever speculatively added)
      — spec: ADDED Invite flow uses single-field search, no role selection,
      "A failed invite surfaces an error and resets the control"

### Phase 4 — Revoke flow (Task 4.1 / 4.2)

- [ ] Activating the revoke control on a listed grant calls
      `sharing.revokeLibraryShare` with that grant's id
      — spec: ADDED Revoke flow updates the owner's list immediately on
      success, "Revoking a grant removes it from the list"
- [ ] On a successful revoke, the grant no longer appears in the "I share" list
      while other grants remain listed
      — spec: same scenario
- [ ] While a revoke mutation is pending, that row's revoke control is disabled
      and shows a pending label
      — spec: Non-Functional Acceptance Criteria, pending-state UI
- [ ] On a failed revoke, an inline error message renders and the grant remains
      listed (no optimistic removal to roll back)
      — spec: ADDED Revoke flow updates the owner's list immediately on
      success, "A failed revoke surfaces an error and leaves the grant listed"

### Phase 5 — Theme and design-system pass (Task 5.1 / 5.2 / 5.3)

- [ ] Manual check: `SharingSection` legible in `dark` theme
- [ ] Manual check: `SharingSection` legible in `dark-greens` theme
- [ ] Manual check: `SharingSection` legible in `light-cool` theme
- [ ] Manual check: `SharingSection` legible in `light-warm` theme
      — spec: Non-Functional Acceptance Criteria, "Section renders legibly
      across all themes with no hard-coded colors"
- [ ] `grep -nE '#[0-9a-fA-F]{3,6}'` over `src/components/account/SharingSection.tsx`
      returns no matches
- [ ] `grep` for emoji characters over the same file returns no matches
- [ ] All icons imported in the new file come from `lucide-react`
- [ ] All new CTA copy is Title Case; all new body copy is sentence case

### Phase 6 — Fix the existing `networkidle` gap (Task 6.1 / 6.2)

- [ ] `grep -n "networkidle" src/e2e/cookbooks-collaboration.spec.ts` returns no
      matches after the fix
      — spec: ADDED Fix `networkidle` instance in
      `cookbooks-collaboration.spec.ts`
- [ ] `npx playwright test cookbooks-collaboration` — TC-COL-1 passes unchanged
      in assertions
- [ ] `npx playwright test cookbooks-collaboration` — TC-COL-2 (and any further
      scenarios in the file) pass unchanged in assertions
      — spec: same requirement, "no behavior change" scenario

### Phase 7 — Two-browser-context E2E coverage (Task 7.1 / 7.2 / 7.3 / 7.4)

- [ ] New cross-context helper in `src/e2e/helpers/app.ts` resolves once an
      expected condition is observable on a second, already-hydrated context's
      page, without reloading that page and without using `networkidle` or
      `waitForTimeout`
      — spec: ADDED Cross-context readiness wait for concurrent multi-user
      tests, "Recipient context observes an owner's action without reload"
- [ ] E2E: owner (Executive Chef, via `registerAndLoginWithTier`) grants a
      library share to a recipient from `/account`'s `SharingSection`
      — spec: parent change's "Granting library access"
- [ ] E2E: recipient's recipe/cookbook list shows the "Shared with me" badge
      for the owner's content, observed via the new cross-context helper with
      no page reload on the recipient's context
      — spec: parent change's "Recipient visibility"
- [ ] E2E: recipient adds a shared recipe to their own cookbook
      — spec: parent change's "Adding shared recipes to own cookbooks"
- [ ] E2E: owner revokes the share from `/account`
      — spec: parent change's "Revoking a share"
- [ ] E2E: recipient's next assertion (via the cross-context helper) shows the
      previously shared entry as unavailable
      — spec: parent change's "Unavailable shared entries"
- [ ] E2E: with an active grant, the owner's tier is downgraded directly in the
      DB; the recipient's next page load shows no shared content
      — spec: parent change's "Tier downgrade suspends shares"
- [ ] `grep -n "networkidle\|waitForTimeout" src/e2e/library-sharing-account.spec.ts`
      returns no matches
      — spec: project E2E wait convention, reliability requirement in design.md

## Acceptance Confirmation

- [ ] Every scenario in `specs/library-sharing/spec.md` (this change) maps to
      at least one test case above
- [ ] Every scenario in `specs/e2e-test-reliability/spec.md` (this change) maps
      to at least one test case above
- [ ] Every scenario under the parent change's `ADDED Managing shares`
      requirement (`openspec/changes/share-my-library/specs/library-sharing/spec.md`)
      is exercised by a test case above
