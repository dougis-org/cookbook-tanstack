## Context

- **Relevant architecture:** Better-Auth 1.6.x manages the `user` MongoDB collection via its adapter. Session data flows from `auth.api.getSession()` → `context.ts` → tRPC `ctx.user`. Route guards read `context.session` in TanStack Router's `beforeLoad`. The `username` plugin is already registered in `auth.ts`.
- **Dependencies:** `better-auth ^1.6.2`, `@trpc/server`, `@tanstack/react-router`, MongoDB `user` collection, `src/lib/auth-guard.ts` (stub for `requireTier`), `src/server/trpc/init.ts` (`protectedProcedure`).
- **Interfaces/contracts touched:**
  - `src/lib/auth.ts` — Better-Auth config
  - `src/lib/auth-client.ts` — client session types
  - `src/lib/auth-guard.ts` — route-level guards
  - `src/server/trpc/init.ts` — procedure-level guards
  - `src/server/trpc/routers/users.ts` — `UserDocument` interface
  - `src/types/router.ts` — `RouterContext` (read-only, inherits types from Better-Auth)
  - `scripts/migrate-user-tiers.ts` — new migration script
  - `package.json` — new `db:migrate-tiers` npm script

## Goals / Non-Goals

### Goals

- Model four ordered tiers as a string enum with an ordinal rank map
- Store `tier` and `isAdmin` in Better-Auth's `user` collection via `additionalFields`
- Expose both fields through the session in tRPC context and the auth client
- Implement "at least this tier" enforcement at route and procedure levels
- Provide an idempotent migration script that promotes existing users and flags the admin

### Non-Goals

