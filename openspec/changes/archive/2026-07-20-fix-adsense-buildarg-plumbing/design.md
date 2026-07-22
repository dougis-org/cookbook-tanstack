## Context

- Relevant architecture: TanStack Start app, built via Vite, deployed to Fly.io. Production image is built by `Dockerfile` (multi-stage: `builder` runs `npm run build`, `runtime` copies `.output/`). Deploy is triggered by `.github/workflows/deploy.yml` on PR-merge-to-`main` or manual `workflow_dispatch`, and runs `flyctl deploy --remote-only`, which builds the Dockerfile on Fly's remote builder.
- Dependencies: `src/lib/google-adsense.ts` (slot ID validation), `src/lib/ad-policy.ts` (eligibility), `src/components/layout/PageLayout.tsx` (`AdSlot` render logic), `src/routes/__root.tsx` (GA + AdSense account meta tag). None of these are modified by this change — they already correctly read `import.meta.env.VITE_*`.
- Interfaces/contracts touched: `Dockerfile` (new `ARG`/`ENV` lines), `.github/workflows/deploy.yml` (new `--build-arg` flags + a new validation step), GitHub repository configuration (5 new Actions Variables), `.env.example`/docs (clarifying comment).

## Goals / Non-Goals

### Goals

- `VITE_ADSENSE_ENABLED`, the three `VITE_GOOGLE_ADSENSE_*_SLOT_ID` vars, and `VITE_GOOGLE_ANALYTICS_ID` reach the compiled client bundle Fly actually serves.
- `VITE_ADSENSE_ENABLED` is provisioned as `true` from day one of this change (per proposal resolution), so real AdSense ads go live as soon as the other slot IDs are valid.
- A production deploy fails loudly and immediately if any of the 5 required Variables is missing/empty, so this exact failure mode (silently shipping a no-op "fix") cannot recur.
- The loud-failure check is strictly confined to the production deploy path; no other workflow (PR CI, unit/e2e test jobs, local dev) is affected.

### Non-Goals

- Redesigning `AD_ENABLED_ROLES`, `showUserAds`, or any tier-eligibility logic.
- Changing the ad slot *layout* (single right-rail vs. 2 sideboards, floating footer) — tracked as a separate, not-yet-scoped change.
- Introducing a secrets-manager, Vault, or any tool beyond GitHub Actions repository Variables and existing Fly secrets.
- Changing how genuinely sensitive values (`BETTER_AUTH_SECRET`, `MONGODB_URI`, `STRIPE_SECRET_KEY`, etc.) are stored or deployed.

## Decisions

### Decision 1: Thread values via Docker `--build-arg`, consumed through paired `ARG`/`ENV` lines in the Dockerfile

- Chosen: Add `ARG VITE_ADSENSE_ENABLED` (and the other 4) to the `builder` stage of `Dockerfile`, followed by `ENV VITE_ADSENSE_ENABLED=$VITE_ADSENSE_ENABLED` (etc.), placed before `RUN npm run build`. `flyctl deploy --remote-only` gains `--build-arg KEY=value` flags carrying the real values into the remote build.
- Alternatives considered: (a) Commit a build-time `.env.production` file to the repo — rejected, would require a source-controlled PR to rotate a slot ID and would encourage checking in values that change per-environment. (b) Use Fly's `[build.args]` table in `fly.toml` with hardcoded values — rejected, `fly.toml` is committed source and these values (especially anything rotated during AdSense unit changes) shouldn't require editing tracked config.
- Rationale: `ARG`→`ENV` is the standard, minimal-surface-area Docker pattern for getting a build arg visible to a `RUN` step (bare `ARG` values are not automatically exported to the process environment `RUN` sees). `--build-arg` on `flyctl deploy` is the documented mechanism for passing build-time values to Fly's remote builder.
- Trade-offs: Every value change now requires a deploy-workflow run (already true in practice, since these were being read at build time all along, just incorrectly) rather than a pure runtime toggle.

### Decision 2: Source values from GitHub Actions repository **Variables**, not **Secrets**

- Chosen: `vars.VITE_ADSENSE_ENABLED`, `vars.VITE_GOOGLE_ADSENSE_TOP_SLOT_ID`, etc., referenced in `deploy.yml`.
- Alternatives considered: Keep using Fly secrets and add a script step to fetch/export them at build time — rejected, adds a runtime dependency (Fly API call) into the build step for no benefit, and doesn't change the fact these values are non-confidential.
- Rationale: All 5 values are inlined into public client JavaScript and visible via view-source on the live site regardless of storage mechanism. GitHub Variables are the correct primitive for non-secret build configuration and remain human-readable in the Settings UI for debugging (unlike write-only Secrets).
- Trade-offs: Any collaborator with repo read access can see these values in Settings → Variables — acceptable since they're already public in shipped JS.

### Decision 3: Fold `VITE_GOOGLE_ANALYTICS_ID` into the same fix

