## Context

- Relevant architecture: tRPC router `src/server/trpc/routers/users.ts`, part of the server-side API layer. Exposes `search`, `me`, `updateProfile` procedures under `usersRouter`. `search` and `updateProfile` are the two procedures touched.
- Dependencies: `src/db/index.ts` (`getMongoClient`, `getBetterAuthCollection`, `toHexString`); `src/server/trpc/init.ts` (`protectedProcedure`, `verifiedProcedure`, `router`); `src/types/user.ts` (`UserTier`, `TIER_RANK`, `hasAtLeastTier`); `zod`; `mongodb` (`ObjectId`).
- Interfaces/contracts touched:
  - `usersRouter.search` input contract: `{ query: string }` → tightened validation (`.trim().min(2).max(254)`), same output shape (`{ id, name, email }[]`).
  - Internal collection-access call sites in `search` and `updateProfile` (not part of the tRPC wire contract — callers are unaffected).

## Goals / Non-Goals

### Goals

- Route both `search` and `updateProfile` MongoDB `user` collection access through `getBetterAuthCollection("user")`.
- Bound `search`'s `query` input to a maximum of 254 characters, trimmed before validation.
- Preserve all existing `search` and `updateProfile` behavior for inputs that were valid before this change and remain valid after (i.e. no regression for queries in the 2–254 char range with no leading/trailing whitespace collapse issue).

### Non-Goals

