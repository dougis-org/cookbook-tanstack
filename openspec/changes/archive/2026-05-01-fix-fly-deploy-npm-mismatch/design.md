## Context

- **Relevant architecture:** Three-layer pipeline: `build-and-test.yml` (PR CI) → merge to main → `deploy.yml` (Fly.io deploy via Docker). The deploy uses `flyctl deploy --remote-only`, which builds the Docker image on Fly.io's Depot builder using the committed `Dockerfile`. The Dockerfile runs `npm ci` against the committed `package-lock.json`.
- **Dependencies:** `node:24-alpine` (Docker base), `flyctl`, `@tanstack/*` ecosystem, `@trpc/*` ecosystem.
- **Interfaces/contracts touched:**
  - `.github/workflows/build-and-test.yml` — Node version for CI runner
  - `package.json` — direct dependency versions
  - `package-lock.json` — resolved dependency tree (regenerated as a result)

## Goals / Non-Goals

### Goals

- `npm ci` succeeds inside `node:24-alpine` Docker on every deploy
- CI lockfile generator uses the same npm major as Docker, preventing future version-skew drift
- All `@tanstack/*` packages pinned to a consistent, mutually-compatible version set
- All `@trpc/*` packages pinned exactly (no `^` ranges that can silently advance)
- Existing test suite (unit + E2E) passes after version bumps

### Non-Goals

- Changing the Docker base image
- Migrating the package manager
- Pinning transitive/indirect dependencies
- Modifying deploy trigger conditions

## Decisions

### Decision 1: Align CI Node version to Node 24

- **Chosen:** Change `node-version: '22'` → `'24'` in `.github/workflows/build-and-test.yml`
- **Alternatives considered:**
  - Pin Docker to Node 22 instead — rejected; Node 24 is the current LTS and Docker image is correct
  - Add a separate "lockfile validation" CI step — rejected; simpler to fix the root cause
  - Switch Dockerfile from `npm ci` to `npm install` — rejected; trades reproducibility for convenience
- **Rationale:** The lockfile generator (CI) and the lockfile consumer (Docker `npm ci`) must use the same npm major. npm 11 (Node 24) enforces peer dep hoisting rules that npm 10 (Node 22) does not. Aligning CI to Node 24 means the auto-committed lockfile is always compatible with Docker.
- **Trade-offs:** Developers on Node 22 locally may see lockfile divergence when running `npm install`. Mitigation: document Node 24 as the required runtime.

### Decision 2: Upgrade `@tanstack/react-query` to `5.100.6`

- **Chosen:** Pin `@tanstack/react-query` at `5.100.6` (current latest) in `package.json`
- **Alternatives considered:**
  - Keep `5.96.2` and add a top-level `@tanstack/query-core@5.100.6` override — fragile, masks the real issue
  - Use `>=5.90.0` range — reintroduces future drift risk
- **Rationale:** npm 11 resolves `@tanstack/query-core@>=5.90.0` (peer dep from `react-router-ssr-query`) to `5.100.6` (current latest). The lockfile must contain this version. The cleanest way to get there is to upgrade `react-query` to `5.100.6`, which brings `query-core@5.100.6` as its direct dependency and hoists it correctly.
- **Trade-offs:** Minor version bump within TanStack Query 5.x; API is stable and semver-compliant. Full test suite validates no regressions.

### Decision 3: Align TanStack router/start family to matching versions

- **Chosen:** Pin all of `@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/react-router-ssr-query`, `@tanstack/react-router-devtools`, `@tanstack/router-plugin` to their current compatible latest versions
- **Alternatives considered:**
  - Leave them at mismatched minors — causes peer dep warnings and potential subtle breakage
- **Rationale:** These packages ship together and share internal interfaces. Running mismatched minors (e.g., `react-router@1.168.10` vs `react-start@1.167.16`) is unsupported and creates unpredictable peer dep resolution.
- **Trade-offs:** Requires verifying no breaking changes across the minor bump. E2E tests cover the routing layer.

### Decision 4: Exact-pin `@trpc/*` packages

- **Chosen:** Change `"^11.16.0"` → `"11.17.0"` for `@trpc/client`, `@trpc/server`, `@trpc/tanstack-react-query`
- **Alternatives considered:**
  - Leave `^` ranges — tRPC `^11.16.0` already resolved to `11.17.0` in lockfile, but future releases will again cause drift
- **Rationale:** Range specifiers are a future drift vector. The lockfile captures a specific version, but `npm install` (run by CI on drift) will advance to whatever is latest. Exact pins make the lockfile the authoritative record with no ambiguity.
- **Trade-offs:** Manual version bump required when upgrading tRPC. Acceptable cost for predictability.

### Decision 5: Regenerate `package-lock.json` locally with Node 24

- **Chosen:** Run `npm install` locally on Node 24 after `package.json` changes, commit the result
- **Alternatives considered:**
  - Let CI auto-generate it on first PR — adds an extra CI round-trip before deploy works
