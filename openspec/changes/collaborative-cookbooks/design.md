## Context

- Relevant architecture: `src/server/trpc/context.ts` (auth context), `src/server/trpc/routers/_helpers.ts` (visibilityFilter), `src/lib/reconcile-user-content.ts` (tier reconciliation), `src/db/models/cookbook.ts` (Cookbook model), `src/server/trpc/routers/cookbooks.ts` (cookbook procedures)
- Dependencies: `Collaborator` collection requires context augmentation to avoid N+1 on every request. `visibilityFilter` signature is changing from sync to sync-with-parameter. Reconciliation is extended to handle collaborator revocation.
- Interfaces/contracts touched: `Context` type in context.ts, `visibilityFilter` function signature, `cookbooksRouter` procedures (list, byId, addCollaborator, removeCollaborator, myCollaborations)

## Goals / Non-Goals

### Goals

- Executive Chef owners can invite collaborators (editor/viewer) to any cookbook they own
- Collaborators access cookbooks via the owner's tier — not their own
- Owner retains full control: invite, remove, revoke at any time
- Owner downgrade from Executive Chef immediately revokes all collaborator access
- Attribution (addedBy) shown in UI when a collaborator makes a change
- Minimal performance impact: single lookup at auth time, no N+1

### Non-Goals

