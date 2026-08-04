## GitHub Issues

- #633

## Why

- Problem statement: There is no documentation anywhere in the repo listing the secrets/environment variables the production deployment depends on — what each one is, where it's configured (Fly secret vs Fly `[env]` vs GitHub Actions secret vs GitHub Actions Variable — these have different build-time/runtime semantics), what breaks if it's wrong, and when it needs to change. Anyone rotating a value or standing up a new environment has to reverse-engineer it from source.
- Why now: The #632 domain migration (to `https://www.mycookbooks.us`) surfaced this gap directly — three/four inconsistent domain strings (`recipe.dougis.com`, `mycookbooks.com`, `mycookbooks.app`, `www.mycookbooks.us`) were found scattered across code and tests with no single source of truth for which was current. That migration is a preview of the class of problem this doc prevents.
- Business/user impact: Wrong secret values in production can cause anything from a full outage (wrong `BETTER_AUTH_URL` logs out all users) to silent, hard-to-detect drift (wrong `STRIPE_WEBHOOK_SECRET` silently stops subscription state from syncing, with no visible error). Documenting failure modes up front reduces time-to-diagnose when a rotation or migration goes wrong, and reduces the chance of a wrong rotation happening in the first place.

## Problem Space

- Current behavior: Secret/env var knowledge is implicit — spread across `.env.example` (local dev focused), `fly.toml`, `.github/workflows/deploy.yml`, and `.github/workflows/build-and-test.yml`, with no single authoritative reference and no notes on blast radius when a value is wrong.
- Desired behavior: A single documented section (in `docs/standards/ci-cd.md`, per explicit user direction — avoids doc sprawl by not creating a new `docs/deployment.md`) listing every production secret/env var with: what it is, where it's set, what depends on it, when it needs to change, and — for the higher-risk vars — a "What Breaks If Wrong" explanation of the concrete failure mode.
- Constraints:
  - Must land as a `docs/standards/ci-cd.md` section, not a new file (explicit user instruction, to avoid doc sprawl).
  - Must not document stale values for things that are actually settled. This change is **blocked** on:
    - #632 (domain migration to `www.mycookbooks.us`) — merged via #638. `APP_PRIMARY_URL`, `BETTER_AUTH_URL`, and `BETTER_AUTH_TRUSTED_ORIGINS` values documented here reflect that merged state.
  - This change is explicitly **not blocked** on #635 (`VITE_STRIPE_PUBLISHABLE_KEY` may not reach the production client bundle). Stripe billing is not fully set up yet and #635 will not be fixed for a while. The doc's job is to state the *correct/intended* storage location for this var (a GitHub Actions Variable passed via `--build-arg`, per the same pattern as the AdSense/GA vars) and flag the current known gap as an open caveat — not to wait for the gap to close. Documenting "here's what should be true and here's the known discrepancy" is in scope; fixing the discrepancy is not.
