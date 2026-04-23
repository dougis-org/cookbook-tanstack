# Spec: Recipe Import Tier Gate

## Capability

`recipes.import` enforces two independent gates before saving:

1. **Tier gate** — user must be Sous Chef or higher (or admin)
2. **Count gate** — user must be under their tier recipe limit

Gates run in order: tier gate first, count gate second. Both throw `FORBIDDEN`.

## Behaviour Matrix

| Tier            | Under limit | At limit    |
|-----------------|-------------|-------------|
| `home-cook`     | FORBIDDEN   | FORBIDDEN   |
| `prep-cook`     | FORBIDDEN   | FORBIDDEN   |
| `sous-chef`     | allowed     | FORBIDDEN   |
| `executive-chef`| allowed     | FORBIDDEN   |
| admin (any tier)| allowed     | allowed     |

## Error Messages

- Tier gate failure: `"Recipe import requires Sous Chef or higher."`
- Count gate failure: `"Recipe limit reached for your plan"` (reuses `enforceContentLimit` message)

## Admin Bypass

`ctx.user.isAdmin === true` skips both gates. `canImport` is not called; `enforceContentLimit` early-returns.

## Count Semantics

Imported recipes count identically to created recipes. `enforceContentLimit` counts all non-deleted, non-`hiddenByTier` recipes for the user — the same query as in `recipes.create`. No special treatment for imports.

## Existing Behaviour Preserved

The `canCreatePrivate` coercion (already in the import path from PR #396) runs after both gates and is unaffected.
