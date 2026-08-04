## Context

Production currently runs at `recipe.dougis.com`, a placeholder domain picked before the brand was finalized. The real branded domain, `www.mycookbooks.us`, is ready. The redirect mechanism (`getDomainRedirectUrl` in `src/lib/domain-redirect.ts`) already exists and is driven entirely by the `APP_PRIMARY_URL` env var — any request whose named `Host` differs from that value gets a 301 to it. Auth trust (`BETTER_AUTH_TRUSTED_ORIGINS`) is a separate, independently-configured list. This means the domain switch is a config/infra change, not an application code change.

Two prior spec fixtures still cite `recipe.dougis.com` as the example primary domain (`openspec/specs/domain-redirect/spec.md`, `openspec/specs/fly-deployment/spec.md`). One of those also has an unrelated drift bug: a scenario claims the Fly health check sends an explicit `Host: recipe.dougis.com` header, but current `fly.toml` has no `headers` field on the check at all — the health check actually passes purely because of the IP-passthrough guard added in a later change. Both are corrected here since this change already touches those files' domain examples.

## Goals / Non-Goals

**Goals:**
- `www.mycookbooks.us` becomes the primary domain: unauthenticated and authenticated traffic all resolve there, and Better Auth trusts it as an origin.
- `recipe.dougis.com` keeps working (soft cutover) — it 301s to the new primary via the existing redirect middleware, so old links/bookmarks/SEO don't break.
- Spec documentation matches reality: example domains reflect the new primary; the health-check Host-header drift is corrected.

**Non-Goals:**
- No change to the redirect mechanism's logic (`getDomainRedirectUrl`) — it is domain-agnostic by design and needs no code change.
- No hard cutover / decommissioning of `recipe.dougis.com` — that's a future, separate decision once traffic has migrated.
- No resolution of the other stray domain references (`mycookbooks.com` in the privacy policy route, `mycookbooks.app` fallback in email layout) — out of scope, flagged for a separate follow-up.
- No secrets-documentation deliverable — tracked in GitHub issue #633.

## Decisions

**Decision: Soft cutover via existing redirect middleware, not a hard switch.**
Keep `recipe.dougis.com`'s Fly TLS cert and DNS record live. Once `APP_PRIMARY_URL` flips to `https://www.mycookbooks.us`, `getDomainRedirectUrl` will treat `recipe.dougis.com` as just another non-primary named host and 301 it to the new primary — no new code path needed. Alternative considered: hard cutover (drop the old domain's cert/DNS immediately). Rejected because it breaks existing bookmarks/backlinks/emails-in-flight with no migration window, for no benefit (the old domain costs nothing to keep serving a redirect).

**Decision: Keep both domains in `BETTER_AUTH_TRUSTED_ORIGINS` during the transition.**
Better Auth's origin check happens independently of the redirect middleware — a POST hitting `recipe.dougis.com/api/auth/...` directly (e.g., a stale client-side fetch, an old bookmarked form) needs its origin trusted or auth calls will fail with an origin-mismatch error before the user ever gets redirected. Keeping `https://recipe.dougis.com` in the trusted-origins list alongside the new domain avoids breaking in-flight sessions during the transition.

**Decision: Route the fly-deployment spec fix through a MODIFIED delta, not a direct edit to `openspec/specs/`.**
Initially fixed the health-check drift by editing `openspec/specs/fly-deployment/spec.md` directly during exploration. Reverted that — canonical specs under `openspec/specs/` are meant to be updated only via a change's delta + archive, so the correction is expressed as a `MODIFIED Requirements` block in this change's `specs/fly-deployment/spec.md` instead, and will land in the canonical file when this change is archived.

## Risks / Trade-offs

- **[Risk] Better Auth trusted-origins list grows stale if the old domain is never removed.** → Mitigation: this is an accepted, explicit trade-off of a soft cutover; revisit removal once analytics show `recipe.dougis.com` traffic has dropped to near zero (a separate future decision, not blocking this change).
- **[Risk] Secrets are applied by hand via `flyctl secrets set` — a typo silently breaks auth/redirect in production.** → Mitigation: tasks.md includes an explicit post-flip verification step (hit both domains, confirm redirect + login work) before considering the change done.
- **[Risk] DNS propagation delay for the new domain means a window where `www.mycookbooks.us` doesn't resolve yet.** → Mitigation: sequence tasks so DNS + Fly cert are provisioned and verified *before* flipping `APP_PRIMARY_URL`, so the redirect target is always live.

## Migration Plan

1. Provision Fly TLS cert for `www.mycookbooks.us`; add DNS record at the registrar; verify the domain resolves and serves the app directly (before it's the configured primary).
2. Update `BETTER_AUTH_TRUSTED_ORIGINS` to include both domains.
3. Flip `APP_PRIMARY_URL` and `BETTER_AUTH_URL` to `https://www.mycookbooks.us`.
4. Verify: `recipe.dougis.com` now 301s to `www.mycookbooks.us`; login/session works on the new domain; existing sessions on the old domain aren't broken mid-flight.
5. Update in-repo docs (`.env.example`, spec examples) to match.

**Rollback:** flip `APP_PRIMARY_URL`/`BETTER_AUTH_URL` back to `https://recipe.dougis.com` — no code deploy needed, no DNS changes to undo (the old domain's cert/DNS was never touched).

## Open Questions

None — domain, cutover strategy, and secrets-doc scope were resolved during exploration (GitHub issue #632 discussion) before this proposal.
