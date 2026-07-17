## Context

My CookBooks is a TanStack Start app (React 19, TanStack Router, Vite/Nitro) with a tRPC API (`src/server/trpc/router.ts`) backed by MongoDB/Mongoose. Auth is Better-Auth with email/password + username, cookie-session based (`src/lib/auth.ts`); there is no OAuth2 *provider* today — Better-Auth is used purely as a consumer-facing auth client, not as an identity provider for third parties. Recipe and cookbook reads already distinguish public vs. private data at the tRPC layer (`recipes.list` / `recipes.byId` are `publicProcedure` and filter to public recipes for anonymous callers; private/personal data requires a session). Tier entitlement (content limits, note visibility, etc.) is centralized in `src/server/trpc/routers/_helpers.ts` and must stay the single source of truth ("Keep tier entitlement checks centralized in shared policy code").

Amazon's Alexa platform requires:
- A **skill backend** (AWS Lambda, or an HTTPS endpoint) implementing the Alexa Skills Kit (ASK) request/response contract.
- An **interaction model** (intents, slots, sample utterances) registered in the Alexa Developer Console.
- Optional **Account Linking** (OAuth2 Authorization Code grant) if the skill needs to know which My CookBooks user is speaking.
- Optional **APL (Alexa Presentation Language)** documents to render visuals on Echo Show / Echo Hub devices; without APL the skill is voice-only.

This design covers only what's needed to plan the integration; nothing here ships code.

## Goals / Non-Goals

**Goals:**
- Let a user say "Alexa, open My CookBooks" (or similar invocation) and search/browse recipes and cookbooks by voice, with a visual recipe card and step-by-step instructions on Echo Show-class devices.
- Let a signed-in user (via account linking) see *their* private recipes and cookbooks, not just public ones, respecting existing tier limits.
- Reuse the existing recipe/cookbook domain model and business logic; do not fork or duplicate it.
- Keep the blast radius of the new external-facing surface small and explicitly read-only.

**Non-Goals:**
- Creating, editing, or deleting recipes/cookbooks by voice (read-only skill for v1).
- Publishing to the Alexa Skill Store / going through Amazon certification (future work, out of scope for this change).
- Redesigning the web app's design system for APL — APL has its own component/styling model and is treated as a new, separate presentation layer.
- Supporting non-Echo-Show devices with rich visuals (voice-only fallback is in-scope conceptually but not designed in detail here).

## Decisions

### 1. Custom Skill hosted as a self-hosted HTTPS endpoint within this app, not AWS Lambda
A **custom skill** is the only ASK skill type that supports arbitrary interaction models and APL. ASK supports two backend hosting models: AWS Lambda, or any HTTPS endpoint that presents a TLS certificate from a trusted CA. Amazon's docs lean toward Lambda by default, but the app is already a long-running Nitro server terminating HTTPS with a normal CA-signed certificate — that alone satisfies ASK's endpoint requirement, with no cert upload or per-request AWS invocation involved.

Decision: expose the skill handler as a route within this same app/repo (e.g. `src/routes/api/alexa/skill.ts`) rather than a separate Lambda + IAM + AWS deploy pipeline. This keeps the whole integration in one repo, one deploy, one on-call surface — no new AWS account/IAM role/infra-as-code to stand up and maintain.

The one thing Lambda gets "for free" that a self-hosted endpoint must implement explicitly: **Alexa request signature verification**. When Alexa invokes a Lambda directly, AWS's own invocation trust model proves the request is genuine; a self-hosted HTTPS endpoint instead receives a `SignatureCertChainUrl` header + a request timestamp that must be validated on every request to prove it came from Alexa and isn't a replay. This is a well-trodden path — `ask-sdk-express-adapter` (built on `ask-sdk-core`, the same intent-handling API used regardless of hosting model) implements this verification, and Nitro/h3 can run Express-style middleware via `fromNodeMiddleware`, so it should slot into the existing route layer without needing a separate framework.

