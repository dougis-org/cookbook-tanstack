# Alexa Skill Deployment, Beta Testing, and Rollback

Companion to `openspec/changes/alexa-echo-recipe-skill/design.md`. Covers the
operational side of the self-hosted Alexa skill: TLS/endpoint configuration,
the private beta testing process, and rollback.

## 1. Endpoint / TLS configuration (task 6.1)

The app is deployed to Fly.io (`fly.toml`) with `force_https = true`. Fly's
edge proxy terminates TLS with a CA-signed certificate (Let's Encrypt) for
the app's public hostname — this already satisfies ASK's requirement that a
self-hosted HTTPS endpoint present a certificate from a trusted CA (see
design.md Decision 1). No certificate upload or additional TLS configuration
is required.

**Skill manifest endpoint configuration** (Alexa Developer Console →
Endpoint):

- Endpoint type: **HTTPS**
- Default endpoint: `https://<production-hostname>/api/alexa/skill`
- SSL certificate type: **"My development endpoint is a sub-domain of a
  domain that has a wildcard certificate from a certificate authority"** or
  **"...is a domain name that is designated by a certificate from a
  certificate authority"**, depending on the exact hostname setup — this is
  a manifest-level checkbox, not an infrastructure change. It is not an ARN
  (no Lambda is involved).

## 2. Private beta / developer testing process (task 6.2)

This change ships a private (unpublished) custom skill only — no Alexa Skill
Store submission or certification is in scope (see proposal.md "Out of
scope"). To validate end-to-end:

1. Register the skill in the [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)
   under the same developer account used for the discovery spike (task 1.1).
2. Point the skill manifest's endpoint at the deployed app's
   `/api/alexa/skill` route (staging first, then production once verified).
3. Upload `src/server/alexa/interaction-model.json` as the interaction model
   for the skill's default locale.
4. Register the OAuth client via
   `src/scripts/register-alexa-oauth-client.ts` (task 2.6) using the
   redirect URI the console assigns for account linking, and enter the
   resulting `client_id`/`client_secret` plus this app's `/api/auth/oauth2/authorize`
   and `/api/auth/oauth2/token` URLs into the skill's Account Linking
   configuration.
5. Enable the skill for testing under the developer's own account (Alexa
   Developer Console → Test tab, or the Alexa app with the same Amazon
   account) — this is "private beta" for a custom skill; no store review is
   involved at this stage.
6. Walk through each scenario in
   `openspec/changes/alexa-echo-recipe-skill/specs/alexa-skill-integration/spec.md`
   against a real Echo Show (or the Console's device simulator) to confirm
   voice + APL behavior end-to-end (task 7.2).
7. Store certification (skill store submission, privacy policy review,
   permitted-intent review) is a distinct follow-up change, not part of this
   one — see design.md's "Risks / Trade-offs" and Open Questions.

## 3. Rollback (task 6.3)

Every piece of this change is additive and behind its own surface — none of
it sits on the critical path for existing web/app functionality:

- **Disable/delete the skill**: in the Alexa Developer Console, disable or
  delete the private skill. This immediately stops all Alexa-originated
  traffic; the `/api/alexa/skill` route simply stops receiving requests.
- **Deregister the OAuth client**: call `auth.api.deleteOAuthClient` (or the
  equivalent admin console action) for the Alexa client. Existing web/app
  sessions are untouched — they authenticate via the existing cookie-based
  Better-Auth session, not the OAuth provider.
- **Revert the route/adapter code**: reverting the PR removes
  `/api/alexa/skill`, the `alexa` tRPC router, the OAuth plugins, and the
  `alexa_skill_progress` collection's writers. The collection itself can be
  left in place or dropped — it holds no data referenced by any other part
  of the app.
- No data migration, backfill, or schema change to `recipes`/`cookbooks`/
  `users` is involved, so there is nothing to migrate back.
