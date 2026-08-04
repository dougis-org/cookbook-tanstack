## Context

`docs/standards/ci-cd.md` currently documents CI/CD process (what gates a PR, auto-merge, deployment workflow summary) but says nothing about the secrets/env vars that deployment depends on. That knowledge lives implicitly across four files: `.env.example` (dev-focused, has some production notes bolted on), `fly.toml` (`[env]` block only), `.github/workflows/deploy.yml` (GitHub Actions Variables + `FLY_API_TOKEN` secret), and `.github/workflows/build-and-test.yml` (`CODACY_API_TOKEN` secret). This change consolidates that into one section of the existing CI/CD doc rather than a new file, per explicit direction to avoid doc sprawl.

This is a documentation-only change with no code or workflow logic changes. It is content-shaped, not architecture-shaped — the design decisions here are about *where information goes* and *how it's verified*, not about system structure.

Blocking dependency: this change was gated on #632 (domain migration) merging, which it has (via PR #638). It is explicitly **not** gated on #635 (`VITE_STRIPE_PUBLISHABLE_KEY` build-arg gap) — per direction from the requester, the doc documents the intended/correct storage location for that var and flags #635 as a known, currently-unresolved gap (Stripe billing is not fully set up yet, so #635 will stay open for a while). Waiting on it would block this doc indefinitely for no benefit; documenting intent plus a caveat is the correct shape here.

## Goals / Non-Goals

**Goals:**
- Produce one authoritative table in `docs/standards/ci-cd.md` covering every prod secret/env var reachable via static inspection of `.env.example`, `fly.toml`, `deploy.yml`, and `build-and-test.yml`.
- Explain the four storage-location categories (Fly secret, Fly `[env]`, GH Actions secret, GH Actions Variable) once, so each table row can reference the category without re-explaining runtime/build-time semantics per row.
- Add prose risk detail ("What Breaks If Wrong") for the subset of vars whose failure mode is silent, ambiguous, or high-blast-radius — not for every var, to keep the section scannable.
- Correct the one known-stale value in `.env.example` (the `APP_PRIMARY_URL` production comment) as a byproduct of this audit.

**Non-Goals:**
- Not restructuring `docs/standards/ci-cd.md` beyond inserting one new section.
- Not building tooling to keep the table in sync automatically (e.g., a script that diffs `.env.example` against the doc). Named as a future risk in the proposal, not solved here.
- Not verifying secrets against live `fly secrets list` / GitHub Settings output as a hard requirement — treated as best-effort per the proposal's open question, unless the requester says otherwise before apply.
- Not touching `deploy.yml` or `build-and-test.yml` logic, even where the audit surfaces a possible gap (that's #635's job, not this change's).
- Not waiting for #635 to resolve — documenting the intended state and flagging the known gap is sufficient.

## Decisions

**Decision: Single section in `docs/standards/ci-cd.md`, not a new `docs/deployment.md`.**
Rationale: explicit user instruction ("it should be a section in ci-cd to avoid doc sprawl"). Alternative considered (new file) was the original suggestion from issue #633's body but was overridden in conversation.

**Decision: Table format (variable / where set / depends on / changes when) plus a separate prose subsection for risk detail, rather than one wide table with a "risk" column.**
Rationale: risk explanations for vars like `STRIPE_WEBHOOK_SECRET` or `BETTER_AUTH_URL` run 3-5 sentences — cramming that into a table cell either truncates the useful part or makes the table unreadable. Splitting scan-first-table from read-when-needed-prose keeps both usable. Alternative considered: one row per var with inline risk column — rejected for readability once drafted (see exploration transcript).

**Decision: Risk detail is selective (auth vars, Stripe vars, `MONGODB_URI`, mail, ImageKit, CI tokens), not exhaustive.**
Rationale: vars like `PORT`, `NODE_ENV`, and the `VITE_GOOGLE_*` analytics/ads vars have self-evident failure modes (container won't bind port; a tracking script doesn't fire) — writing risk prose for those adds length without adding information. Alternative considered: uniform coverage for consistency — rejected as padding.

**Decision: Placement — new section inserted after "What CI/CD Checks" and before "Deployment & Release" in `docs/standards/ci-cd.md`.**
Rationale: keeps the document's existing flow (process → what's checked → **secrets reference** → deployment/release) rather than appending at the end, where it would read as an afterthought disconnected from the "Deployment & Release" section that immediately follows and depends on this context.