Signature verification needs the **raw, unparsed request body bytes** (the signature is computed over the exact bytes Alexa sent; re-serializing a parsed JSON body will not reproduce the same signature). Nitro/h3 parses JSON bodies automatically for typical route handlers, and once a body stream has been consumed it can't be read again — so the skill route must read the raw body itself (h3's `readRawBody`, or an equivalent that captures bytes before any JSON-parsing middleware runs) and hand those exact bytes to `ask-sdk-express-adapter`'s verifier, rather than relying on an already-parsed `event.node.req` body. This needs to be confirmed hands-on during the discovery spike (#615) against however `fromNodeMiddleware` and Nitro's body handling interact in practice — see Open Questions.

Alternatives considered:
- **AWS Lambda (original decision):** avoids implementing signature verification, but requires a new AWS account/IAM role, a second deploy pipeline, and — per the original motivation for this design — pushed toward putting the handler in a separate repo. Rejected once "keep everything controlled within the app" was weighed against "skip writing signature verification"; the verification code is a bounded, well-documented piece of work, while a second deploy target is ongoing operational overhead.
- **Self-hosted, hand-rolled signature verification (no adapter library):** more control, but re-implements a security-sensitive check that `ask-sdk-express-adapter` already does correctly. Rejected in favor of the existing adapter.

### 2. A dedicated read-only adapter surface, not direct access to internal mutation routers
Add a narrow, in-process adapter (`src/server/trpc/routers/alexa.ts`, or a plain function module the skill route calls directly, since it now lives in the same process rather than across a network boundary) that:
- Wraps `recipes.list`, `recipes.byId`, `cookbooks.*` read paths.
- Returns voice/APL-friendly shapes (e.g., pre-flattened ingredient/step lists, short spoken summaries) instead of raw domain documents.
- Is **read-only** — no mutation procedures exposed.

Rationale: even though the skill handler now runs in-process (Decision 1), it still authenticates callers via OAuth bearer tokens tied to a *different* audience (the Alexa skill, not a first-party browser session), and it's driven by a third party's request/response contract (ASK), not our own UI. A narrow, versionable, read-only surface keeps that boundary explicit — it avoids coupling internal router shapes to Alexa's request lifecycle and lets internal implementation change without touching the skill's contract, even without a network hop forcing the separation. Alternative considered: call `recipes`/`cookbooks` tRPC procedures directly from the skill handler — rejected because it would require every existing procedure to support two auth mechanisms (cookie session *and* OAuth bearer token) and would blur the line between "what the web app can do" and "what a third-party voice surface can do."

### 3. Account linking via Better-Auth's official `@better-auth/oauth-provider` plugin, not a bespoke authorization server
Better-Auth 1.6's core config in this project (`src/lib/auth.ts`) has no OAuth2 *provider* (authorization-server) capability today — only consumer-side session auth. However, Better-Auth ships an official `@better-auth/oauth-provider` plugin that turns the app itself into a spec-compliant OAuth 2.1 authorization server: `/authorize` and `/token` endpoints, `authorization_code` + `refresh_token` (+ `client_credentials`, unused here) grants, PKCE required by default, configurable custom scopes, and session-integrated login — it reuses whatever session the user already has via the existing Better-Auth config.

