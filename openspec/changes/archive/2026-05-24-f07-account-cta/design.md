## Context

- Relevant architecture: 
  - **TanStack Start & Router**: File-based routing in `src/routes/` (`account.tsx` and `pricing.tsx`).
  - **Tier and Entitlement System**: entitlements are defined statically in `src/lib/tier-entitlements.ts` (contains limits, pricing, display names, and descriptions).
  - **Auth State Hook**: `useAuth` hook gets active user session from the client.
- Dependencies: None.
- Interfaces/contracts touched: 
  - Link path routing contracts between `/account` and `/pricing`.
  - Search query param contracts in TanStack Router: passing `focus` from `/account` to `/pricing`.

## Goals / Non-Goals

### Goals

- Elevate `/account` page conversion by replacing the small text link with a primary CTA button targeted to the next subscription tier.
- Display context-aware information: the next tier's name and its monthly price (e.g., "Upgrade to Prep Cook — $2.99/mo").
- Add a secondary "Compare all plans →" text link below the button.
- Re-order UI layout: position the primary CTA and comparison link above the next tier preview card.
- Support `executive-chef` (top-tier) state by showing "You're on the top plan" inside the CTA card and hiding the upgrade button.
- Add type-safe query parameter validation on the `/pricing` route to cleanly accept the `focus` parameter without typescript issues.
- Maintain full test coverage for `/account` and its sub-components using Vitest.

### Non-Goals

- Implementation of the actual visual highlight styling on the `/pricing` page (highlighting a focused tier card is out-of-scope for F07).
- Changing stripe or tRPC database mutation actions.

## Decisions

### Decision 1: Query parameter validation via TanStack Router

- **Chosen**: Add a `validateSearch` hook to `/pricing` in `src/routes/pricing.tsx`.
- **Alternatives considered**: Hand-rolling raw URL parsing using `window.location` inside the component.
- **Rationale**: Using TanStack Router's built-in `validateSearch` method preserves standard type safety. It ensures that `<Link to="/pricing" search={{ focus: nextTier }}>` compiles under strict TypeScript and prevents runtime errors.
- **Trade-offs**: Requires adding search parameter types to the route definition, but this is a standard and safe practice in this repository.

### Decision 2: Consolidated upgrade block rendering

- **Chosen**: Group all upgrade-related actions and previews inside a single conditional block that triggers based on `tier === 'executive-chef'` and `nextTier` status.
- **Alternatives considered**: Splitting the button, comparison link, and next tier preview into individual, independent conditional blocks.
- **Rationale**: A consolidated block keeps layout structure extremely clean and ensures correct visual flow. The CTA button is rendered first, followed by the comparison link, and finally the next tier details block.
- **Trade-offs**: None. This is highly readable and maintainable code.

## Proposal to Design Mapping

- **Proposal element**: Replace pricing link with primary CTA.
  - **Design decision**: Decision 2 (Consolidated upgrade block rendering).
  - **Validation approach**: Unit tests in `src/routes/__tests__/-account.test.tsx` verifying that a button is rendered instead of a link when `nextTier` is present.
- **Proposal element**: Link to `/pricing?focus={nextTier}`.
  - **Design decision**: Decision 1 (Query parameter validation).
  - **Validation approach**: Verify successful TypeScript compilation (`npx tsc --noEmit`) and write unit test assertions checking the `href` attribute on the primary CTA link.
- **Proposal element**: Show top tier plan block.
  - **Design decision**: Render static `"You're on the top plan"` box when `tier === 'executive-chef'`.
  - **Validation approach**: Unit test verifying the absence of the button and presence of the text.

## Functional Requirements Mapping

- **Requirement**: Display next tier name and monthly price on the primary button.
  - **Design element**: Dynamic JSX template: `Upgrade to {TIER_DISPLAY_NAMES[nextTier]} — ${TIER_PRICING[nextTier]?.monthly}/mo`.
  - **Acceptance criteria reference**: Acceptance criteria #1.
  - **Testability notes**: Render `/account` with mocked session tiers (`home-cook`, `prep-cook`) and assert correct button text contents.
- **Requirement**: Button directs to `/pricing?focus={nextTier}`.
  - **Design element**: Router `<Link to="/pricing" search={{ focus: nextTier }} className="...">`.
  - **Acceptance criteria reference**: Acceptance criteria #2.
  - **Testability notes**: Assert the `href` attribute value of the upgrade button is `/pricing?focus=prep-cook` (or matching next tier).

## Non-Functional Requirements Mapping

- **Requirement category**: Reliability & Operability.
  - **Requirement**: The app must handle fallback gracefully if the user's tier is unrecognized or malformed.
  - **Design element**: Defaults `tier` to `"home-cook"` as per existing fallback logic.
  - **Acceptance criteria reference**: Implicit.
  - **Testability notes**: Assert fallback logic does not throw exceptions.

## Risks / Trade-offs

- **Risk/trade-off**: TypeScript strict mode warning about missing `focus` property on Route search params.
  - **Impact**: App fails to build.
  - **Mitigation**: Add `validateSearch` to `/pricing` in `src/routes/pricing.tsx` so the router knows `focus` is an allowed string parameter.

## Rollback / Mitigation

- **Rollback trigger**: A regression or bug is identified in routing or layout causing compilation failures in production.
- **Rollback steps**: Revert files to their pre-change state via git: `git checkout HEAD -- src/routes/account.tsx src/routes/pricing.tsx src/routes/__tests__/-account.test.tsx`.
- **Data migration considerations**: None. No database migrations are included in this front-end layout change.
- **Verification after rollback**: Verify that `npm run test` passes cleanly.

## Operational Blocking Policy

- **If CI checks fail**: Do NOT merge. Fix all unit test issues locally by running `npm run test`.
- **If security checks fail**: Run security remediation steps according to standard repository guidelines.
- **If required reviews are blocked/stale**: Address code comments, request re-review, and do not bypass gates.

## Open Questions

None. The technical implementation details are simple, precise, and fully mapped.
