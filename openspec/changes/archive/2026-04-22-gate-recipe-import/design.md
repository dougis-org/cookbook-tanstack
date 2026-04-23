# Design: Gate Recipe Import

## Approach

Two lines added to the `recipes.import` mutation, before any existing logic:

```typescript
// Tier gate — must precede count check (fail fast for restricted tiers)
if (!ctx.user.isAdmin && !canImport(ctx.user.tier as EntitlementTier)) {
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "Recipe import requires Sous Chef or higher.",
  });
}
// Count gate — reuses existing helper from recipes.create
await enforceContentLimit(ctx.user.id, ctx.user.tier ?? undefined, ctx.user.isAdmin ?? false, "recipes");
```

No new helpers, no new abstractions. Both `canImport` and `enforceContentLimit` already exist and are already imported or easily added to the existing import line.

## Why tier gate before count gate

A Home Cook or Prep Cook can never import regardless of their count. Running `enforceContentLimit` (a DB query) before the tier check would waste a round-trip for these users on every rejected call. Tier gate is pure in-memory — no I/O.

## Why `enforceContentLimit` and not a separate count

Imported recipes are semantically identical to created recipes — same model, same user quota. Reusing `enforceContentLimit` ensures consistent limit semantics and avoids duplicating the `hiddenByTier` exclusion logic.

## Existing test update required

The three existing `recipes.import` tests use `makeAuthCaller(user.id)` with no tier (defaults to `undefined`). `canImport(undefined)` → `false` (unknown tier treated as `home-cook`). These tests will fail after the gate is added and must be updated to `makeAuthCaller(user.id, { tier: "sous-chef" })`.
