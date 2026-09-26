## Context

- Relevant architecture: `src/server/trpc/context.ts` (`createContext`) builds per-request context consumed by all tRPC routers. `collabCookbookIds` is currently an eagerly-resolved `string[]` field on `Context`. It is read in exactly three places, all in `src/server/trpc/routers/cookbooks.ts`: `list` (line 301), `byId` (line 334), `printById` (lines 401, 407, 423). `visibilityFilter` (`_helpers.ts:29-55`) accepts `collabCookbookIds` as an optional parameter defaulting to `[]`, so callers that don't pass it (recipes.ts, privateRecipeNotes.ts) are structurally unaffected by this change.
- Dependencies: `Collaborator` model (`@/db/models`), tRPC's `Context` type (inferred via `Awaited<ReturnType<typeof createContext>>`, exported from `context.ts:50`).
- Interfaces/contracts touched: the `Context` type shape (one field changes from `string[]` to an accessor function); the three `cookbooks.ts` call sites that read `ctx.collabCookbookIds` directly.

## Goals / Non-Goals

### Goals

- A `Collaborator.find()` failure only affects `cookbooks.ts` procedures, never `recipes.ts` / `privateRecipeNotes.ts` / `alexa.ts`.
- A `Collaborator.find()` failure surfaces as an explicit `TRPCError` with a retry-friendly message, matching the existing `recipes.ts:433`/`:526` convention — not a raw unhandled exception, not a silent `[]` fallback.
- Within a single request, at most one `Collaborator.find()` query executes even if multiple `cookbooks.ts` code paths read the value (memoization).
- The success path (`Collaborator.find()` resolves normally) is behaviorally identical to today — same IDs, same shape, once resolved.

### Non-Goals

- Not changing `sharedOwnerIds`'s fail-closed behavior (#671 / `share-my-library` design.md Decision 4) — that block is untouched.
- Not building a general lazy-context-value abstraction for future fields — this is a one-off accessor shaped for this field only.
- Not changing what counts as a collaborator or the `Collaborator` schema/query itself.

## Decisions

### Decision 1: Lazy, memoized accessor lives on `ctx`, not moved into `cookbooks.ts`

- Chosen: Replace the eager `collabCookbookIds: string[]` field with `getCollabCookbookIds(): Promise<string[]>` on `Context`, a closure-memoized function created inside `createContext`. First call executes `Collaborator.find()`; the resulting promise is cached in a closure variable, so subsequent calls within the same request (e.g. `byId` calling it once, `printById` calling it twice) reuse the same in-flight or resolved promise instead of re-querying.
- Alternatives considered:
  1. Move `Collaborator.find()` entirely into `cookbooks.ts` as a router-local helper, called independently by each of the three procedures.
  2. Keep the field eager but wrap it in `try/catch` in `context.ts`, throwing `TRPCError` immediately on failure (current shape, just loud instead of silent).
- Rationale: Option 2 doesn't solve the actual problem — an eager query in `createContext` still runs (and can still fail) for every authenticated request regardless of which router is invoked, so `recipes.ts`/`alexa.ts` calls would still pay the failure risk. Option 1 avoids that, but tRPC's `createContext` runs once per request even when a client batches multiple procedure calls, so a router-local helper would need its own memoization mechanism anyway — duplicating the same closure-cache pattern three times (once per call site) instead of once in `context.ts`. Keeping one memoized accessor on `ctx` gives every `cookbooks.ts` call site a single `await ctx.getCollabCookbookIds()` with no per-call-site cache logic to get wrong.
- Trade-offs: `Context`'s shape changes from a plain data bag to one containing a function, which is a minor departure from the rest of the type (`sharedOwnerIds` stays a plain resolved array, since its `try/catch` already resolves eagerly to a real value or `[]`). This asymmetry is intentional and will be called out in the updated code comment (Decision 4).

### Decision 2: Failure mode — throw `TRPCError`, matching the `recipes.ts` retry-message convention

- Chosen: When the underlying `Collaborator.find()` rejects, `getCollabCookbookIds()`'s returned promise rejects with `new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to load cookbook collaborations. Please try again." })`, after logging the original error with `console.error` (mirroring the existing `sharedOwnerIds` log line at `context.ts:42`, adjusted to name the failing lookup).
- Alternatives considered:
  1. Fail closed — resolve to `[]` on failure, matching `sharedOwnerIds`.
  2. Let the raw Mongoose/Mongo exception propagate unwrapped.
