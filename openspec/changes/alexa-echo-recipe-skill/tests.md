---
name: tests
description: Tests for the alexa-echo-recipe-skill change
---

# Tests

## Overview

This document outlines the tests for the `alexa-echo-recipe-skill` change. All work follows strict TDD (Test-Driven Development): write a failing test, write the minimal code to pass it, then refactor. Each case below maps to a task in `tasks.md` and a scenario in `specs/alexa-skill-integration/spec.md`.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Section 2 — Account linking (`@better-auth/oauth-provider`)

- [ ] (Task 2.1) Consent page renders the requesting client name and scope from `client_id`/`scope` query params
- [ ] (Task 2.1) Consent page redirects an unauthenticated visitor to login before showing the consent screen
- [ ] (Task 2.1) Consent page records the user's grant decision and the deny decision distinctly
- [ ] (Task 2.2) `/authorize` issues an authorization code only when `redirect_uri` matches a registered value for the client
- [ ] (Task 2.2) `/authorize` rejects a request with an unknown or mismatched `redirect_uri`
- [ ] (Task 2.2) `/authorize` rejects a request missing a PKCE `code_challenge`
- [ ] (Task 2.3) `/token` exchanges a valid authorization code + PKCE verifier for an access token and refresh token exactly once
- [ ] (Task 2.3) `/token` rejects a reused authorization code
- [ ] (Task 2.3) `/token` rejects an expired authorization code
- [ ] (Task 2.3) `/token` rejects unknown/invalid client credentials
- [ ] (Task 2.3) `/token` refresh-token grant issues a new access token
- [ ] (Task 2.4) Token-validation helper accepts a valid, unexpired, unrevoked access token
- [ ] (Task 2.4) Token-validation helper rejects an expired access token — Scenario: Expired or revoked access token
- [ ] (Task 2.4) Token-validation helper rejects a revoked access token — Scenario: Expired or revoked access token

### Section 3 — Read-only Alexa adapter

- [ ] (Task 3.1) Unauthenticated adapter search request returns only public recipes — Scenario: Unauthenticated user searches by recipe name
- [ ] (Task 3.1) Adapter search respects existing `recipes.list` search/filter semantics (name, meal, course, ingredient)
- [ ] (Task 3.1) Adapter search with no matches returns an empty result set without erroring — Scenario: Search yields no results
- [ ] (Task 3.2) Adapter recipe-detail lookup returns a voice/APL-shaped response with flattened ingredients and numbered steps
- [ ] (Task 3.2) Adapter recipe-detail response never includes note content, for any tier — Scenario: Private note content is never spoken
- [ ] (Task 3.3) Authenticated "my recipes"/"my cookbooks" request with a valid access token returns only the caller's own/visible content — Scenario: Linked user asks for "my recipes"
- [ ] (Task 3.3) Authenticated request with a missing access token is rejected — Scenario: Unlinked user asks for "my recipes"
- [ ] (Task 3.3) Authenticated request with an expired or revoked access token is rejected — Scenario: Expired or revoked access token
- [ ] (Task 3.3) Authenticated request applies the same `enforceContentLimit`/tier policy as the web app — Scenario: Free-tier user's recipe count exceeds visible limit elsewhere
- [ ] (Task 3.4) Adapter surface exposes no create/update/delete procedure reachable by the skill route — Scenario: Skill attempts an operation outside the adapter's exposed surface

### Section 4 — Interaction model and skill route

- [ ] (Task 4.1) `SearchRecipesIntent` handler returns spoken + APL results for a matching query
- [ ] (Task 4.1) `GetRecipeDetailsIntent` handler returns a spoken summary and APL detail card — Scenario: User requests recipe details
- [ ] (Task 4.1) `NextStepIntent` advances the step index and speaks/displays the next instruction — Scenario: User asks for the next step
- [ ] (Task 4.1) `NextStepIntent` on the last step indicates the recipe is complete
- [ ] (Task 4.1) `PreviousStepIntent` moves the step index backward
- [ ] (Task 4.1) `NextStepIntent` with no active session and no persisted progress responds that no recipe is in progress — Scenario: User asks for the next step with no recipe in progress
- [ ] (Task 4.1) `BrowseCookbookIntent` returns chapters/entries for an owned, resolvable cookbook — Scenario: Linked user browses one of their cookbooks
- [ ] (Task 4.1) `BrowseCookbookIntent` with an unresolvable cookbook name responds that it could not find the cookbook, without revealing whether it exists for another user — Scenario: User references a cookbook they do not own or cannot access
- [ ] (Task 4.2) Unlinked user invoking a private-content intent receives an account-linking prompt card and no private data — Scenario: Unlinked user asks for "my recipes"
- [ ] (Task 4.3) Route rejects a request with a missing Alexa request signature
- [ ] (Task 4.3) Route rejects a request with an invalid Alexa request signature verified against the raw request body
- [ ] (Task 4.3) Route rejects a request with a stale timestamp
- [ ] (Task 4.4) `NextStepIntent`/`PreviousStepIntent` read and update a persisted `{ recipeId, stepIndex }` record keyed by Alexa `userId`
- [ ] (Task 4.4) `NextStepIntent` after simulated session loss resumes from the persisted record instead of reporting no recipe in progress — Scenario: User resumes after the Alexa session has timed out

### Section 5 — APL visual presentation

- [ ] (Task 5.4) Voice-only fallback (no APL support) produces a coherent spoken-only response for `SearchRecipesIntent`
- [ ] (Task 5.4) Voice-only fallback produces a coherent spoken-only response for `GetRecipeDetailsIntent`
- [ ] (Task 5.4) Voice-only fallback produces a coherent spoken-only response for `BrowseCookbookIntent`

### Section 7 — Full-suite regression

- [ ] (Task 7.1) `npm run test` passes with no regressions to existing recipe/cookbook/auth behavior
