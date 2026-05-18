# Collaborative Cookbooks — Implementation Tasks

## Setup

### Task: Create Collaborator model
- [x] Create `src/db/models/collaborator.ts` with `ICollaborator` interface and `Collaborator` model
- [x] Fields: `cookbookId` (ref Cookbook), `userId` (ref User), `role` ('editor' | 'viewer'), `addedAt`, `addedBy` (ref User)
- [x] Indexes: `{ userId: 1 }`, `{ cookbookId: 1 }`, `{ cookbookId: 1, userId: 1 }` (unique)
- [x] Export from `src/db/models/index.ts`

### Task: Add collabCookbookIds to Context
- [x] Update `src/server/trpc/context.ts` `createContext` to query Collaborator for authenticated users
- [x] Populate `collabCookbookIds: string[]` on the context object
- [x] Update `Context` type to include `collabCookbookIds: string[]`
- [x] Add comment explaining the query pattern

### Task: Update visibilityFilter
- [x] Modify `visibilityFilter` signature in `src/server/trpc/routers/_helpers.ts` to accept optional `collabCookbookIds: string[] = []`
- [x] Add third `$or` clause: `{ _id: { $in: collabCookbookIds }, hiddenByTier: { $ne: true } }` when collabCookbookIds is non-empty
- [x] Update all existing call sites to pass `ctx.collabCookbookIds` (grep for `visibilityFilter`)
- [x] Verify existing tests pass with default parameter (backward compatible)

---

## Reconciliation

### Task: Add reconcileCollaborationOnDowngrade
- [x] Create `reconcileCollaborationOnDowngrade(session, userId)` function in `src/lib/reconcile-user-content.ts`
- [x] Query cookbooks owned by user, then delete all Collaborator records where `cookbookId IN [...]`
- [x] Called in `reconcileUserContent` when `direction === 'downgrade' && oldTier === 'executive-chef' && newTier !== 'executive-chef'`
- [x] Add unit test coverage for downgrade path (existing test file: `src/lib/__tests__/reconcile-user-content.test.ts`)

---

## tRPC Procedures

