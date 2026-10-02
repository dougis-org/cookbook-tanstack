## Context

- Relevant architecture:
  - `src/components/account/SharingSection.tsx` → `SharesIGiveList` owns invite (`sharing.shareLibrary`) and revoke (`sharing.revokeLibraryShare`) mutations and reads `sharing.myLibraryShares`.
  - Precedent: `src/components/recipes/PrivateRecipeNotes.tsx` `upsertMutation` (cancel → snapshot → set → rollback → invalidate).
  - tRPC via `@trpc/tanstack-react-query` (`trpc.x.y.mutationOptions()` / `.queryKey()`), TanStack Query v5.
- Dependencies: `@tanstack/react-query` (`QueryClient.cancelQueries/getQueryData/setQueryData/invalidateQueries/isMutating`).
- Interfaces/contracts touched: none on the server. New internal helper module `src/lib/optimisticListMutation.ts`. `SharesIGiveList` UI behavior (pending rows, enabled input).

## Goals / Non-Goals

### Goals

- Immediate, rollback-safe optimistic invite and revoke in `SharesIGiveList`.
- Pending rows are visibly distinct and cannot be revoked.
- Rapid-fire invites with the search input enabled.
- A reusable helper with its own unit tests.

### Non-Goals

- Collaborator add/remove retrofit (follow-up).
- Server changes; new global optimistic framework.

## Decisions

### Decision 1: Shared helper builds mutation callbacks from `apply` + `revert`

- Chosen: `optimisticListMutation({ queryClient, queryKey, mutationKey, apply, revert })` returns `{ onMutate, onError, onSettled }` to spread into `mutationOptions`. `onMutate` cancels in-flight queries for `queryKey`, calls `apply(list, vars)` via `setQueryData`, and returns a context (anything `apply` wants to hand to `revert`, e.g. the removed row + index). `onError` calls `revert(currentList, vars, context)` via `setQueryData`. `onSettled` invalidates `queryKey` only when no *other* mutation with `mutationKey` is in flight.
- Alternatives considered: (a) inline snapshot/restore per mutation as in `PrivateRecipeNotes`; (b) whole-snapshot rollback in the helper; (c) always invalidate on settle.
- Rationale: user chose a shared helper. Inverse-based rollback is correct under concurrency; whole-snapshot restore is not (see Decision 4).
- Trade-offs: slightly more API surface than inline code; `PrivateRecipeNotes` stays on its own inline snapshot (single-value cache, no concurrency) and is not migrated.

### Decision 2: Optimistic invite row uses a temp id and a pending marker

- Chosen: row `{ id: "optimistic-<recipientId>", recipientId, recipientName: user.name || user.email, addedAt: new Date().toISOString() }`. A row is *pending* iff `id.startsWith("optimistic-")` (exported predicate `isOptimisticShareId`). If the recipient already has a row (real or pending) `apply` leaves the list unchanged.
- Alternatives considered: separate `pending` field on the row; separate React state list merged at render.
- Rationale: the cache holds one list; the id prefix needs no schema change and survives rollback/merge logic. The predicate keeps the magic string in one place.
- Trade-offs: string-prefix convention; mitigated by a single exported predicate and tests.

### Decision 3: Pending rows render dimmed, labelled "Sharing…", with no Revoke control

- Chosen: pending `<li>` gets `aria-busy="true"`, `opacity-60`, a "Sharing…" label in place of the date, and no Revoke button.
- Alternatives considered: render a disabled Revoke button.
- Rationale: there is no real `shareId` to send; removing the control removes the failure mode. Matches the existing "Sharing…" copy and design-system motion rules (`transition-colors`/opacity only, no skeletons).
- Trade-offs: layout shift when the Revoke button appears on settle; the button slot is small and the row keeps its height.

### Decision 4: Inverse rollback, not snapshot restore; guarded invalidation

