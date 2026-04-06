## Context

The CookBook app currently has TanStack Router/Start packages installed at 1.159.5 and React Query at 5.90.21. `package.json` specifiers use `^1.132.0` (router family) and `^5.90.21` (query), so the lockfile already resolved forward to 1.159.5 via semver. This change advances the lockfile to the current latest versions and updates `package.json` specifiers to match.

All six packages must be upgraded atomically — TanStack Router, React Start, router-plugin, devtools, and SSR-query share internal APIs and will break if mismatched.

**Proposal mapping:**
| Proposal element | Design decision |
|-----------------|-----------------|
| Six packages updated together | Single `npm install` command with all packages pinned to latest |
| `useBlocker` risk | Covered by existing E2E test suite; no code change required |
| Scroll restoration timing change | Verified by E2E run; no config change required |
| No new APIs adopted | Install-only, zero code changes |

## Goals / Non-Goals

**Goals:**
- Advance all six TanStack packages to their latest stable versions
- Confirm zero regressions via build + unit + E2E test pass
- Update `package.json` version specifiers to the new baseline

**Non-Goals:**
- Adopting new APIs introduced in target versions (e.g., `staleReloadMode`)
- Modifying any application code, routes, or components
- Addressing other open dependency issues

## Decisions

### Decision 1: Single atomic install

**Choice:** Update all six packages in one `npm install` call rather than incrementally.

**Rationale:** TanStack Router packages share internal module bindings. Installing them at different versions causes runtime errors. A single command guarantees the lockfile is consistent. The jump is only ~9 minor versions with no identified breaking changes; incremental installs add effort without reducing risk.

**Alternatives considered:** Version-by-version bisect — unnecessary overhead given clean changelog research; would slow the update without safety benefit.

---

### Decision 2: Update `package.json` specifiers to pinned latest

**Choice:** Change `package.json` entries from `^1.132.0` to `^1.168.10` (router) / `^1.167.16` (start) etc., bringing the declared range in line with the installed versions.

**Rationale:** The current `^1.132.0` specifier is misleading — it implies the package could be as old as 1.132.0 but is actually at 1.159.5. Updating the specifier makes the declared baseline honest and prevents a fresh `npm install` from resolving to an older version if the lockfile is missing.

---

### Decision 3: No code changes

**Choice:** This is an install-only change. If the upgrade introduces a type error or test failure, investigate and fix rather than pinning lower.

**Rationale:** The changelog analysis found no breaking API changes for any surface used by this codebase. Patching forward is preferable to holding back.

## Risks / Trade-offs

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `useBlocker` regression (pending-state refactor in 1.167.0) | Low | E2E test covers unsaved-changes guard; manual smoke test of RecipeForm navigate-away flow |
| Scroll restoration timing change (throttle removed, 1.168.5) | Low | E2E run covers page navigation; verify scroll position after navigation manually if needed |
| Unforeseen type errors | Low | `npm run build` step catches at compile time |
| npm resolution selects a newer version than targeted | Low | Specifiers use `^` — cap with exact versions if resolution is unexpected |

## Rollback / Mitigation

If the upgrade causes a regression that cannot be quickly fixed:

1. `git revert` the commit (restores `package.json` and `package-lock.json`)
2. `npm install` to restore the previous lockfile state
3. File a targeted issue for the specific regression before re-attempting the upgrade

**Operational blocking policy:** If CI fails after the PR is raised and the failure is not clearly related to the upgrade (e.g., a flaky E2E test), re-run once. If it persists, treat as a real regression and investigate before merging.

## Open Questions

None. The upgrade path is fully defined and changelog research found no blockers.
