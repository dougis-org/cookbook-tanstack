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
  - Must not document stale values. This change is **blocked** on two in-flight items:
    - #632 (domain migration to `www.mycookbooks.us`) — currently being pushed with a PR about to be cut. `APP_PRIMARY_URL`, `BETTER_AUTH_URL`, and `BETTER_AUTH_TRUSTED_ORIGINS` values documented here must reflect its final merged state, not the in-progress one.
    - #635 (`VITE_STRIPE_PUBLISHABLE_KEY` may not reach the production client bundle) — filed as a follow-up bug during exploration of this issue. Whether that var is a Fly secret, a GitHub Actions Variable passed via `--build-arg`, or currently broken must be resolved before this doc can state its storage location correctly.
- Assumptions:
  - #632 will merge with `www.mycookbooks.us` as `APP_PRIMARY_URL`/`BETTER_AUTH_URL`, and will keep `recipe.dougis.com` + the `.fly.dev` fallback in `BETTER_AUTH_TRUSTED_ORIGINS` during the transition period (confirmed via the `flyctl secrets set` command already run against production).
  - #635 will be resolved (either confirming the current setup is correct, or fixing `deploy.yml` to pass `VITE_STRIPE_PUBLISHABLE_KEY` as a build-arg) before this change is applied.
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

- Fixing #635 itself (tracked separately; this change only documents its resolution once merged).
- Fixing the `mycookbooks.app`/`mycookbooks.com` hardcoded strings (flagged in the doc, not remediated here — no issue currently tracks that cleanup; may warrant its own follow-up issue but is not this change's job).
- Any change to `.github/workflows/deploy.yml` or `.github/workflows/build-and-test.yml` behavior (documentation only, no CI logic changes).
- A rotation runbook / step-by-step "how to rotate secret X" procedure — this change documents *what* and *why*, not a rotation playbook. Could be a natural follow-up.
- Any change to how secrets are actually stored (e.g., migrating to a secrets manager) — purely documenting the current state.

## What Changes

- `docs/standards/ci-cd.md` gains a new `## Production Secrets & Environment Variables` section (table + risk-detail subsection) inserted after "What CI/CD Checks" and before "Deployment & Release".
- `.env.example`'s `APP_PRIMARY_URL` comment is corrected to the current canonical domain.

## Risks

- Risk: This change is blocked on two external, in-flight items (#632, #635) landing first.
  - Impact: If applied before either lands, the doc will contain incorrect values on day one, defeating its purpose.
  - Mitigation: Tasks/apply for this change should not proceed until both #632 is merged and #635 is resolved (either fixed or explicitly confirmed as working-as-documented). This is called out as a blocking dependency, not a soft suggestion.
- Risk: The var inventory may be incomplete — some production secrets could be set directly via `fly secrets set` / GitHub Actions UI with zero trace in any repo file.
  - Impact: The doc ships "complete" but silently omits a var, recreating the exact problem it's meant to solve.
  - Mitigation: Cross-check the documented list against `fly secrets list` output and the GitHub repo's Settings → Secrets/Variables pages before finalizing, not just static file grep. Flagged as an open question below.
- Risk: Doc rot — this table will drift out of date the next time a var is added/removed/rotated if updating it isn't habitual.
  - Impact: Same failure mode the issue exists to prevent, just deferred.
  - Mitigation: Out of scope for this change to solve process-wise, but worth naming so a future "keep this table updated" norm can be proposed separately (e.g. PR template checklist item).

## Open Questions

- Question: Should apply for this change wait on a hard confirmation that #632 has merged and #635 is closed, or is it acceptable to draft the doc now with placeholder/TBD values and do a final pass once both land?
  - Needed from: dougis
  - Blocker for apply: yes — design.md and tasks.md will assume "wait for both to close" unless told otherwise.
- Question: Should the doc's var table be cross-checked against live `fly secrets list` / GitHub repo Settings output (not just static file grep) to catch anything with zero trace in the repo, and if so, who has access to run that check?
  - Needed from: dougis
  - Blocker for apply: no — can proceed with the file-grep-derived inventory and flag it as best-effort in the doc if live verification isn't feasible.
- Question: Does the `mycookbooks.app`/`mycookbooks.com` hardcoded-string cleanup deserve its own tracked GitHub issue now, or just the callout in this doc for later?
  - Needed from: dougis
  - Blocker for apply: no — the callout alone satisfies this change's scope either way.

## Non-Goals

- Not building a secrets rotation runbook or automation.
- Not migrating secret storage to a different system.
- Not fixing the underlying `VITE_STRIPE_PUBLISHABLE_KEY` build-arg gap (#635) or the hardcoded domain strings — both are documented/flagged, not remediated, here.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
