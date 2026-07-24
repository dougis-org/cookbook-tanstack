# Tasks

## 1. Pre-work / discovery spike (no production code)

- [ ] 1.1 Register a development Amazon Developer account and create a private (unpublished) custom skill to confirm interaction-model, account-linking, and APL constraints match this design
- [ ] 1.2 Confirm Amazon's Account Linking requirements (redirect URIs, client authentication method, required consent screen fields) against the OAuth2 design in `design.md`
- [ ] 1.3 Confirm the minimum privacy-policy and data-handling disclosures certification will require, and note any gaps against current app privacy policy

## 2. Account linking via `@better-auth/oauth-provider` (account linking backend)

- [x] 2.1 Write failing tests for the consent page: renders the requesting client/scope from `client_id`/`scope` params, redirects unauthenticated visitors to login first, records the user's grant/deny decision
- [x] 2.2 Write failing tests for the registered Alexa OAuth client: `/authorize` issues a code only for the registered `redirect_uris`, rejects unknown/mismatched redirect URIs, requires PKCE
- [x] 2.3 Write failing tests for `/token`: exchanges a valid authorization code + PKCE verifier for an access + refresh token once, rejects reused/expired codes, rejects unknown client credentials, refresh-token exchange issues a new access token
- [x] 2.4 Write failing tests for access-token validation (used by the Alexa adapter) including expired/revoked token rejection
- [x] 2.5 Add `@better-auth/oauth-provider` and its `jwt()` dependency to the Better-Auth config in `src/lib/auth.ts`, configured with the `read:own-content` scope, to make 2.2–2.4 pass
- [x] 2.6 Register the Alexa skill as an OAuth client via `auth.api.createOAuthClient({ redirect_uris })` (or documented manual step, per the discovery spike's findings on Amazon's redirect URI)
- [x] 2.7 Implement the consent page UI to make 2.1 pass
- [x] 2.8 Implement a thin token-validation helper (wrapping the plugin's session/token verification) for downstream use by the Alexa adapter

## 3. Read-only Alexa adapter (external API surface)

- [x] 3.1 Write failing tests for public recipe search via the adapter (unauthenticated request returns only public recipes, respects existing search/filter semantics from `recipes.list`)
- [x] 3.2 Write failing tests for recipe detail lookup via the adapter, including the voice/APL-shaped response (flattened ingredients, numbered steps, no note content included per any tier)
- [x] 3.3 Write failing tests for authenticated ("my recipes"/"my cookbooks") requests: valid access token returns only the caller's own/visible content; missing, expired, or revoked token is rejected; tier/content-limit enforcement matches `enforceContentLimit` behavior used elsewhere
- [x] 3.4 Write failing tests confirming no mutation capability is reachable through the adapter (only read paths are wired up)
- [x] 3.5 Implement `src/server/trpc/routers/alexa.ts` (or equivalent read-only route group) to make 3.1–3.4 pass, delegating to existing `recipes` and `cookbooks` read logic — no duplicated query logic
- [x] 3.6 Wire the adapter's auth check to the OAuth token validation helper from 2.8

## 4. Interaction model and self-hosted skill route

- [x] 4.1 Write failing unit tests (using `ask-sdk` test utilities / mocked request envelopes) for `SearchRecipesIntent`, `GetRecipeDetailsIntent`, `NextStepIntent`/`PreviousStepIntent` step handling, and `BrowseCookbookIntent`, including the "no recipe in progress" and "cookbook not found" edge cases from the spec
- [x] 4.2 Write failing tests for the account-linking prompt path (unlinked user requesting private content)
- [x] 4.3 Write failing tests confirming the route rejects requests with a missing/invalid/stale Alexa request signature or timestamp, verified against the raw request body (not a re-serialized parsed body)
- [x] 4.4 Write failing tests for persisted step-navigation progress: `NextStepIntent`/`PreviousStepIntent` read and update a persisted `{ recipeId, stepIndex }` record keyed by Alexa `userId`; a `NextStepIntent` after simulated session loss resumes from the persisted record instead of reporting no recipe in progress
- [x] 4.5 Implement the ASK interaction model JSON (intents, slots, sample utterances) satisfying 4.1's expected utterance coverage
- [x] 4.6 Add `ask-sdk-core` and `ask-sdk-express-adapter` as dependencies; implement the skill route (e.g. `src/routes/api/alexa/skill.ts`), reading the raw request body (via h3's `readRawBody` or by disabling automatic body parsing for this route) and passing it to the adapter for signature verification, wired into Nitro/h3 via `fromNodeMiddleware` (or the closest equivalent confirmed by the discovery spike), to make 4.1–4.3 pass
- [x] 4.7 Wire the route's intent handlers to call the read-only Alexa adapter from Section 3 in-process (no network hop)
- [x] 4.8 Implement the persisted step-navigation store (e.g. a new `alexa_skill_progress` Mongoose model keyed by Alexa `userId`, holding `{ recipeId, stepIndex, updatedAt }`) and wire `NextStepIntent`/`PreviousStepIntent` to read/write it, to make 4.4 pass

## 5. APL visual presentation

- [x] 5.1 Build the APL document for search results (title, thumbnail, meal/course badges) matching the taxonomy badge color convention
- [x] 5.2 Build the APL document for recipe detail (image, ingredients, numbered steps, next/previous affordance)
- [x] 5.3 Build the APL document for cookbook browse (chapter list)
- [x] 5.4 Verify voice-only fallback (no APL support) still produces a coherent spoken-only experience for each intent

## 6. Deployment and rollout plan

- [x] 6.1 Confirm the deployed app's existing HTTPS/TLS setup satisfies ASK's endpoint certificate requirement; document the skill manifest endpoint configuration (URL, not ARN)
- [x] 6.2 Document the private beta / Alexa developer testing process (no store submission) used to validate the skill end-to-end
- [x] 6.3 Document rollback: disabling/deleting the private skill and deregistering the OAuth client has no effect on existing web/app functionality

## 7. Verification and completion

- [x] 7.1 Run the full existing test suite (`npm run test`) to confirm no regressions to existing recipe/cookbook/auth behavior
- [ ] 7.2 Manually exercise the private skill against a local/staging deployment for each scenario in `specs/alexa-skill-integration/spec.md`
- [x] 7.3 Spawn a sub-agent to run the `openspec-review-code` skill and apply all resulting fixes before committing (required pre-commit review step)
- [ ] 7.4 Commit, push, and open a PR with auto-merge enabled; monitor CI and review threads to completion
