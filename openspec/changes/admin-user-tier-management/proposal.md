## GitHub Issues

- dougis-org/cookbook-tanstack#330
- dougis-org/cookbook-tanstack#338 (audit log display — follow-up, out of scope here)

## Why

- **Problem statement:** Admins have no UI to view or change user tiers. The `isAdmin` flag and tier data model exist in the database (via #282), and the enforcement infrastructure is complete (`adminProcedure`, `requireAdmin()` guard), but there is no admin interface to use them.
- **Why now:** The user tier system (#282) just shipped. The natural next step is giving admins the tools to manage tiers without direct database access.
- **Business/user impact:** Without this feature, changing a user's tier requires a manual MongoDB update. This blocks any real use of the tier system and creates operational risk.

## Problem Space

- **Current behavior:** There is no admin route. Tier and isAdmin fields can only be changed by direct database manipulation.
- **Desired behavior:** Authenticated admins can navigate to `/admin/users`, see all users with their current tier, change any user's tier via a confirmation-gated dropdown, and have each change written to an audit log collection.
- **Constraints:**
  - Admin access must be enforced both at the route level (`requireAdmin()` guard in `beforeLoad`) and at the API level (`adminProcedure` on all tRPC mutations/queries).
  - The audit log is write-only for now — display is deferred to #338.
  - `tier` and `isAdmin` fields are already carried in the Better-Auth session via `additionalFields` + `inferAdditionalFields<Auth>()` — no additional session plumbing needed.
  - Admin nav links must be hidden from non-admin users (conditional on `useSession().data?.user.isAdmin`).
- **Assumptions:**
  - The acting admin's `isAdmin` flag is already set directly in MongoDB (no UI for that — bootstrap concern).
  - A user cannot demote themselves (guard against self-demotion in the mutation).
- **Edge cases considered:**
  - Admin tries to change their own tier → blocked server-side with a clear error.
  - Non-admin navigates directly to `/admin/users` → redirected by `requireAdmin()` guard.
  - Unauthenticated user navigates to `/admin/users` → redirected by `requireAuth()` guard.
  - Tier set to the same value already stored → mutation is a no-op (no audit log entry written).

## Scope

### In Scope

- `/admin/users` route with full user list and tier management UI
- Admin layout route (`src/routes/admin.tsx`) with `requireAuth()` + `requireAdmin()` guards
- tRPC admin router (`src/server/trpc/routers/admin.ts`) with:
  - `admin.users.list` — list all users (adminProcedure)
  - `admin.users.setTier` — update tier + write audit log entry (adminProcedure)
- `adminAuditLog` Mongoose model and collection
- Confirmation modal before any tier change mutation fires
- Admin nav link in Header, hidden from non-admins
- Placeholder "View audit log" link per user row → `/admin/audit` (route not built yet, link disabled/noted as coming soon)

### Out of Scope

- `/admin/audit` display route (#338)
- Setting or unsetting `isAdmin` from the UI (bootstrap concern, direct DB)
- Self-service tier upgrades / payments
- Any non-tier admin actions

## What Changes

- **New files:**
  - `src/routes/admin.tsx` — admin layout route
  - `src/routes/admin/users.tsx` — user list + tier management page
  - `src/server/trpc/routers/admin.ts` — admin tRPC router
  - `src/db/models/admin-audit-log.ts` — Mongoose model for audit log
- **Modified files:**
  - `src/db/models/index.ts` — barrel-export the new model
  - `src/server/trpc/root.ts` — add `admin` router to the root
  - `src/components/Header.tsx` — add conditional admin nav link

## Risks

- **Risk:** `adminAuditLog` collection grows unboundedly with no TTL or retention policy.
  - **Impact:** Low for now (low write volume), but eventually becomes a maintenance concern.
  - **Mitigation:** Accept for now; add TTL index or archival in a future issue.
- **Risk:** Tier change applied but audit log write fails (partial success).
  - **Impact:** Silent gap in audit history.
  - **Mitigation:** Write audit log in the same async block as the update; if log write fails, log the error server-side but do not roll back the tier change (audit is informational, not transactional).
- **Risk:** Admin nav link visible flash before session loads.
  - **Impact:** Minor UX flicker.
  - **Mitigation:** Render the link only after session is confirmed (`status === 'authenticated'`).

## Open Questions

No unresolved ambiguity remains. All design decisions were resolved during the explore session:
- Audit log writes: yes, new collection, no display in this change.
- Confirmation modal: yes, before every tier mutation.
- Admin guard: enforced both route (`requireAdmin()`) and API (`adminProcedure`).
- Nav link visibility: conditional on `isAdmin`, hidden from non-admins.
- Routing: Option A — dedicated `/admin/` subtree.
- Audit log UI: deferred to #338 (placeholder link in user rows).

## Non-Goals

- Audit log viewer UI (deferred to #338)
- Admin ability to set/remove `isAdmin` flag on other users
- Subscription or payment-driven tier changes
- Role management beyond the four tiers defined in #282

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