- Chosen: invite `revert` removes the row with the temp id; revoke `revert` re-inserts the removed row at its original index (clamped). `onSettled` invalidates only if `queryClient.isMutating({ mutationKey }) <= 1` (this mutation still counts itself during `onSettled`; the exact threshold is pinned by a helper unit test against the installed TanStack Query version).
- Alternatives considered: restore the pre-mutation snapshot on error; invalidate unconditionally.
- Rationale: with rapid invites, restoring invite #1's snapshot would erase invite #2's optimistic row; unconditional invalidation lets a refetch from invite #1 wipe invite #2's pending row before the server has it.
- Trade-offs: `apply`/`revert` must be written as a pair; covered by helper tests.

### Decision 5: Invite input stays enabled; cleared immediately

- Chosen: `handleSelect` clears `searchInput`/`debouncedSearch` synchronously and calls `inviteMutation.mutate`. Remove `disabled={inviteMutation.isPending}` from the input and result buttons, and the global "Sharing…" paragraph under the input (pending rows carry the state).
- Alternatives considered: keep the lock while the request is in flight; keep the input populated with the chosen name.
- Rationale: user requirement ("free for rapid invites"). Per-row pending state replaces the global spinner text.
- Trade-offs: `isPending`/`variables` of a single `useMutation` no longer describe all in-flight invites, so UI state derives from the cache (pending rows), not from mutation state.

### Decision 6: Revoke uses the same helper; per-row disabled/"Revoking…" removed

- Chosen: revoke `apply` filters the row out and returns `{ row, index }`; `revert` re-inserts it. The old `revokeMutation.isPending && variables.shareId` gating is removed, since the row is gone while in flight.
- Alternatives considered: keep the row dimmed "Revoking…" until settle (not optimistic).
- Rationale: matches issue #688 ("optimistic remove").
- Trade-offs: a failed revoke makes the row reappear; the error banner explains why.

### Decision 7: Errors name the recipient; latest failure wins

- Chosen: `inviteError` becomes `Unable to share your library with <name>. Try again.` (or the server message if present, prefixed likewise); cleared on the next invite attempt or success. `revokeError` unchanged in shape, naming the recipient when known.
- Alternatives considered: error list; toast system (none exists in repo).
- Rationale: the row vanishes on failure and the input was cleared, so the message must say who failed.
- Trade-offs: with several simultaneous failures only the last is shown.

### Decision 8: Test approach — real `QueryClient` for optimistic behavior

- Chosen: new optimistic tests render `SharesIGiveList` inside a real `QueryClientProvider` with `@/lib/trpc` mocked so `mutationOptions(opts)` returns `{ mutationFn, ...opts }` and `queryOptions` returns a keyed `queryFn` over a controllable in-memory list. The existing mock-only tests are migrated where the old `useQueryClient` stub (`invalidateQueries` only) no longer suffices.
- Alternatives considered: extend the `useMutation` mock to call `onMutate`/`onError` by hand.
- Rationale: hand-driving callbacks tests the mock, not the cache behavior.
- Trade-offs: slightly heavier test setup; helper tests (`QueryClient` only) stay fast.

## Proposal to Design Mapping

- Proposal element: Optimistic invite with pending row
  - Design decision: 2, 3
  - Validation approach: component test — row appears synchronously, `aria-busy`, no Revoke
- Proposal element: Optimistic revoke
  - Design decision: 6
  - Validation approach: component test — row removed synchronously; reappears on forced error
- Proposal element: Free input for rapid invites
  - Design decision: 5
  - Validation approach: component test — input enabled and cleared while an invite is pending; second invite fires
- Proposal element: Shared helper
  - Design decision: 1, 4
  - Validation approach: helper unit tests with real `QueryClient`
- Proposal element: Concurrency edge cases
  - Design decision: 4
  - Validation approach: helper + component tests for overlapping invites/revokes and guarded invalidation
- Proposal element: Error clarity after row vanishes
  - Design decision: 7
  - Validation approach: component test — error text contains recipient name