- Real-time collaboration or conflict resolution (last-write-wins only)
- Role changes (remove + re-add to change)
- Notifications (GH #458)
- Email invite flow
- Onboarding flow (GH #459)
- Print view changes (GH #461)

## Decisions

### Decision 1: Separate `Collaborator` collection (Option B)

- Chosen: `Collaborator` as a standalone MongoDB collection with `{ cookbookId, userId, role, addedAt, addedBy }`
- Alternatives considered: Embedding `collaborators[]` array on the Cookbook document
- Rationale: Enables invitation flow (future pending state), cleaner audit trail, separates concerns. Embedding would require schema migration if additional fields (like `addedBy`) were needed. Option B is more work upfront but future-proofs the model.
- Trade-offs: Additional join query; acceptable given low collaborator-to-cookbook ratio

### Decision 2: Context augmentation for visibility filtering

- Chosen: `collabCookbookIds` populated at context creation time (in `createContext`), passed to `visibilityFilter` as a parameter
- Alternatives considered: Async visibilityFilter (would require every call site to become async), lookup at router level per query
- Rationale: Single DB query per authenticated request (not per cookbook query). `visibilityFilter` stays synchronous. No changes to tRPC procedure signatures beyond adding a parameter with a default.
- Trade-offs: Collaboration state is fresh per request — no stale cache issues in v1

### Decision 3: VisibilityFilter collaborator clause

- Chosen: Third `$or` clause in visibilityFilter: `{ _id: { $in: collabCookbookIds }, hiddenByTier: { $ne: true } }`
- Logic: Public OR owned OR collaborator-on. All three filtered through `hiddenByTier: { $ne: true }`.
- Rationale: Collaborators can see private cookbooks (access via owner, not via public flag). Non-hidden check still applies — collaborator access is revoked when content is hidden due to owner's tier downgrade.
- Trade-offs: Separate `hiddenByTier` check for collaborator clause matches existing pattern

### Decision 4: Downgrade triggers immediate revocation

- Chosen: `reconcileCollaborationOnDowngrade` deletes ALL `Collaborator` records for cookbooks owned by the downgraded user when `oldTier === 'executive-chef' && newTier !== 'executive-chef'`
- Alternatives considered: Grace period, freeze (read-only but retained)
- Rationale: Simple, unambiguous. Owner downgraded → they can't share anymore → all access gone. No confusing half-state.
- Trade-offs: Abrupt but acceptable per user request

### Decision 5: `accessLevel` computed client-side from `byId` response

- Chosen: `byId` returns `collaborators[]` and `accessLevel` computed in the route component
- Alternatives considered: Returning `role: 'owner' | 'editor' | 'viewer'` directly
- Rationale: The `accessLevel` flag is derived from `cookbook.userId === currentUserId` + `collaborators[]` lookup. Doing it server-side would require passing `userId` into the query. Client-side is cleaner and avoids leaking `accessLevel` if the query is used in other contexts.
- Trade-offs: Client must compute; test coverage must verify the computation logic

### Decision 6: Attribution via `addedBy` on Collaborator

- Chosen: `addedBy` field on Collaborator records "who invited this person"
- Alternatives considered: Embedding `updatedBy` on modified documents
- Rationale: `addedBy` answers "who gave access" not "who made last edit". Attribution "Added by [user]" in the UI refers to who made a collaborative addition (e.g., a recipe was added to the cookbook by collaborator X) — this may be tracked separately via a `cookbookActivity` log in future. For v1, `addedBy` on Collaborator is sufficient for "Invited by" display.
- Trade-offs: Attribution for recipe edits (who added a recipe to the collaborative cookbook) is not yet implemented — deferred to future work

### Decision 7: Tier gating at procedure level, not router level

- Chosen: `addCollaborator` and `removeCollaborator` procedures check `executive-chef` tier directly via `tierProcedure('executive-chef')`
- Alternatives considered: Gating at the router level (cookbooksRouter applies tier check to all procedures)
- Rationale: Other cookbook procedures (create, update, delete) are available to all authenticated users with tier limits handled via `enforceContentLimit`. Only collaboration-initiating procedures need tier gating.
- Trade-offs: Two procedures use `tierProcedure` vs one router-level middleware — slightly more code but more precise

## Proposal to Design Mapping

- Proposal element: Separate Collaborator collection
  - Design decision: Decision 1
  - Validation: Model exists with correct indexes, unique constraint on (cookbookId, userId)

- Proposal element: Context augmentation
  - Design decision: Decision 2
  - Validation: `ctx.collabCookbookIds` populated at context creation for authenticated users

- Proposal element: visibilityFilter collaborator clause
  - Design decision: Decision 3
  - Validation: Public + owned + collaborator cookbooks all accessible via visibilityFilter

- Proposal element: Downgrade revocation
  - Design decision: Decision 4
  - Validation: `reconcileCollaborationOnDowngrade` deletes all Collaborator records for downgraded owner's cookbooks

- Proposal element: UI access level gating
  - Design decision: Decision 5
  - Validation: CookbookDetail page gates actions correctly based on computed accessLevel

- Proposal element: Attribution display
  - Design decision: Decision 6
  - Validation: Collaborators panel shows "Invited by [name]" using addedBy field

- Proposal element: Executive Chef tier gating
  - Design decision: Decision 7
  - Validation: Non-executive-chef users cannot call addCollaborator or removeCollaborator

## Functional Requirements Mapping

- Requirement: Executive Chef users can invite collaborators to any cookbook they own
  - Design element: `addCollaborator` procedure gated with `tierProcedure('executive-chef')`
  - Acceptance criteria reference: GH #420 acceptance criteria

- Requirement: Collaborator roles (editor/viewer) are enforced
  - Design element: `accessLevel` computed from cookbook.userId (owner) or Collaborator.role (collaborator)
  - Acceptance criteria reference: GH #420

- Requirement: Non-Executive-Chef users cannot initiate collaboration (invite UI hidden/disabled)
  - Design element: Tier gating on addCollaborator/removeCollaborator procedures; UI reads `useTierEntitlements` for button visibility
  - Acceptance criteria reference: GH #420

- Requirement: Cookbook detail view indicates shared status and lists collaborators
  - Design element: byId returns collaborators[]; CookbookCard shows collaboratorCount; CookbookDetail shows collaborators panel
  - Acceptance criteria reference: GH #420

- Requirement: Owner can remove collaborators
  - Design element: removeCollaborator procedure; collaborators panel shows Remove button for owner
  - Acceptance criteria reference: GH #420

- Requirement: Downgrade handling defined and implemented
  - Design element: reconcileCollaborationOnDowngrade called in reconcileUserContent when direction === 'downgrade' && oldTier === 'executive-chef'
  - Acceptance criteria reference: GH #420

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Collaborator lookups are indexed and performant under load
  - Design element: Indexes on { userId: 1 }, { cookbookId: 1 }, { cookbookId: 1, userId: 1 } unique
  - Acceptance criteria reference: GH #460 (indexing investigation)
  - Testability notes: `explain()` on all four access patterns confirms index usage

- Requirement category: reliability
  - Requirement: Reconcile is atomic with tier change
  - Design element: `reconcileCollaborationOnDowngrade` called within the same transaction as content hiding
  - Acceptance criteria reference: reconcile-user-content.test.ts extends coverage
  - Testability notes: Unit test verifies collaborator deletion on downgrade path

- Requirement category: maintainability
  - Requirement: visibilityFilter stays synchronous with default parameter
  - Design element: Default `[]` for collabCookbookIds keeps existing call sites unchanged
  - Acceptance criteria reference: All existing tests pass without modification
  - Testability notes: TypeScript compile; grep for visibilityFilter call sites

## Risks / Trade-offs

- Risk/trade-off: Context creation adds one DB query per authenticated request
  - Impact: Marginal latency increase for all authenticated cookbook queries
  - Mitigation: Single distinct() query on indexed field; acceptable for collaboration feature
  - Monitoring: Track context creation latency in production

- Risk/trade-off: visibilityFilter signature change requires updating all call sites
  - Impact: Missing parameter leads to incorrect visibility (no collaborators visible)
  - Mitigation: Default parameter `[]` maintains backward compatibility; TypeScript catches missing args
  - Verification: All existing cookbook tests pass

- Risk/trade-off: Race between invite and downgrade
  - Impact: Collaborator added between reconcile start and commit
  - Mitigation: Next request will not find them (downgrade already persisted); brief window acceptable for v1
  - Future: Consider idempotent invite checks at procedure level

## Rollback / Mitigation

- Rollback trigger: Production issue with collaborator visibility or access
- Rollback steps:
  1. Revert `collabCookbookIds` from context (set to empty array)
  2. Remove collaborator clause from visibilityFilter
  3. Remove reconcileCollaborationOnDowngrade call
  4. Remove addCollaborator/removeCollaborator/myCollaborations procedures
- Data migration considerations: Collaborator collection can be dropped (no data loss on revert)
- Verification after rollback: Existing tests pass; manual smoke test as collaborator and owner

## Open Questions

No open questions. All decisions confirmed during explore session with user.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check.
- If security checks fail: Do not merge. Escalate to repo owner.
- If required reviews are blocked/stale: Ping reviewer after 24h; escalate after 48h.
- Escalation path: Repo owner (dougis) is final escalation. Security failures block indefinitely.