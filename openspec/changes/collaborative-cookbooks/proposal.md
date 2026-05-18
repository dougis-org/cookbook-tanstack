# Collaborative Cookbooks for Executive Chef Tier

## GitHub Issues

- #420 (primary)
- #458 (notifications — out of scope)
- #459 (onboarding flow — follow-up)
- #460 (indexing investigation — follow-up)
- #461 (print view impact — follow-up)

## Why

Executive Chef subscribers have no social feature distinguishing their tier from Sous Chef. Adding collaborative cookbooks gives the top tier a concrete capability that creates retention lock-in once users are collaborating with others.

## Problem Space

- Current behavior: Cookbooks are single-owner only. No sharing mechanism exists.
- Desired behavior: Executive Chef owners can invite collaborators (editor/viewer roles) to any cookbook they own. Collaborators access the cookbook via the owner's tier, not their own.
- Constraints:
  - Collaborators do not need Executive Chef — access is granted by the owner's tier.
  - Owner retains full control (invite, remove, revoke).
  - Downgrade from Executive Chef immediately revokes all collaborator access.
  - Attribution ("Added by [user]") must be shown on collaborative edits.
- Edge cases:
  - Owner downgrades: all collaborator access revoked immediately.
  - Collaborator's own tier limits don't change — they access via owner.
  - Private cookbooks: collaborators can view/edit based on role, not public access.

## Scope

### In Scope

- New `Collaborator` MongoDB collection (cookbookId, userId, role, addedAt, addedBy)
- Context augmentation: `collabCookbookIds` added to context for visibility filtering
- `visibilityFilter` updated to include collaborator clause
- `reconcileCollaborationOnDowngrade()` added to `reconcile-user-content.ts`
- tRPC procedures: `addCollaborator`, `removeCollaborator`, `myCollaborations`, `users.search` (for invite modal user lookup)
- tRPC mutations: `cookbooks.list` +collaboratorCount, `cookbooks.byId` +collaborators[], +accessLevel
- UI changes: CookbookCard +collaboratorCount/+isCollaborator, CookbookDetail collaborators panel + role-gated actions
- Tier gating: only Executive Chef owners can initiate collaboration (invite/remove)

### Out of Scope

- Notifications (GH #458)
- Invite by email (falls under notifications)
- Real-time collaboration
- Role change (remove + re-add to change role)
- Onboarding flow (GH #459)
- Indexing investigation (GH #460)
- Print view changes (GH #461)

## What Changes

### Data Model
- `src/db/models/collaborator.ts` — new ICollaborator interface and model
- `src/db/models/index.ts` — export Collaborator
- `src/server/trpc/context.ts` — add collabCookbookIds to context
- `src/server/trpc/routers/_helpers.ts` — visibilityFilter gains collabCookbookIds parameter

### Reconciliation
- `src/lib/reconcile-user-content.ts` — add reconcileCollaborationOnDowngrade called when owner downgrades from executive-chef

### tRPC Procedures
- `src/server/trpc/routers/cookbooks.ts`:
  - `list`: +collaboratorCount field
  - `byId`: +collaborators[] (id, name, role, addedAt) — `accessLevel: 'owner' | 'editor' | 'viewer'` derived client-side from collaborators[] + current userId
  - `addCollaborator` (new, executive-chef gated, verifiedProcedure)
  - `removeCollaborator` (new, executive-chef gated, verifiedProcedure)
  - `myCollaborations` (new, protectedProcedure)
- `src/server/trpc/routers/users.ts`:
  - `search` (new, protectedProcedure) — lookup users by email or username prefix for the invite modal; returns `[{ id, name, email }]`; excludes the caller

### UI
- `src/components/cookbooks/CookbookCard.tsx` — +collaboratorCount prop, +isCollaborator prop, Users icon with count
- `src/routes/cookbooks.$cookbookId.tsx` — collaborators panel, role-gated actions (owner/editor/viewer), new modals (inviteCollaborator, removeCollaborator)
- `src/routes/cookbooks/index.tsx` — pass isOwner + collaboratorCount to CookbookCard

## Risks

- Risk: visibilityFilter signature change cascades to every call site
  - Impact: All query procedures using visibilityFilter must pass new parameter
  - Mitigation: TypeScript compilation catches missing updates; all changes are additive (default [] maintains backward compat)

- Risk: Context creation slower due to Collaborator lookup
  - Impact: Every authenticated request adds one extra DB query
  - Mitigation: Single distinct query, indexed; acceptable for collaboration feature

- Risk: Race condition between addCollaborator and reconcileCollaborationOnDowngrade
  - Impact: Collaborator added during downgrade transaction
  - Mitigation: Reconcile happens atomically in transaction with tier update; concurrent invites during downgrade may succeed briefly but next request will filter them out

## Open Questions

No unresolved ambiguity. All decisions confirmed during explore session:
- Data model: separate Collaborator collection (Option B)
- Conflict resolution: last-write-wins
- Attribution: "Added by [user]" shown in UI
- Downgrade: immediate revocation, no grace period
- Collaborator limits: not counted against collaborator's own limits

## Non-Goals

- Adding role change (must remove and re-add)
- Real-time collaboration
- Notification system
- Email invite flow
- Print view changes

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.