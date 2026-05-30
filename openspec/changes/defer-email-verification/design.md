## Context

- Relevant architecture:
  - File-based routing via TanStack Router; route guards via `beforeLoad` in `src/lib/auth-guard.ts`.
  - Better-Auth handles session/verification lifecycle; configured in `src/lib/auth.ts`.
  - Mongoose recipe model in `src/db/models/recipe.ts` with soft-delete middleware pattern.
  - tRPC procedures in `src/server/trpc/routers/recipes.ts` use a `visibilityFilter(ctx.user)` helper to scope queries.
  - `VerificationBanner` in `src/components/auth/VerificationBanner.tsx` already handles resend logic — reusable.
- Dependencies:
  - `better-auth` — must confirm `afterEmailVerification` hook availability in installed version (spike task).
  - Mongoose soft-delete middleware pattern — `pendingVerification` filter must follow the same approach as `deleted` and `hiddenByTier`.
- Interfaces/contracts touched:
  - `IRecipe` interface — new optional field `pendingVerification?: boolean`.
  - `recipes.list` tRPC input/output — no new inputs; output filtering changes.
  - `recipes.byId` tRPC — non-owner access to pending recipes blocked.
  - `usage.getOwned` tRPC — count excludes pending recipes.
  - `src/lib/auth.ts` `emailVerification` config — new hook.

## Goals / Non-Goals

### Goals

- Allow unverified authenticated users to create and save recipes.
- Prevent pending (unverified) recipes from being publicly visible.
- Automatically publish pending recipes when the user verifies their email.
- Preserve tier limit semantics: pending recipes do not consume tier slots.

### Non-Goals

- 30-day TTL cleanup of unclaimed pending recipes.
- Changes to `/import` or `/change-tier` auth guards.
- Admin tooling for pending recipes.

## Decisions

### Decision 1: Persistence strategy — DB flag vs sessionStorage

- Chosen: DB flag (`pendingVerification: boolean`) on the `Recipe` model.
- Alternatives considered: `sessionStorage` (persist recipe data client-side until verification).
- Rationale: `sessionStorage` is destroyed when the user closes the tab. The primary verification flow requires the user to leave the app (email client), click a link, and return — exactly the scenario where `sessionStorage` fails. DB storage also provides long-term product analytics on intent-but-unverified users.
- Trade-offs: DB flag requires filtering at every query site. Mitigated by a required integration test confirming no leakage.

### Decision 2: Finalization trigger — afterEmailVerification hook (Option C)

- Chosen: Wire `afterEmailVerification` in Better-Auth's `emailVerification` config block to call `publishPendingRecipes(userId)`.
- Confirmation: The hook is confirmed to exist. The installed `better-auth` version uses the same config extension pattern for `sendVerificationEmail` and `sendResetPassword` in `src/lib/auth.ts`. The `afterEmailVerification` callback receives `{ user }` (same shape as `sendVerificationEmail`). No spike required.
- Alternatives considered:
  - Option A: Session-load scan — on each authenticated request, check for pending recipes and publish. Simple but runs on every request.
  - Option B: Client-side polling — `PostSubmitVerifyGate` polls session state and fires a mutation on verification. Breaks for cross-device verification.
- Rationale: Option C fires exactly once, server-side, at the moment of verification. The callback stays thin (one import, one call); `publishPendingRecipes` owns all logic and is independently testable.
- Trade-offs: Depends on Better-Auth hook availability (spike required). Fallback: Option A using `protectedProcedure` middleware if hook is absent — document in design.md update before implementing.

### Decision 3: Pending recipe visibility — owner can read/edit, non-owners blocked

- Chosen: `pendingVerification: true` recipes are readable and editable by their owner, invisible to all other users including unauthenticated requests.
- Alternatives considered: Completely hidden until verified (owner cannot view or edit).
- Rationale: The issue explicitly shows the recipe to the user above the `PostSubmitVerifyGate`. The owner must be able to view (and ideally edit) before verifying.
- Trade-offs: Requires `byId` to check ownership before returning a pending recipe. Low complexity; follows existing ownership pattern.

### Decision 4: Tier limit count — pending recipes excluded

- Chosen: `usage.getOwned` excludes `pendingVerification: true` recipes from the count.
- Alternatives considered: Count pending recipes against the limit.
- Rationale: If pending recipes consume a slot, an unverified user on a free tier could hit their limit from a single submit before they have verified. This defeats the deferred-verification UX entirely.
- Trade-offs: A user could theoretically submit many pending recipes to avoid the limit, but pending recipes are never public, so abuse surface is minimal. The 30-day TTL (follow-up issue) bounds the long-term footprint.

### Decision 5: Service layer for publish logic

- Chosen: `publishPendingRecipes(userId: string): Promise<void>` in `src/server/recipes/pendingRecipes.ts`.
- Alternatives considered: Inline logic in the auth hook or in the recipe tRPC router.
- Rationale: Keeps the auth callback thin. Independent testability without mocking tRPC or auth. Can be reused if additional entry points are needed later (e.g., admin action).
- Trade-offs: One additional file, but with a single, clear responsibility.

## Proposal to Design Mapping

- Proposal element: Remove `requireVerifiedAuth()` from `/recipes/new`
  - Design decision: Decision 1 (DB flag), Decision 3 (owner visibility)
  - Validation approach: Existing route guard tests extended; Playwright E2E for unverified user reaching the form.

- Proposal element: Save recipe with `pendingVerification: true` on unverified submit
  - Design decision: Decision 1 (DB flag)
  - Validation approach: Unit test on `recipes.create` tRPC mutation confirming flag is set when caller is unverified.

