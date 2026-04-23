# Proposal: Gate Recipe Import to Sous Chef and Above

## Problem

`recipes.import` is a `protectedProcedure` with no tier check. Any authenticated user — including Home Cook and Prep Cook — can call it. Per `docs/user-tier-feature-sets.md`, recipe import is a Sous Chef+ feature. Additionally, imported recipes must count toward the user's tier limit (same as created recipes), but `enforceContentLimit` is not called in the import path.

Closes GitHub issue #390.

## Scope

**In scope:**
- Add `canImport` tier gate to `recipes.import` mutation
- Add `enforceContentLimit` count check to `recipes.import` mutation
- Tests covering the 2×2 outcome matrix (tier gate × count limit) plus admin bypass

**Out of scope:**
- Import UI gating (tracked in #380)
- Changes to `canImport` logic in `tier-entitlements.ts` (already correct)

## Outcome

```
User tier     | Under limit | At limit
------------- | ----------- | --------
home-cook     | FORBIDDEN   | FORBIDDEN  (tier gate, not count gate)
prep-cook     | FORBIDDEN   | FORBIDDEN  (tier gate, not count gate)
sous-chef     | allowed     | FORBIDDEN  (count gate)
executive-chef| allowed     | FORBIDDEN  (count gate)
admin         | allowed     | allowed    (admin bypass)
```

Tier gate fires first — fail fast before DB count query for users who can never import.

## Dependencies

- `canImport` in `@/lib/tier-entitlements` — already implemented (#387)
- `enforceContentLimit` in `src/server/trpc/routers/_helpers.ts` — already implemented (#388)
- No new helpers needed

## Files affected

- `src/server/trpc/routers/recipes.ts` — add two checks to `import` mutation
- `src/server/trpc/routers/__tests__/recipes.test.ts` — new test suite for import gating
