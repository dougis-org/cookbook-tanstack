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

### 1. Custom Skill on AWS Lambda, not Smart Home/Flash Briefing skill types
A **custom skill** is the only ASK skill type that supports arbitrary interaction models and APL. Lambda is Amazon's recommended and lowest-friction hosting model for custom skills (vs. a self-hosted HTTPS endpoint requiring a fixed SSL cert whitelisted by Amazon). The Lambda function is a thin ASK request router (`ask-sdk-core`) that calls out to the existing My CookBooks tRPC API over HTTPS — it holds no business logic itself.

### 2. A dedicated read-only adapter surface, not direct third-party access to internal routers
Add a narrow adapter (`src/server/trpc/routers/alexa.ts`, mounted alongside the existing routers, or a plain REST route group under `src/routes/api/alexa/*` if request/response shapes need to diverge further from tRPC's contract) that:
- Wraps `recipes.list`, `recipes.byId`, `cookbooks.*` read paths.
- Returns voice/APL-friendly shapes (e.g., pre-flattened ingredient/step lists, short spoken summaries) instead of raw domain documents.
- Is **read-only** — no mutation procedures exposed.

Rationale: the Alexa Lambda is an untrusted-ish third-party runtime (external to our deployment) authenticating via OAuth access tokens, not our first-party session cookies. Giving it its own narrow, versionable contract avoids coupling internal router shapes to Amazon's request lifecycle and lets us change internal implementation without touching the skill. Alternative considered: expose the existing tRPC routers directly over a bearer-token variant of the same procedures — rejected because it would require every existing procedure to support two auth mechanisms (cookie session *and* OAuth bearer token) and would leak internal shapes into a third-party surface.

### 3. Account linking via a new minimal OAuth2 Authorization Code provider, additive to Better-Auth
Better-Auth 1.6 does not include an OAuth2 *provider* (authorization-server) plugin in this project's current configuration — only consumer-side session auth. Alexa Account Linking requires the *app* to act as an OAuth2 authorization server (issue authorization codes, exchange for access/refresh tokens) that Amazon's account-linking flow calls into.

Decision: add a small, purpose-built OAuth2 authorization-server module (new `authorization_code` + `access_token`/`refresh_token` collections, a `/oauth/authorize` route reusing the existing Better-Auth session to identify the logged-in user, and a `/oauth/token` route) rather than adopting a full generic OAuth2-provider library. Scope is deliberately tiny: a single trusted client (the Alexa skill), one scope (`read:own-content`), Authorization Code + Refresh Token grants only.

Alternatives considered:
- **Skip account linking, voice-only public search:** simplest, but fails the core ask (users want *their own* saved recipes/cookbooks on the Echo Show). Rejected as insufficient for v1 value, but noted as a possible "voice-only public preview" fallback if account linking proves too costly.
- **Third-party OAuth-as-a-service (e.g., Auth0/Ory) fronting Better-Auth:** adds an external dependency and cost for a single-client use case; rejected in favor of a small in-house implementation matching the project's existing "own the auth stack" pattern.

### 4. Tier/entitlement enforcement reused, not reimplemented
The Alexa adapter calls the same `enforceContentLimit` / tier-policy helpers used elsewhere ("Keep tier entitlement checks centralized in shared policy code"). A linked account on the free tier sees the same recipe/cookbook ceiling via Alexa as on the web. Private note content stays hidden from the skill entirely for v1 (notes are not read out) — simplest way to honor "Do not reveal note text to unauthorized tiers" without re-deriving read-entitlement logic for a new surface.

### 5. APL document set: three visual states, matching content hierarchy not literal tokens
Three APL documents: **search results list** (title + thumbnail + meal/course badges), **recipe detail** (image, ingredients, numbered steps with a "next step" affordance), **cookbook browse** (chapter list). APL uses its own styling primitives (not CSS custom properties), so the design system's `--theme-*` tokens don't transfer directly; instead, the APL documents mirror the *hierarchy* (title > meta > body) and the taxonomy badge color convention (amber/violet/emerald/cyan) as static APL color values, since APL has no live theme-switching concept tied to a household's Echo device.

### 6. Voice interaction model shape
Core intents: `SearchRecipesIntent` (slots: query, meal, course, ingredient), `GetRecipeDetailsIntent`, `ReadIngredientsIntent`, `NextStepIntent` / `PreviousStepIntent` (session-attribute-tracked step index), `BrowseCookbookIntent`, plus required built-ins (`AMAZON.HelpIntent`, `AMAZON.CancelIntent`, `AMAZON.StopIntent`, `AMAZON.FallbackIntent`). Step navigation state (current recipe id + step index) lives in ASK session attributes, not server-side, since it's per-conversation and ephemeral.

## Risks / Trade-offs

- **[Risk] Building a bespoke OAuth2 authorization server is a real security surface (token issuance, refresh, revocation) for a single external client.** → Mitigation: scope it minimally (one client, one scope, short-lived access tokens, refresh rotation), reuse Better-Auth's existing session/user model rather than a parallel identity store, and require this module go through the same security review as any auth-adjacent change (`.github/instructions` Codacy/Snyk gates, plus manual review given sensitivity).
- **[Risk] Amazon skill certification can reject skills for interaction-model or privacy-policy issues, discovered late.** → Mitigation: this change's scope stops before certification; a follow-up change/spike should validate certification requirements (privacy policy URL, permitted intents, account-linking UX) before writing the Lambda.
- **[Risk] Voice recipe reading is a poor UX for long ingredient lists / complex steps without pagination.** → Mitigation: `NextStepIntent` model paginates by design; ingredients are chunked (e.g., "5 of 12 ingredients... continue?").
- **[Risk] Divergence between the new Alexa adapter's read shape and the underlying recipe/cookbook schema over time.** → Mitigation: adapter is a thin mapper covered by contract tests against the real routers, not a data copy.
- **[Trade-off] Read-only v1 means voice users can't add a recipe found via search to a cookbook, or mark it liked.** Accepted for v1 scope; flagged as a natural v2 (would need mutating intents + write-scoped OAuth token).

## Migration Plan

This change ships no code, so there is no runtime migration. The plan for the *future* implementation change(s), sequenced to de-risk the OAuth/certification unknowns first:
1. Spike/validate Amazon account-linking + certification requirements against this design (no production code).
2. Implement the OAuth2 authorization-server module and its tests, behind no feature flag (net-new routes, zero impact on existing auth).
3. Implement the `alexa` read adapter and its tests.
4. Build the Lambda skill handler + interaction model + APL documents against the adapter (in a separate repo or `infra/alexa-skill/` — TBD in tasks).
5. Beta-test via Alexa's private skill testing (no store submission) before considering store certification as a separate, later change.

Rollback at every stage is simply "don't deploy/enable the skill" — none of the new surfaces are on the critical path for existing web/app functionality.

## Open Questions

- Should the Alexa adapter live inside this repo (new tRPC router + a `infra/` Lambda package) or in a separate repo entirely, given it deploys to AWS rather than the existing Nitro host? Leaning toward same repo for shared types, separate deploy pipeline.
- Do we want a single shared OAuth `client_id` for the skill, or design for future third-party integrations (Google Assistant, etc.) reusing the same authorization server? Leaning toward single-client now, generalize only when a second consumer is real.
- What's the minimum viable privacy policy / data-handling disclosure Amazon's certification will require, given the skill touches user-owned recipe data?
- Should public (unauthenticated) voice search be allowed at all, or should the skill always require account linking to reduce scope? Current lean: allow public search unauthenticated (mirrors the web app's public recipe browsing), require linking only for "my recipes"/"my cookbooks" requests.