- Proposal element: Pending recipes must not appear in public queries
  - Design decision: Decision 3 (visibility rules)
  - Validation approach: Required tRPC integration test: `pending recipes never appear in public list`.

- Proposal element: `publishPendingRecipes` triggered on verification
  - Design decision: Decision 2 (Option C hook), Decision 5 (service layer)
  - Validation approach: Unit test on `publishPendingRecipes` confirming flag removal; integration test confirming hook wires correctly.

- Proposal element: Pending recipes excluded from tier limit count
  - Design decision: Decision 4
  - Validation approach: Unit test on `usage.getOwned` with mixed pending/non-pending recipes.

## Functional Requirements Mapping

- Requirement: Unverified users can access `/recipes/new` and submit the form.
  - Design element: Swap `requireVerifiedAuth()` → `requireAuth()` in route `beforeLoad`.
  - Acceptance criteria reference: specs/recipe-creation.md — unverified access AC.
  - Testability notes: Extend existing route guard tests; Playwright test for unverified user.

- Requirement: Submitted recipe saved with `pendingVerification: true` when user is unverified.
  - Design element: `RecipeForm` detects `emailVerified === false` on submit; calls create mutation with flag.
  - Acceptance criteria reference: specs/recipe-creation.md — pending save AC.
  - Testability notes: tRPC mutation unit test; check DB document after creation.

- Requirement: `PostSubmitVerifyGate` shown post-submit, displaying recipe and resend button.
  - Design element: New component `src/components/recipes/PostSubmitVerifyGate.tsx`; reuses resend logic from `VerificationBanner`.
  - Acceptance criteria reference: specs/recipe-creation.md — post-submit gate AC.
  - Testability notes: React Testing Library unit test for component rendering and resend interaction.

- Requirement: Pending recipes invisible to non-owners in all queries.
  - Design element: Filter `{ pendingVerification: { $ne: true } }` applied in `recipes.list` for non-owner/public contexts; `recipes.byId` ownership check for pending.
  - Acceptance criteria reference: specs/data-integrity.md — visibility AC.
  - Testability notes: tRPC integration test seeding pending + published recipes, asserting public list only returns published.

- Requirement: Pending recipes auto-published on email verification.
  - Design element: `afterEmailVerification` hook → `publishPendingRecipes(userId)`.
  - Acceptance criteria reference: specs/verification-finalization.md — publish AC.
  - Testability notes: Unit test `publishPendingRecipes`; mock hook invocation test.

- Requirement: Pending recipes excluded from usage/tier count.
  - Design element: `usage.getOwned` adds `pendingVerification: { $ne: true }` to recipe count query.
  - Acceptance criteria reference: specs/usage-counting.md — tier count AC.
  - Testability notes: Unit test with mixed recipe states.

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: Pending recipes never publicly accessible.
  - Design element: Server-side tRPC filters; no client-side gating only.
  - Acceptance criteria reference: specs/data-integrity.md.
  - Testability notes: Integration test; manual review of all `recipes.list` query paths.

- Requirement category: reliability
  - Requirement: Cross-device verification correctly publishes pending recipes.
  - Design element: `afterEmailVerification` hook fires server-side, independent of client state.
  - Acceptance criteria reference: specs/verification-finalization.md.
  - Testability notes: Covered by unit test on `publishPendingRecipes`; manual cross-device QA.

- Requirement category: operability
  - Requirement: Hook spike result is documented before implementation of finalization step.
  - Design element: Spike task gates the finalization implementation task.
  - Acceptance criteria reference: tasks.md — spike task.
  - Testability notes: Spike output is a comment in `design.md` confirming hook name/signature.

## Risks / Trade-offs

- Risk/trade-off: `afterEmailVerification` hook unavailable in installed Better-Auth version.
  - Impact: Finalization path blocked; must fall back to Option A (protectedProcedure middleware scan).
  - Mitigation: Spike is the first task. If fallback needed, update design.md and tasks.md before any finalization code is written.

- Risk/trade-off: Pending filter missed at a query site, leaking unverified content.
  - Impact: Public visibility of unverified recipes.
  - Mitigation: Required integration test. PR blocked until test passes.

- Risk/trade-off: Pending recipes accumulate indefinitely for users who never verify.
  - Impact: DB bloat over time.
  - Mitigation: Accepted for this change. 30-day TTL cleanup is a follow-up issue.

## Rollback / Mitigation

- Rollback trigger: Pending recipes appear in public queries (integration test regression), or `afterEmailVerification` hook causes unhandled errors in production.
- Rollback steps:
  1. Revert `src/routes/recipes/new.tsx` guard to `requireVerifiedAuth()`.
  2. Revert `src/lib/auth.ts` hook addition.
  3. Recipes already saved with `pendingVerification: true` remain in DB but are filtered from all queries — no data loss.
  4. A follow-up migration can remove the flag from existing documents if needed.
- Data migration considerations: `pendingVerification` field uses `$ne: true` semantics (matches absent, null, false) — no backfill needed for existing recipes, consistent with the `deleted` field pattern already in use.
- Verification after rollback: Run integration test suite; confirm `recipes.list` public query returns expected results.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix failing tests before requesting re-review.
- If security checks fail: Treat as a blocker. No exceptions for the "pending recipes never leak" integration test.
- If required reviews are blocked/stale: Ping reviewer after 24 hours. Escalate to repo owner after 48 hours.
- Escalation path and timeout: If spike reveals Better-Auth hook is absent after 1 working day of investigation, fall back to Option A and update artifacts before continuing.

## Open Questions

None. All design questions were resolved during exploration:

- `afterEmailVerification` hook confirmed in the installed `better-auth` version. Signature: `async ({ user }) => void`, same shape as `sendVerificationEmail`. Option C is the definitive finalization path — no fallback to Option A needed.