Decision: adopt `@better-auth/oauth-provider` (plus its `jwt()` plugin dependency, since access/ID tokens are JWTs) rather than hand-writing authorization-code/token storage and endpoints. Scope stays as originally intended — a single registered client (the Alexa skill, via `auth.api.createOAuthClient({ redirect_uris })`), one custom scope (`read:own-content`) alongside the plugin's standard scopes — but the OAuth-correctness logic (code/token issuance, PKCE validation, replay protection) is the plugin's responsibility, not ours. The app-specific work narrows to: configuring the plugin, registering the one client, and building the `consentPage` UI the plugin redirects to (it hands us `client_id`/`scope`; we render the screen and record the user's decision).

Alternatives considered:
- **Bespoke OAuth2 authorization-server module (original decision):** full control, but re-implements a security-sensitive protocol (code issuance, PKCE, token rotation, replay protection) that a maintained, official plugin already gets right. Rejected once the plugin's existence was confirmed — no reason to own that surface ourselves.
- **Skip account linking, voice-only public search:** simplest, but fails the core ask (users want *their own* saved recipes/cookbooks on the Echo Show). Rejected as insufficient for v1 value, but noted as a possible "voice-only public preview" fallback if account linking proves too costly.
- **Third-party OAuth-as-a-service (e.g., Auth0/Ory) fronting Better-Auth:** adds an external dependency and cost for a single-client use case; rejected — `@better-auth/oauth-provider` already lives in the same auth stack the app uses, with no separate vendor relationship needed.

### 4. Tier/entitlement enforcement reused, not reimplemented
The Alexa adapter calls the same `enforceContentLimit` / tier-policy helpers used elsewhere ("Keep tier entitlement checks centralized in shared policy code"). A linked account on the free tier sees the same recipe/cookbook ceiling via Alexa as on the web. Private note content stays hidden from the skill entirely for v1 (notes are not read out) — simplest way to honor "Do not reveal note text to unauthorized tiers" without re-deriving read-entitlement logic for a new surface.

### 5. APL document set: three visual states, matching content hierarchy not literal tokens
Three APL documents: **search results list** (title + thumbnail + meal/course badges), **recipe detail** (image, ingredients, numbered steps with a "next step" affordance), **cookbook browse** (chapter list). APL uses its own styling primitives (not CSS custom properties), so the design system's `--theme-*` tokens don't transfer directly; instead, the APL documents mirror the *hierarchy* (title > meta > body) and the taxonomy badge color convention (amber/violet/emerald/cyan) as static APL color values, since APL has no live theme-switching concept tied to a household's Echo device.

### 6. Voice interaction model shape, with step navigation persisted per Alexa user (not session-only)
Core intents: `SearchRecipesIntent` (slots: query, meal, course, ingredient), `GetRecipeDetailsIntent`, `ReadIngredientsIntent`, `NextStepIntent` / `PreviousStepIntent`, `BrowseCookbookIntent`, plus required built-ins (`AMAZON.HelpIntent`, `AMAZON.CancelIntent`, `AMAZON.StopIntent`, `AMAZON.FallbackIntent`).

Step navigation state (current recipe id + step index) is **persisted keyed by the Alexa-supplied `userId`** (stable per device/skill enablement regardless of account linking — no account linking is required to get one), not held only in ASK session attributes. A real cooking session routinely spans several minutes between steps (reading a step, doing the work, coming back), which comfortably exceeds Alexa's session timeout; session-attribute-only state would silently lose the user's place. The persisted record is a small, single-purpose store (e.g. `alexa_skill_progress`, keyed by Alexa `userId`, holding `{ recipeId, stepIndex, updatedAt }`) — separate from recipe/cookbook business data, so it doesn't conflict with the read-only adapter boundary in Decision 2 (that boundary is about recipe/cookbook *content*, not the skill's own conversational bookkeeping). On `NextStepIntent`/`PreviousStepIntent` with no in-memory session state (because the session expired), the handler loads the persisted record instead of treating it as "no recipe in progress," and offers to resume ("Continuing [recipe] at step 4 of 9...").

### 7. Public recipe search is unauthenticated; account linking is required only for "my" content
`SearchRecipesIntent` and `GetRecipeDetailsIntent` work without account linking, returning only public recipes — mirroring the web app's existing unauthenticated browsing of public recipes (`recipes.list`/`recipes.byId` are already `publicProcedure`). Account linking is prompted only when a user asks for their own recipes/cookbooks (`BrowseCookbookIntent` against an owned cookbook, or an explicit "my recipes" request).

Rationale: forcing account linking before a skill delivers any value is a well-known adoption killer for voice skills — a user's first interaction shouldn't require leaving the conversation to link an account. Requiring linking universally also doesn't reduce implementation scope, since the unauthenticated code path already has to exist (public recipes are public on the web today, and `specs/alexa-skill-integration/spec.md`'s "Public voice recipe search" requirement is written against it regardless). The risk of allowing it is low: unauthenticated requests only ever reach already-public data, never anything tier-gated or private.

