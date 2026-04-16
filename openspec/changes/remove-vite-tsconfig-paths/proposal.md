## GitHub Issues

- dougis-org/cookbook-tanstack#328

## Why

- Problem statement: `vite-tsconfig-paths` plugin emits a deprecation warning in Vite 8 because native tsconfig path resolution is now built into Vite via `resolve.tsconfigPaths`. The plugin is redundant.
- Why now: Project runs Vite 8.0.8. The warning appears during every Playwright run and every dev server start, creating noise that obscures real warnings.
- Business/user impact: Cleaner dev/test output; one fewer dependency to maintain; aligns with Vite 8 best practices.

## Problem Space

- Current behavior: `vite.config.ts` and `vitest.config.ts` both use the `vite-tsconfig-paths` plugin to resolve `@/*` imports from `tsconfig.json`. Vite 8 detects the plugin and emits a warning recommending the native option instead.
- Desired behavior: `@/*` path alias resolves correctly in all contexts (dev server, build, Vitest unit tests, Playwright E2E) with no deprecation warning, using `resolve.tsconfigPaths: true` instead of the plugin.
- Constraints: Plugin order in `vite.config.ts` is tested and documented in CLAUDE.md. Removing the plugin changes the documented order.
- Assumptions: Vite 8 native `resolve.tsconfigPaths` is functionally equivalent to `vite-tsconfig-paths` for a single flat tsconfig with one path alias (`@/*` → `./src/*`).
- Edge cases considered: SSR/Nitro server-side pass, Vitest's separate config, `vite.config.test.ts` ordering assertions, CLAUDE.md plugin order documentation.

## Scope

### In Scope

- Remove `tsconfigPaths()` plugin from `vite.config.ts`; add `resolve: { tsconfigPaths: true }`
- Remove `tsconfigPaths()` plugin from `vitest.config.ts`; add `resolve: { tsconfigPaths: true }`
- Update `vite.config.test.ts`: remove assertions referencing `vite-tsconfig-paths`; delete the vitest-config ordering `it` block (becomes trivial with one plugin)
- Remove `vite-tsconfig-paths` from `package.json` dependencies
- Update `CLAUDE.md` plugin order documentation to reflect the new chain

### Out of Scope

- Changes to tsconfig.json path aliases themselves
- Adding new path aliases
- Any other Vite config changes unrelated to this plugin removal

## What Changes

- `vite.config.ts`: remove `import tsconfigPaths` and `tsconfigPaths()` call; add `resolve: { tsconfigPaths: true }` to config object
- `vitest.config.ts`: same plugin removal; add `resolve: { tsconfigPaths: true }`
- `vite.config.test.ts`: remove `vite-tsconfig-paths` existence check and the two ordering assertions that reference it; delete the second `it` block entirely
- `package.json`: remove `vite-tsconfig-paths` from dependencies (and run `npm install` to update lockfile)
- `CLAUDE.md`: update documented plugin order from `devtools → nitro → tsConfigPaths → tailwindcss → tanstackStart → react` to `devtools → nitro → tailwindcss → tanstackStart → react`

## Risks

- Risk: Native `resolve.tsconfigPaths` behaves differently from `vite-tsconfig-paths` in some edge case (e.g., tsconfig `extends` chains, multiple tsconfigs)
  - Impact: `@/*` imports fail to resolve at runtime or build time
  - Mitigation: Project has a single flat tsconfig with one alias — low risk. Existing unit and E2E test suites will catch resolution failures immediately.

- Risk: Nitro's SSR bundling pass does not pick up `resolve.tsconfigPaths`
  - Impact: Server-side `@/*` imports fail during SSR
  - Mitigation: `resolve` is a core Vite option applied to all passes. E2E tests exercise SSR routes and will catch this.

## Open Questions

No unresolved ambiguity. The change is well-bounded and the codebase has been fully reviewed. Existing test coverage (unit + E2E) is sufficient to detect regressions.

## Non-Goals

- Migrating to a different module resolution strategy
- Changing any tsconfig compiler options
- Updating other plugins or dependencies

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
