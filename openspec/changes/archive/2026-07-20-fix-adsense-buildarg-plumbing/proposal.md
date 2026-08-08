## GitHub Issues

- #624

## Why

- Problem statement: Ad slots (and, most likely, Google Analytics) never render on the live production site because the Fly.io deploy pipeline never delivers `VITE_*` build-time configuration into the Docker build that produces the shipped bundle. Setting these as Fly secrets has no effect — Fly secrets are only injected into the running container at runtime, while Vite inlines `import.meta.env.VITE_*` once, at `npm run build` time, inside the Docker builder stage.
- Why now: Reported live in GitHub issue #624 ("Ads are not loading on live site") — this is a revenue-affecting production bug, not a nice-to-have.
- Business/user impact: Zero ad revenue from the free tier despite the ad system being fully built and gated correctly by `ad-policy.ts`/`showUserAds`; likely zero Analytics data collection as well, meaning product decisions may be flying blind on real usage.

## Problem Space

- Current behavior: `Dockerfile`'s builder stage runs `RUN npm run build` with no `ARG`/`ENV` declarations for any `VITE_*` variable. `.github/workflows/deploy.yml` runs `flyctl deploy --remote-only` with no `--build-arg` flags. Fly secrets named `VITE_ADSENSE_ENABLED`, `VITE_GOOGLE_ADSENSE_TOP_SLOT_ID`, `VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID`, and `VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID` do not currently exist at all (confirmed via `flyctl secrets list`); `VITE_GOOGLE_ANALYTICS_ID` *is* set as a Fly secret but is suspected non-functional for the same structural reason.
- Desired behavior: The five client-exposed `VITE_*` configuration values reach the compiled client bundle that Fly actually serves, so `AdSlot` can render real Google AdSense units (when enabled) and the GA tag loads.
- Constraints: Must keep `flyctl deploy --remote-only` (Fly's remote builder) — no local Docker build step should be introduced into CI. Must not weaken the existing graceful-degradation behavior (unset/invalid values today safely fall back to the `SponsorSlot` house ad / no GA tag — that must still hold).
- Assumptions: These five values are not confidential — they are inlined into public client JavaScript and visible via view-source regardless of how they're stored, so they can be sourced from GitHub Actions repository **Variables** rather than **Secrets**.
- Edge cases considered: A build triggered with no `--build-arg` values supplied (e.g., a manual `workflow_dispatch` run before repo Variables are configured) must still produce a working build — the app must degrade to today's status quo (no ads, no GA), not fail to build.

## Scope

### In Scope

- `Dockerfile`: add `ARG`/`ENV` plumbing for `VITE_ADSENSE_ENABLED`, `VITE_GOOGLE_ADSENSE_TOP_SLOT_ID`, `VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID`, `VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID`, `VITE_GOOGLE_ANALYTICS_ID`.
- `.github/workflows/deploy.yml`: pass those five values to `flyctl deploy` as `--build-arg` flags, sourced from GitHub Actions repository Variables.
- `.github/workflows/deploy.yml`: add a pre-deploy validation step, scoped to this workflow only (which already runs exclusively on PR-merge-to-`main` or `workflow_dispatch`, i.e. production deploys — no staging/preview deploy exists today), that fails the job loudly if any of the 5 repository Variables is unset or empty. This check must not run in any other workflow (PR CI, unit/e2e test jobs) so local/non-prod work never sees this noise.
- Documentation update (`.env.example` and/or `docs/`) clarifying these five values live as Actions repo Variables, not Fly secrets.
- Manual, out-of-band step (tracked as a task, not code): creating the 5 GitHub Actions repository Variables with real values, with `VITE_ADSENSE_ENABLED` set to `true`.

### Out of Scope

- Any change to `src/lib/google-adsense.ts`, `src/lib/ad-policy.ts`, `PageLayout.tsx`, `SponsorSlot.tsx`, or `__root.tsx` — the application read-side logic is already correct.
- The ad *layout* itself (number of concurrent slots, "floating"/sticky footer behavior, 2-sideboard vs. 1-right-rail design) — that is a separate, already-identified design discrepancy between GitHub issue #624's expectations and the documented `design-system/handoff/issues/F02-ads-on-authed-pages.md` spec, to be handled as its own change once a product decision is made.
- Removing the now-redundant Fly secrets of the same name — safe cleanup, not required for the fix, left as an optional manual step.

## What Changes

- `Dockerfile` builder stage gains `ARG`/`ENV` declarations for the 5 variables, placed before `RUN npm run build`.
- `.github/workflows/deploy.yml`'s `flyctl deploy --remote-only` step gains `--build-arg KEY=${{ vars.KEY }}` for each of the 5 variables.
- New GitHub Actions repository Variables created (manual, tracked in tasks).
- `.env.example` and/or deploy docs updated to state these values must be Actions Variables, not Fly secrets, to actually take effect.

## Risks

- Risk: GitHub Actions repository Variables are visible in the Settings UI to any collaborator with read access (unlike write-only Secrets).
  - Impact: None of material consequence — these values are already publicly visible in deployed page source.
  - Mitigation: None needed; documented as an intentional trade-off in design.md.
- Risk: A misconfigured or empty Actions Variable produces an empty `--build-arg KEY=`.
  - Impact: Feature silently stays disabled (same as today), not a build failure.
  - Mitigation: Existing validation (`getValidatedGoogleAdSenseSlotId`, GA ID regex check) already treats malformed/empty values as "feature off" — no new code path needed.
- Risk: Forgetting to also create the Actions Variables after merging the workflow/Dockerfile change means the fix ships but nothing changes.
  - Impact: Issue #624 stays open despite a "fix" landing.
  - Mitigation: Superseded by the new loud pre-deploy validation step below — a missing Variable now fails the production deploy job outright instead of silently shipping a no-op fix.
- Risk: A loud pre-deploy check could become noisy if it accidentally runs on non-production workflows (PR checks, test jobs, preview builds).
  - Impact: Unrelated CI runs fail or produce false alarms, training the team to ignore the check.
  - Mitigation: The validation step lives only inside `deploy.yml`'s single `deploy` job, which already gates on `github.event.pull_request.merged == true || github.event_name == 'workflow_dispatch'` — i.e. production deploys only. No other workflow file is touched.

## Open Questions

Resolved by repo owner (doug) during proposal review:

- `VITE_ADSENSE_ENABLED` is set to `true` as part of the 5 Actions Variables created in this change — not left as a deferred manual toggle.
- The production deploy workflow (`deploy.yml`) fails loudly if any of the 5 Variables is unset/empty. This check is confined to `deploy.yml`'s `deploy` job (prod-only trigger) and must not be added to PR/CI/test workflows, to avoid non-prod noise.

No further open questions remain blocking apply.

## Non-Goals

- Not redesigning the ad placement/inventory (2 sideboards + header + floating footer vs. the current 1-slot-per-page model) — tracked separately.
- Not introducing a new secrets-management tool or changing how genuinely sensitive values (`BETTER_AUTH_SECRET`, `MONGODB_URI`, `STRIPE_SECRET_KEY`) are handled.
- Not changing the `AD_ENABLED_ROLES` / tier-eligibility policy in `ad-policy.ts`.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`, `specs/**/*.md`, and `tasks.md` before implementation starts.
