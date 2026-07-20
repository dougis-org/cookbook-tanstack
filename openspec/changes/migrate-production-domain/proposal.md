## Why

The app currently launches under `recipe.dougis.com`, a developer-owned placeholder domain. We're ready to launch on the real branded domain, `www.mycookbooks.us`, and need the app to redirect there instead. This is a soft cutover: `recipe.dougis.com` keeps its DNS/TLS and will continue to work, but now 301s to the new primary domain via the existing redirect middleware, so old links and bookmarks don't break.

## What Changes

- Flip `APP_PRIMARY_URL` and `BETTER_AUTH_URL` Fly secrets from `https://recipe.dougis.com` to `https://www.mycookbooks.us`.
- Add `https://www.mycookbooks.us` to the `BETTER_AUTH_TRUSTED_ORIGINS` Fly secret, keeping `https://recipe.dougis.com` in the list (Better Auth's origin check runs before the redirect middleware, so a request that still lands on the old domain needs its origin trusted too).
- Update `.env.example`'s production example comments (`APP_PRIMARY_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`) to reference `www.mycookbooks.us` instead of `recipe.dougis.com`.
- Update fixture/example domain strings in `openspec/specs/domain-redirect/spec.md` and `openspec/specs/fly-deployment/spec.md` so the documented primary domain matches production.
- Infra-side (outside this repo, tracked as tasks but not code changes): provision a Fly TLS cert for `www.mycookbooks.us`, add the DNS record at the registrar, and decide apex (`mycookbooks.us`) handling.

No application code changes are required — `getDomainRedirectUrl` (`src/lib/domain-redirect.ts`) already derives all behavior from `APP_PRIMARY_URL`, so the redirect logic itself does not need to change, only its configured value.

## Capabilities

### New Capabilities

None — no new spec-level behavior is introduced.

### Modified Capabilities

- `domain-redirect`: no requirement changes; example/fixture domain values in the spec (`recipe.dougis.com`) are updated to the new primary (`www.mycookbooks.us`) to stay accurate as documentation. The behavior described (redirect any non-primary named host to `APP_PRIMARY_URL`, pass through IP-addressed hosts) is unchanged.
- `fly-deployment`: no requirement changes to deployment mechanics; the health-check scenario's example domain reference is updated for consistency (this spec file also had a pre-existing drift issue — a scenario claiming the health check sends an explicit `Host: recipe.dougis.com` header, which does not match current `fly.toml` — corrected as part of this change since it touches the same file and the same underlying fact: the health check relies on the IP-passthrough guard, not a domain-specific header).

## Impact

- **Fly secrets** (not in repo, applied via `flyctl secrets set`): `APP_PRIMARY_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`.
- **Fly infra** (not in repo, applied via `flyctl certs add` / registrar DNS console): TLS cert and DNS record for `www.mycookbooks.us`.
- **Files in repo**: `.env.example`, `openspec/specs/domain-redirect/spec.md`, `openspec/specs/fly-deployment/spec.md`.
- **Downstream behavior affected by the env flip** (no code changes, but these all read `APP_PRIMARY_URL`/`BETTER_AUTH_URL` at runtime): Better Auth session/origin validation (`src/lib/auth.ts`), domain-redirect middleware (`src/start.ts`), cookbook share links (`src/server/trpc/routers/cookbooks.ts`), transactional email links (`src/emails/Layout.tsx`).
- **Not in scope**: the `mycookbooks.com` reference in `src/routes/privacy-policy.tsx` and the `mycookbooks.app` fallback in `src/emails/Layout.tsx` — these are separate brand-domain inconsistencies noticed during exploration but are out of scope for this change. Full secrets documentation (what each Fly/CI secret is for, where it's set, when it must change) is tracked separately in GitHub issue #633, not part of this change.
