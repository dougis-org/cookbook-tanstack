## GitHub Issues

- #391 (tier-wall and upgrade prompt UX)
- #387 (entitlement helpers — prerequisite, completed)

## Why

- Problem statement: When server-side tier enforcement throws `FORBIDDEN`, the client cannot distinguish a tier-wall error from an ownership or permissions error, so it cannot show contextual upgrade messaging. Users hitting a limit get a generic error toast with no path forward.
- Why now: Server-side enforcement (#388–#390) is in place. The UX layer is the remaining gap before the tier feature is user-facing.
- Business/user impact: Users who hit a tier limit currently see an opaque error. Clear upgrade prompts directly convert confusion into upgrade intent.

## Problem Space

- Current behavior: tRPC mutations throw `FORBIDDEN` for both ownership violations and tier enforcement. The client has no way to tell them apart. No tier-aware pre-emptive UI exists — buttons are enabled even when the user is already at their limit.
- Desired behavior: (1) Buttons and toggles are disabled pre-emptively when the user has exhausted their tier allowance. (2) If a tier wall is hit server-side, a contextual `TierWall` component appears (inline or modal) explaining the limit and linking to `/pricing`. (3) `FORBIDDEN` for ownership violations remains unchanged — only tier errors use the new path.
- Constraints: Must not duplicate tier logic — `canCreatePrivate`, `canImport`, and `TIER_LIMITS` from `src/lib/tier-entitlements.ts` are the single source of truth. Client tier data comes from the Better-Auth session (`session.user.tier`).
- Assumptions: `session.user.tier` is always present after login (defaultValue `"home-cook"` is set in auth config). The `/pricing` page (#393) exists and is linkable.
- Edge cases considered: Unauthenticated users (no tier), admin users (bypass all limits), tier data missing/null during session hydration, graceful degradation if session is unavailable.

## Scope

### In Scope

- `AppErrorCause` type and tRPC `errorFormatter` in `src/server/trpc/init.ts`
- Switch tier-enforcement throws from `FORBIDDEN` to `PAYMENT_REQUIRED` with typed `cause`
- `useTierEntitlements()` hook (`src/hooks/useTierEntitlements.ts`)
- `TierWall` component with `display: 'inline' | 'modal'` and `reason` prop
- Pre-emptive affordances: disabled "New Recipe" / "New Cookbook" buttons with inline TierWall tooltip
- Pre-emptive affordances: hide "Set to private" toggle for Home Cook / Prep Cook
- Pre-emptive affordances: hide/disable import entry point for Home Cook / Prep Cook
- Client-side catch of `PAYMENT_REQUIRED` at tRPC mutation call sites → modal TierWall

### Out of Scope

- Actual upgrade/payment flow (just links to `/pricing`)
- Changes to `/pricing` page design
- Admin tier-management UI
- Changing ownership-FORBIDDEN behavior
- Any server-side enforcement changes beyond the error code switch

## What Changes

- `src/server/trpc/init.ts` — add `errorFormatter` and `AppErrorCause` type; switch `adminProcedure` and `tierProcedure` FORBIDDEN throws to use cause (tier throws become `PAYMENT_REQUIRED`)
- `src/server/trpc/routers/_helpers.ts` — update `enforceContentLimit` to throw `PAYMENT_REQUIRED` with `cause: { type: 'tier-wall', reason: 'count-limit' }`
- `src/server/trpc/routers/cookbooks.ts` — update private-cookbook FORBIDDEN to `PAYMENT_REQUIRED` with `cause: { type: 'tier-wall', reason: 'private-content' }`
- `src/server/trpc/routers/recipes.ts` — update import/private FORBIDDEN to `PAYMENT_REQUIRED` with `cause: { type: 'tier-wall', reason: 'import' | 'private-content' }`
- `src/hooks/useTierEntitlements.ts` — new hook exposing `tier`, `canCreatePrivate`, `canImport`, `recipeLimit`, `cookbookLimit`
- `src/components/ui/TierWall.tsx` — new reusable component
- Recipe / cookbook create buttons and forms — consume `useTierEntitlements` for pre-emptive affordances and catch `PAYMENT_REQUIRED` for modal TierWall

## Risks

- Risk: Switching from `FORBIDDEN` to `PAYMENT_REQUIRED` could break existing error handling that checks for `FORBIDDEN`.
  - Impact: Medium — any catch block checking `error.data?.code === 'FORBIDDEN'` for tier errors would stop matching.
  - Mitigation: Grep all call sites before switching; only tier-enforcement throws change code. Ownership `FORBIDDEN` stays unchanged.

- Risk: Session hydration lag means `useTierEntitlements` returns null tier briefly on first render.
  - Impact: Low — buttons may flash as enabled then immediately disable.
  - Mitigation: Treat null tier as most-restrictive (home-cook defaults) or defer rendering affordances until `isPending` is false.

- Risk: `AppErrorCause` `cause` field is not serialized by default in tRPC's error pipeline.
  - Impact: High if unaddressed — `error.data.appError` would always be null on client.
  - Mitigation: Explicitly read `error.cause` inside `errorFormatter` and promote it to `shape.data.appError`. Verify with a test.

## Open Questions

No unresolved ambiguity. All design decisions have been made during the explore session:
- Error code: `PAYMENT_REQUIRED` (HTTP 402 semantics) ✓
- Error discrimination: `AppErrorCause` via `errorFormatter`, not message parsing ✓
- TierWall display modes: both `inline` and `modal` ✓
- Session access pattern: new `useTierEntitlements()` hook wrapping `useAuth()` ✓

## Non-Goals

- Building a payment or subscription flow
- Changing the visual design of `/pricing`
- Surfacing tier limits in admin tools
- Retroactively migrating historical `FORBIDDEN` errors outside tier enforcement

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