- Rationale: Fail-closed (option 1) was explicitly rejected — for `collabCookbookIds`, degrading silently to "no collaborations" on a transient infra blip is a silent scope reduction (a real collaborator loses access to shared cookbooks with no visible error), which is worse for debuggability than a loud, retryable failure and was the specific outcome ruled out during exploration. Option 2 (raw propagation) is today's behavior and has no user-facing retry guidance — `recipes.ts` already establishes the house convention of wrapping retryable infra failures in a `TRPCError` with an actionable message, so this reuses that convention rather than inventing new error copy or a new failure-handling shape.
- Trade-offs: None significant — this is strictly more informative than today's behavior for the cases where it fires (which is now a smaller set of requests than today, per Decision 1).

### Decision 3: `printById`'s inline `ctx.collabCookbookIds.includes(...)` check moves to the resolved array

- Chosen: `printById` (`cookbooks.ts:420-424`) currently reads `ctx.collabCookbookIds` synchronously to compute `isAuthorized`. After this change, `printById` calls `await ctx.getCollabCookbookIds()` once at the top (alongside the `visFilter`/`recipeVisFilter` calls at lines 401/407, which already need the resolved array), storing the result in a local `collabCookbookIds` variable reused for both the `visibilityFilter` calls and the `isAuthorized` check.
- Alternatives considered: Leave the `includes` check reading a synchronous field and only make the `visibilityFilter` call sites async — rejected, since it would require two different access patterns for the same conceptual value in the same procedure, which is more confusing than resolving once at the top of the procedure.
- Rationale: `printById` already needs the resolved value twice for `visibilityFilter` (lines 401 and 407); resolving once and reusing the local variable for the `isAuthorized` check as well keeps the memoization benefit (one query) explicit at the call site instead of relying purely on the `ctx`-level cache.
- Trade-offs: `printById`'s procedure body gains one `await` at the top; negligible.

### Decision 4: Update the `context.ts` comment block to state the finished rationale

- Chosen: Replace the current comment (`context.ts:23-30`, which describes `sharedOwnerIds` and explicitly defers the `collabCookbookIds` decision to "#677 tracks the deliberate follow-up decision") with a comment on the `collabCookbookIds` block explaining: it's lazy/scoped to `cookbooks.ts` consumers only, it fails loud with a `TRPCError` on lookup failure (unlike `sharedOwnerIds`, which fails closed), and why — pointing at this change's `design.md` for the full rationale, the same way the existing comment points at `share-my-library/design.md`.
- Alternatives considered: Leave the old comment as-is and only add a new one — rejected, since the old comment's unresolved-question framing ("#677 tracks the deliberate follow-up decision on whether to retrofit...") becomes stale and misleading once this change lands.
- Rationale: This directly closes out #677's second investigation branch ("If no, document in context.ts why the two blocks differ") with a concrete, linked answer, rather than leaving a future reader to reconstruct the reasoning from two different design docs.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: "Retrofit `collabCookbookIds`... scope it to where it's actually consumed"
  - Design decision: Decision 1
  - Validation approach: Unit test asserting `Collaborator.find` is not called when a `recipes.ts`/`privateRecipeNotes.ts`/`alexa.ts` procedure is invoked in the same request.
- Proposal element: "On lookup failure, throw a `TRPCError`... instead of letting a raw exception propagate, and instead of degrading to `[]`"
  - Design decision: Decision 2
  - Validation approach: Unit test mocking `Collaborator.find` to reject, asserting `cookbooks.ts` procedures reject with the expected `TRPCError` code/message.
- Proposal element: "Update the in-code comment block... to state the finished rationale"
  - Design decision: Decision 4
  - Validation approach: Manual review during PR — no automated test for comment content.
- Proposal element: Memoization / no duplicate queries (Problem Space edge case)
  - Design decision: Decision 1 (closure-cached promise), Decision 3 (single resolve per procedure)
  - Validation approach: Unit test asserting exactly one `Collaborator.find` call when `printById` is invoked (which reads the value at two `visibilityFilter` call sites plus the `isAuthorized` check).

## Functional Requirements Mapping

- Requirement: `cookbooks.ts` procedures (`list`, `byId`, `printById`) resolve `collabCookbookIds` identically to today on the success path.
  - Design element: Decision 1 (`getCollabCookbookIds()` resolves to the same `string[]` `Collaborator.find()` always produced).
  - Acceptance criteria reference: specs/context-collaboration-lookup (success-path scenario).
  - Testability notes: Existing `cookbooks.test.ts` fixtures for `list`/`byId`/`printById` should pass unmodified aside from awaiting the new accessor in test setup if they construct `ctx` directly.
- Requirement: Non-`cookbooks.ts` procedures never trigger or fail on a `Collaborator` lookup.
  - Design element: Decision 1 (lazy — accessor is only invoked where read).
  - Acceptance criteria reference: specs/context-collaboration-lookup (isolation scenario).
  - Testability notes: Mock `Collaborator.find` to throw; call a `recipes.ts` procedure; assert no error and `Collaborator.find` not called.
