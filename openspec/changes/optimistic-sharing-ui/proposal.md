## GitHub Issues

- #688

## Why

- Problem statement: `SharesIGiveList` (Account → Sharing & Collaboration) invites and revokes library shares with a pending-state UI only: the input/buttons lock and show "Sharing…" / "Revoking…" until the server responds, then the list refetches. The list does not change until the round trip and refetch complete.
- Why now: #675 deliberately shipped pending-state UI to avoid introducing a new pattern in that PR. #688 is the planned follow-up. The pattern already exists in the repo (`src/components/recipes/PrivateRecipeNotes.tsx` `upsertMutation`: `cancelQueries` → snapshot → `setQueryData` → rollback on error → invalidate on success), so the risk of adopting it is low.
- Business/user impact: Executive Chef users get an immediate response when sharing/revoking, and can invite several people in quick succession without waiting on each request.

## Problem Space

- Current behavior:
  - Invite: picking a search result calls `sharing.shareLibrary`; the search input and result buttons are disabled while pending; on success the `myLibraryShares` query is invalidated and the new row appears after the refetch.
  - Revoke: the row's button is disabled and reads "Revoking…" until success + refetch.
  - Errors surface via local `inviteError` / `revokeError` state.
- Desired behavior:
  - Invite: the person appears in "Libraries You Share" immediately, rendered as **pending** (dimmed, "Sharing…", no Revoke action). The search input clears and stays **enabled** so further invites can be fired without waiting. On success the row becomes a normal row (server id/date); on failure the row disappears and an error naming the recipient is shown.
  - Revoke: the row disappears immediately; on failure it reappears at its original position and an error is shown.
  - Cache rollback/apply logic lives in a **shared helper** so other mutations (e.g. collaborator add/remove) can adopt it later.
- Constraints:
  - Server API (`sharing.shareLibrary`, `sharing.revokeLibraryShare`, `sharing.myLibraryShares`) is unchanged.
  - Design-system rules: theme tokens only, no emoji, Lucide icons, `transition-*` motion only; "Sharing…" uses the `…` character.
  - TDD per `AGENTS.md`; existing `SharingSection` tests mock `useMutation`/`useQueryClient` and must be updated, not deleted.
- Assumptions:
  - `myLibraryShares` rows have `{ id, recipientId, recipientName, addedAt }` (see `LibraryShareRow`).
  - `shareLibrary` returns the created grant, but the list is reconciled by invalidation, not by splicing the response.
- Edge cases considered:
  - Concurrent invites: a rollback of one must not erase another's optimistic row.
  - Concurrent revokes: a rollback of one must not resurrect another's removal.
  - Refetch triggered by an unrelated settle must not wipe still-in-flight optimistic rows.
  - Inviting someone already in the list (client-side dedupe; server still returns `CONFLICT`).
  - Revoke of a pending (temp-id) row must be impossible, since no real `shareId` exists yet.
  - Failure after the search input has already been cleared: the error must name the recipient, since the row vanishes.
  - Server-side failures: `CONFLICT` (already shared), `BAD_REQUEST` (self), `NOT_FOUND`, `FORBIDDEN` (tier downgrade mid-session).

## Scope

### In Scope

- Shared optimistic-list-update helper (new, under `src/lib/`) with unit tests.
- Optimistic invite (pending row, free input) and optimistic revoke in `src/components/account/SharingSection.tsx`.
- Component tests: optimistic add appears immediately and is marked pending; reverts on forced error; optimistic revoke removes immediately and reverts on forced error; concurrent invites/revokes.
- Update of existing `SharingSection` tests whose `useQueryClient` mock is insufficient.

### Out of Scope

- Retrofitting `cookbooks.addCollaborator` / `cookbooks.removeCollaborator` in `src/routes/cookbooks.$cookbookId.tsx`. These run inside a modal with `closeModal()` on success, so optimistic UI changes the modal flow. Tracked as a follow-up issue; the helper is designed to be reusable for it.
- Server/router changes.
- Optimistic UI for `SharedWithMeList` / `MyCollaborationsList` (read-only lists).

## What Changes

- Add `src/lib/optimisticListMutation.ts` (name final in design): builds `onMutate` / `onError` / `onSettled` handlers for a list query from an `apply` function and an inverse `revert` function.
- `SharesIGiveList`: replace plain `onSuccess`-invalidate mutations with helper-driven optimistic ones; remove input/result-button `disabled` on invite pending; render pending rows; recipient-named invite error.
- Tests updated/added as above.

## Risks

- Risk: Cache races between overlapping mutations.
  - Impact: Flicker, lost optimistic rows, or resurrected rows.
  - Mitigation: Inverse-operation rollback (not whole-snapshot restore); `cancelQueries` before apply; invalidate on settle only when no other mutation with the same key is in flight.
- Risk: Temp id leaks into a mutation (revoke on a pending row).
  - Impact: Server `BAD_REQUEST` on an invalid ObjectId.
  - Mitigation: Pending rows render no Revoke control; test asserts it.
- Risk: Existing mock-heavy component tests break or give false confidence.
  - Impact: Low-value tests for the new behavior.
  - Mitigation: New behavior tested with a real `QueryClient` and a mocked tRPC layer; old tests migrated.
- Risk: Rapid invites produce multiple errors but only one error slot.
  - Impact: A failure is hidden.
  - Mitigation: Latest failure wins and names the recipient; cleared on next successful invite.

## Open Questions

- None blocking. Resolved during explore: input stays free for rapid invites; optimistic invite row looks visibly pending; shared helper rather than inline logic.
  - Needed from: n/a
  - Blocker for apply: no

## Non-Goals

- No server-side or API-contract changes.
- No generic optimistic framework beyond list add/remove helpers needed here.
- No changes to sharing eligibility, tier gating, or the section's gating matrix.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
