# Tasks

## 1. Pre-work / discovery spike (no production code)

- [ ] 1.1 Register a development Amazon Developer account and create a private (unpublished) custom skill to confirm interaction-model, account-linking, and APL constraints match this design
- [ ] 1.2 Confirm Amazon's Account Linking requirements (redirect URIs, client authentication method, required consent screen fields) against the OAuth2 design in `design.md`
- [ ] 1.3 Confirm the minimum privacy-policy and data-handling disclosures certification will require, and note any gaps against current app privacy policy

## 2. OAuth2 authorization-server module (account linking backend)

- [ ] 2.1 Write failing tests for `/oauth/authorize`: redirects to login when no session, issues an authorization code bound to the logged-in user and the Alexa client_id when a session exists, rejects unknown/mismatched redirect URIs
- [ ] 2.2 Write failing tests for `/oauth/token`: exchanges a valid authorization code for an access + refresh token once, rejects reused/expired codes, rejects unknown client credentials
- [ ] 2.3 Write failing tests for refresh-token exchange and for access-token validation (used by the Alexa adapter) including expired/revoked token rejection
- [ ] 2.4 Implement the `authorization_code`, `access_token`, and `refresh_token` storage (new Mongoose models) to make 2.1–2.3 pass
- [ ] 2.5 Implement `/oauth/authorize` and `/oauth/token` route handlers to make 2.1–2.3 pass, reusing the existing Better-Auth session to identify the caller
- [ ] 2.6 Implement token validation middleware/helper for downstream use by the Alexa adapter

## 3. Read-only Alexa adapter (external API surface)

- [ ] 3.1 Write failing tests for public recipe search via the adapter (unauthenticated request returns only public recipes, respects existing search/filter semantics from `recipes.list`)
- [ ] 3.2 Write failing tests for recipe detail lookup via the adapter, including the voice/APL-shaped response (flattened ingredients, numbered steps, no note content included per any tier)
- [ ] 3.3 Write failing tests for authenticated ("my recipes"/"my cookbooks") requests: valid access token returns only the caller's own/visible content; missing, expired, or revoked token is rejected; tier/content-limit enforcement matches `enforceContentLimit` behavior used elsewhere
- [ ] 3.4 Write failing tests confirming no mutation capability is reachable through the adapter (only read paths are wired up)
- [ ] 3.5 Implement `src/server/trpc/routers/alexa.ts` (or equivalent read-only route group) to make 3.1–3.4 pass, delegating to existing `recipes` and `cookbooks` read logic — no duplicated query logic
- [ ] 3.6 Wire the adapter's auth check to the OAuth token validation helper from 2.6

## 4. Interaction model and Lambda skill handler

- [ ] 4.1 Write failing unit tests (using `ask-sdk` test utilities / mocked request envelopes) for `SearchRecipesIntent`, `GetRecipeDetailsIntent`, `NextStepIntent`/`PreviousStepIntent` session-state handling, and `BrowseCookbookIntent`, including the "no active recipe" and "cookbook not found" edge cases from the spec
- [ ] 4.2 Write failing tests for the account-linking prompt path (unlinked user requesting private content)
- [ ] 4.3 Implement the ASK interaction model JSON (intents, slots, sample utterances) satisfying 4.1's expected utterance coverage
- [ ] 4.4 Implement the Lambda request handlers to make 4.1–4.2 pass, calling the read-only Alexa adapter from Section 3 over HTTPS
- [ ] 4.5 Implement session-attribute-based step navigation state (current recipe id + step index)

## 5. APL visual presentation

- [ ] 5.1 Build the APL document for search results (title, thumbnail, meal/course badges) matching the taxonomy badge color convention
- [ ] 5.2 Build the APL document for recipe detail (image, ingredients, numbered steps, next/previous affordance)
- [ ] 5.3 Build the APL document for cookbook browse (chapter list)
- [ ] 5.4 Verify voice-only fallback (no APL support) still produces a coherent spoken-only experience for each intent

## 6. Infra and deployment plan

- [ ] 6.1 Define infra-as-code (or documented manual steps) for the Lambda function, its IAM role, and environment configuration pointing at the read-only adapter's URL
- [ ] 6.2 Document the private beta / Alexa developer testing process (no store submission) used to validate the skill end-to-end
- [ ] 6.3 Document rollback: disabling/deleting the private skill and revoking the OAuth client has no effect on existing web/app functionality

## 7. Verification and completion

- [ ] 7.1 Run the full existing test suite (`npm run test`) to confirm no regressions to existing recipe/cookbook/auth behavior
- [ ] 7.2 Manually exercise the private skill against a local/staging deployment for each scenario in `specs/alexa-skill-integration/spec.md`
- [ ] 7.3 Spawn a sub-agent to run the `openspec-review-code` skill and apply all resulting fixes before committing (required pre-commit review step)
- [ ] 7.4 Commit, push, and open a PR with auto-merge enabled; monitor CI and review threads to completion
