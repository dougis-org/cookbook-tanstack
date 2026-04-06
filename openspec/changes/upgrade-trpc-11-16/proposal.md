## Why

The three tRPC packages (`@trpc/client`, `@trpc/server`, `@trpc/tanstack-react-query`) are pinned at 11.10.0 while 11.16.0 is available. They must always be upgraded together to stay in sync. The update resolves six minor releases of bug fixes; no breaking changes exist in the span.

## What Changes

- Upgrade `@trpc/client` from `^11.10.0` to `^11.16.0`
- Upgrade `@trpc/server` from `^11.10.0` to `^11.16.0`
- Upgrade `@trpc/tanstack-react-query` from `^11.10.0` to `^11.16.0`

No API changes, no migration steps. All releases between 11.10 and 11.16 are additive features or bug fixes for functionality this project does not use (SSE subscriptions, streaming links, OpenAPI generation).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `dependency-upgrade`: Add tRPC version requirements (installed at ≥ 11.16.0, build and tests pass).

## Impact

- `package.json` — version specifiers updated
- `package-lock.json` — lockfile regenerated
- No source file changes expected; all tRPC public APIs used by this project are stable across the version span

## Non-Goals

- Adopting new 11.16 features (OpenAPI generation, `streamHeader`, max batch size)
- Updating any other packages

## Risks

Low. Changelog review confirmed no breaking changes for the fetch adapter, `httpBatchLink`, `initTRPC`, `createTRPCOptionsProxy`, or `protectedProcedure` patterns this project uses.

## Open Questions

No unresolved ambiguity. Changelog reviewed; dependency graph checked; peer dependency requirements (`typescript >=5.7.2`, `@tanstack/react-query ^5.80.3`) already satisfied by the current project setup.

---

_If scope changes after approval, proposal, design, specs, and tasks must be updated before apply proceeds._
