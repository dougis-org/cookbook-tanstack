## GitHub Issues

- #671 (primary — "Share My Library 1/5: LibraryShare model, visibility filter, and
  request context")
- #670 (parent epic — Share My Library)
- #677 (related, not addressed here — `collabCookbookIds` fail-closed retrofit)

## Why

- Problem statement: The Share My Library epic (#670) needs an account-wide,
  read-only visibility grant before any of its four downstream PRs (router, read-path
  integration, content UI, account section) can exist. Nothing in the current schema
  or request pipeline can express "user B may read everything user A owns."
- Why now: This is PR 1 of 5 in the epic's delivery plan and has no dependency on any
  other unmerged work — it is the first item that can start.
- Business/user impact: No user-visible impact on its own (this PR ships dark). It
  unblocks #672-#675, which together deliver the epic's user-facing capability.

## Problem Space

- Current behavior:
  - `visibilityFilter(user, collabCookbookIds)` in `src/server/trpc/routers/_helpers.ts`
    returns a three-clause `$or`: public, owned, and (since Collaboration) a specific
    set of collaborated-on cookbook ids. It has no notion of "everything another user
    owns."
  - `src/server/trpc/context.ts` resolves `collabCookbookIds` per request via a single
    `Collaborator.find()` query, with no error handling — a query failure fails the
    whole request.
  - Tier (`tier`) lives on the Better-Auth `user` collection, reached only through the
    raw driver (`getBetterAuthCollection`), never as a Mongoose model. No code path
    today joins a Mongoose collection against that raw collection in a single
    aggregation *for authorization purposes* — the only precedent
    (`fetchCollaboratorsWithUsers` in `src/server/trpc/routers/cookbooks.ts`) joins it
    purely for display names, not for a tier-based access decision.
  - `userLookupStages(localField, alias)` (`cookbooks.ts:229`), the `$lookup`+`$unwind`
    helper that makes that join possible, is module-private to `cookbooks.ts`.
- Desired behavior:
  - A new `LibraryShare` collection records `{ ownerId, recipientId, addedAt, addedBy }`
    grants.
  - `ctx.sharedOwnerIds` resolves, per request, the set of owners currently sharing
    with the caller — filtered to owners whose tier is Executive Chef *right now*, not
    at grant time.
  - `visibilityFilter` gains a fourth `$or` clause so content owned by any id in
    `sharedOwnerIds` becomes visible, subject to the same `hiddenByTier` exclusion as
    every other clause.
- Constraints:
  - The owner-tier check must cost exactly one additional query, not two. This is an
    explicit NFAC in the epic's spec (`specs/library-sharing/spec.md`), not a
    nice-to-have.
  - Grants must never be deleted on downgrade — the live tier check is what makes
    re-upgrade restore access with no data migration (epic design Decision 2). This is
    a deliberate asymmetry with `Collaborator`, which Collaboration deletes on
    downgrade via `reconcileCollaborationOnDowngrade()`.
  - `visibilityFilter`'s new parameter must default to `[]` so every existing call
    site keeps its current behavior with zero code changes — call-site threading is
    explicitly deferred to a later PR (#673), not this one.
- Assumptions:
  - `userLookupStages` can be safely relocated and exported without behavior change,
    because it is a pure function with no closure over `cookbooks.ts` state.
  - The existing `Collaborator`-style unique-index and lean-projection patterns
    generalize directly to `LibraryShare`.
- Edge cases considered:
  - Caller holds zero grants: `sharedOwnerIds` must be `[]` **and** the aggregation
    must not run at all — not run-and-return-empty.
  - Owner downgraded below Executive Chef: grant row persists, `sharedOwnerIds`
    excludes that owner on the very next request.
  - Owner re-upgraded: same grant row becomes effective again with no re-grant.
  - Owner-tier lookup itself throws or times out: must degrade to `[]`
    (fail closed on access), not propagate and fail the whole request
    (fail open on availability) — this is the opposite failure mode from the adjacent
    `collabCookbookIds` block, which still throws. That inconsistency is real and is
    tracked separately in #677, not resolved here.
  - Invalid ObjectId strings reaching `visibilityFilter`'s new parameter must be
    discarded, not passed to Mongo (matching the existing `collabCookbookIds` handling).

## Scope

### In Scope

- `src/db/models/library-share.ts` — new `ILibraryShare` model: `ownerId`,
  `recipientId`, `addedAt`, `addedBy`; indexes on `ownerId`, on `recipientId`, unique
  on `(ownerId, recipientId)`; a comment recording why downgrade does not delete rows.
- `src/db/models/index.ts` — export `LibraryShare`.
- `src/server/trpc/routers/_helpers.ts`:
  - Fourth `$or` clause on `visibilityFilter`, gated by a new `sharedOwnerIds: string[]
    = []` parameter.
  - Relocate `userLookupStages(localField, alias)` here from `cookbooks.ts`, exported.
- `src/server/trpc/routers/cookbooks.ts` — update its two `userLookupStages` call
  sites to import from `_helpers.ts`; remove the now-dead private copy.
- `src/server/trpc/context.ts` — new `sharedOwnerIds` resolution: a single
  `LibraryShare.aggregate()` using the relocated `userLookupStages`, filtered to
  owners whose current tier is `executive-chef`, wrapped to degrade to `[]` on
  failure. Skipped entirely when the caller has no grant rows.

### Out of Scope

- The `sharing` tRPC router (`shareLibrary`, `revokeLibraryShare`, listings) — #672.
- Threading `sharedOwnerIds` into `recipes.ts` / `cookbooks.ts` list/byId call sites,
  `sharedBy` payload fields, cross-owner cookbook entries, and the read-only mutation
  sweep — #673.
- Any UI — #674, #675.
- Retrofitting `collabCookbookIds` to fail closed — #677.
- Print-view impact — #669.

## What Changes

- New collection `library-shares`, indexed and unique on `(ownerId, recipientId)`.
- `visibilityFilter` signature: `(user, collabCookbookIds = [], sharedOwnerIds = [])`.
- `Context` type gains `sharedOwnerIds: string[]`.
- `userLookupStages` moves from a `cookbooks.ts`-private function to an exported
  member of `_helpers.ts`; `cookbooks.ts` imports it instead of defining it.

## Risks

- Risk: The `LibraryShare` → `user` aggregation join is a pattern with only one prior
  instance in the codebase (`fetchCollaboratorsWithUsers`), and that instance was
  built for display, not for an authorization decision.
  - Impact: A subtly wrong `$match` ordering (e.g. filtering on `_owner.tier` before
    the `$unwind` fully resolves) could silently admit or exclude owners incorrectly —
    a security-relevant bug that unit tests must catch before this reaches PR 3, where
    it starts gating real read access.
  - Mitigation: Task-level tests assert the exact query shape (one round trip) and the
    tier-filtering behavior directly, independent of PR 3's read-path tests.

- Risk: Relocating `userLookupStages` touches `cookbooks.ts`, a file this PR would
  otherwise have no reason to open.
  - Impact: A mistake in the relocation could regress Collaboration's collaborator-name
    display, which is unrelated to this feature.
  - Mitigation: `cookbooks.ts`'s existing collaborator-aggregation tests must pass
    unchanged after the move; this is an explicit acceptance criterion, not an
    assumption.

- Risk: The fail-closed wrapping on `sharedOwnerIds` and the fail-open (throwing)
  behavior of the adjacent `collabCookbookIds` block create two visibly different
  error-handling styles in the same function.
  - Impact: A future maintainer extending `context.ts` may copy the wrong pattern.
  - Mitigation: A code comment on the `sharedOwnerIds` block explains the asymmetry
    and points to #677, which tracks resolving it deliberately.

- Risk: This PR ships dark — no automated check today verifies that a merged-but-unused
  capability stays unreachable until PR 3-5 land.
  - Impact: Low; `visibilityFilter`'s new parameter defaults to `[]` and no caller
    passes anything else yet, so there is no code path by which this PR alone changes
    observable behavior.
  - Mitigation: The regression test asserting call-site behavior is unchanged when the
    parameter is omitted covers this directly.

## Open Questions

No unresolved ambiguity. Both implementation-level questions this PR raised were
resolved during the explore session that preceded this proposal:

- Question: Should `ctx.sharedOwnerIds` cost one query or two (grants, then tier)?
  - Needed from: n/a — resolved. One aggregation via a relocated `userLookupStages`.
  - Blocker for apply: no.
- Question: Should the `collabCookbookIds` block also be made fail-closed for
  consistency with the new `sharedOwnerIds` block?
  - Needed from: n/a — resolved. Deferred to #677; this PR only comments the
    asymmetry, it does not touch `collabCookbookIds`'s behavior.
  - Blocker for apply: no.

## Non-Goals

- Changing `Collaborator` or `collabCookbookIds` behavior in any way.
- Building the grant/revoke mutation surface (#672).
- Making any content actually reachable by a recipient (#673-#675 do that).
- Optimizing beyond "one additional query" — no caching layer, no denormalization.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
