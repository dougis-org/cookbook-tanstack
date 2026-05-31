## GitHub Issues

- dougis-org/cookbook-tanstack#452

## Why

- Problem statement: New users who sign up hit an email verification wall before they can create a recipe, forcing three context switches (sign up → leave app → find email → click link → return) before experiencing any product value.
- Why now: Verification before value is a well-documented churn driver. The banner infrastructure (`VerificationBanner`) already exists; the auth guard swap is low-effort. The risk of deferring is low because pending recipes are not publicly visible until verified.
- Business/user impact: Reduces early churn for new sign-ups. Users feel the product work for them before being asked to do something. Pending recipe data also provides a signal on intent-but-churned users for future engagement.

## Problem Space

- Current behavior: `/recipes/new` uses `requireVerifiedAuth()` which redirects unverified users to `/auth/verify-email`. No recipe is ever saved before verification.
- Desired behavior: Unverified users can reach `/recipes/new`, fill in the form, and submit. The recipe is saved to the database with `pendingVerification: true`. After submit, they see a `PostSubmitVerifyGate` showing their saved recipe above a "verify to publish" prompt. On verification, pending recipes are automatically published via a `afterEmailVerification` hook in Better-Auth calling `publishPendingRecipes(userId)`.
- Constraints:
  - Pending recipes must never appear in public list queries, taxonomy counts, or any non-owner view.
  - Pending recipes must not count against a user's tier recipe limit (otherwise the deferred flow defeats itself).
  - Theme tokens only, no emoji in UI copy.
  - `/import` and `/change-tier` keep `requireVerifiedAuth()` — not in scope.
  - Do not break existing tests for `/recipes/new` — extend them.
- Assumptions:
  - Better-Auth exposes an `afterEmailVerification` hook in the `emailVerification` config block. **This must be confirmed as a spike before implementation of the finalization step.**
  - `pendingVerification: true` recipes owned by the user are readable by that owner (for the gate display and editing).
  - The owner can edit a pending recipe before verifying.
- Edge cases considered:
  - User verifies on a different device: the `afterEmailVerification` hook fires server-side, so client state is irrelevant.
  - User never verifies: pending recipes persist. Cleanup (30-day TTL + warning email) is deferred to a follow-up issue.
  - User submits multiple recipes before verifying: all accumulate as pending; all are published on verification.
  - Tier limit check: `usage.getOwned` must exclude pending recipes from the count.

## Scope

### In Scope

- Remove `requireVerifiedAuth()` from `/recipes/new`, replace with `requireAuth()`.
- Add `pendingVerification?: boolean` field to `IRecipe` model and Mongoose schema.
- Update `RecipeForm` to handle the unverified-submit branch: saves recipe with `pendingVerification: true`.
- New `PostSubmitVerifyGate` component shown after submit when user is unverified: displays saved recipe summary above a verify-email prompt with resend button.
- Update `recipes.list` tRPC procedure to exclude pending recipes from non-owner queries.
- Update `recipes.byId` to block non-owners from viewing pending recipes.
- Update `usage.getOwned` to exclude pending recipes from tier limit counts.
- Update taxonomy count queries to exclude pending recipes.
- Add `publishPendingRecipes(userId)` service function in `src/server/recipes/pendingRecipes.ts`.
- Wire `afterEmailVerification` hook in `src/lib/auth.ts` to call `publishPendingRecipes`.
- Spike: confirm `afterEmailVerification` hook name/signature in installed `better-auth` version.
- tRPC test confirming pending recipes never appear in public list queries.
- Extend (not replace) existing `/recipes/new` tests.

### Out of Scope

- 30-day cleanup / TTL for unclaimed pending recipes (follow-up issue).
- Warning email for pending-recipe users approaching TTL.
- `/import` and `/change-tier` auth guard changes.
- `sessionStorage` as a persistence strategy.

## What Changes

- `src/routes/recipes/new.tsx` — swap `requireVerifiedAuth()` to `requireAuth()`; handle unverified post-submit state.
- `src/db/models/recipe.ts` — add `pendingVerification?: boolean` field.
- `src/components/recipes/RecipeForm.tsx` — add unverified-submit branch; navigate to post-submit gate state.
- `src/components/recipes/PostSubmitVerifyGate.tsx` — new component (recipe summary + verify prompt + resend button).
- `src/server/recipes/pendingRecipes.ts` — new service: `publishPendingRecipes(userId)`.
- `src/lib/auth.ts` — add `afterEmailVerification` hook calling `publishPendingRecipes`.
- `src/server/trpc/routers/recipes.ts` — filter `pendingVerification: true` from public/non-owner queries in `list` and `byId`.
- `src/server/trpc/routers/usage.ts` — exclude pending recipes from owned recipe count.
- Taxonomy count queries — exclude pending recipes.

## Risks

- Risk: `afterEmailVerification` hook does not exist in the installed Better-Auth version.
  - Impact: Finalization of pending recipes on verification would require an alternative mechanism (Option A — session-load scan, or a custom API route).
  - Mitigation: Treat as a required spike in the first task. If the hook is absent, fall back to Option A (scan on `protectedProcedure` middleware on next authenticated request). Document the chosen fallback in `design.md` before continuing.

- Risk: Pending recipes leak into public queries via a missed filter site.
  - Impact: Unverified content becomes publicly visible, violating the constraint.
  - Mitigation: A dedicated tRPC integration test (`pending recipes never appear in public list`) is required and must pass before merge.

- Risk: Pending recipes count against tier limits, blocking users from benefiting from the deferred flow.
  - Impact: UX regression — user fills form, submits, but has "hit their limit."
  - Mitigation: Explicitly exclude `pendingVerification: true` recipes from `usage.getOwned` count.

## Open Questions

No open questions. All design decisions were resolved during exploration:

- The `afterEmailVerification` hook in the `emailVerification` config block is confirmed to exist in the installed version of `better-auth`. The `src/lib/auth.ts` config already uses the same extension pattern (`sendVerificationEmail`, `sendResetPassword`) confirming the hook signature. No spike required.

## Non-Goals

- 30-day TTL cleanup of unclaimed pending recipes.
- Any change to `/import` or `/change-tier` auth guards.
- Real-time / WebSocket notification when verification completes on another device.
- Admin tooling to view or manage pending recipes.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
