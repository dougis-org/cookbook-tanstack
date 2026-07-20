## 1. Infra provisioning (non-code, precedes the flip)

- [x] 1.1 Add DNS record(s) at the registrar for `www.mycookbooks.us` pointing to Fly (and decide/implement apex `mycookbooks.us` handling — e.g. ALIAS/redirect to `www`)
- [x] 1.2 Provision a Fly TLS cert for `www.mycookbooks.us` (`flyctl certs add www.mycookbooks.us`)
- [x] 1.3 Verify `www.mycookbooks.us` resolves and serves the app directly over HTTPS, before it becomes the configured primary

## 2. Secrets flip (non-code)

- [x] 2.1 Update `BETTER_AUTH_TRUSTED_ORIGINS` Fly secret to include both `https://www.mycookbooks.us` and `https://recipe.dougis.com`
- [x] 2.2 Set `APP_PRIMARY_URL` Fly secret to `https://www.mycookbooks.us`
- [x] 2.3 Set `BETTER_AUTH_URL` Fly secret to `https://www.mycookbooks.us`

## 3. Post-flip verification

- [x] 3.1 Confirm `recipe.dougis.com` now 301-redirects to `https://www.mycookbooks.us` (path/query preserved)
- [x] 3.2 Confirm login/session flow works end-to-end on `www.mycookbooks.us`
- [x] 3.3 Confirm the Fly health check (`/api/health`) still passes post-flip
- [x] 3.4 Confirm cookbook share links and transactional emails now render `www.mycookbooks.us` URLs — share links confirmed; transactional emails still need separate debugging (pre-existing `mycookbooks.app` fallback in `src/emails/Layout.tsx`, already flagged out-of-scope in this change's proposal)

## 4. Repo documentation updates

- [x] 4.1 Update `.env.example` production example comments for `APP_PRIMARY_URL` and `BETTER_AUTH_TRUSTED_ORIGINS` to reference `www.mycookbooks.us` instead of `recipe.dougis.com`
- [x] 4.2 Confirm spec deltas in this change (`specs/domain-redirect/spec.md`, `specs/fly-deployment/spec.md`) are ready to archive into `openspec/specs/`

## 5. Follow-up (tracked outside this change)

- [x] 5.1 Confirm GitHub issue #633 (secrets documentation) is filed and linked from this change's proposal — already done during exploration, verify it's still open