- Assumptions:
  - #632 merged with `www.mycookbooks.us` as `APP_PRIMARY_URL`/`BETTER_AUTH_URL`, keeping `recipe.dougis.com` + the `.fly.dev` fallback in `BETTER_AUTH_TRUSTED_ORIGINS` during the transition period (confirmed via the `flyctl secrets set` command already run against production, and via merged PR #638).
  - `VITE_STRIPE_PUBLISHABLE_KEY`'s intended/correct storage location can be documented from the established `VITE_*` build-arg pattern (`deploy.yml`) without needing #635 to be fixed first — the doc states the intended value and separately notes the known gap.
  - The full var inventory is derivable from `.env.example`, `fly.toml`, `.github/workflows/deploy.yml`, and `.github/workflows/build-and-test.yml` — no vars are configured purely through the Fly dashboard/CLI with no trace in these files (other than the runtime-only Fly secrets, which by definition have no file trace and are inventoried from `.env.example`'s server-side var list).
- Edge cases considered:
  - Vars that fail loudly (e.g. `FLY_API_TOKEN`, `PORT`) vs. vars that fail silently/ambiguously (e.g. `STRIPE_WEBHOOK_SECRET`, `MAILTRAP_API_TOKEN`) need different documentation weight — the "What Breaks If Wrong" subsection is scoped to the latter category plus the highest-blast-radius vars (auth), not every var uniformly.
  - `mycookbooks.app` (hardcoded fallback in `src/emails/Layout.tsx`) and `mycookbooks.com` (hardcoded contact email in `src/routes/privacy-policy.tsx`) are NOT driven by `APP_PRIMARY_URL` — the doc must flag this explicitly so a future domain rotation doesn't assume these follow automatically.

## Scope

### In Scope

- New `## Production Secrets & Environment Variables` section in `docs/standards/ci-cd.md`.
- A table covering every var found in `.env.example`, `fly.toml`, `deploy.yml`, and `build-and-test.yml`: variable name, where it's set (with the four storage-location categories defined), what depends on it, and when it changes.
- A `### What Breaks If Wrong` subsection with prose risk explanations for the vars whose failure mode is non-obvious or high-blast-radius (auth vars, Stripe vars, `MONGODB_URI`, `MAILTRAP_API_TOKEN`/`MAIL_FROM`, `IMAGE_KIT_API_KEY`, CI tokens).
- Correcting `.env.example`'s stale `# Production: APP_PRIMARY_URL=https://recipe.dougis.com` comment to reflect the post-#632 canonical domain.
- A flag/callout that `mycookbooks.app` and `mycookbooks.com` are hardcoded elsewhere in source and not derived from `APP_PRIMARY_URL`.

### Out of Scope

- Fixing #635 itself (tracked separately; this change documents the intended value and flags the known gap, it does not wait for or perform the fix).
- Fixing the `mycookbooks.app`/`mycookbooks.com` hardcoded strings (flagged in the doc, not remediated here — no issue currently tracks that cleanup; may warrant its own follow-up issue but is not this change's job).
- Any change to `.github/workflows/deploy.yml` or `.github/workflows/build-and-test.yml` behavior (documentation only, no CI logic changes).
- A rotation runbook / step-by-step "how to rotate secret X" procedure — this change documents *what* and *why*, not a rotation playbook. Could be a natural follow-up.
- Any change to how secrets are actually stored (e.g., migrating to a secrets manager) — purely documenting the current state.

## What Changes

- `docs/standards/ci-cd.md` gains a new `## Production Secrets & Environment Variables` section (table + risk-detail subsection) inserted after "What CI/CD Checks" and before "Deployment & Release".
- `.env.example`'s `APP_PRIMARY_URL` comment is corrected to the current canonical domain.

## Risks

- Risk: Documenting `VITE_STRIPE_PUBLISHABLE_KEY`'s intended storage location while #635 remains unresolved could be misread as claiming the current setup is correct.
  - Impact: A reader could assume production Stripe checkout works today when #635 says it may not.
  - Mitigation: The doc's table row and "What Breaks If Wrong" entry for this var explicitly state it as the *intended* location and link #635 as an open, unresolved gap — not as settled fact.
- Risk: The var inventory may be incomplete — some production secrets could be set directly via `fly secrets set` / GitHub Actions UI with zero trace in any repo file.
  - Impact: The doc ships "complete" but silently omits a var, recreating the exact problem it's meant to solve.
  - Mitigation: Cross-check the documented list against `fly secrets list` output and the GitHub repo's Settings → Secrets/Variables pages before finalizing, not just static file grep. Flagged as an open question below.
- Risk: Doc rot — this table will drift out of date the next time a var is added/removed/rotated if updating it isn't habitual.
  - Impact: Same failure mode the issue exists to prevent, just deferred.
  - Mitigation: Out of scope for this change to solve process-wise, but worth naming so a future "keep this table updated" norm can be proposed separately (e.g. PR template checklist item).

## Open Questions

- Question: Should the doc's var table be cross-checked against live `fly secrets list` / GitHub repo Settings output (not just static file grep) to catch anything with zero trace in the repo, and if so, who has access to run that check?
  - Needed from: dougis
  - Blocker for apply: no — can proceed with the file-grep-derived inventory and flag it as best-effort in the doc if live verification isn't feasible.
- Question: Does the `mycookbooks.app`/`mycookbooks.com` hardcoded-string cleanup deserve its own tracked GitHub issue now, or just the callout in this doc for later?
  - Needed from: dougis
  - Blocker for apply: no — the callout alone satisfies this change's scope either way.

## Non-Goals

- Not building a secrets rotation runbook or automation.
- Not migrating secret storage to a different system.
- Not fixing the underlying `VITE_STRIPE_PUBLISHABLE_KEY` build-arg gap (#635) or the hardcoded domain strings — both are documented/flagged, not remediated, here. #635 is explicitly expected to remain open for a while (Stripe billing is not fully set up yet); this doc documents the intended state, not a fait accompli.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
