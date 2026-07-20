## 1. Infra provisioning (non-code, precedes the flip)

- [ ] 1.1 Add DNS record(s) at the registrar for `www.mycookbooks.us` pointing to Fly (and decide/implement apex `mycookbooks.us` handling — e.g. ALIAS/redirect to `www`)
- [ ] 1.2 Provision a Fly TLS cert for `www.mycookbooks.us` (`flyctl certs add www.mycookbooks.us`)
- [ ] 1.3 Verify `www.mycookbooks.us` resolves and serves the app directly over HTTPS, before it becomes the configured primary

## 2. Secrets flip (non-code)

- [ ] 2.1 Update `BETTER_AUTH_TRUSTED_ORIGINS` Fly secret to include both `https://www.mycookbooks.us` and `https://recipe.dougis.com`
- [ ] 2.2 Set `APP_PRIMARY_URL` Fly secret to `https://www.mycookbooks.us`
- [ ] 2.3 Set `BETTER_AUTH_URL` Fly secret to `https://www.mycookbooks.us`

## 3. Post-flip verification

- [ ] 3.1 Confirm `recipe.dougis.com` now 301-redirects to `https://www.mycookbooks.us` (path/query preserved)
- [ ] 3.2 Confirm login/session flow works end-to-end on `www.mycookbooks.us`
- [ ] 3.3 Confirm the Fly health check (`/api/health`) still passes post-flip
- [ ] 3.4 Confirm cookbook share links and transactional emails now render `www.mycookbooks.us` URLs

## 4. Repo documentation updates

- [ ] 4.1 Update `.env.example` production example comments for `APP_PRIMARY_URL` and `BETTER_AUTH_TRUSTED_ORIGINS` to reference `www.mycookbooks.us` instead of `recipe.dougis.com`
- [ ] 4.2 Confirm spec deltas in this change (`specs/domain-redirect/spec.md`, `specs/fly-deployment/spec.md`) are ready to archive into `openspec/specs/`

## 5. Follow-up (tracked outside this change)

- [ ] 5.1 Confirm GitHub issue #633 (secrets documentation) is filed and linked from this change's proposal — already done during exploration, verify it's still open