- **Rationale:** The lockfile should be correct before the fix PR is merged so the deploy succeeds immediately on merge.
- **Trade-offs:** Developer must have Node 24 locally to regenerate. Acceptable; Node 24 is current LTS.

## Proposal to Design Mapping

- Proposal element: CI uses Node 22 / npm 10, Docker uses Node 24 / npm 11
  - Design decision: Decision 1 — align CI to Node 24
  - Validation approach: `npm ci` dry-run in Docker after change; CI pipeline passes

- Proposal element: `@tanstack/query-core` missing from lockfile top level
  - Design decision: Decision 2 — upgrade `react-query` to `5.100.6`
  - Validation approach: Docker `npm ci` succeeds; `npm ls @tanstack/query-core` shows `5.100.6` at top level

- Proposal element: TanStack packages at mismatched minor versions
  - Design decision: Decision 3 — align all to matching versions
  - Validation approach: No peer dep warnings in `npm install` output; E2E tests pass

- Proposal element: `@trpc/*` with `^` ranges causing future drift
  - Design decision: Decision 4 — exact-pin tRPC packages
  - Validation approach: `package.json` has no `^` on tRPC; lockfile matches exactly

## Functional Requirements Mapping

- **Requirement:** `npm ci` succeeds in `node:24-alpine` Docker
  - Design element: Decisions 1, 2, 5
  - Acceptance criteria reference: `specs/deploy/deploy-lockfile-compat.md`
  - Testability notes: Run `docker run --rm -v $(pwd)/package.json:/app/package.json -v $(pwd)/package-lock.json:/app/package-lock.json -w /app node:24-alpine npm ci --dry-run`

- **Requirement:** CI auto-lockfile-update produces a Docker-compatible lockfile
  - Design element: Decision 1
  - Acceptance criteria reference: `specs/deploy/deploy-lockfile-compat.md`
  - Testability notes: Introduce deliberate lockfile drift on a test PR; verify CI auto-commits a lockfile that passes Docker `npm ci`

- **Requirement:** All existing tests pass after dependency upgrades
  - Design element: Decisions 2, 3, 4
  - Acceptance criteria reference: `specs/deploy/dependency-upgrade-compat.md`
  - Testability notes: `npm run test` (Vitest) and `npm run test:e2e` (Playwright) must pass with zero regressions

## Non-Functional Requirements Mapping

- **Requirement category:** Reliability
  - Requirement: Deploy pipeline does not silently succeed with a stale lockfile
  - Design element: Decision 1 — CI catches lockfile issues at PR time, not deploy time
  - Acceptance criteria reference: `specs/deploy/deploy-lockfile-compat.md`
  - Testability notes: Verify that a PR with an out-of-sync lockfile fails the CI build step

- **Requirement category:** Reproducibility
  - Requirement: Docker build installs exactly the same packages on every deploy
  - Design element: Decision 5 — lockfile is source of truth, `npm ci` enforces it
  - Acceptance criteria reference: `specs/deploy/deploy-lockfile-compat.md`
  - Testability notes: Two sequential Docker builds from the same commit produce identical `node_modules`

## Risks / Trade-offs

- **Risk/trade-off:** Node 24 introduced in CI may expose a test compatibility issue
  - Impact: CI pipeline fails on an unrelated Node API change
  - Mitigation: Node 24 is LTS; the codebase targets `>=20.19.0` per `package.json` engines field. If a failure surfaces, address it in this same PR before merging.

- **Risk/trade-off:** Exact-pinning tRPC requires manual bumps for security patches
  - Impact: Security fixes in tRPC minor releases won't auto-apply
  - Mitigation: Dependabot / Renovate will still surface available updates as PRs. The tradeoff is intentional.

## Rollback / Mitigation

- **Rollback trigger:** CI or E2E tests fail after the version bumps and cannot be fixed within this PR's scope
- **Rollback steps:**
  1. Revert `package.json` version changes
  2. Revert `node-version` in `build-and-test.yml` to `'22'`
  3. Run `npm install` on Node 22 to restore the previous lockfile
  4. Commit and push the revert
- **Data migration considerations:** None — this change is purely build/dependency tooling
- **Verification after rollback:** Confirm `npm ci` passes locally on Node 22 and Docker `npm ci` passes (it was already broken, so rollback restores the pre-change state, not a working state)

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Investigate and fix within the PR. If the failure is unrelated to this change, document it and open a separate issue.
- **If security checks fail:** Do not merge. Codacy or Snyk findings must be reviewed; if the finding is in an upgraded package, assess severity before proceeding.
- **If required reviews are blocked/stale:** Ping reviewers after 24 hours. After 48 hours with no response, escalate to repo owner.
- **Escalation path and timeout:** If the PR cannot be unblocked within 72 hours, consider a minimal hotfix (only the CI node-version change) to stop the deploy bleeding while the full dependency alignment is completed separately.

## Open Questions

No open questions. Design is fully determined by the investigation findings.
