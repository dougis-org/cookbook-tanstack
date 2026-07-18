## Why

GitHub issue #624 reports that ad slots (and likely the already-configured Google Analytics tag) never render in production. Root cause: `VITE_*` variables are inlined by Vite at **build time**, but the Fly.io deploy pipeline only ever injects secrets at **container runtime**. The `Dockerfile` builder stage runs `npm run build` with no `ARG`/`ENV` declarations for any `VITE_*` variable, and `.github/workflows/deploy.yml` calls `flyctl deploy --remote-only` without passing `--build-arg`. As a result, `import.meta.env.VITE_ADSENSE_ENABLED` and the three `VITE_GOOGLE_ADSENSE_*_SLOT_ID` variables are always `undefined` in the compiled bundle, regardless of what is set with `fly secrets set` — and `VITE_GOOGLE_ANALYTICS_ID`, which *is* already set as a Fly secret, is almost certainly suffering the same silent failure.

## What Changes

- Add `ARG`/`ENV` declarations to the `Dockerfile` builder stage for all client-exposed build-time variables: `VITE_ADSENSE_ENABLED`, `VITE_GOOGLE_ADSENSE_TOP_SLOT_ID`, `VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID`, `VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID`, and `VITE_GOOGLE_ANALYTICS_ID` (folding in the same fix for the pre-existing analytics gap), placed before `RUN npm run build` so Vite can inline them.
- Update `.github/workflows/deploy.yml` to pass each of those values via `flyctl deploy --remote-only --build-arg KEY=value`, sourced from repository (Actions) variables/secrets rather than Fly secrets, since these values are inlined into public JS and are not sensitive.
- Document in `.env.example` and/or deploy docs that these specific `VITE_*` values must live as GitHub Actions repo variables (not just Fly secrets) because Fly secrets never reach the Docker build step.
- No application code changes — `src/lib/google-adsense.ts`, `src/lib/ad-policy.ts`, and `PageLayout.tsx` already read `import.meta.env.VITE_*` correctly; the bug is entirely in the build/deploy plumbing.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `fly-deployment`: The `Dockerfile` builder stage and `.github/workflows/deploy.yml` currently have no mechanism to pass `VITE_*` build-time variables into the Docker build. This adds `ARG`/`ENV` plumbing and `--build-arg` passing so client-exposed configuration (AdSense, Analytics) actually reaches the compiled bundle.

## Impact

- `Dockerfile` — add `ARG`/`ENV` lines in the builder stage.
- `.github/workflows/deploy.yml` — add `--build-arg` flags to the `flyctl deploy` step, sourced from `vars.*` / `secrets.*`.
- GitHub repository settings — new Actions variables (and/or secrets) need to be created for the 5 `VITE_*` values; existing Fly secrets of the same names become redundant for build purposes (may be removed or left as harmless unused runtime env vars).
- No runtime application code changes; no schema/API changes; no test behavior changes beyond a possible new workflow-level check.
