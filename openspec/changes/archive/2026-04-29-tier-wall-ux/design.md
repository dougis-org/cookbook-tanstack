## Context

- Relevant architecture: TanStack Start + tRPC + Better-Auth. tRPC router in `src/server/trpc/`, client hook layer in `src/hooks/`, components in `src/components/`. Session includes `user.tier` via Better-Auth `additionalFields` + `inferAdditionalFields` on the client.
- Dependencies: `src/lib/tier-entitlements.ts` (TIER_LIMITS, canCreatePrivate, canImport), `src/hooks/useAuth.ts` (session access), `src/routes/pricing.tsx` (link target), `src/server/trpc/init.ts` (error formatter insertion point).
- Interfaces/contracts touched: tRPC error shape (adds `data.appError`), mutation call sites that currently handle `FORBIDDEN`, any component rendering recipe/cookbook create buttons or the private toggle.

## Goals / Non-Goals

### Goals

- Typed, structured error metadata on all tRPC errors via a single `errorFormatter`
- Clear semantic distinction between ownership-FORBIDDEN and tier-PAYMENT_REQUIRED
- Client hook that delivers pre-computed tier entitlements to any component
- Reusable `TierWall` component covering both inline (tooltip/banner) and modal UX
- Pre-emptive disabled-state affordances on create buttons and feature toggles
- Server-error catch path that surfaces a modal TierWall instead of a generic toast

### Non-Goals

- Payment or subscription implementation
- Changing ownership FORBIDDEN behavior
- `/pricing` page redesign

## Decisions

### Decision 1: Error discrimination via `PAYMENT_REQUIRED` + `AppErrorCause` formatter

- Chosen: Switch tier-enforcement throws to `code: 'PAYMENT_REQUIRED'`. Add `errorFormatter` to `initTRPC.create()` in `src/server/trpc/init.ts` that reads `error.cause` and promotes it to `shape.data.appError: AppErrorCause | null`. Define `AppErrorCause` as a discriminated union.
- Alternatives considered: (A) Message-prefix parsing (`"[TIER] ..."`), (B) Custom `cause` without formatter (cause not serialized by default).
- Rationale: `PAYMENT_REQUIRED` maps cleanly to HTTP 402 semantics — no ambiguity with ownership errors. The formatter is a one-time investment in `init.ts` that benefits all future structured errors app-wide. Client receives fully typed `error.data.appError` with no string parsing.
- Trade-offs: Requires verifying all existing `FORBIDDEN` catch blocks at call sites before migrating tier throws. Formatter adds a small serialization step to every error.

```typescript
// src/server/trpc/init.ts
export type AppErrorCause =
  | { type: 'tier-wall'; reason: 'count-limit' | 'private-content' | 'import' }
  | { type: 'ownership' }

// errorFormatter reads error.cause and merges into shape.data
```

### Decision 2: `useTierEntitlements()` hook

- Chosen: New hook at `src/hooks/useTierEntitlements.ts` wrapping `useAuth()`. Returns `{ tier, canCreatePrivate, canImport, recipeLimit, cookbookLimit }`.
- Alternatives considered: Adding `tier` directly to `useAuth()` return value.
- Rationale: `useAuth` is about identity (who you are). Tier entitlements are about capability (what you can do). Separation keeps each hook focused and independently testable. Components import only what they need.
- Trade-offs: One extra import per component. Acceptable given the clarity gained.

### Decision 3: `TierWall` component with `display` prop

- Chosen: Single `TierWall` component at `src/components/ui/TierWall.tsx` with props `{ reason, display, onDismiss? }`. `display: 'inline'` renders a compact banner/tooltip suitable for wrapping a disabled button. `display: 'modal'` renders a dialog overlay with dismiss action.
- Alternatives considered: Two separate components (`TierTooltip` + `TierModal`).
- Rationale: The content (limit description, /pricing link) is identical across both modes. A single component with a display-mode prop avoids duplicating the messaging logic. The `reason` prop drives the copy.
- Trade-offs: Slightly more complex internal render logic vs. two simpler components. Manageable given the small surface area.

### Decision 4: Null-tier handling in `useTierEntitlements`

- Chosen: Treat null/undefined tier as `'home-cook'` (most-restrictive non-anonymous tier) for pre-emptive affordances. Do not defer rendering — use the fallback tier immediately.
- Alternatives considered: Show a loading state until tier is known; treat null as fully unrestricted.
- Rationale: The auth config sets `defaultValue: "home-cook"` — in practice tier is never null post-login. Using the restrictive default prevents a flash of enabled buttons. Unrestricted fallback would be a security UX regression.
- Trade-offs: A logged-in user with a genuine null tier (data anomaly) would see more restrictions than warranted. Acceptable given the default ensures this shouldn't occur.

## Proposal to Design Mapping

- Proposal element: Switch tier errors from FORBIDDEN to PAYMENT_REQUIRED
  - Design decision: Decision 1 (AppErrorCause + errorFormatter)
  - Validation approach: Unit test that a tier-enforcement mutation throw produces `error.data.appError.type === 'tier-wall'` on the client

- Proposal element: Client-side tier access via session
  - Design decision: Decision 2 (useTierEntitlements hook)
  - Validation approach: Unit tests for the hook covering all tier values and null