- Not touching `admin.ts`, `notifications.ts`, or `cookbooks.ts`'s direct `getMongoClient().db().collection('user')` calls (tracked as separate future work).
- Not changing `getBetterAuthCollection`'s signature, default parameter, or the `BetterAuthCollectionName` type.
- Not adding rate limiting, additional authorization checks, or ReDoS mitigations beyond the existing regex-escaping (already safe against ReDoS per issue #664's own analysis).
- Not refactoring `updateProfile`'s `findOneAndUpdate` fallback branch (lines 161–169).

## Decisions

### Decision 1: Swap direct `getMongoClient()` calls for `getBetterAuthCollection("user")`

- Chosen: In both `search` (currently line 77) and `updateProfile` (currently line 125), replace `getMongoClient().db().collection("user")` with `getBetterAuthCollection("user")`. Add `getBetterAuthCollection` to the existing `import { getMongoClient, toHexString } from "@/db"` — drop `getMongoClient` from that import if nothing else in the file uses it directly (need to verify: `getMongoClient` is currently only used at those two call sites, so it can be dropped entirely from the import once both are swapped).
- Alternatives considered:
  1. Leave `getMongoClient` import and add `getBetterAuthCollection` alongside it, unused — rejected, `noUnusedLocals` is enabled in this project's `tsconfig.json`, so an unused import would fail the build.
  2. Pass an explicit client argument to `getBetterAuthCollection("user", getMongoClient().db())` — rejected as redundant; the function's default parameter already does exactly this.
- Rationale: `getBetterAuthCollection` exists specifically to centralize this pattern (per its own definition and the issue). Using it directly, relying on its default parameter, is the minimal, idiomatic fix and matches how the helper is intended to be called elsewhere in the codebase.
- Trade-offs: None functionally — same MongoDB client, same `.db()`, same collection name. Purely a call-site convention fix.

### Decision 2: Tighten `search`'s query validator to `z.string().trim().min(2).max(254)`

- Chosen: Replace `z.object({ query: z.string().min(2) })` with `z.object({ query: z.string().trim().min(2).max(254) })`.
- Alternatives considered:
  1. `.max(254)` without `.trim()` — rejected per requester decision during proposal approval; requester explicitly chose to include `.trim()`.
  2. A different max value (100, as originally suggested in issue #664, or 200) — rejected per requester decision; 254 was chosen to match RFC 5321's maximum email address length, since `search` matches against `email` as well as `name`.
  3. `.max()` applied before `.trim()` in the chain (`z.string().max(254).trim().min(2)`) — rejected; Zod evaluates chained string methods left-to-right, and length-bound checks should apply to the value actually used downstream (the trimmed query), not the raw pre-trim input. Ordering `.trim().min(2).max(254)` means both boundary checks apply to the trimmed value, which is what's used in the `$regex` and `.limit(10)` query.
- Rationale: Chained in the order `.trim()` → `.min(2)` → `.max(254)` so that validation reflects the actual string used to build the query (trimmed). This is the standard Zod idiom for this pattern.
- Trade-offs: Whitespace-boundary behavior changes for queries where trimming crosses the `min(2)` threshold (e.g. `" a"` → `"a"`, now rejected where it previously passed). Accepted and documented in proposal.md's Risks section as an intentional, requester-approved tightening.

## Proposal to Design Mapping

- Proposal element: `search` procedure bypasses the db singleton (Finding 1, GitHub issue #664).
  - Design decision: Decision 1.
  - Validation approach: existing `search` unit tests in `users.test.ts` continue to pass unmodified in behavior; mock target updated from `getMongoClient` to `getBetterAuthCollection` (see tasks.md/tests.md for specifics).
- Proposal element: `updateProfile` procedure bypasses the db singleton (Finding 1, GitHub issue #664).
  - Design decision: Decision 1.
  - Validation approach: existing `updateProfile` unit tests in `users.test.ts` continue to pass unmodified in behavior; mock target updated accordingly.
- Proposal element: `search` query has no maximum length (Finding 2, GitHub issue #664).
  - Design decision: Decision 2.
  - Validation approach: new test asserting queries ≤ 254 chars (post-trim) are accepted and queries > 254 chars (post-trim) are rejected with a Zod validation error, not a server error.
- Proposal element: requester decision to include `.trim()`.
  - Design decision: Decision 2.
  - Validation approach: new test asserting a whitespace-padded query is trimmed before the `min`/`max`/regex logic runs (e.g. `"  ab  "` behaves identically to `"ab"`).

## Functional Requirements Mapping

- Requirement: `search` and `updateProfile` must access the `user` collection exclusively via `getBetterAuthCollection("user")`.
  - Design element: Decision 1.
  - Acceptance criteria reference: specs — "MODIFIED Requirement: users router uses the shared collection accessor".
  - Testability notes: static/behavioral — no direct way to assert "which helper was called" from a black-box test without mocking `@/db`; verification is (a) source-level (grep/review confirms no remaining `getMongoClient().db().collection("user")` in `users.ts`), and (b) existing `search`/`updateProfile` test suites pass against mocks targeting `getBetterAuthCollection`.

- Requirement: `search` must accept queries between 2 and 254 characters (after trimming) and reject queries outside that range with a validation error.
  - Design element: Decision 2.
  - Acceptance criteria reference: specs — "MODIFIED Requirement: search query length is bounded".
  - Testability notes: directly testable via tRPC caller invoking `search` with boundary-value inputs (1, 2, 254, 255 chars; whitespace-padded variants) and asserting success vs. `TRPCError`/Zod validation failure.

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: `search`'s query input must not allow unbounded-length strings to reach the MongoDB `$regex` query, reducing resource-usage/attack-surface exposure for `executive-chef`-tier verified users.
  - Design element: Decision 2 (`.max(254)`).
  - Acceptance criteria reference: specs — "NFAC: search query length is bounded (security)".
  - Testability notes: covered by the same boundary-value tests as the functional requirement above (255-char query rejected before reaching the database call — assert the mocked collection's `.find()` is never invoked for an over-length query).

## Risks / Trade-offs

- Risk/trade-off: dropping `getMongoClient` from `users.ts`'s import could break if some other, currently-unnoticed code path in the file depends on it.
  - Impact: compile error (TypeScript would catch this immediately since `noUnusedLocals` is on, or a missing-reference error if something still calls it).
  - Mitigation: `grep -n getMongoClient src/server/trpc/routers/users.ts` before finalizing the diff to confirm no other usages; if any exist beyond the two identified call sites, keep the import and update tasks.md accordingly.
- Risk/trade-off: `.trim()` behavior change at the `min(2)` boundary (see design.md Decision 2, proposal.md Risks).
  - Impact: low, documented, requester-approved.
  - Mitigation: explicit test coverage; called out in proposal.md and here for traceability.
- Risk/trade-off: existing `users.test.ts` tests may mock `getMongoClient` directly (e.g. via `vi.mock('@/db', ...)`), which would silently no-op if the source now calls `getBetterAuthCollection` instead.
  - Impact: false-positive test pass (tests pass but don't exercise the real code path) — worse than a failing test, because it hides the change.
  - Mitigation: tasks.md must include an explicit step to inspect current mocks in `users.test.ts` and update them to mock/spy on `getBetterAuthCollection` (or the underlying `getMongoClient` if `getBetterAuthCollection` is left unmocked and calls through) — not just "run tests and see green."

## Rollback / Mitigation

- Rollback trigger: CI failure, review rejection, or a production issue traced to this change post-merge (e.g. `search` or `updateProfile` returning unexpected empty results, or an unhandled exception from `getBetterAuthCollection`).
- Rollback steps: revert the merge commit on `main` (the change is two small, self-contained edits to a single file plus its test file — a straight `git revert` is safe and low-risk, no data migration involved).
- Data migration considerations: none — no schema or stored-data changes; this is application-code-only.
- Verification after rollback: re-run `users.test.ts` and confirm `search`/`updateProfile` behave as they did pre-change; confirm no lingering references to `getBetterAuthCollection` in `users.ts` if a full revert was applied.

## Operational Blocking Policy

- If CI checks fail: diagnose and fix within the working branch; do not merge until CI is green. Given the small surface area, expect failures to be limited to test-mock mismatches (see Risks) or a TypeScript unused-import error.
- If security checks fail (Codacy/Snyk, per project CLAUDE.md): review findings; this change is a strict narrowing of behavior (added length bound, no new external input paths), so no new findings are expected. If one appears, treat it as a signal to re-examine the diff before dismissing.
- If required reviews are blocked/stale: follow the project's standard PR review loop (per `pr-review-toolkit:review-pr` in tasks.md) — address findings, re-request review, do not force-merge.
- Escalation path and timeout: per project tasks.md convention (see schema rules), if review findings persist after three or more fix/push iterations with no progress, halt and report to the requester with the remaining findings listed.

## Open Questions

None. All ambiguities were resolved during proposal approval (trim inclusion, max-length value of 254).
