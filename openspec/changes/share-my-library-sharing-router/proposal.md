## GitHub Issues

- #672
- Parent epic: #670
- Depends on: #671 (merged, archived as `2026-09-25-share-my-library-foundation`)

## Why

- Problem statement: The `LibraryShare` model, the `visibilityFilter` shared-owner
  clause, and `ctx.sharedOwnerIds` context resolution exist on `main` (PR 1 / #671),
  but there is no way for an Executive Chef to create, list, or revoke a grant. The
  read-path plumbing has nothing to plumb yet.
- Why now: PR 2 of 5 in the sequential decomposition tracked by epic #670. PR 3
  (read-path integration) depends on this router existing.
- Business/user impact: None yet — this PR is server-only and ships dark (no route or
  component references the new procedures). User-visible impact begins at PR 5.

## Problem Space

- Current behavior: No `sharing` tRPC router exists. `LibraryShare` rows can only be
  created directly against MongoDB; there is no authorized write path.
- Desired behavior: An `executive-chef`-tier (or admin) user can grant, list, and
  revoke library shares through `shareLibrary`, `revokeLibraryShare`,
  `myLibraryShares`, and `mySharedLibraries`, each authorized and validated per the
  rejections enumerated in #672.
- Constraints:
  - Must reuse `execChefProcedure` (currently private to `cookbooks.ts:258`) rather
    than re-implementing the tier gate.
  - Must reuse `usersRouter.search` for recipient lookup (already Executive-Chef
    gated and regex-escaped) — no parallel lookup, per the issue's explicit note.
  - Listings must expose **no email and no tier** for either party, and must exclude
    grants whose owner is currently below `executive-chef` — for **both** listings,
    including `myLibraryShares` (grants the caller has given), per design.md
    Decision 2's "live check, no reconciliation" philosophy.
  - Security findings on `sharing.ts` are blocking and must not be waived (stated
    explicitly in #672).
- Assumptions:
  - The root router file is `src/server/trpc/router.ts` (the issue and `tasks.md`
    both say `_app.ts`, which does not exist in this codebase — confirmed during
    exploration). This proposal registers the new router there.
  - `execChefProcedure` can be promoted to `src/server/trpc/routers/_helpers.ts`
    without behavior change, since `_helpers.ts` already imports from `../init` and
    hosts the other shared authorization/visibility primitives
    (`visibilityFilter`, `verifyOwnership`, `userLookupStages`).
- Edge cases considered:
  - Self-share (`recipientId === ctx.user.id`) must be rejected before any DB lookup
    happens against the recipient, since the caller's own id is always "known to
    exist."
  - Duplicate-pair detection should rely on the existing unique
    `(ownerId, recipientId)` index (catch `E11000`, mirroring
    `isDuplicateKeyError()` in `cookbooks.ts:230`) rather than a separate
    existence-check-then-insert, which would leave a TOCTOU race window.
  - `revokeLibraryShare` must distinguish "grant doesn't exist" (`NOT_FOUND`) from
    "grant exists but caller isn't the owner" (`FORBIDDEN`, including when the
    caller is the *recipient*) — a single scoped `deleteOne` can't make that
    distinction, so it needs a fetch-then-check-then-delete shape (mirroring
    `verifyOwnership`).
  - The "exclude grants from an owner below executive-chef" filter needs to run
    identically in `context.ts` (access control) and in both `sharing.ts` listings
    (display) — see design.md's new Decision 8 for how this proposal avoids letting
    that logic drift.

## Scope

### In Scope

- `src/server/trpc/routers/sharing.ts` — new router with `shareLibrary`,
  `revokeLibraryShare`, `myLibraryShares`, `mySharedLibraries`.
- Registering `sharingRouter` on `appRouter` in `src/server/trpc/router.ts`.
- Promoting `execChefProcedure` out of `cookbooks.ts` into
  `src/server/trpc/routers/_helpers.ts` and updating `cookbooks.ts`'s import.
- A new shared helper in `_helpers.ts` for the "$lookup owner, filter to
  `SHARING_OWNER_TIER`" aggregation fragment, reused by `context.ts`'s
  `sharedOwnerIds` resolution and by both `sharing.ts` listing procedures.
- Integration tests for all four procedures per the TDD checklist in #672.

### Out of Scope

- Any change to `visibilityFilter`, `ctx.sharedOwnerIds`, or the `LibraryShare`
  model itself (already shipped in #671).
- Read-path integration (`sharedBy` on recipe/cookbook payloads, cross-owner
  cookbook entries) — PR 3 / #673.
- Any UI — PRs 4 and 5 / #674, #675.

## What Changes

- New file `src/server/trpc/routers/sharing.ts`.
- `src/server/trpc/router.ts` gains a `sharing: sharingRouter` entry.
- `src/server/trpc/routers/cookbooks.ts` loses its private `execChefProcedure`
  definition, importing it from `_helpers.ts` instead — no behavior change.
- `src/server/trpc/routers/_helpers.ts` gains `execChefProcedure` and a new shared
  aggregation-stage helper for the owner-tier-eligibility filter.
- `src/server/trpc/context.ts` is updated to call the new shared helper instead of
  inlining the same pipeline fragment (behavior-preserving refactor).

## Risks

- Risk: Promoting `execChefProcedure` could subtly change its behavior for the
  existing collaboration procedures in `cookbooks.ts` if the move isn't a pure
  cut-paste.
  - Impact: Regression in an already-shipped, unrelated feature (Collaboration).
  - Mitigation: Move the function verbatim; run the full existing `cookbooks.ts`
    integration suite unchanged before and after the move to confirm zero diff in
    behavior.
- Risk: Refactoring `context.ts`'s inline aggregation into a shared helper touches
  code that is on the hot path of every authenticated request.
  - Impact: A subtle behavioral change here would silently break access control
    for the already-shipped foundation feature.
  - Mitigation: Extract the helper as a pure pipeline-stage-array function with no
    behavior change, and re-run `context.ts`'s existing test coverage (grant →
    visible, downgrade → invisible, re-upgrade → visible again) before adding new
    call sites.
- Risk: Security findings on an authorization-boundary file (`sharing.ts`) are
  explicitly called out as blocking and non-waivable in #672.
  - Impact: A rushed implementation could ship a bypassable grant/revoke check.
  - Mitigation: `pr-review-toolkit:review-pr` gate is required per
    `openspec/changes/share-my-library/tasks.md`'s ownership metadata; do not
    self-merge.

## Open Questions

None blocking. Two judgment calls were made explicitly rather than left open,
carried over from the `/opsx:explore` session that preceded this proposal (the user
instructed to proceed directly into proposal mode afterward):

- `execChefProcedure` promotion location: resolved as `_helpers.ts` (see Assumptions).
- Owner-tier-filter duplication between `context.ts` and the two listing procedures:
  resolved as a shared helper (see What Changes; captured as design.md Decision 8).

## Non-Goals

- Not changing the `LibraryShare` schema or its indexes.
- Not adding a `role` concept to shares (already decided against in
  `openspec/changes/share-my-library/design.md` Decision 1).
- Not touching any read-path visibility logic beyond the pure refactor described
  above.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
