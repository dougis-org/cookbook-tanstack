# Collaborative Cookbooks — Test Plan

This document maps requirements to test cases. Unit tests live alongside implementation files (`__tests__/` directories). E2E tests live in `src/e2e/`.

## Unit Test Coverage

### `src/db/models/__tests__/` (new)

**`collaborator.test.ts`**
- `should allow valid role values (editor, viewer)`
- `should reject invalid role values`
- `should enforce unique constraint on (cookbookId, userId)`
- `should set addedAt automatically`
- `should require cookbookId, userId, addedBy`

### `src/server/trpc/routers/__tests__/users.test.ts` (new or extend existing)

**`users.search`**
- `returns matching users by email prefix`
- `returns matching users by name prefix`
- `excludes the calling user from results`
- `returns empty array when no match found`
- `returns at most 10 results`
- `requires query of at least 2 characters`
- `unauthenticated caller receives UNAUTHORIZED`

### `src/server/trpc/routers/__tests__/cookbooks.test.ts` (extend existing)

**`addCollaborator`**
- `authenticated executive-chef owner can add editor collaborator`
- `authenticated executive-chef owner can add viewer collaborator`
- `authenticated non-executive-chef owner receives FORBIDDEN`
- `non-owner (editor) receives FORBIDDEN`
- `non-owner (viewer) receives FORBIDDEN`
- `cannot add duplicate collaborator (unique constraint error)`
- `target user does not exist → NOT_FOUND`

**`removeCollaborator`**
- `owner can remove collaborator`
- `editor collaborator receives FORBIDDEN`
- `viewer collaborator receives FORBIDDEN`
- `removing non-existent collaborator is a no-op (success: true)`

**`myCollaborations`**
- `returns all cookbooks where user is collaborator with correct role`
- `excludes cookbooks where user is owner (owner is not a collaborator)`
- `excludes cookbooks with hiddenByTier: true`
- `returns empty array when user has no collaborations`

**`list` (extend existing)**
- `returns collaboratorCount for each cookbook`

**`byId` (extend existing)**
- `returns collaborators array for cookbook with collaborators`
- `returns empty collaborators array for cookbook with no collaborators`
- `collaborators includes id, name, role, addedAt`

### `src/server/trpc/routers/__tests__/_helpers.test.ts` (extend existing)

**`visibilityFilter`**
- `null user → public only`
- `authenticated user, no collaborations → owner + public`
- `authenticated user, with collaborations → owner + public + collaborator cookbooks`
- `collaborator cannot see cookbooks with hiddenByTier: true`

### `src/lib/__tests__/reconcile-user-content.test.ts` (extend existing)

**`reconcileUserContent downgrade from executive-chef`**
- `deletes all collaborators on owned cookbooks`
- `does NOT delete collaborators when downgrading from non-executive-chef tier`

### `src/components/cookbooks/__tests__/CookbookCard.test.tsx` (extend existing)

- `shows collaborator count with Users icon when collaboratorCount > 0`
- `does not show collaborator indicator when collaboratorCount is 0 or undefined`
- `shows owner User icon and collaborator Users icon when both isOwner and collaboratorCount > 0`

### `src/routes/__tests__/cookbooks.$cookbookId.test.tsx` (new or extend existing)

**`accessLevel computation`**
- `owner sees correct accessLevel ('owner')`
- `editor collaborator sees correct accessLevel ('editor')`
- `viewer collaborator sees correct accessLevel ('viewer')`

**`collaborators panel`**
- `shows collaborators section when user has any access level`
- `shows invite button only when accessLevel === 'owner'`
- `shows remove button only when accessLevel === 'owner'`
- `collaborators list shows name, role, invited-by`

**`action button visibility`**
- `edit/delete cookbook buttons: owner only`
- `add recipe / new chapter buttons: owner and editor`
- `remove recipe / rename/delete chapter buttons: owner and editor`
- `no modification buttons visible to viewer`

---

## E2E Test Coverage (src/e2e/cookbooks-collaboration.spec.ts)

- `executive-chef owner can invite a collaborator to a cookbook`
- `invited collaborator can access the shared cookbook with correct role`
- `editor collaborator can add a recipe to the cookbook`
- `viewer collaborator cannot add a recipe (buttons not visible)`
- `owner can remove a collaborator`
- `owner downgrade from executive-chef revokes collaborator access`
- `non-executive-chef user cannot see invite UI on cookbook detail`

---

## Integration Test Notes

1. **Auth context mock**: Tests that call tRPC procedures need to mock the context with `collabCookbookIds`. Use the existing `createMockContext` pattern if available.

2. **Collaborator fixture**: Use a shared `seedCollaborators()` helper to create test data with known cookbook-user-role relationships.

3. **Visibility filter tests**: Focus on the three-way split (public, owned, collaborator) and ensure `hiddenByTier` applies uniformly to all three clauses.

4. **Reconciliation tests**: The downgrade test must be run against a real MongoDB instance (not mocked) since it involves the transaction wrapper. Mark as integration tests if the test suite uses a separate integration DB.

---

## Test Data Fixtures

```typescript
// Shared fixture pattern
const COLLABORATOR_FIXTURES = {
  ownerExecChef: { id: 'user-owner', tier: 'executive-chef' },
  editorCollab: { id: 'user-editor', tier: 'home-cook' },
  viewerCollab: { id: 'user-viewer', tier: 'prep-cook' },
  cookbookWithCollaborators: { id: 'cb-collab-test', ownerId: 'user-owner', collaboratorCount: 2 },
}
```

---

## Out of Scope for Tests

- Notification sending (GH #458)
- Email invite flow
- Real-time collaboration
- Print view collaborator display (GH #461)