**Decision: `.env.example`'s `APP_PRIMARY_URL` comment gets corrected as part of this change, not deferred to #632.**
Rationale: #632 is a code/infra change (the actual secret rotation); `.env.example` is documentation, matching this change's nature. Fixing it here also means the doc and the dev-facing example file tell the same story simultaneously — no window where one is right and the other stale.

**Decision: `mycookbooks.app` / `mycookbooks.com` hardcoded strings are flagged in the new doc section, not fixed.**
Rationale: out of scope per proposal — no issue currently tracks their remediation, and fixing them is a code change (contradicts "documentation only" scope for this change). A callout is enough to prevent someone assuming a domain rotation is complete once `APP_PRIMARY_URL` changes.

**Decision: `VITE_STRIPE_PUBLISHABLE_KEY`'s row documents the intended storage location, not a wait-for-fix state, with #635 linked as an open caveat.**
Rationale: the requester was explicit — the doc's job is to clarify what values are needed and where they should live, not to be blocked on whether every value is currently set correctly. #635 is expected to stay open for a while since Stripe billing isn't fully set up yet; gating this whole doc on that timeline would be the wrong trade. Alternative considered (leave the row as "TBD — see #635"): rejected because the pattern is already knowable from `deploy.yml`'s existing AdSense/GA handling — there's a clear intended answer, it's just not yet implemented.

## Risks / Trade-offs

- [Risk] Documenting `VITE_STRIPE_PUBLISHABLE_KEY`'s intended location while #635 is open could be misread as "this works today" → [Mitigation] The table row and risk-detail entry both explicitly link #635 and state current status is unconfirmed/likely broken, not settled.
- [Risk] Static-file-derived inventory misses a secret set only via `fly secrets set`/GitHub UI with no repo trace → [Mitigation] Flagged as a proposal open question (non-blocking); the doc section can note "derived from repo files as of `<date>`; cross-check against `fly secrets list` if in doubt" so it doesn't overclaim completeness.
- [Risk] Selective risk-detail coverage could be read as "the vars left out don't matter" → [Mitigation] Open with one sentence in the section explaining why coverage is selective (self-evident failure modes excluded), so the omission reads as a deliberate scoping choice, not an oversight.
- [Trade-off] Folding this into `ci-cd.md` (an already-long doc) vs. a dedicated file trades discoverability (a reader looking for "CI/CD standards" now also finds secrets docs) for the explicit anti-sprawl preference stated by the requester. Accepted as the requester's call, not re-litigated here.

## Migration Plan

Not applicable in the infra-migration sense — this is a doc edit with no deploy/rollback mechanics. Sequencing plan:

1. Confirm #632 merged (domain migration final state known) — done, via PR #638.
2. Write the `## Production Secrets & Environment Variables` section into `docs/standards/ci-cd.md`, including the `VITE_STRIPE_PUBLISHABLE_KEY` row documented against its intended location with #635 linked as an open caveat.
3. Correct `.env.example`'s stale `APP_PRIMARY_URL` comment.
4. PR through normal CI/CD gates (this repo's standard flow — build, test, lint, security scans, Codacy — even though the diff is docs-only, per explicit user instruction to run this through the same gates as any other code change).

## Open Questions

- Carried from `proposal.md`: is live `fly secrets list` / GitHub Settings cross-check required, or is the file-grep-derived inventory sufficient with a caveat note? `tasks.md` will treat this as best-effort/optional unless told otherwise.
- #632 the GitHub issue itself still shows as open (PR #638 didn't use a closing keyword) even though its scope is done — worth closing manually, tracked as a task, not a blocker for this change.
