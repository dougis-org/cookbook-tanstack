## GitHub Issues

- dougis-org/cookbook-tanstack#664

## Why

- Problem statement: `src/server/trpc/routers/users.ts` has two pre-existing issues surfaced by an automated Verity review during PR #661: (1) the `search` and `updateProfile` procedures call `getMongoClient().db().collection("user")` directly instead of the project's `getBetterAuthCollection("user")` singleton helper, and (2) `search`'s input schema (`z.string().min(2)`) has no upper bound on query length, letting an arbitrarily long string be built into a `$regex` prefix match against `email`/`name`.
- Why now: both are narrow, low-risk, already-diagnosed fixes with a suggested patch in the issue body. Cheap to land before they accumulate alongside further edits to this file.
- Business/user impact: no user-facing behavior change. Convention consistency (finding 1) reduces future maintenance risk (typing, connection pooling, instrumentation won't reach these two call sites without a separate fix). Query bound (finding 2) reduces unnecessary attack surface / resource-usage risk for `search`, which is gated behind `executive-chef` tier + `verifiedProcedure`, so exposure is limited to verified, paying users, not anonymous traffic — not an active incident.

## Problem Space

- Current behavior:
  - `search` (line 77) and `updateProfile` (line 125) each call `getMongoClient().db().collection("user")` directly, bypassing `getBetterAuthCollection("user")` defined in `src/db/index.ts`.
  - `search`'s input is `z.object({ query: z.string().min(2) })` — no `.max()`. The query is regex-escaped before use (`input.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`), so this is not a ReDoS vector via regex metacharacters; it is an unbounded-length-string resource/attack-surface concern.
- Desired behavior:
  - Both call sites use `getBetterAuthCollection("user")`.
  - `search`'s input schema trims whitespace and rejects queries longer than 254 characters.
- Constraints:
  - `getBetterAuthCollection`'s `name` parameter is typed as `"user" | "session" | "account" | "verification"` — both call sites already use `"user"`, so no type change is needed.
  - No change to the `$regex` escaping logic, tier gating, or `verifiedProcedure` wrapper.
- Assumptions:
  - `getBetterAuthCollection`'s default client parameter (`getMongoClient().db()`) is behaviorally identical to today's direct call — confirmed by reading `src/db/index.ts`; swapping call sites should have no functional side effect beyond consistency.
  - 254 characters (RFC 5321 max email address length) is the agreed bound, since `search` matches against `email` as well as `name`.
  - `.trim()` is included alongside `.max()` and `.min()`, per requester decision — trimming happens before the `min(2)`/`max(254)` checks (Zod applies `.trim()` before length validators when chained as `.trim().min(2).max(254)`).
- Edge cases considered:
  - Query exactly 254 characters (post-trim): must still succeed (boundary inclusive).
  - Query of 255+ characters (post-trim): must be rejected by Zod validation (client sees a validation error, not a server error).
  - Existing queries between 2 and 254 characters: unaffected.
  - Leading/trailing whitespace: now trimmed before length validation — e.g. `"  ab  "` (6 chars) trims to `"ab"` (2 chars) and passes `min(2)`; `" a"` (2 chars untrimmed) trims to `"a"` (1 char) and now **fails** `min(2)` where it previously passed. This is an intentional, requester-approved behavior change.

## Scope

### In Scope

- `src/server/trpc/routers/users.ts`:
  - `search` procedure: replace `getMongoClient().db().collection("user")` with `getBetterAuthCollection("user")`; update the `query` input validator to `z.string().trim().min(2).max(254)`.
  - `updateProfile` procedure: replace `getMongoClient().db().collection("user")` with `getBetterAuthCollection("user")`.
  - Add/adjust the `getBetterAuthCollection` import from `@/db`.
- `src/server/trpc/routers/__tests__/users.test.ts`: add coverage for the max-length rejection; verify existing tests still pass against the singleton-based collection access (adjusting mocks as needed).

### Out of Scope

- `src/server/trpc/routers/admin.ts` (line 47), `notifications.ts` (line 33), and `cookbooks.ts` (line 642) also call `getMongoClient().db().collection('user')` directly, bypassing the same helper. Issue #664 scopes only to `users.ts`; these are a separate, pre-existing convention-drift issue and are explicitly not touched here.
- Any change to the `$regex` escaping approach, the tier-gating logic (`hasAtLeastTier`), or the `verifiedProcedure`/`protectedProcedure` wrappers.
- Any change to `getBetterAuthCollection`'s signature or the `getMongoClient` singleton itself.

## What Changes

- `users.ts` `search`: `getMongoClient().db().collection("user")` → `getBetterAuthCollection("user")`.
- `users.ts` `search`: input schema `z.string().min(2)` → `z.string().trim().min(2).max(254)`.
- `users.ts` `updateProfile`: `getMongoClient().db().collection("user")` → `getBetterAuthCollection("user")`.
- Test coverage added for: query-length rejection at the 254-character boundary, and trim-then-validate behavior (whitespace-padded queries).

## Risks

- Risk: `getBetterAuthCollection`'s default parameter evaluation (`client: any = getMongoClient().db()`) could differ subtly from the current inline call in a way tests don't already cover (e.g. mock setup in `users.test.ts` may target `getMongoClient` directly and need updating to also cover/allow `getBetterAuthCollection`).
  - Impact: test breakage or, in the worst case, a runtime call to the wrong collection if mocking is done incorrectly.
  - Mitigation: run the full `users.test.ts` suite after the swap; adjust mocks explicitly rather than relying on pass-through behavior. `getBetterAuthCollection` is already used elsewhere in the codebase (implied by its existence in `src/db/index.ts`), so this is a well-trodden path, not a novel integration.
- Risk: adding `.trim()` changes acceptance behavior for whitespace-padded queries at the `min(2)` boundary (see Edge Cases above) — a query that currently passes may now be rejected.
  - Impact: low — affects only queries where trimming removes 1+ characters and the trimmed result is under 2 characters. This is an intentional, requester-approved tightening, not an accidental regression.
  - Mitigation: covered by a dedicated test case (see Scope); documented explicitly in this proposal and design.md.

## Open Questions

None. Both ambiguities raised during explore mode (`.trim()` inclusion and the numeric max-length bound) were resolved directly with the requester before this proposal was finalized: `.trim()` is included, and the bound is 254 characters (RFC 5321 max email length).

## Non-Goals

- Not fixing the same `getMongoClient().db().collection('user')` pattern in `admin.ts`, `notifications.ts`, or `cookbooks.ts`.
- Not changing the `search` procedure's authorization model (tier gating, `verifiedProcedure`).
- Not addressing the `updateProfile` fallback branch's defensive "driver quirks" re-query logic (lines 161–169) — noted during exploration as adjacent dead-code-shaped complexity, but out of scope for this change.
- Not introducing rate limiting or additional abuse controls on `search` beyond the length bound.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
