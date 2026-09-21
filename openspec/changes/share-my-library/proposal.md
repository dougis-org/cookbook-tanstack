## GitHub Issues

- #668 (primary)
- #669 (print view impact — follow-up, out of scope)

## Why

- Problem statement: Executive Chef subscribers can share a cookbook at a time via
  Collaboration (#420), but there is no way to give a trusted person read access to an
  entire private library. A user who wants to let a partner, family member, or co-cook
  browse everything they have must invite them cookbook-by-cookbook, and private
  *recipes* that live outside any cookbook cannot be shared at all.
- Why now: Collaboration shipped the invite plumbing (`Collaborator`, `users.search`,
  invite modal, downgrade reconciliation) that this feature can build on directly.
  Doing it now reuses that groundwork instead of re-deriving it later.
- Business/user impact: Adds a second concrete Executive Chef capability with a
  different shape from Collaboration — Collaboration is about *co-authoring one book*,
  Share My Library is about *granting visibility to a whole collection*. The sharing
  user pays for the tier; recipients need no subscription, which makes shared access a
  natural funnel into the product for the recipient.

## Problem Space

- Current behavior:
  - Recipes and cookbooks are visible to others only when `isPublic: true`.
  - Private content (`isPublic: false`) is visible to its owner alone.
  - The single exception is Collaboration: an Executive Chef owner invites specific
    users to a specific cookbook with an `editor` or `viewer` role, recorded in the
    `Collaborator` collection and surfaced through `ctx.collabCookbookIds`.
  - A cookbook's `recipes[]` entries are always, in practice, recipes owned by the
    cookbook's own owner. Nothing in the schema enforces this, but nothing exercises
    the cross-owner case either.
- Desired behavior:
  - An Executive Chef owner can grant named users read-only access to their **entire**
    library — every private recipe and every cookbook they own, present and future.
  - Recipients see that content mixed into their normal recipe and cookbook lists,
    marked with a "Shared with me" badge so provenance is never ambiguous.
  - Recipients can add a shared recipe into **their own** cookbook, producing a
    cookbook entry that references a recipe owned by somebody else.
  - Recipients can never edit, delete, or re-share the owner's content.
  - Access is dynamic: content the owner adds later is automatically included, and
    revoking the share (or the owner dropping below Executive Chef) removes access
    immediately.
- Constraints:
  - Only Executive Chef owners may share. Recipients need no particular tier — any
    signed-in user is eligible, because the benefit is purchased by the sharer.
  - Read-only must be structural, not a new permission layer bolted on: existing
    mutations authorize via `verifyOwnership` / `verifyCookbookOwner`, which compare
    `doc.userId` to the caller. A recipient never satisfies that comparison, so
    write paths stay closed with no new gate.
  - Sharing must not interact with tier limits. A shared recipe is not the
    recipient's document and must not count against their recipe or cookbook quota,
    consistent with the Collaboration precedent.
  - `hiddenByTier: true` content stays invisible to everyone including the owner;
    sharing must not become a way to surface tier-hidden documents.
  - Sharing and Collaboration are independent. Being a shared-library recipient grants
    no edit rights on any cookbook, and being a cookbook collaborator grants no access
    to the rest of the owner's library.
- Assumptions:
  - Share grants are account-wide and role-less. There is exactly one level of access
    (read), so the `Collaborator`-style `role` field has no analogue here.
  - Already-public content is unaffected — it is visible to everyone regardless, so
    the new visibility clause only changes what a recipient sees for private content.
  - `users.search` is already gated to Executive Chef callers, which matches exactly
    the population allowed to initiate a share. It is reusable as-is.
- Edge cases considered:
  - Owner downgrades from Executive Chef → all their shares stop granting access
    immediately, without deleting the grant rows (see design: live tier check).
  - Owner re-upgrades to Executive Chef → previously created grants become effective
    again, because rows were never deleted.
  - Recipient added a shared recipe to their own cookbook, then the share ends → the
    cookbook entry remains but renders as unavailable; ordering and chapter layout
    are preserved.
  - Owner soft-deletes a recipe a recipient had referenced → the existing soft-delete
    middleware already excludes it from reads; it presents as unavailable by the same
    path as a revoked share.
  - Owner shares with a user who later deletes their account → grant row is orphaned
    but inert; it grants access to nobody.
  - Self-share (owner adds themselves as recipient) must be rejected.
  - Duplicate grant for the same `(ownerId, recipientId)` pair must be rejected by a
    unique index rather than silently creating a second row.
  - A recipient who is *also* a collaborator on one of the owner's cookbooks sees the
    union of both grants; the cookbook is editable via the collaborator role and the
    rest of the library is read-only.

## Scope

### In Scope

- New `LibraryShare` MongoDB collection: `{ ownerId, recipientId, addedAt, addedBy }`,
  unique on `(ownerId, recipientId)`.
- Context augmentation: `ctx.sharedOwnerIds` — owners who currently share with the
  caller, computed per request and filtered to owners whose tier is still
  Executive Chef.
- `visibilityFilter()` gains a `sharedOwnerIds` parameter adding an `$or` clause so
  recipes and cookbooks owned by a sharing owner become readable.
- tRPC procedures on a new `sharing` router: `shareLibrary`, `revokeLibraryShare`,
  `myLibraryShares` (grants I have given), `mySharedLibraries` (grants I have
  received).
- `recipes.list` / `recipes.byId` / `cookbooks.list` / `cookbooks.byId` gain a
  `sharedBy: { id, name } | null` field for the "Shared with me" badge.
- Cross-owner cookbook entries: recipients may add a shared recipe to their own
  cookbook; the entry resolves against live share state and renders as unavailable
  when the share ends.
- New "Sharing & Collaboration" section on the account page (`src/routes/account.tsx`)
  that manages **both** library shares and existing cookbook collaborators in one
  place.
- Tier gating: only Executive Chef owners may create or hold active shares.

### Out of Scope

- Print view attribution for shared content (#669).
- Notifications or email alerts when a share is created or revoked.
- Invite-by-email for users who do not yet have an account.
- Write or edit access of any kind for recipients — this is read-only by definition.
- Re-sharing: a recipient cannot share the owner's library onward.
- Granular or partial sharing (specific cookbooks, tags, or subsets). Collaboration
  already covers per-cookbook granularity.
- Migrating or reworking the existing `Collaborator` feature. The account section
  surfaces it alongside sharing but does not change its behavior.
- Any change to tier limits or pricing.

## What Changes

### Data Model

- `src/db/models/library-share.ts` — new `ILibraryShare` interface and model.
- `src/db/models/index.ts` — export `LibraryShare`.
- No schema changes to `Recipe` or `Cookbook`. Cross-owner entries and the
  "unavailable" state are derived at read time, not persisted.

### Server

- `src/server/trpc/context.ts` — add `sharedOwnerIds`, resolved by joining
  `LibraryShare` rows for the caller against each owner's current tier.
- `src/server/trpc/routers/_helpers.ts` — `visibilityFilter` gains a third parameter
  and a fourth `$or` clause.
- `src/server/trpc/routers/sharing.ts` — new router (`shareLibrary`,
  `revokeLibraryShare`, `myLibraryShares`, `mySharedLibraries`).
- `src/server/trpc/routers/_app.ts` — register the `sharing` router.
- `src/server/trpc/routers/recipes.ts` — pass `sharedOwnerIds` to `visibilityFilter`;
  add `sharedBy` to list/byId payloads; allow adding a shared recipe to an owned
  cookbook.
- `src/server/trpc/routers/cookbooks.ts` — pass `sharedOwnerIds` to
  `visibilityFilter`; add `sharedBy`; resolve cross-owner recipe entries and mark
  unavailable ones.

### UI

- `src/components/account/SharingSection.tsx` — new section managing library shares
  (invite via `users.search`, list grantees, revoke) and listing existing cookbook
  collaborations.
- `src/routes/account.tsx` — render `SharingSection`.
- `src/components/recipes/RecipeCard.tsx` — "Shared with me" badge.
- `src/components/cookbooks/CookbookCard.tsx` — "Shared with me" badge.
- Recipe and cookbook detail views — hide edit/delete affordances for shared content,
  show owner attribution.
- Cookbook detail — render unavailable cross-owner entries as a placeholder.

## Risks

- Risk: `visibilityFilter` signature changes again, cascading to every call site.
  - Impact: Any missed call site silently keeps the old visibility behavior, so
    shared content fails to appear rather than failing loudly.
  - Mitigation: New parameter defaults to `[]`, preserving current behavior; TypeScript
    catches signature mismatches; an explicit task enumerates every call site.

- Risk: Per-request tier join in context creation slows every authenticated request.
  - Impact: One extra lookup on top of the existing `Collaborator` query.
  - Mitigation: Single indexed query returning only `ownerId`; skipped entirely when
    the caller has no share rows. Accepted for correctness — it is what makes
    downgrade revocation instant without a reconciliation job.

- Risk: Cross-owner cookbook entries break code that assumes a cookbook's recipes are
  all owned by the cookbook owner.
  - Impact: Print views, exports, or aggregation pipelines could leak a recipe the
    viewer may not see, or crash on an unresolvable reference.
  - Mitigation: Every read path that resolves `recipes[]` must filter through
    visibility; an explicit task audits all consumers. Print is deferred to #669 and
    must not ship cross-owner entries until that issue is resolved.

- Risk: A recipient retains visibility after revocation via a cached client payload.
  - Impact: Stale UI briefly shows content the user no longer has rights to.
  - Mitigation: Authorization is enforced server-side on every request; a stale client
    cache cannot fetch new data. Revocation invalidates the relevant queries.

- Risk: Sharing becomes a privacy surprise — users may not expect "share everything"
  to include recipes they consider sensitive.
  - Impact: Reputational / trust damage from unintended disclosure.
  - Mitigation: The share action must state plainly that it covers the entire library
    including all future content, and the grantee list must always be visible in
    account settings.

## Open Questions

No unresolved ambiguity. All decisions were confirmed during the explore session that
preceded this proposal:

- Recipient scope: specific invited users, not a public toggle or link.
- Recipient tier floor: none — any signed-in user may receive a share.
- Revocation on downgrade: live tier check at request time, no reconciliation job and
  no row deletion.
- Orphaned cross-owner entries: keep the cookbook slot, render as unavailable.
- Placement: a single "Sharing & Collaboration" account section covering both
  library shares and cookbook collaborators.
- Naming: "Share My Library" as the user-facing name; `LibraryShare` as the model.
- Print impact: deferred to #669, filed as part of this design work.

## Non-Goals

- Replacing or deprecating cookbook Collaboration.
- Any form of write access for recipients.
- Transitive or onward re-sharing.
- Notification, email, or invite-a-non-user flows.
- Real-time presence or activity feeds for shared libraries.
- Partial or selective library sharing.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
