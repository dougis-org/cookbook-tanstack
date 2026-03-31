## Context

The RecipeLike collection tracks which users have favourited which recipes via a compound-unique index on `{ userId, recipeId }`. Two existing endpoints use it:

- `recipes.isMarked` — point-lookup `RecipeLike.exists({ userId, recipeId })` for a single recipe
- `recipes.list` (when `markedByMe: true`) — `RecipeLike.find({ userId }).select('recipeId')` to obtain IDs for the `$in` filter

After #219 removed the dead `marked` schema field from the Recipe collection, no list or detail response carries a favourite-status signal. Clients must fire a separate `isMarked` call per recipe viewed, creating N+1 latency.

**Proposal mapping:**

| Proposal element | Design decision |
|---|---|
| Add `marked` to `Recipe` type | Add field to TypeScript interface; computed at query time, not stored |
| Hoist RecipeLike query in `list` | Single `RecipeLike.find` per authenticated list call, reused for filter + marking |
| `byId` marked status | `RecipeLike.exists` point-lookup added to byId handler |
| Dead code removal | Remove `{ marked: _marked }` strips from `list` items map and `update` mutation |
| Full test matrix | Separate describe blocks per procedure; all auth/anon/edge permutations |

## Goals / Non-Goals

**Goals:**
- `recipes.list` items include `marked: boolean` computed from RecipeLike for the caller
- `recipes.byId` response includes `marked: boolean` computed from RecipeLike for the caller
- Anonymous callers always receive `marked: false` with no DB query
- Single RecipeLike query per authenticated list call (not per item)
- Remove obsolete `marked` field strips from `update` and `list` items map
- Full test coverage: positive, negative, edge cases for both procedures

**Non-Goals:**
- Modifying `isMarked` / `toggleMarked` endpoints
- Adding `marked` to `create`, `update`, or `import` mutation responses
- UI changes (handled in #222)

## Decisions

### D1: Hoist RecipeLike.find in `list` — always run for authenticated users

**Current code (conditional):**
```
if (input?.markedByMe && ctx.user) {
  const likedDocs = await RecipeLike.find({ userId: ctx.user.id }).select('recipeId').lean()
  const likedIds = likedDocs.map(l => l.recipeId)
  filter._id = { $in: likedIds }
}
```

**After (hoisted):**
```
let likedIds: Set<string> | null = null
if (ctx.user) {
  const likedDocs = await RecipeLike.find({ userId: ctx.user.id }).select('recipeId').lean()
  likedIds = new Set(likedDocs.map(l => l.recipeId.toString()))
  if (input?.markedByMe) {
    filter._id = { $in: [...likedIds] }
  }
}
```

Then in the items map: `marked: likedIds ? likedIds.has(r._id.toString()) : false`

**Rationale:** One query, two uses. The Set provides O(1) per-item lookup. The existing compound index `{ userId: 1, recipeId: 1 }` makes `find({ userId })` efficient. Result is bounded by the user's total like count — expected to be small.

**Alternative considered:** Run `RecipeLike.find` only when `markedByMe` is absent, and use a synthetic `marked: true` when `markedByMe` is true. Rejected: more branching logic with the same number of DB calls in the common case.

### D2: byId — use RecipeLike.exists for point-lookup

```
const marked = ctx.user
  ? !!(await RecipeLike.exists({ userId: ctx.user.id, recipeId: input.id }))
  : false
```

**Rationale:** Mirrors the existing `isMarked` implementation exactly. `exists` is a lightweight Mongoose helper that uses the unique compound index; cheaper than `findOne` since it returns only `_id`. No need to hoist (single recipe — no set required).

### D3: Remove dead marked strips — clean delete, no replacement

The `{ marked: _marked, ...r }` in the `list` items map and `{ marked: _marked, ...d }` in `update` were stripping a Mongoose document field that no longer exists after #219. Deleting them is safe; the spread of the remaining fields is unchanged.

### D4: marked: boolean on Recipe interface (not optional)

Always present, always boolean (`false` for anon). No `undefined` or optional — consumers can rely on it without nullish checks.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Extra DB round-trip per authenticated list call | Bounded by like count; compound index; acceptable for current scale |
| `update` return shape doesn't include `marked` despite Recipe type declaring it | Router uses `any` cast; TypeScript won't surface this. Accepted tech debt — stricter return-type pass is future work |
| `RecipeDetail extends Recipe` now includes `marked` | Consistent and intentional; byId already computes it |

## Rollback / Mitigation

No schema migrations. All changes are in application code and types. Roll back by reverting the router and type changes. No data is written or deleted.

## Open Questions

_(none)_