- Proposal element: Updating existing tests
  - Design decision: 8
  - Validation approach: full `SharingSection` suite green

## Functional Requirements Mapping

- Requirement: Invite shows an immediate pending row and keeps input free
  - Design element: Decisions 2, 3, 5
  - Acceptance criteria reference: specs/library-sharing-optimistic-ui — "Optimistic invite", "Rapid invites"
  - Testability notes: synchronous assertions after click, before the mocked mutation resolves
- Requirement: Failed invite reverts and reports
  - Design element: Decisions 4, 7
  - Acceptance criteria reference: "Invite failure reverts"
  - Testability notes: mocked `mutationFn` rejects; assert row gone + alert text
- Requirement: Revoke removes immediately and reverts on failure
  - Design element: Decisions 4, 6
  - Acceptance criteria reference: "Optimistic revoke", "Revoke failure reverts"
  - Testability notes: same pattern
- Requirement: Pending rows cannot be revoked
  - Design element: Decision 3
  - Acceptance criteria reference: "Pending row has no Revoke"
  - Testability notes: `queryByRole('button', { name: /revoke/i })` within the pending row is null
- Requirement: Overlapping mutations do not corrupt the list
  - Design element: Decision 4
  - Acceptance criteria reference: "Overlapping invites", "Overlapping revokes"
  - Testability notes: two deferred promises resolved/rejected in opposite order

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Final list state always equals server state after all mutations settle
  - Design element: Decision 4 (guarded invalidate)
  - Acceptance criteria reference: NFAC Reliability
  - Testability notes: after all deferreds settle, `myLibraryShares` refetch is observed
- Requirement category: operability
  - Requirement: Helper is reusable for other list mutations
  - Design element: Decision 1
  - Acceptance criteria reference: NFAC Operability
  - Testability notes: helper tests are independent of sharing types (generic list items)
- Requirement category: accessibility
  - Requirement: Pending state exposed to assistive tech; error announced
  - Design element: Decisions 3, 7 (`aria-busy`, existing `role="alert"`)
  - Acceptance criteria reference: NFAC Operability/Accessibility
  - Testability notes: query by role/attribute
- Requirement category: security
  - Requirement: No change to authorization; temp id never sent to server
  - Design element: Decision 3
  - Acceptance criteria reference: See functional scenario "Pending row has no Revoke"
  - Testability notes: n/a (server unchanged; existing router tests cover authz)

## Risks / Trade-offs

- Risk/trade-off: `isMutating` threshold off-by-one in a given TanStack Query version
  - Impact: refetch skipped forever or fired too early
  - Mitigation: helper unit test pins the behavior against the installed version
- Risk/trade-off: Optimistic `addedAt` is client clock
  - Impact: brief date mismatch vs server
  - Mitigation: pending rows show "Sharing…" instead of the date; real date appears after refetch
- Risk/trade-off: Two optimistic conventions in the repo (`PrivateRecipeNotes` inline vs helper)
  - Impact: mild inconsistency
  - Mitigation: documented in Decision 1; migration deferred

## Rollback / Mitigation

- Rollback trigger: user-visible list corruption or flicker reported after release.
- Rollback steps: revert the PR (single component + new helper + tests); the previous pending-state UI is restored with no data implications.
- Data migration considerations: none (client-only; server unchanged).
- Verification after rollback: `SharingSection` tests from before the change pass; manual invite/revoke on the account page.

## Operational Blocking Policy

- If CI checks fail: fix, validate locally, push, re-run; do not enable auto-merge or use `--admin`.
- If security checks fail: remediate before any further push; re-scan.
- If required reviews are blocked/stale: re-request review once after 24h; then escalate to the repo owner.
- Escalation path and timeout: after 3 review-fix iterations with no progress, stop and report remaining findings to the user.

## Open Questions

- None. (Collaborator retrofit is a tracked follow-up, not an open question for this change.)