- Proposal element: TierWall component (inline + modal)
  - Design decision: Decision 3 (single component with display prop)
  - Validation approach: RTL tests for both display modes; Playwright test for modal dismiss and /pricing link

- Proposal element: Pre-emptive affordances on buttons/toggles
  - Design decision: Decisions 2 + 3 combined — hook provides entitlement flags, component renders inline TierWall
  - Validation approach: RTL tests asserting button disabled state per tier; Playwright test for tooltip appearance

- Proposal element: Session null-tier handling
  - Design decision: Decision 4 (home-cook fallback)
  - Validation approach: Hook unit test with null session

## Functional Requirements Mapping

- Requirement: "New Recipe" button disabled at recipe limit, shows upgrade tooltip
  - Design element: `useTierEntitlements().recipeLimit` + current recipe count (from existing tRPC list query) → `TierWall display="inline"`
  - Acceptance criteria reference: specs/pre-emptive-affordances.md
  - Testability notes: RTL test with mocked session at limit; Playwright test verifying disabled button + tooltip text

- Requirement: "New Cookbook" button disabled at cookbook limit
  - Design element: Same pattern as recipes using `cookbookLimit`
  - Acceptance criteria reference: specs/pre-emptive-affordances.md
  - Testability notes: RTL test with mocked session at limit

- Requirement: "Set to private" toggle hidden for Home Cook / Prep Cook
  - Design element: `useTierEntitlements().canCreatePrivate` → conditional render
  - Acceptance criteria reference: specs/pre-emptive-affordances.md
  - Testability notes: RTL test per tier value

- Requirement: Import entry point hidden/disabled for Home Cook / Prep Cook
  - Design element: `useTierEntitlements().canImport` → conditional render
  - Acceptance criteria reference: specs/pre-emptive-affordances.md
  - Testability notes: RTL test per tier value

- Requirement: Server-side PAYMENT_REQUIRED caught and shown as modal TierWall
  - Design element: mutation `onError` handler checks `error.data?.appError?.type === 'tier-wall'` → `TierWall display="modal"`
  - Acceptance criteria reference: specs/tier-wall-component.md
  - Testability notes: RTL test with mocked tRPC mutation error; Playwright test for full flow

- Requirement: TierWall links to /pricing
  - Design element: TierWall renders `<Link to="/pricing">` from `@tanstack/react-router`
  - Acceptance criteria reference: specs/tier-wall-component.md
  - Testability notes: RTL test asserting link href

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Graceful degradation if session or tier unavailable
  - Design element: Decision 4 (home-cook fallback); TierWall renders without crashing when tier is null
  - Acceptance criteria reference: specs/use-tier-entitlements.md
  - Testability notes: Hook unit test with null session; TierWall snapshot with null tier

- Requirement category: security
  - Requirement: Pre-emptive affordances are convenience only — server enforcement remains authoritative
  - Design element: No change to server-side enforcement logic; client UI is layered on top
  - Acceptance criteria reference: Implicit — server tests from #388–#390 cover this
  - Testability notes: No client-only bypass exists by design

- Requirement category: operability
  - Requirement: AppErrorCause is typed end-to-end
  - Design element: `AppErrorCause` exported from `init.ts`; tRPC type inference propagates to `TRPCClientError<AppRouter>`
  - Acceptance criteria reference: specs/app-error-cause.md
  - Testability notes: TypeScript compilation enforces type; no runtime test needed beyond basic formatter test

## Risks / Trade-offs

- Risk/trade-off: Existing FORBIDDEN catch blocks at mutation call sites may miss tier errors after the switch to PAYMENT_REQUIRED.
  - Impact: Medium — generic toast shown instead of TierWall for any call site not yet migrated.
  - Mitigation: Grep `FORBIDDEN` across all tRPC call sites before switching. Migrate all tier-enforcement throws atomically in a single task.

- Risk/trade-off: `error.cause` serialization through tRPC's error pipeline.
  - Impact: High if unhandled — appError would always be null on the client.
  - Mitigation: Verify in `errorFormatter` that `cause` is a plain object (not an Error instance) before spreading into `shape.data.appError`. Write a dedicated unit test.

## Rollback / Mitigation

- Rollback trigger: `error.data.appError` is consistently null on client after deploy; TierWall never renders; existing error toasts broken.
- Rollback steps: Revert `init.ts` formatter, revert tier-enforcement throws back to `FORBIDDEN` with original messages. No data migration needed — this is pure application logic.
- Data migration considerations: None — no DB schema changes.
- Verification after rollback: Run `npm run test` and `npm run test:e2e` against original behavior.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix failing tests before proceeding. TypeScript errors in `AppErrorCause` type usage are blocking.
- If security checks fail: Treat as blocking. Tier-wall bypass is a UX issue, not a security issue (server enforces), but any accidental removal of server enforcement is critical.
- If required reviews are blocked/stale: Ping reviewer after 24h. After 48h escalate to async self-merge if all checks pass and change is scoped to UI only.
- Escalation path and timeout: 48h review window; unblocked merge with passing CI after that for UI-only changes.

## Open Questions

No open questions. All design decisions were resolved during the explore session prior to proposal creation.