Alternative considered: **require linking for all requests, including public search.** Rejected — it adds friction with no corresponding reduction in what needs to be built, and it breaks the "helpful kitchen friend" product goal of being useful on first contact.

## Risks / Trade-offs

- **[Risk] Even with an official OAuth-provider plugin, wiring account linking (client registration, consent page, scope grant) is still a security-sensitive integration for a single external client.** → Mitigation: scope it minimally (one client, one scope, PKCE required by the plugin's default), reuse Better-Auth's existing session/user model rather than a parallel identity store, and require this integration go through the same security review as any auth-adjacent change (`.github/instructions` Codacy/Snyk gates, plus manual review given sensitivity).
- **[Risk] A self-hosted skill endpoint must correctly verify Alexa's request signature (`SignatureCertChainUrl` + timestamp) on every request; getting this wrong could let spoofed/replayed requests through.** → Mitigation: use `ask-sdk-express-adapter`, which implements this verification, rather than hand-rolling it; cover it with tests asserting unsigned/stale/mismatched requests are rejected.
- **[Risk] Amazon skill certification can reject skills for interaction-model or privacy-policy issues, discovered late.** → Mitigation: this change's scope stops before certification; a follow-up change/spike should validate certification requirements (privacy policy URL, permitted intents, account-linking UX) before writing the skill route.
- **[Risk] Voice recipe reading is a poor UX for long ingredient lists / complex steps without pagination.** → Mitigation: `NextStepIntent` model paginates by design; ingredients are chunked (e.g., "5 of 12 ingredients... continue?").
- **[Risk] A real cooking session often outlasts Alexa's session timeout, so session-attribute-only step tracking would silently lose the user's place mid-recipe.** → Mitigation: persist step-navigation progress keyed by Alexa `userId` (Decision 6), so `NextStepIntent` can resume after a timeout instead of reporting "no recipe in progress."
- **[Risk] Divergence between the new Alexa adapter's read shape and the underlying recipe/cookbook schema over time.** → Mitigation: adapter is a thin mapper covered by contract tests against the real routers, not a data copy.
- **[Trade-off] Read-only v1 means voice users can't add a recipe found via search to a cookbook, or mark it liked.** Accepted for v1 scope; flagged as a natural v2 (would need mutating intents + write-scoped OAuth token).

## Migration Plan

This change ships no code, so there is no runtime migration. The plan for the *future* implementation change(s), sequenced to de-risk the OAuth/certification unknowns first:
1. Spike/validate Amazon account-linking + certification requirements against this design (no production code).
2. Configure `@better-auth/oauth-provider` (+ `jwt()`), register the Alexa client, and build the consent page, with tests.
3. Implement the `alexa` read adapter and its tests.
4. Build the self-hosted skill route (interaction model + `ask-sdk-express-adapter`-based handler + APL documents) within this repo, calling the adapter in-process.
5. Beta-test via Alexa's private skill testing (no store submission) before considering store certification as a separate, later change.

Rollback at every stage is simply "don't deploy/enable the skill" — none of the new surfaces are on the critical path for existing web/app functionality.

## Open Questions

- Does `ask-sdk-express-adapter`'s signature-verification behavior work cleanly on top of Nitro/h3's request handling — specifically, can the skill route obtain the raw, unparsed request body it needs (via h3's `readRawBody` or by disabling automatic body parsing for that route) when run through `fromNodeMiddleware`? Or does the skill route need a thinner, hand-adapted verification step directly against `ask-sdk-core`'s primitives instead of the Express adapter? To be confirmed during the discovery spike (#615).
- Do we want a single shared OAuth `client_id` for the skill, or design for future third-party integrations (Google Assistant, etc.) reusing the same `@better-auth/oauth-provider` instance? Leaning toward single-client now, generalize only when a second consumer is real.
- What's the minimum viable privacy policy / data-handling disclosure Amazon's certification will require, given the skill touches user-owned recipe data?
