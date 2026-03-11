## Context

The repository has two workflow files under `.github/workflows/`:

- `build-and-test.yml` — primary CI workflow; runs on PRs and pushes to `main`
- `resolve-outdated-comments.yml` — auxiliary workflow; resolves stale PR review threads

GitHub has deprecated Node.js 20 as the runner used by bundled GitHub Actions. All `@v4` action releases (checkout, setup-node, upload-artifact) embed Node 20. When Node 20 support is removed from GitHub-hosted runners, these actions will produce warnings and eventually fail.

The fix is a direct version-pin update: replace `@v4` with `@v6` for affected actions. `@v6` versions use Node 22 and are drop-in compatible.

**Current action inventory:**

| File | Action | Current | Target |
|---|---|---|---|
| `build-and-test.yml` | `actions/checkout` | `@v4` | `@v6` |
| `build-and-test.yml` | `actions/setup-node` | `@v4` | `@v6` |
| `build-and-test.yml` | `actions/upload-artifact` | `@v4` | `@v6` (×2) |
| `resolve-outdated-comments.yml` | `actions/checkout` | `@v6` | `@v6` (already correct) |

The `@v6` pin in `resolve-outdated-comments.yml` predates this change; it will be verified and left at the latest stable version.

## Goals / Non-Goals

**Goals:**
- Eliminate all Node-20-backed `@v4` action pins from workflow files
- Ensure all actions use Node-22+ compatible releases
- Leave CI job logic, environment variables, and test commands unchanged

**Non-Goals:**
- Refactoring workflow structure or adding new jobs
- Updating any Node.js version used for building the application (already on `25` in setup-node)
- Modifying secrets, permissions, or concurrency settings

## Decisions

### Decision 1 — Update checkout/setup-node/upload-artifact to `@v6`

**Choice:** Bump `actions/checkout`, `actions/setup-node`, and `actions/upload-artifact` from `@v4` → `@v6`.

**Rationale:** `@v6` is the current stable, Node-22-compatible release for `actions/checkout`, `actions/setup-node`, and `actions/upload-artifact` (v7 exists but is deferred until breaking-change review). Using the major-version tag aligns with how the project already pins actions and keeps future patch-level updates automatic within the major version. SHA pinning would be more secure but is out of scope for this maintenance change.

**Alternatives considered:**
- *Use Dependabot / Renovate for automated updates* — Would automate ongoing maintenance but adds configuration overhead not in scope here.
- *Pin to exact SHA* — More secure against supply-chain attacks but inconsistent with current project conventions.

### Decision 2 — Leave `resolve-outdated-comments.yml` checkout at `@v6`

**Choice:** Confirm the existing `actions/checkout@v6` pin is already correct; no change needed.

**Rationale:** `@v6` matches the target version for `actions/checkout`. The step is to verify the pin is correct and document it as intentional.

### Decision 3 — Proposal-to-design mapping

| Proposal element | Design decision |
|---|---|
| Update `checkout@v4` → `@v6` | Decision 1 |
| Update `setup-node@v4` → `@v6` | Decision 1 |
| Update `upload-artifact@v4` → `@v6` (×2) | Decision 1 |
| Confirm `checkout@v6` in resolve workflow already correct | Decision 2 |

## Risks / Trade-offs

- **[Risk] `@v6` introduces a breaking API change** → Mitigation: GitHub's official changelogs for checkout v6, setup-node v6, and upload-artifact v6 confirm these are drop-in replacements; CI will verify by running end-to-end after the change.
- **[Risk] `resolve-outdated-comments.yml` uses `@v6` which may not yet be stable** → Mitigation: Verify against the published releases for `actions/checkout`; pin to the highest stable major if `@v6` is pre-release.
- **[Risk] CI is the only validation gate** → Mitigation: Changes are confined to action pins; no application logic is touched, making regression unlikely.

## Rollback / Mitigation

If the updated workflow fails:
1. Revert the version pins in the affected workflow files back to their previous values
2. Re-run CI to confirm the rollback restores green builds

Rollback is a single-commit revert — no database migrations, no dependency changes.

**Operational blocking policy:** If CI remains blocked after the update, revert immediately and open an issue to investigate the specific action failure before re-attempting.

## Open Questions

None — action v5 releases are GA and well-documented.
