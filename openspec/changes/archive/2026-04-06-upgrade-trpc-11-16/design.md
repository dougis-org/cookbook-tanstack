## Context

All tRPC packages in this project (`@trpc/client`, `@trpc/server`, `@trpc/tanstack-react-query`) are currently at 11.10.0. Six minor versions have been released since then (11.11–11.16). Changelog review confirms no breaking changes for the APIs this project uses: `fetchRequestHandler`, `httpBatchLink`, `initTRPC`, `createTRPCOptionsProxy`, `publicProcedure`, and `protectedProcedure`.

Proposal → design mapping:
- _Upgrade three tRPC packages_ → single `npm install` command (all three in one pass to preserve lockfile consistency)
- _No breaking changes_ → no source file modifications required
- _Verification_ → build + unit/integration + E2E test runs

## Goals / Non-Goals

**Goals:**
- Advance all three tRPC packages to 11.16.0 in one atomic lockfile update
- Confirm no regressions via existing CI pipeline

**Non-Goals:**
- Adopting new features from 11.11–11.16 (OpenAPI, `streamHeader`, max batch size)
- Changing any application source files

## Decisions

### Single install command for all three packages

Run `npm install @trpc/client@latest @trpc/server@latest @trpc/tanstack-react-query@latest` in one pass rather than individual installs. This avoids a transient state where peer dependency version mismatches could cause npm to introduce unintended resolutions.

_Alternative considered_: Update `package.json` manually then run `npm install`. Rejected — less reliable for lockfile hygiene.

### No source-level changes

The APIs used by this project — `fetchRequestHandler` (fetch adapter), `httpBatchLink`, `initTRPC`, `createTRPCOptionsProxy`, `protectedProcedure` — are unchanged across the version span. No code modifications are needed.

## Risks / Trade-offs

- **Minor risk: npm peer resolution surprises** → Mitigation: run `npm ls` post-install to verify resolved versions before running tests.
- **Low risk: undocumented behaviour change in 11.11–11.16** → Mitigation: existing E2E suite covers all tRPC-backed interactions end-to-end.

## Rollback / Mitigation

Rollback: `git restore package.json package-lock.json && npm install` restores the previous lockfile state. No database or infrastructure changes are involved.

## Open Questions

None. All decision points resolved by changelog review and peer-dependency analysis.
