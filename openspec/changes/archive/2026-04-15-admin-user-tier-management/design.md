## Context

- **Relevant architecture:**
  - TanStack Router file-based routing in `src/routes/` with `beforeLoad` guards
  - tRPC with `protectedProcedure` / `tierProcedure` / `adminProcedure` in `src/server/trpc/init.ts`
  - Better-Auth session carries `tier` and `isAdmin` via `additionalFields` + `inferAdditionalFields<Auth>()` — no extra plumbing needed
  - `requireAdmin()` and `adminProcedure` both exist and are unused — built anticipating this feature
  - MongoDB "user" collection managed by Better-Auth; direct updates via `getMongoClient().db().collection("user")`
- **Dependencies:**
  - `src/types/user.ts` — `UserTier`, `TIER_RANK`, `hasAtLeastTier`
  - `src/lib/auth-guard.ts` — `requireAuth()`, `requireAdmin()`
  - `src/server/trpc/init.ts` — `adminProcedure`
  - `src/db/index.ts` — `getMongoClient()`
  - `src/components/Header.tsx` — add admin nav link
- **Interfaces/contracts touched:**
  - tRPC root router (`src/server/trpc/root.ts`) — add `admin` sub-router
  - `src/db/models/index.ts` — barrel-export new model
  - `src/routes/__root.tsx` context type (no change needed — `RouterContext` already includes session with `isAdmin`)

## Goals / Non-Goals

### Goals

- Protected `/admin/users` route with dual-layer guard (route + API)
- Full user list with current tier displayed
- Per-user tier selector with confirmation modal before mutation
- Audit log write on every tier change (no display in this change)
- Admin nav link hidden from non-admin users
- Placeholder "View audit log" link per user row (disabled, links to future `/admin/audit`)

### Non-Goals