### Task: Add users.search
- [x] New `protectedProcedure` query in `src/server/trpc/routers/users.ts` (create file if it doesn't exist; export from router)
- [x] Input: `{ query: string }` (min 2 chars to avoid full-table scans)
- [x] Search by email prefix OR username/name prefix (case-insensitive regex or $text index)
- [x] Exclude the calling user from results
- [x] Return shape: `Array<{ id: string; name: string; email: string }>`
- [x] Limit results to 10 (UI is a typeahead, not a full directory)

### Task: Update cookbooks.list
- [x] Add `$lookup` to join with Collaborator collection and `$count` for collaboratorCount
- [x] Return shape: add `collaboratorCount: number` to each cookbook entry
- [x] Pass `ctx.collabCookbookIds` to visibilityFilter call

### Task: Update cookbooks.byId
- [x] Add `$lookup` to join with Collaborator collection (populate userId for names)
- [x] Return shape: add `collaborators: Array<{ id, name, role, addedAt }>` to response
- [x] Pass `ctx.collabCookbookIds` to visibilityFilter call

### Task: Add cookbooks.addCollaborator
- [x] New `verifiedProcedure` mutation gated with `tierProcedure('executive-chef')`
- [x] Input: `{ cookbookId, userId, role }`
- [x] Verify caller is owner (cookbook.userId === ctx.user.id)
- [x] Verify target user exists (query user collection)
- [x] Check not already a collaborator (duplicate key error handling)
- [x] Create Collaborator record with `addedBy: ctx.user.id`
- [x] Return `{ success: true }`

### Task: Add cookbooks.removeCollaborator
- [x] New `verifiedProcedure` mutation gated with `tierProcedure('executive-chef')`
- [x] Input: `{ cookbookId, userId }`
- [x] Verify caller is owner
- [x] Delete Collaborator record
- [x] Return `{ success: true }`

### Task: Add cookbooks.myCollaborations
- [x] New `protectedProcedure` query
- [x] Query Collaborator collection for `userId === ctx.user.id`
- [x] Join with Cookbook to get name (and filter hiddenByTier)
- [x] Return `[{ id, name, role }]` array

---

## UI: CookbookCard

### Task: Update CookbookCard props
- [x] Add `collaboratorCount?: number` to `CookbookCardProps.cookbook`
- [x] Add `isCollaborator?: boolean` prop (for future use, not shown in card v1)
- [x] Import `Users` icon from lucide-react

### Task: Render collaborator count in card
- [x] Show `Users` icon + count when `collaboratorCount > 0`
- [x] Position next to owner `User` icon in the icon row
- [x] Style: muted color, smaller than owner icon
- [x] `aria-label` with full text: "{count} collaborator{s}"

---

## UI: CookbookDetail

### Task: Compute accessLevel
- [x] In `CookbookDetailPage`, compute `accessLevel` from `userId`, `cookbook.userId`, `cookbook.collaborators[]`
- [x] `accessLevel: 'owner' | 'editor' | 'viewer'` — all three are reachable; a user who is neither owner nor collaborator cannot reach this page (visibilityFilter blocks byId)

### Task: Gate action buttons by accessLevel
- [x] Edit/Delete cookbook: `accessLevel === 'owner'`
- [x] Invite collaborator button: `accessLevel === 'owner'` (shown in header area)
- [x] Add recipe, New Chapter buttons: `accessLevel === 'owner' || accessLevel === 'editor'`
- [x] Remove recipe (card), Remove button on cards: `accessLevel === 'owner' || accessLevel === 'editor'`
- [x] Rename/Delete chapter: `accessLevel === 'owner' || accessLevel === 'editor'`
- [x] Drag/reorder (owner/editor only — already gated on `isOwner`, needs extension)

### Task: Add collaborators panel
- [x] New collapsible section below cookbook header (above recipe list)
- [x] Shows for all access levels (owner, editor, viewer — all three can reach CookbookDetail)
- [x] Lists all collaborators: name, role, "Invited by [owner name]" (from addedBy lookup)
- [x] Owner sees "Invite" button (opens modal) and "Remove" button per collaborator
- [x] Editor/viewer see list without action buttons

### Task: Add invite modal
- [x] New modal kind: `{ kind: 'inviteCollaborator' }`
- [x] Search user by email or username (text input, debounced query)
- [x] Role selector: Editor / Viewer radio buttons
- [x] Submit calls `cookbooks.addCollaborator` mutation
- [x] On success: invalidate queries, close modal, show success feedback

### Task: Add remove collaborator modal
- [x] New modal kind: `{ kind: 'removeCollaborator'; collaborator }`
- [x] Confirmation dialog: "Remove [name] from this cookbook?"
- [x] Submit calls `cookbooks.removeCollaborator` mutation
- [x] On success: invalidate queries, close modal

### Task: Show shared indicator in header
- [x] Add `Users` icon next to owner `User` icon in cookbook name header
- [x] Shows when `cookbook.collaboratorCount > 0`
- [x] `aria-label`: "Shared with {count} collaborator{s}"`

---

## UI: Cookbooks index page

### Task: Pass collaboratorCount to CookbookCard
- [x] In `src/routes/cookbooks.tsx` (index route), update `CookbookCard` usage to pass `collaboratorCount`
- [x] Also pass `isOwner` (already done) — already in props

---

## Testing

### Task: Unit tests for Collaborator model
- [x] Test schema validation (role enum)
- [x] Test unique constraint behavior

### Task: Unit tests for visibilityFilter
- [x] Test with empty collabCookbookIds (existing behavior)
- [x] Test with populated collabCookbookIds (collaborator clause)

### Task: Unit tests for reconcileCollaborationOnDowngrade
- [x] Add tests to existing `reconcile-user-content.test.ts`

### Task: Unit tests for new tRPC procedures
- [x] Add tests to `cookbooks.test.ts` for addCollaborator, removeCollaborator, myCollaborations

### Task: Component tests for CookbookCard
- [x] Update `CookbookCard.test.tsx` to cover collaboratorCount display
- [x] Test both with and without collaborators

### Task: Component tests for CookbookDetail
- [x] Update `CookbookDetail.test.tsx` to cover collaborators panel
- [x] Test owner/editor/viewer access level scenarios

---

## E2E Tests (optional for v1)

### Task: E2E for invite flow
- [x] As executive-chef user, invite collaborator to cookbook
- [x] Verify collaborator can access cookbook with correct role
- [x] Verify owner can remove collaborator

---

## Cleanup

### Task: Verify TypeScript compilation
- [x] Run `npx tsc --noEmit`
- [x] Fix any type errors

### Task: Run full test suite
- [x] `npm run test` passes
- [x] `npm run test:e2e` passes (if e2e tests added)

### Task: Verify no unused imports
- [x] Run linting, fix any issues (no lint script; tsc --noEmit shows only pre-existing errors unrelated to this change)