- No tier-change endpoints or admin UI (out of scope per proposal)
- No feature gate matrix (spike #334)
- No UI surfacing tier to the user

## Decisions

### Decision 1: Tier storage — string enum with rank map

- **Chosen:** `UserTier = 'home-cook' | 'prep-cook' | 'sous-chef' | 'executive-chef'` stored as a string in MongoDB; ordinal comparison via `TIER_RANK: Record<UserTier, number>`.
- **Alternatives considered:** Numeric field only (`0–3`); separate `tierLevel` numeric + `tierName` string.
- **Rationale:** String values are human-readable in MongoDB documents and logs. Rank map isolates the ordering concern without coupling it to the stored value. Matches how Better-Auth `additionalFields` work (typed string fields).
- **Trade-offs:** Requires `TIER_RANK` lookup for comparisons; a purely numeric field would be simpler for ordering but less readable.

### Decision 2: `additionalFields` via Better-Auth config

- **Chosen:** Declare `tier` and `isAdmin` in `betterAuth({ user: { additionalFields: { ... } } })` in `src/lib/auth.ts`.
- **Alternatives considered:** Separate Mongoose model overlaying the `user` collection; raw MongoDB operations in tRPC procedures.
- **Rationale:** Better-Auth owns the `user` collection — writing outside its API risks conflicts with its internal operations (session validation, account linking). `additionalFields` is the documented extension point.
- **Trade-offs:** TypeScript inference from `additionalFields` must be verified at implementation time; may require an explicit cast in `context.ts` if Better-Auth's generics don't flow through `getSession()`.

### Decision 3: `hasAtLeastTier` helper — admin bypass

- **Chosen:** `hasAtLeastTier(user, required)` returns `true` if `user.isAdmin === true` OR `TIER_RANK[user.tier ?? 'home-cook'] >= TIER_RANK[required]`.
- **Alternatives considered:** Separate `isAdmin` check at each call site; admin as a virtual top tier above Executive Chef.
- **Rationale:** Centralizing the bypass in one helper prevents missed checks. Admin as a separate boolean is cleaner than inserting it into the tier hierarchy — admins are a cross-cutting concern, not a tier.
- **Trade-offs:** `undefined` tier (pre-migration users) is treated as `'home-cook'` by the `?? 'home-cook'` fallback — this is intentional and safe.

### Decision 4: Two-layer enforcement (route + tRPC)

- **Chosen:** `requireTier(tier)` in `auth-guard.ts` for route `beforeLoad`; `tierProcedure(tier)` factory in `src/server/trpc/init.ts` for server-side enforcement.
- **Alternatives considered:** Route-only enforcement; tRPC-only enforcement.
- **Rationale:** Route guards provide fast redirects for UX (send users to `/account` before rendering); tRPC procedures provide server-side enforcement independent of routing (API calls from scripts, future mobile clients, etc.). Defense-in-depth.
- **Trade-offs:** Two call sites to maintain when tier semantics change, but both delegate to `hasAtLeastTier`, so the logic is centralised.

### Decision 5: Migration script — conservative `$setOnInsert` + explicit admin update

- **Chosen:** Step 1: `updateMany({}, { $set: { tier: 'executive-chef', isAdmin: false } })` scoped to documents missing `tier`. Step 2: targeted `updateOne({ email: 'doug@dougis.com' }, { $set: { isAdmin: true } })`. Idempotent.
- **Alternatives considered:** Full `$set` on all documents (would overwrite future manual changes); seed-style script in `src/db/seeds/`.
- **Rationale:** The conservative approach avoids clobbering data once tier-change endpoints exist. Placing the script in `scripts/` (not `seeds/`) signals it's a one-time migration, not repeatable setup data.
- **Trade-offs:** Slightly more complex query (filter for missing field), but much safer for long-term operation.

### Decision 6: `requireAdmin()` and `adminProcedure` as stubs

- **Chosen:** Implement the function signatures with their enforcement logic (check `isAdmin`, redirect/throw appropriately) but add a `// @future` comment noting no routes or procedures use them yet.
- **Rationale:** Stub with real logic is safer than an empty placeholder — if someone accidentally wires it up, it will enforce correctly. Zero risk of premature exposure since no routes call it.
- **Trade-offs:** Slightly more code than a pure stub, but avoids a footgun.

## Proposal to Design Mapping

- Proposal element: `UserTier` type + `TIER_RANK` map
  - Design decision: Decision 1
  - Validation approach: Unit tests on `hasAtLeastTier` covering all tier pairings and admin bypass

- Proposal element: Better-Auth `additionalFields`
  - Design decision: Decision 2
  - Validation approach: Integration test — sign up a user, verify `getSession()` returns `tier` and `isAdmin`

- Proposal element: `hasAtLeastTier` with admin bypass
  - Design decision: Decision 3
  - Validation approach: Unit tests; all permutations including `undefined` tier and `isAdmin: true`

- Proposal element: Route guard + tRPC procedure enforcement
  - Design decision: Decision 4
  - Validation approach: Route guard tests (mock `RouterContext`); tRPC procedure tests (mock `ctx.user`)

- Proposal element: Migration script
  - Design decision: Decision 5
  - Validation approach: Run against test DB; verify all docs have `tier`, verify `doug@dougis.com` has `isAdmin: true`, verify idempotency

## Functional Requirements Mapping

- **Requirement:** `UserTier` union type with four values; `TIER_RANK` maps each to an integer 0–3
  - Design element: `src/types/user.ts`
  - Acceptance criteria reference: specs/user-tier-model.md
  - Testability notes: Pure TypeScript — unit-testable with no runtime dependencies

- **Requirement:** `tier` and `isAdmin` present in Better-Auth session
  - Design element: `src/lib/auth.ts` `additionalFields`
  - Acceptance criteria reference: specs/auth-integration.md
  - Testability notes: Integration test with real (or in-memory) MongoDB; verify `ctx.user.tier` type and value

- **Requirement:** `requireTier(tier)` redirects users below the required tier
  - Design element: `src/lib/auth-guard.ts`
  - Acceptance criteria reference: specs/route-guards.md
  - Testability notes: Unit test with mocked `RouterContext`; test all tier combinations + admin bypass

- **Requirement:** `tierProcedure(tier)` throws `FORBIDDEN` for users below required tier
  - Design element: `src/server/trpc/init.ts`
  - Acceptance criteria reference: specs/trpc-procedures.md
  - Testability notes: tRPC unit test with mocked context; verify `FORBIDDEN` error code

- **Requirement:** Migration sets all existing users to `'executive-chef'`; `doug@dougis.com` gets `isAdmin: true`
  - Design element: `scripts/migrate-user-tiers.ts`
  - Acceptance criteria reference: specs/migration.md
  - Testability notes: Integration test against test MongoDB instance; verify counts and specific document state

## Non-Functional Requirements Mapping

- **Requirement category:** Security
  - Requirement: Tier enforcement must be server-side; client-side tier data is informational only
  - Design element: `tierProcedure` in tRPC; `requireTier` alone is not sufficient
  - Acceptance criteria reference: specs/trpc-procedures.md
  - Testability notes: Verify tRPC procedure rejects requests regardless of route guard state

- **Requirement category:** Reliability
  - Requirement: `undefined` tier (pre-migration) must not cause a runtime error or grant elevated access
  - Design element: `?? 'home-cook'` fallback in `hasAtLeastTier`
  - Acceptance criteria reference: specs/user-tier-model.md
  - Testability notes: Unit test `hasAtLeastTier` with `undefined` tier input

- **Requirement category:** Operability
  - Requirement: Migration script is idempotent and safe to re-run
  - Design element: `scripts/migrate-user-tiers.ts` conditional `$set`
  - Acceptance criteria reference: specs/migration.md
  - Testability notes: Run migration twice; verify document state is unchanged after second run

- **Requirement category:** Maintainability
  - Requirement: Adding a new tier in future requires changes in exactly one place (`TIER_RANK`)
  - Design element: `src/types/user.ts` — all comparisons go through `TIER_RANK`
  - Acceptance criteria reference: N/A (design constraint)
  - Testability notes: TypeScript exhaustiveness check on `UserTier` union

## Risks / Trade-offs

- **Risk/trade-off:** Better-Auth `additionalFields` generic inference may not propagate to `getSession()` return type.
  - Impact: `ctx.user.tier` typed as `unknown`; TypeScript errors across enforcement code.
  - Mitigation: Add an explicit `UserWithTier` interface to `context.ts` and cast the session user if needed. Document this as a known Better-Auth limitation.

- **Risk/trade-off:** Migration script running `$set` after tier-change endpoints are live would overwrite intentional tier assignments.
  - Impact: Data loss / user tier regression.
  - Mitigation: Decision 5 uses conditional update (only sets `tier` if missing). Document clearly in script header.

## Rollback / Mitigation

- **Rollback trigger:** `ctx.user.tier` type errors in CI, or `requireTier` incorrectly denying access in production.
- **Rollback steps:**
  1. Revert `src/lib/auth.ts` `additionalFields` addition.
  2. Revert `src/lib/auth-guard.ts` and `src/server/trpc/init.ts` changes.
  3. Revert `src/types/user.ts` (delete file).
  4. The `user` collection documents retain `tier`/`isAdmin` fields but they are ignored by the application — no data migration needed on rollback.
- **Data migration considerations:** MongoDB documents keep the fields; they are harmless if the application ignores them.
- **Verification after rollback:** All existing tests pass; `requireAuth()` continues to work; no TypeScript errors.

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Fix TypeScript errors or test failures before proceeding. The `additionalFields` type inference risk is the most likely failure mode — address per Decision 2 mitigation.
- **If security checks fail:** Do not merge. Tier enforcement is a security boundary; a failing Codacy/Snyk scan on these files must be resolved.
- **If required reviews are blocked/stale:** Ping reviewer after 48 hours. After 96 hours with no response, escalate to next available reviewer.
- **Escalation path:** If blocked for >5 business days, treat as a scope or dependency issue and revisit the proposal.

## Open Questions

No open questions. All design decisions are resolved based on the explore session and proposal.