- Chosen: Add the same `ARG`/`ENV`/`--build-arg`/Variable treatment for `VITE_GOOGLE_ANALYTICS_ID` alongside the 4 AdSense values.
- Alternatives considered: Separate change/PR — rejected, identical root cause and identical fix shape; splitting would mean re-touching the same 2 files twice for no isolation benefit, and GA is currently suspected broken by the same bug.
- Rationale: Single root cause, single fix, single verification pass.
- Trade-offs: None material; slightly widens the diff of this change beyond the literal word "AdSense" in its name, but stays within the same `fly-deployment` capability.

### Decision 4: `VITE_ADSENSE_ENABLED` provisioned as `true`, not left as a deferred manual toggle

- Chosen: The Actions Variable `VITE_ADSENSE_ENABLED` is created with value `true` as part of this change's manual configuration task (Decision resolved by repo owner during proposal review).
- Alternatives considered: Leave it `false`/unset until slot IDs are separately verified — rejected per explicit owner direction; the existing slot-ID validation (`getValidatedGoogleAdSenseSlotId`) already guards against a malformed/missing slot ID independently, so `VITE_ADSENSE_ENABLED=true` with an unset slot ID for one position degrades that position only, it doesn't force-render a broken ad.
- Rationale: Owner wants ads live as soon as this change ships and slot IDs are valid, not gated behind a second manual flip.
- Trade-offs: If a slot ID is later found to be invalid post-deploy, that specific position silently falls back to `SponsorSlot`/null rather than erroring — this is existing, desired behavior (see Decision 5's validation is at the Variable-presence level, not the AdSense-approval level).

### Decision 5: Add a prod-only loud-failure validation step to `deploy.yml`, not to any shared/reusable workflow

- Chosen: A new step in the existing `deploy` job of `.github/workflows/deploy.yml` (immediately before the `flyctl deploy` step) that checks all 5 required Variables are non-empty and fails the job (non-zero exit) with a clear error message if any are missing.
- Alternatives considered: (a) Add the check to a shared/reusable workflow or a separate CI workflow that also runs on PRs — rejected per explicit owner direction ("I do not want non prod noise"), this would surface failures on every PR even when nobody touched deploy config. (b) Rely on Fly's deploy failing naturally if the build produces a broken bundle — rejected, an empty `VITE_*` value does *not* break the build (Vite happily inlines an empty string), so there's no natural failure to rely on; the check must be explicit.
- Rationale: The `deploy` job already gates on `github.event.pull_request.merged == true || github.event_name == 'workflow_dispatch'` — by construction, this job only ever runs for production deploys, so a step placed inside it is automatically prod-only with no additional conditionals needed.
- Trade-offs: If a legitimate reason ever exists to deploy with one of these Variables intentionally empty (e.g., temporarily disabling ads without touching AdSense config), the deploy will now fail until the Variable is set — this is the intended behavior per the loud-failure requirement, and `VITE_ADSENSE_ENABLED=false` is the correct way to disable ads instead of leaving it unset.

## Proposal to Design Mapping

- Proposal element: `Dockerfile` gains `ARG`/`ENV` plumbing for the 5 variables
  - Design decision: Decision 1
  - Validation approach: Local `docker build --build-arg ...` producing a bundle containing the literal slot ID string; local `docker build .` with no args still succeeding
- Proposal element: `deploy.yml` passes the 5 values to `flyctl deploy` as `--build-arg`, sourced from repo Variables
  - Design decision: Decision 1, Decision 2
  - Validation approach: Workflow file inspection (grep for `--build-arg` + `vars.`) plus a real deploy run confirmed via view-source on the live site
- Proposal element: `VITE_ADSENSE_ENABLED` set to `true` as part of this change
  - Design decision: Decision 4
  - Validation approach: Confirm the Actions Variable value post-creation; confirm `AdSlot` renders `mode: 'adsense'` on the live site once slot IDs are also valid
- Proposal element: Prod-only loud failure if Variables are unset, no non-prod noise
  - Design decision: Decision 5
  - Validation approach: Manually unset one Variable in a test run of `workflow_dispatch` (or a scoped dry run) and confirm the job fails with a clear message before reaching `flyctl deploy`; confirm no other workflow file was touched
- Proposal element: Fold in `VITE_GOOGLE_ANALYTICS_ID` fix
  - Design decision: Decision 3
  - Validation approach: Confirm GA `gtag`/`dataLayer` script loads on the live site post-deploy

## Functional Requirements Mapping

- Requirement: Dockerfile builder stage accepts and exports the 5 client-exposed build-time variables
  - Design element: Decision 1
  - Acceptance criteria reference: `specs/fly-deployment/spec.md` — "Dockerfile accepts client-exposed build-time variables via ARG"
  - Testability notes: `docker build --build-arg KEY=value .` then inspect the built client bundle for the literal value (e.g. `grep` the compiled JS for the slot ID string)

- Requirement: Deploy workflow forwards the 5 variables from repo Variables to the Docker build
  - Design element: Decision 1, Decision 2
  - Acceptance criteria reference: `specs/fly-deployment/spec.md` — "Deploy workflow forwards client-exposed configuration as build args"
  - Testability notes: Static inspection of `deploy.yml` for `--build-arg KEY=${{ vars.KEY }}` on all 5 variables; confirm none reference `secrets.*`

- Requirement: Production deploy fails loudly if any of the 5 variables is unset/empty
  - Design element: Decision 5
  - Acceptance criteria reference: `specs/fly-deployment/spec.md` — "Deploy job validates required build-time variables before deploying"
  - Testability notes: Trigger `workflow_dispatch` with a Variable temporarily unset (in a disposable test scenario) and confirm the job fails before the `flyctl deploy` step runs, with a message naming the missing variable

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: A missing/invalid build-time Variable must never silently ship a broken production build again
  - Design element: Decision 5
  - Acceptance criteria reference: `specs/fly-deployment/spec.md` — "Deploy job validates required build-time variables before deploying"
  - Testability notes: Same as functional requirement above; also confirm the failure message is actionable (names the missing variable(s))

- Requirement category: reliability
  - Requirement: A build with all 5 variables unset must still succeed and produce the existing safe-degrade behavior (no ads / no GA), for any non-deploy build context (e.g. local `docker build .`)
  - Design element: Decision 1
  - Acceptance criteria reference: `specs/fly-deployment/spec.md` — "Missing build args degrade gracefully"
  - Testability notes: `docker build .` with zero `--build-arg` flags succeeds; this scenario is distinct from the prod-deploy validation in Decision 5, which only applies inside `deploy.yml`'s job, not to Docker itself

- Requirement category: operability (noise control)
  - Requirement: The loud-failure check must not run on any non-production workflow
  - Design element: Decision 5
  - Acceptance criteria reference: `specs/fly-deployment/spec.md` — "Deploy job validates required build-time variables before deploying"
  - Testability notes: Confirm via diff that only `.github/workflows/deploy.yml` is modified; no changes to PR-triggered CI workflows

## Risks / Trade-offs

- Risk/trade-off: GitHub Actions repository Variables are visible to any collaborator with read access.
  - Impact: None material — values are already public in shipped JS.
  - Mitigation: Documented as accepted trade-off; no confidentiality is actually lost.
- Risk/trade-off: The new prod-only validation step could itself have a bug that blocks legitimate deploys (e.g., a typo in the variable name check).
  - Impact: Deploys blocked until fixed — but this fails safe (blocks a bad deploy) rather than failing unsafe (ships silently broken config), which is preferable to the status quo.
  - Mitigation: Task list includes explicitly testing the validation step against both a "all variables present" and "one variable missing" scenario before merge.
- Risk/trade-off: `VITE_ADSENSE_ENABLED=true` is provisioned immediately, so if a slot ID Variable is entered incorrectly (e.g., includes a `ca-` prefix), that specific ad position silently falls back rather than erroring.
  - Impact: A misconfigured slot could go unnoticed longer than if enablement were staged.
  - Mitigation: Task list includes a live-site verification step (view-source check for `data-ad-slot` on all 3 positions) immediately after the first deploy with real values.

## Rollback / Mitigation

- Rollback trigger: The new validation step blocks a deploy unexpectedly for a scenario not anticipated here, or a `--build-arg` value causes an unrelated build failure.
- Rollback steps: Revert the `Dockerfile` and `deploy.yml` commit(s) via a follow-up PR (standard git revert); this restores the exact pre-change behavior (Fly secrets set but ineffective, sponsor slot / no GA — a safe, already-shipped state). No Fly secrets or Actions Variables need to be deleted as part of rollback; they simply become inert again.
- Data migration considerations: None — no database or persisted-data changes in this change.
- Verification after rollback: Confirm `deploy.yml` runs and completes without the validation step; confirm the live site returns to its pre-change appearance (no unrelated regression introduced by the revert itself).

## Operational Blocking Policy

- If CI checks fail: Standard PR CI (unit tests, typecheck, lint) failing blocks merge as normal — no special handling introduced by this change since no application code is touched.
- If security checks fail: Not applicable — no new dependencies, no secret values introduced (Actions Variables are explicitly non-secret by design).
- If required reviews are blocked/stale: Standard repo review process applies; no change to review requirements introduced here.
- Escalation path and timeout: If the new prod-deploy validation step blocks a real production deploy after this change ships, the repo owner (doug) is the sole escalation point (single-maintainer project) — fix forward via a follow-up PR or revert per the Rollback plan above; no on-call rotation exists for this project.

## Open Questions

- None remaining. Both open questions from `proposal.md` were resolved by the repo owner during proposal review (`VITE_ADSENSE_ENABLED=true`; loud prod-only validation, no non-prod noise) and are reflected in Decisions 4 and 5 above.