- Requirement: A `Collaborator` lookup failure inside `cookbooks.ts` produces a `TRPCError`, not a raw exception or silent `[]`.
  - Design element: Decision 2.
  - Acceptance criteria reference: specs/context-collaboration-lookup (failure scenario).
  - Testability notes: Mock `Collaborator.find` to reject with a generic `Error`; assert the procedure call rejects with `TRPCError` `code: "INTERNAL_SERVER_ERROR"` and the specified message.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: `Collaborator` lookup failures must not take down unrelated requests.
  - Design element: Decision 1.
  - Acceptance criteria reference: specs/context-collaboration-lookup (isolation scenario).
  - Testability notes: Covered by the isolation unit test above; also verifiable by grepping that no non-`cookbooks.ts` router file references `getCollabCookbookIds`.
- Requirement category: performance
  - Requirement: No more than one `Collaborator.find()` query per request regardless of how many times the value is read.
  - Design element: Decision 1 (closure memoization), Decision 3 (single resolve in `printById`).
  - Acceptance criteria reference: specs/context-collaboration-lookup (memoization scenario).
  - Testability notes: Spy on `Collaborator.find`, invoke `printById` (which reads the value at 3 call sites), assert call count is 1.
- Requirement category: operability
  - Requirement: Lookup failures are logged with enough context to diagnose (mirroring the existing `sharedOwnerIds` log line).
  - Design element: Decision 2 (`console.error` before throwing).
  - Acceptance criteria reference: specs/context-collaboration-lookup (failure scenario).
  - Testability notes: Assert `console.error` (spied) is called with a recognizable prefix (e.g. `[context.collabCookbookIds]`) when the mocked lookup rejects.

## Risks / Trade-offs

- Risk/trade-off: Changing `Context.collabCookbookIds` from a plain array to an accessor function is a breaking type change for any test or code constructing `Context` objects directly (e.g. router unit tests that stub `ctx`).
  - Impact: Existing test fixtures in `cookbooks.test.ts` and any shared test-context builder (`__tests__/test-helpers.ts`) will fail to compile/type-check until updated.
  - Mitigation: Tasks phase includes updating all test fixtures that construct a `Context`-shaped object to provide `getCollabCookbookIds` instead of `collabCookbookIds`; a grep for `collabCookbookIds` across `__tests__/` will enumerate every site needing an update.
- Risk/trade-off: `alexa.ts` (`context.ts` alternate context builder, lines ~24/35 per earlier grep) also constructs a context object with `collabCookbookIds: []` — this needs the same field rename to stay type-compatible with `Context`.
  - Impact: If missed, `alexa.ts` fails to compile.
  - Mitigation: Tasks phase explicitly includes updating `alexa.ts`'s context construction to match the new shape (a trivial accessor returning `Promise.resolve([])`, since Alexa requests never collaborate on cookbooks).

## Rollback / Mitigation

- Rollback trigger: Post-merge discovery that some other router unexpectedly depended on `collabCookbookIds` being synchronously available (not found in current grep, but tasks-phase verification will re-check), or that memoization introduced a request-scoping bug (e.g. leaking a cached promise across requests, which would only happen if the closure were incorrectly hoisted outside `createContext`).
- Rollback steps: Revert the commit(s) touching `context.ts`, `cookbooks.ts`, and `alexa.ts`. This is a pure code change with no data migration, so a revert fully restores prior behavior.
- Data migration considerations: None — no schema or persisted-data changes.
- Verification after rollback: Re-run the existing `cookbooks.test.ts` and `context.test.ts` suites to confirm the pre-change eager/unconditional behavior is restored.

## Operational Blocking Policy

- If CI checks fail: Fix the failing test/lint/type-check before merging; this change has no infra dependency that would cause a flaky CI failure unrelated to the code itself.
- If security checks fail: Treat as blocking — this change touches authorization-adjacent code (`visibilityFilter` inputs), so any Codacy/Snyk finding on the modified lines must be resolved or explicitly waived per the project's `verity waive` policy (requires a cited human-approved reason), never silently ignored.
- If required reviews are blocked/stale: Follow the project's standard PR auto-merge policy (`docs/standards/ci-cd.md`) — do not force-merge past an unresolved review comment.
- Escalation path and timeout: If a reviewer identifies a case where `collabCookbookIds` fail-loud behavior causes an unacceptable UX regression (e.g. a heavily-trafficked `cookbooks.list` call site now surfaces errors more often than desired), escalate back to design — this proposal explicitly scoped that trade-off as accepted, so reopening it means revisiting Decision 2, not silently patching around it.

## Open Questions

- None blocking. The two open questions raised in `proposal.md` (accessor shape on `ctx` vs. router-local; `TRPCError` code choice) are resolved by Decision 1 and Decision 2 above.
