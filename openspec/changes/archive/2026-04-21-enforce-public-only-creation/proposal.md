## GitHub Issues

- #389

## Why

- Problem statement: Home Cook and Prep Cook users can currently create private recipes and cookbooks by bypassing client-side UI restrictions and sending `isPublic: false` in TRPC requests.
- Why now: To enforce tiered feature sets and maintain the business model where private content is a premium feature.
- Business/user impact: Ensures that lower-tier users are restricted to public content as intended, while providing a seamless experience for those who may not know their tier's limits.

## Problem Space

- Current behavior: No server-side enforcement on `isPublic` field for create/update operations.
- Desired behavior: 
    - Creation: Coerce `isPublic` to `true` for lower tiers.
    - Update: Reject `isPublic: false` with `FORBIDDEN` error for lower tiers.
- Constraints: Must use `canCreatePrivate(tier)` helper from `src/lib/tier-entitlements.ts`.
- Assumptions: Admins should be exempt from these restrictions.
- Edge cases considered:
    - User downgrading tier: Existing private content remains private, but they cannot create new private content or update existing content to be private (though they shouldn't have existing private content if they were always low-tier).
    - Recipe import: Coercion should also apply to the `import` procedure.

## Scope

### In Scope

- `recipes.create`: Coerce `isPublic: true` for restricted tiers.
- `recipes.import`: Coerce `isPublic: true` for restricted tiers.
- `recipes.update`: Reject `isPublic: false` for restricted tiers.
- `cookbooks.create`: Coerce `isPublic: true` for restricted tiers.
- `cookbooks.update`: Reject `isPublic: false` for restricted tiers.
- Unit tests for all affected procedures.

### Out of Scope

- Changing visibility of existing content.
- UI changes (handled in other tasks/issues).
- Other entitlement enforcements (e.g., recipe limits).

## What Changes

- `src/server/trpc/routers/recipes.ts`: Logic added to `create`, `update`, and `import`.
- `src/server/trpc/routers/cookbooks.ts`: Logic added to `create` and `update`.
- `src/server/trpc/routers/__tests__/test-helpers.ts`: Enhanced to support tiered callers.
- `src/server/trpc/routers/__tests__/recipes.test.ts`: New test cases.
- `src/server/trpc/routers/__tests__/cookbooks.test.ts`: New test cases.

## Risks

- Risk: Users might be confused if their recipe is saved as public when they selected private.
  - Impact: Low (for create). Coercion is silent as per issue requirements.
  - Mitigation: UI should ideally reflect these limits, but server-side coercion is the safety net.
- Risk: Breaking existing workflows for higher-tier users.
  - Impact: Medium.
  - Mitigation: Thorough testing to ensure `sous-chef` and above remain unrestricted.

## Open Questions

- No unresolved ambiguity exists. The issue description is specific about coercion for create and rejection for update.

## Non-Goals

- Implementing a subscription/payment system.
- Refactoring the entire entitlement system.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
