# Tests: Recipe Import Gate

## Test file

`src/server/trpc/routers/__tests__/recipes.test.ts`

## Updates to existing tests

The three existing tests in `describe("recipes.import")` use `makeAuthCaller(user.id)` with no tier. Change to `makeAuthCaller(user.id, { tier: "sous-chef" })` so they pass the new tier gate.

## New describe block

```
describe("recipes.import — tier gate and count limit")
```

### Tier gate cases

| Test | Setup | Expected |
|------|-------|----------|
| home-cook blocked | `makeAuthCaller(user.id, { tier: "home-cook" })` | rejects `{ code: "FORBIDDEN" }` |
| prep-cook blocked | `makeAuthCaller(user.id, { tier: "prep-cook" })` | rejects `{ code: "FORBIDDEN" }` |
| sous-chef allowed | `makeAuthCaller(user.id, { tier: "sous-chef" })`, 0 recipes | resolves with `{ name: ... }` |

### Count gate cases

| Test | Setup | Expected |
|------|-------|----------|
| sous-chef at limit | 500 existing recipes + sous-chef caller | rejects `{ code: "FORBIDDEN" }` |
| admin bypasses both | `makeAuthCaller(user.id, { tier: "home-cook", isAdmin: true })` | resolves |

### Notes

- For the "at limit" test, seed 500 recipes using `Recipe.insertMany` (not individual `.save()` calls) to keep the test fast.
- Use `rejects.toMatchObject({ code: "FORBIDDEN" })` — same pattern as `recipes.create` tier tests.
- Admin test uses `home-cook` tier deliberately to confirm admin bypasses the tier gate, not just the count gate.