- Audit log display UI (deferred to #338)
- Setting/unsetting `isAdmin` from UI
- Subscription/payment tier flows
- Admin actions beyond tier management

## Decisions

### Decision 1: Dual-layer admin enforcement

- **Chosen:** `requireAdmin()` in route `beforeLoad` AND `adminProcedure` on all tRPC procedures in admin router
- **Alternatives considered:** Route guard only; API guard only
- **Rationale:** Route guard prevents navigation; API guard prevents direct API calls bypassing the UI. Both already exist — cost is near zero.
- **Trade-offs:** Slight duplication, but correctness > DRY for security boundaries.

### Decision 2: New `admin` tRPC sub-router

- **Chosen:** `src/server/trpc/routers/admin.ts` with nested `users` sub-router (`admin.users.list`, `admin.users.setTier`)
- **Alternatives considered:** Add procedures to existing `usersRouter`; inline in route loader
- **Rationale:** Admin operations are a distinct capability. Separate router makes `adminProcedure` blanket-apply natural and keeps `usersRouter` as a user-scoped concern.
- **Trade-offs:** One more file, but clear separation of concerns.

### Decision 3: Audit log as separate collection, write-only for now

- **Chosen:** New `adminAuditLog` Mongoose model; writes email snapshots of admin + target at time of change
- **Alternatives considered:** Embed history array in user document; use existing logging infrastructure
- **Rationale:** Separate collection scales independently. Email snapshots prevent ambiguity if user changes email later. Write-only scope keeps this change bounded; display deferred to #338.
- **Trade-offs:** Partial success risk (tier updated, log write fails) — accepted; log is informational not transactional.

### Decision 4: Confirmation modal before tier mutation

- **Chosen:** Client-side modal showing current tier → new tier, requires explicit confirm before `setTier` mutation fires
- **Alternatives considered:** Inline save without confirm; undo within time window
- **Rationale:** Tier changes affect user access. Accidental changes should be hard. Modal is simple and sufficient.
- **Trade-offs:** Extra click per change — acceptable for admin-infrequent operations.

### Decision 5: Self-demotion blocked server-side

- **Chosen:** `setTier` mutation throws `FORBIDDEN` if `targetUserId === ctx.user.id`
- **Alternatives considered:** Block in UI only; allow self-changes
- **Rationale:** Prevents accidental admin lockout. UI should also hide/disable the selector for self, but server is authoritative.
- **Trade-offs:** Admin cannot change their own tier at all — acceptable, bootstrap concern.

### Decision 6: No-op on same-tier set

- **Chosen:** If incoming tier equals stored tier, return early — no DB write, no audit log entry
- **Alternatives considered:** Write anyway for idempotency record
- **Rationale:** Audit log should reflect intent. Repeat of same value is UI noise, not a meaningful change.
- **Trade-offs:** None significant.

### Decision 7: Admin nav link conditional on session `isAdmin`

- **Chosen:** Render link only when `useSession().data?.user.isAdmin === true` and `status === 'authenticated'`
- **Alternatives considered:** Always render, show 403 page; render for all auth users
- **Rationale:** Non-admins have no business seeing the admin section. `isAdmin` already available from session via `inferAdditionalFields` — zero extra fetch.
- **Trade-offs:** Minor flash avoidance — check `status === 'authenticated'` before rendering to avoid flicker on load.

## Proposal to Design Mapping

- Proposal element: Protected `/admin/users` route
  - Design decision: Decision 1 (dual-layer guard), Decision 2 (admin router)
  - Validation approach: E2E — non-admin redirect; unauthenticated redirect; admin can access

- Proposal element: List all users with current tier
  - Design decision: Decision 2 (`admin.users.list` procedure)
  - Validation approach: Unit test procedure returns all users; E2E table renders

- Proposal element: Promote/demote tier with confirmation
  - Design decision: Decision 4 (modal), Decision 2 (`admin.users.setTier`)
  - Validation approach: Unit test mutation; E2E modal confirm/cancel flow

- Proposal element: Audit log write
  - Design decision: Decision 3 (new collection, write-only)
  - Validation approach: Unit test audit log document written on tier change

- Proposal element: Admin nav hidden from non-admins
  - Design decision: Decision 7 (session-conditional render)
  - Validation approach: Unit test Header renders link only for admin session

- Proposal element: Self-demotion blocked
  - Design decision: Decision 5 (server-side FORBIDDEN)
  - Validation approach: Unit test mutation throws when targetUserId === callerId

## Functional Requirements Mapping

- **Requirement:** Admin can list all users with email, name, current tier
  - Design element: `admin.users.list` adminProcedure — queries MongoDB "user" collection
  - Acceptance criteria reference: specs/admin-user-list.md
  - Testability notes: Mock DB in unit test; E2E seed users and verify table

- **Requirement:** Admin can change any user's tier (not self)
  - Design element: `admin.users.setTier` adminProcedure — updates user + writes audit log
  - Acceptance criteria reference: specs/admin-set-tier.md
  - Testability notes: Unit test mutation logic; E2E complete modal confirmation flow

- **Requirement:** Confirmation modal shown before tier change
  - Design element: Client-side modal component in `/admin/users` route
  - Acceptance criteria reference: specs/admin-set-tier.md
  - Testability notes: React Testing Library — modal opens on selector change, cancel aborts, confirm fires mutation

- **Requirement:** Audit log written on every tier change
  - Design element: `adminAuditLog` collection write inside `setTier` mutation
  - Acceptance criteria reference: specs/audit-log-write.md
  - Testability notes: Unit test verifies `insertOne` called with correct shape

- **Requirement:** Non-admin redirected away from `/admin/*`
  - Design element: `requireAdmin()` in layout route `beforeLoad`
  - Acceptance criteria reference: specs/admin-access-guard.md
  - Testability notes: E2E — non-admin session navigating to `/admin/users` lands on `/account`

## Non-Functional Requirements Mapping

- **Requirement category:** Security
  - Requirement: Admin procedures reject non-admin callers at API level
  - Design element: `adminProcedure` middleware on all admin tRPC procedures
  - Acceptance criteria reference: specs/admin-access-guard.md
  - Testability notes: Unit test tRPC procedure throws FORBIDDEN when `ctx.user.isAdmin` is false

- **Requirement category:** Security
  - Requirement: Admin cannot demote themselves
  - Design element: Self-check in `setTier` mutation body
  - Acceptance criteria reference: specs/admin-set-tier.md
  - Testability notes: Unit test throws FORBIDDEN when targetUserId matches callerId

- **Requirement category:** Reliability
  - Requirement: Audit log write failure does not roll back tier change
  - Design element: Audit write in same async block, error caught and logged server-side only
  - Acceptance criteria reference: specs/audit-log-write.md
  - Testability notes: Unit test simulates audit write failure — tier update still returns success

- **Requirement category:** Operability
  - Requirement: Admin nav link does not flash for non-admins on load
  - Design element: Gate on `status === 'authenticated'` before checking `isAdmin`
  - Acceptance criteria reference: specs/admin-nav-link.md
  - Testability notes: RTL — link absent when session status is `loading` or `unauthenticated`

## Risks / Trade-offs

- **Risk/trade-off:** Audit log write partial failure (tier updated, log missing)
  - Impact: Silent gap in audit trail
  - Mitigation: Server-side error logging; acceptable for informational log

- **Risk/trade-off:** `adminAuditLog` collection unbounded growth
  - Impact: Low near-term; operational concern long-term
  - Mitigation: Deferred to #338 or a future housekeeping issue; accept for now

- **Risk/trade-off:** Admin nav link flash on initial load
  - Impact: Minor UX flicker
  - Mitigation: Render only after `status === 'authenticated'`

## Rollback / Mitigation

- **Rollback trigger:** Admin route causes unhandled errors in production, or tier mutations corrupt user documents
- **Rollback steps:**
  1. Revert PR — removes admin routes, admin tRPC router, and Header link
  2. `adminAuditLog` collection can remain (no harm if router is gone)
  3. No migration needed — user tier field untouched by rollback
- **Data migration considerations:** None — new collection only, no schema changes to existing collections
- **Verification after rollback:** `/admin/users` returns 404; `admin.*` tRPC calls return NOT_FOUND

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Fix failing tests or build errors before requesting review.
- **If security checks fail:** Block merge. Triage Codacy/Snyk findings; resolve or document accepted risk before merge.
- **If required reviews are blocked/stale:** Ping reviewer after 24h; escalate to repo owner after 48h.
- **Escalation path and timeout:** Repo owner (dougis) has final merge authority. No timeout on security findings — must be resolved.

## Open Questions

No open questions. All decisions resolved during explore session and proposal review.
