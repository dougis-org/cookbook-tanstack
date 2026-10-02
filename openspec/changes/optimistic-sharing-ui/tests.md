---
name: tests
description: Tests for the optimistic-sharing-ui change
---

# Tests

## Overview

This document outlines the tests for the `optimistic-sharing-ui` change. All work follows strict TDD (fail, pass, refactor).

Harnesses:

- **Helper tests** (`src/lib/__tests__/optimisticListMutation.test.ts`): real `QueryClient`, no React.
- **Component tests** (`src/components/account/__tests__/SharingSection.optimistic.test.tsx`, new): real `QueryClientProvider`; `@/lib/trpc` mocked so `mutationOptions(opts)` returns `{ mutationFn, ...opts }` with controllable deferred promises and `queryOptions` reads a mutable in-memory share list.
- **Existing suite** (`SharingSection.test.tsx`): migrated per E4.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** capture the requirement; run it and confirm it fails.
2.  **Write code to pass the test:** simplest implementation.
3.  **Refactor:** improve structure while tests stay green.

## Test Cases

### E1 — Shared helper (spec: "Shared optimistic list helper")

- [x] T1 (E1.1) `onMutate` cancels in-flight queries for the key, then applies `apply` to cached list — "In-flight refetch is cancelled before apply", "Apply and revert"
- [x] T2 (E1.1) `onMutate` returns the context produced by `apply` for use by `revert`
- [x] T3 (E1.1) `onError` runs `revert(currentList, vars, context)`; result restores `[a, b]` from `[a, b, c]` — "Apply and revert"
- [x] T4 (E1.1) Revert is by inverse: with `c` and `d` applied, reverting `c` leaves `d` — "Revert does not discard unrelated changes"
- [x] T5 (E1.1/E1.3) `onSettled` does not invalidate while another mutation with the same `mutationKey` is in flight, and invalidates exactly once when the last settles — "Guarded invalidation" (pins the `isMutating` threshold)
- [x] T6 (E1.1) `apply`/`revert` tolerate an empty/undefined cache entry (no throw; list treated as `[]`)

### E2 — Optimistic invite (spec: "Optimistic invite with pending row", "Rapid invites", list-driven pending state)

- [x] T7 (E2.1) Selecting a result adds a pending row synchronously (before the deferred resolves), `aria-busy="true"`, "Sharing…" — "Pending row appears immediately"
- [x] T8 (E2.1) Search input value is cleared immediately and the input is not `disabled` while pending — "Invite no longer locks the input"
- [x] T9 (E2.1) Pending row contains no Revoke control; other rows keep theirs — "Pending row has no Revoke"
- [x] T10 (E2.1) On rejection the pending row is removed and `role="alert"` text contains the recipient name and server message — "Invite failure reverts"
- [x] T11 (E2.1) On success + refetch the row is no longer `aria-busy`, shows the date, has Revoke — "Pending row becomes a real row on success"
- [x] T12 (E2.1) A second invite fires while the first is pending (two `shareLibrary` calls, two pending rows); first rejecting removes only its row — "Second invite while first is pending", "Overlapping invites, first fails"
- [x] T13 (E2.1) Selecting an already-listed recipient adds no duplicate row — "Recipient already listed"
- [x] T13a (E2.2) `isOptimisticShareId` returns true only for ids with the `optimistic-` prefix
- [x] T13b (E2.4) No standalone "Sharing…" paragraph under the input

### E3 — Optimistic revoke (spec: "Optimistic revoke")

- [x] T14 (E3.1) Activating Revoke removes the row synchronously, other rows remain — "Row removed immediately"
- [x] T15 (E3.1) On rejection the row returns at its original index and an alert is shown — "Revoke failure reverts"
- [x] T16 (E3.1) Overlapping revokes: first rejecting restores only its row; the second stays removed — "Overlapping revokes, first fails"
- [x] T17 (E3.3) No "Revoking…" label is rendered at any point — "Revoke no longer shows 'Revoking…'"

### E4 — Existing suite and non-functional (spec: NFAC)

- [x] T18 (E4.1/E4.2) Migrated `SharingSection.test.tsx` passes: list rendering, gating matrix, search, invite/revoke flows
- [x] T19 (NFAC Reliability) After a mixed success/failure sequence settles, `myLibraryShares` is refetched and the displayed list equals the server list
- [x] T20 (NFAC Performance) With never-resolving mutation promises, UI updates occur within the same `act` flush
- [x] T21 (NFAC Operability) Pending row exposes `aria-busy`; failure message exposed via `role="alert"`

## Traceability Matrix

| Test | Task | Spec scenario |
| --- | --- | --- |
| T1–T6 | E1 | Shared optimistic list helper (all) |
| T7, T13b | E2.1, E2.4–E2.5 | Pending row appears immediately; Invite no longer locks the input |
| T8 | E2.4 | Invite no longer locks the input |
| T9 | E2.5 | Pending row has no Revoke |
| T10 | E2.6 | Invite failure reverts |
| T11 | E2.3 | Pending row becomes a real row on success |
| T12 | E2.3–E2.4 | Rapid invites |
| T13, T13a | E2.2 | Recipient already listed |
| T14–T16 | E3.2 | Optimistic revoke |
| T17 | E3.3 | Revoke no longer shows "Revoking…" |
| T18 | E4 | Regression |
| T19–T21 | E1–E3 | NFAC Reliability / Performance / Operability |
