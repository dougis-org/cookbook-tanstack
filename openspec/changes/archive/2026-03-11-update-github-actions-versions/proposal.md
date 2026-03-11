## Why

GitHub has deprecated Node.js 20 as the runtime for GitHub Actions, and all `@v4` actions (checkout, setup-node, upload-artifact) depend on it. Continuing to use these versions will trigger deprecation warnings in CI and, eventually, broken workflows when Node 20 support is removed.

## What Changes

- Update `actions/checkout@v4` → `@v6` in `build-and-test.yml`
- Update `actions/setup-node@v4` → `@v6` in `build-and-test.yml`
- Update `actions/upload-artifact@v4` → `@v6` in `build-and-test.yml` (two occurrences)
- Align `actions/checkout` in `resolve-outdated-comments.yml` to `@v6` (already at `@v6` — confirm no changes needed)
- Confirm no other workflow files reference Node-20-backed action versions

## Capabilities

### New Capabilities

- `github-actions-maintenance`: Standards and checklist for keeping GitHub Actions pinned to their latest Node-22+ compatible versions across all workflow files.

### Modified Capabilities

<!-- No existing spec-level capability requirements are changing. -->

## Impact

- **Files changed:** `.github/workflows/build-and-test.yml`, `.github/workflows/resolve-outdated-comments.yml`
- **CI behavior:** No functional change — only the runtime version bundled into the actions changes; job steps remain identical
- **Dependencies:** No `package.json` changes required
- **Open Questions:** None — the mapping from v4 → v6 (checkout, setup-node, upload-artifact) are drop-in replacements

## Scope

**In scope:**
- Updating action version pins in all workflow YAML files under `.github/workflows/`

**Out of scope:**
- Changing CI job logic, environment variables, or test commands
- Adding new workflow jobs or secrets

## Risks

- Low risk: v6 for `actions/checkout`, `actions/setup-node`, and `actions/upload-artifact` are backward-compatible drop-in replacements
- Mitigation: Run CI after the update to confirm no regressions

## Non-Goals

- Migrating to a different CI platform
- Restructuring workflow files beyond version pin updates

## Open Questions

None.
