## Context

`PageLayout.tsx`, `google-adsense.ts`, and `__root.tsx` already read `import.meta.env.VITE_ADSENSE_ENABLED`, `VITE_GOOGLE_ADSENSE_TOP_SLOT_ID`, `VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID`, `VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID`, and `VITE_GOOGLE_ANALYTICS_ID` correctly — application code is not the problem.

The deploy path is:

```
GitHub Actions (deploy.yml)
  flyctl deploy --remote-only          # no --build-arg passed today
        │
        ▼
Fly.io remote builder
  docker build .                       # Dockerfile has no ARG for VITE_* today
        │  Stage 1 (builder): npm run build   ← Vite inlines import.meta.env.VITE_* HERE
        │  Stage 2 (runtime): node .output/server/index.mjs
        ▼
Running container
  fly secrets set VITE_ADSENSE_ENABLED=true    ← only affects THIS stage, too late
```

Fly secrets (`fly secrets set ...`) are injected as environment variables into the **runtime** container process. Vite's `import.meta.env.VITE_*` substitution happens once, at `npm run build` time, inside the **builder** stage of the Docker image. Because the builder stage never receives these variables — no `ARG` is declared to accept them, and no `--build-arg` is passed when the image is built — every `VITE_*` reference these features rely on resolves to `undefined` in the shipped bundle, permanently, no matter what is set as a Fly secret afterward.

This is also why `VITE_GOOGLE_ANALYTICS_ID`, which *is* set as a Fly secret today, is suspected to be silently non-functional — it has the exact same structural gap, just discovered later because there's no visible "missing ad" symptom for analytics.

## Goals / Non-Goals

**Goals:**
- Get `VITE_ADSENSE_ENABLED`, the three `VITE_GOOGLE_ADSENSE_*_SLOT_ID` vars, and `VITE_GOOGLE_ANALYTICS_ID` actually compiled into the production bundle Fly serves.
- Keep the values out of Fly secrets going forward for this specific purpose — they are inlined into public JS, so treating them as build-time repo configuration (GitHub Actions variables) is more honest than storing them as if they were secret.
- Preserve `flyctl deploy --remote-only` (Fly's remote builder) rather than switching to local Docker builds in CI.

**Non-Goals:**
- No change to `src/lib/google-adsense.ts`, `src/lib/ad-policy.ts`, `PageLayout.tsx`, or any other application code — the read side is already correct.
- No change to the ad *layout* (slot count, floating footer, sideboard count) — that's a separate product/design decision tracked outside this change.
- No change to how genuinely secret values (`BETTER_AUTH_SECRET`, `MONGODB_URI`, `STRIPE_SECRET_KEY`, etc.) are managed — those stay as Fly runtime secrets since they're never bundled into client JS.

## Decisions

**Decision 1: Pass these values as Docker `--build-arg`, not by baking them into the repo.**
`flyctl deploy --remote-only --build-arg KEY=value` forwards build args to Fly's remote builder. The Dockerfile declares matching `ARG` entries and re-exports them as `ENV` before `RUN npm run build` (Vite reads `process.env` at build time, and `ARG` alone is not visible to `RUN` without also being consumed — the standard pattern is `ARG FOO` followed by `ENV FOO=$FOO`).
_Alternative considered:_ Committing a build-time `.env.production` file — rejected, since slot IDs may need to change without a code change/PR, and this would require redeploys with source edits for a config change.

**Decision 2: Source the build-arg values from GitHub Actions repository Variables (`vars.*`), not Secrets (`secrets.*`).**
None of these five values are sensitive — they're inlined into public JavaScript and visible to anyone who views source. Using Actions **Variables** (not **Secrets**) avoids the false impression that these need secret-level handling, and avoids GitHub's secret redaction in logs getting in the way of debugging a misconfigured slot ID.
_Alternative considered:_ Keep using Fly secrets and add a `flyctl ssh console`/release-time step to export them as build args — rejected as unnecessarily complex; Fly secrets are fundamentally the wrong mechanism for build-time values regardless of how they're threaded through.

**Decision 3: Fold the `VITE_GOOGLE_ANALYTICS_ID` fix into the same change.**
It has the identical root cause and the identical fix shape (one more `ARG`/`ENV` line, one more `--build-arg` flag). Splitting it into a separate change would mean re-touching the same two files for no benefit.

**Decision 4: Leave the existing Fly secrets of the same name in place (harmless) rather than deleting them as part of this change.**
`fly secrets unset` is a separate, low-risk cleanup action the user can take once the new mechanism is verified working; deleting them isn't required for the fix and doesn't belong in a PR whose job is to fix the pipeline.

## Risks / Trade-offs

- **[Risk]** GitHub Actions repository Variables are visible in the Settings UI to anyone with repo read access (unlike Secrets, which are write-only after creation) → **Mitigation**: acceptable, since these values are already publicly visible in the deployed page source; no confidentiality is lost.
- **[Risk]** A missing/blank Actions Variable silently produces an empty `--build-arg KEY=` → **Mitigation**: existing validation (`getValidatedGoogleAdSenseSlotId`, the `G-` regex check for the GA ID) already treats malformed/empty values as "feature disabled," so an unset variable degrades gracefully to today's status quo (sponsor slot / no GA tag) rather than a broken build.
- **[Trade-off]** Slot ID changes now require a workflow run (any push that triggers `deploy.yml`, or a manual `workflow_dispatch`) instead of being a pure runtime toggle → acceptable since these values were already effectively frozen per-deploy (they were being read at build time all along, just incorrectly).

## Migration Plan

1. Add `ARG`/`ENV` declarations to `Dockerfile` for the 5 variables, before `RUN npm run build`.
2. Add the 5 GitHub Actions repository Variables (`Settings → Secrets and variables → Actions → Variables`) with their real values.
3. Update `.github/workflows/deploy.yml` to pass `--build-arg KEY=${{ vars.KEY }}` for each of the 5 variables on the `flyctl deploy` step.
4. Merge and let the next PR-merge-triggered deploy run; verify via `view-source` on the live site that the AdSense script tag and `data-ad-slot` values are present, and that the GA `gtag` script loads.
5. Once verified, optionally run `fly secrets unset VITE_ADSENSE_ENABLED VITE_GOOGLE_ADSENSE_TOP_SLOT_ID VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID VITE_GOOGLE_ANALYTICS_ID` as cleanup (out of band, not part of this change's tasks).

Rollback: revert the Dockerfile/workflow commit; behavior returns to today's status quo (sponsor slot only, no GA), which is a safe, already-shipped state.

## Open Questions

- Should `VITE_ADSENSE_ENABLED` default to `true` once slot IDs exist, or remain an explicit opt-in switch the user flips manually after verifying each slot in AdSense? (Current proposal keeps it as an explicit Actions Variable the user sets themselves — no behavior change to the flag's meaning.)
