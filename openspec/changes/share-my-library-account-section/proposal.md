## GitHub Issues

- #675
- Part of epic #670
- Depends on #674 (merged, PR #687)
- Follow-ups spun out of this proposal: #688 (optimistic UI), #689 (broader E2E networkidle sweep)

## Why

- Problem statement: The Share My Library feature (#670) has a complete, merged
  server-side implementation (grant/revoke procedures, visibility filtering, tier-gated
  read access) and a complete content-rendering layer (#674 — badges, gating,
  unavailable placeholders), but no UI through which a user can actually create or
  manage a share. The feature is implemented but unreachable.
- Why now: This is the last of 5 planned PRs in the epic (#670) and is the PR that
  carries `Closes #668`. Nothing else blocks it — #674 merged today.
- Business/user impact: Until this ships, Executive Chef subscribers cannot use the
  capability they are paying for, and recipients cannot discover that content has been
  shared with them outside of it silently appearing in list views.

## Problem Space

- Current behavior: `src/routes/account.tsx` renders `ProfileSection`, `StatusSection`,
  and `PreferencesSection`. There is no UI anywhere for creating a library share,
  listing shares given/received, or viewing existing cookbook collaborations in one
  place. The server procedures (`sharing.shareLibrary`, `sharing.revokeLibraryShare`,
  `sharing.myLibraryShares`, `sharing.mySharedLibraries`, `cookbooks.myCollaborations`)
  are implemented, tested, and merged, but have no caller in application code.
- Desired behavior: A new `SharingSection` on the account page lets an Executive Chef
  invite a recipient by searching for them, see and revoke every grant they've made,
  and — for any user regardless of tier — see libraries shared with them and their
  existing cookbook collaborations, all in one place.
- Constraints:
  - Must follow `ProfileSection`/`PreferencesSection` structural conventions
    (component shape, section layout, PageLayout usage).
  - Must satisfy `design-system/CLAUDE.md`: four-theme legibility, no hard-coded hex,
    Lucide-only icons, no emoji, Title Case CTAs / sentence-case body, brand name
    "My CookBooks", adblock-safe `.up-*` classnames for any upsell surface.
  - Must satisfy the project's E2E wait convention: hydration-marker waits
    (`src/e2e/helpers/app.ts`), never `networkidle`, never fixed sleeps.
  - No new server-side work is in scope — every procedure this UI needs already
    exists and is merged.
- Assumptions:
  - "Executive Chef continuously" (design.md Decision 6, from the parent change) is
    enforced server-side already; this UI does not need to re-derive that check, only
    call `execChefProcedure`-backed mutations and let `FORBIDDEN` surface as an error.
  - The existing `cookbooks.myCollaborations` procedure (used by this section's third,
    read-only list) is stable and unaffected by this change.
- Edge cases considered:
  - A non-Executive-Chef user with zero received shares and zero collaborations needs
    an upgrade affordance rather than three empty lists.
  - A non-Executive-Chef user who *has* received shares or holds collaborations must
    still see those lists — the upgrade affordance is about the "I share" capability
    specifically, not the whole section.
  - A revoke or invite mutation can fail (network error, concurrent revoke, duplicate
    grant); the UI must not silently drop the user's action.
  - The two-user E2E flow (grant → visible → add to own cookbook → revoke →
    unavailable) requires two users to be authenticated concurrently, not sequentially.

## Scope

### In Scope

- `src/components/account/SharingSection.tsx`: new component with three lists
  (shares I give, libraries shared with me, my cookbook collaborations), invite
  input, revoke action, scope-warning copy, and an upgrade affordance path for
  non-Executive-Chef users with nothing shared with them.
- Wiring `SharingSection` into `src/routes/account.tsx`.
- Invite/revoke mutations using `useMutation` with a pending/disabled-state UI and
  error surfacing on failure (see Open Questions / Decision in design.md — explicitly
  **not** optimistic-UI-with-rollback; that is deferred to #688).
- Component tests for all three lists, their empty states, the gating matrix, the
  invite flow (via `users.search`), and the revoke flow.
- A new Playwright E2E spec covering the full round trip across two concurrently
  authenticated browser contexts (owner grants → recipient sees shared content badged
  → recipient adds a shared recipe to their own cookbook → owner revokes → recipient
  sees the entry as unavailable), plus the tier-downgrade-suspends-shares path.
- Fixing the existing `networkidle` wait in `src/e2e/cookbooks-collaboration.spec.ts`
  (`inviteCollaborator()` helper) to use the hydration-marker helpers in
  `src/e2e/helpers/app.ts`, since this change's new spec reuses and extends that
  same two-user interaction pattern and should not propagate a known-bad wait into
  new test code modeled on it.
- Any new Playwright helper needed to wait for a second context's view to reflect a
  change made by the first (e.g. after a revoke), added to `src/e2e/helpers/app.ts`.

### Out of Scope

- Any change to `src/server/trpc/routers/sharing.ts`, `cookbooks.ts`, or
  `_helpers.ts` — all required procedures already exist and are merged.
- True optimistic UI with rollback for invite/revoke — tracked in follow-up #688.
- Sweeping other `src/e2e/*.spec.ts` files for the same `networkidle` anti-pattern —
  tracked in follow-up #689. This change only fixes the one file it directly builds
  on.
- Any change to per-cookbook collaborator management UI
  (`InviteCollaboratorModal`, role selection, `cookbooks.addCollaborator`/
  `removeCollaborator`) beyond using it as a UX reference. Collaborator management
  stays on the cookbook page per design.md Decision 5 (parent change).
- Print-path handling for shared/cross-owner content — tracked separately in #669.

## What Changes

- New component: `src/components/account/SharingSection.tsx`.
- Modified route: `src/routes/account.tsx` renders the new section.
- New/modified tests: component tests for `SharingSection`; a new E2E spec (name TBD
  in tasks.md, e.g. `src/e2e/library-sharing-account.spec.ts`); one-line wait-helper
  fix in `src/e2e/cookbooks-collaboration.spec.ts`.
- Possible addition to `src/e2e/helpers/app.ts`: a helper for cross-context
  readiness/polling if the two-context test needs one beyond existing hydration waits.
- No server, schema, or database changes.

## Risks

- Risk: Modeling the invite flow on `InviteCollaboratorModal` while stripping role
  selection could leave an inconsistent interaction pattern between cookbook
  collaboration and library sharing if not deliberately simplified.
  - Impact: User confusion ("why does this invite flow look different from that
    one?").
  - Mitigation: design.md documents the simplified single-field invite explicitly as
    an intentional divergence (no roles exist for a library-wide grant), not an
    oversight.
- Risk: The three-way gating matrix (Executive Chef / non-Exec with shares / non-Exec
  without shares) is easy to get subtly wrong, e.g. hiding the "shared with me" list
  for a non-Exec-Chef user who has one.
  - Impact: A paying feature works, but a free recipient of a share loses visibility
    into content they were explicitly given access to.
  - Mitigation: design.md pins the exact matrix; tasks.md requires a dedicated test
    per cell.
- Risk: Genuine two-`BrowserContext` E2E scaffolding is new infrastructure for this
  repo (the existing Collaboration spec fakes multi-user with cookie-clear +
  relogin on one page); getting the concurrency and readiness waits wrong produces
  flaky CI.
  - Impact: Flaky or hanging E2E runs block merges, not just for this PR but for
    whoever else touches `src/e2e/` next.
  - Mitigation: Build the two-context helper deliberately in `src/e2e/helpers/app.ts`
    rather than inline in the spec, with explicit hydration-marker waits per context,
    so it is independently testable and reusable — the exact instinct #689 later
    broadens.
- Risk: Pending/disabled-state UI (chosen over optimistic UI, see design.md) may feel
  slower than Collaboration's existing invite flow, inviting scope creep mid-PR to
  "just make it optimistic."
  - Impact: Scope creep re-opens the exact rollback complexity this proposal
    deliberately deferred.
  - Mitigation: #688 exists and is linked from design.md precisely so that pressure
    has a named destination that isn't "do it now."

## Open Questions

None blocking. All ambiguity surfaced during the `/opsx:explore` session for #675 was
resolved with the requester before this proposal was written:

- Optimistic UI vs. pending-state UI → resolved: pending-state UI now, optimistic UI
  deferred to #688.
- `networkidle` gap in `cookbooks-collaboration.spec.ts` → resolved: fixed in this
  change's scope, since the new spec is modeled on that file's pattern.
- Broader E2E `networkidle` sweep → resolved: out of scope here, tracked in #689.

## Non-Goals

- Changing who can be invited (no recipient tier floor — already decided in the
  parent change's design.md Decision 6).
- Changing how shared content is modeled, filtered, or rendered in list/detail views
  (owned by #673/#674, already merged).
- Building a general-purpose "notifications" or "activity feed" surface for sharing
  events — the account section is the full extent of surfacing for this change.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
