## GitHub Issues

- #677

## Why

- Problem statement: `src/server/trpc/context.ts` computes `collabCookbookIds` via `Collaborator.find()` unconditionally, on every authenticated request, with no error handling. If that query throws, the whole request fails — even though `collabCookbookIds` is only ever read by `cookbooks.ts` procedures (`list`, `get`, `update`). Requests to `recipes.ts`, `privateRecipeNotes.ts`, and `alexa.ts` pay the query's failure risk for a value they never consume. `#671` added an adjacent `sharedOwnerIds` block that instead degrades to `[]` on failure (fail-closed), so the same function now has two structurally similar blocks with different, undocumented failure semantics.
- Why now: #677 was opened specifically to make this decision deliberately rather than leave it as an accident of build order between #420 (Collaborative Cookbooks) and #671 (Share My Library).
- Business/user impact: Today, a transient `Collaborator` lookup blip (e.g. a Mongo hiccup) causes unrelated features — recipe browsing, private notes, Alexa skill calls — to 500 for authenticated users, with no path to retry short of the client re-sending the request blind.

## Problem Space

- Current behavior: `collabCookbookIds` is computed eagerly in `createContext` for every authenticated request; an unhandled exception propagates and fails the entire request regardless of which procedure was invoked.
- Desired behavior: A `Collaborator` lookup failure should only affect the `cookbooks.ts` procedures that actually consume `collabCookbookIds`, and when it does fail, it should surface as an explicit, retry-friendly `TRPCError` rather than an unhandled exception or a silent `[]` fallback.
- Constraints:
  - Must not change the fail-closed behavior already shipped for `sharedOwnerIds` (#671) — that is a deliberate, separately-documented decision (`share-my-library/design.md`, Decision 4) and is out of scope here.
  - Must not widen `collabCookbookIds`'s semantics (still: "cookbook IDs the current user collaborates on") — this is a failure-handling and scoping change, not a behavior change to collaboration access itself.
  - `visibilityFilter(ctx.user, collabCookbookIds)` (in `_helpers.ts`) already defaults the second argument to `[]`, so callers that don't pass it are unaffected either way.
- Assumptions:
  - The existing `recipes.ts:433` / `recipes.ts:526` pattern (`TRPCError` with a "Please try again" / "Try again later" message) is the house convention for router-level, user-facing retryable failures, and should be followed here rather than inventing new error copy or a new fail-closed convention.
  - No other router will start consuming `collabCookbookIds` before this change lands (verified via grep: only `cookbooks.ts` reads it today).
- Edge cases considered:
  - A caller with zero collaborations (`Collaborator.find` returns `[]` successfully) must behave exactly as today — no error, empty array.
  - Concurrent calls to multiple `cookbooks.ts` procedures in one request session (e.g. via tRPC batching) should not trigger duplicate `Collaborator.find()` queries if the lookup is memoized per-request.
  - A caller who is a collaborator on some cookbooks but hits a lookup failure while calling `recipes.ts` or `privateRecipeNotes.ts` must see no change at all (no query attempted, no error raised) — that's the point of the scoping.

## Scope

### In Scope

- Retrofit `collabCookbookIds` in `src/server/trpc/context.ts` so the `Collaborator.find()` query is not run unconditionally for every request — scope it to where it's actually consumed (`cookbooks.ts`), via a lazy/memoized accessor or an equivalent mechanism that avoids the eager query.
- On lookup failure, throw a `TRPCError` (matching the existing `recipes.ts` retry-message convention) instead of letting a raw exception propagate, and instead of degrading to `[]`.
- Update the in-code comment block (currently `context.ts:23-30`) to state the finished rationale for why `collabCookbookIds` and `sharedOwnerIds` now intentionally differ, closing out #677's "if no, document why" branch with a concrete "yes, and here's the shape" answer.
- Update/add tests covering: success path unchanged, failure path scoped to `cookbooks.ts` only, failure path produces the expected `TRPCError`.

### Out of Scope

- Changing `sharedOwnerIds`'s fail-closed behavior or its design rationale (#671 / `share-my-library` design.md Decision 4).
- Any change to `Collaborator` schema, indexes, or the collaboration data model itself.
- Broader refactor of `createContext` beyond what's needed to scope this one lookup (e.g. not generalizing to a lazy-context-value framework unless the design work concludes that's the simplest correct shape for just this one case).

## What Changes

- `src/server/trpc/context.ts`: `collabCookbookIds` construction moves from eager/unconditional to lazy/scoped, wrapped to throw a `TRPCError` on failure instead of propagating raw or degrading to `[]`.
- `src/server/trpc/routers/cookbooks.ts` (or wherever the lazy accessor is invoked): reads trigger the lookup and its failure mode at the point of use.
- Updated code comments documenting the now-deliberate asymmetry with `sharedOwnerIds`.
- New/updated tests in `src/server/trpc/__tests__/context.test.ts` and/or `src/server/trpc/routers/__tests__/cookbooks.test.ts`.

## Risks

- Risk: Scoping the lookup to be lazy could introduce duplicate queries per request if multiple `cookbooks.ts` procedures each trigger their own fetch instead of sharing one memoized result.
  - Impact: Extra Mongo round-trips per request; performance regression vs. today's single eager query.
  - Mitigation: Memoize the lazy accessor per-request (e.g. cache the promise on first access) so repeated reads within the same context resolve to one underlying query — design.md will specify the exact mechanism.
- Risk: A future router starts consuming `collabCookbookIds` without realizing the value is now lazy/scoped, and doesn't handle the thrown `TRPCError`.
  - Impact: Unhandled error surfaces as a generic 500 instead of the intended retry-friendly message, in a router the author didn't expect to fail this way.
  - Mitigation: Document the accessor's contract clearly at its definition site; the thrown `TRPCError` is a normal tRPC error either way, so even an unaware caller gets tRPC's standard error handling — it just won't get a custom message.
- Risk: Retrofitting failure handling changes observable behavior for existing `cookbooks.ts` callers (previously: unhandled exception → generic 500; now: explicit `TRPCError` with different code/message).
  - Impact: Any client-side error-handling logic keyed on the old error shape could behave differently.
  - Mitigation: Confirm no client code branches on the specific shape of today's unhandled `Collaborator.find()` exception (unlikely, since it was never a designed error contract) as part of design/tasks verification.

## Open Questions

- Question: Should the lazy `collabCookbookIds` accessor live on `ctx` itself (e.g. `ctx.getCollabCookbookIds()` returning a memoized promise), or should the `Collaborator.find()` call move entirely into `cookbooks.ts` as a per-procedure lookup with no `ctx` involvement at all?
  - Needed from: design phase — this is a design decision, not a proposal-level ambiguity; design.md will resolve it based on which shape best avoids duplicate queries and keeps `context.ts` a thin session/auth layer.
  - Blocker for apply: no
- Question: What `TRPCError` code should a `Collaborator` lookup failure use — `INTERNAL_SERVER_ERROR` (matches the underlying infra failure) or something more specific?
  - Needed from: design phase, following the existing `recipes.ts` precedent.
  - Blocker for apply: no

## Non-Goals

- Not introducing a general-purpose lazy-context-value abstraction for future use cases beyond this one lookup.
- Not changing the collaboration authorization model (who counts as a collaborator, what `Collaborator.find()` queries).
- Not revisiting whether `sharedOwnerIds` should itself change — that decision stands as shipped.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
