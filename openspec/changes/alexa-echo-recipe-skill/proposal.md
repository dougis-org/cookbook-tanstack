## Why

Issue #603 asks for an investigation and design (not an implementation) for bringing My CookBooks to Amazon smart-display devices (Echo Show, Fire TV-adjacent Echo Hub) so users can ask Alexa to find and display recipes hands-free while cooking. This is a discovery surface with real value: kitchen use is exactly the moment a phone/laptop is inconvenient, and voice + visual (APL) recipe cards are a natural fit for the existing recipe/cookbook data model. The deliverable of this change is the design and implementation plan itself; no Alexa-facing code ships as part of this change.

## What Changes

- Define a new **Alexa Skill** (custom skill, not a Flash Briefing/Smart Home skill) built on the Alexa Skills Kit (ASK), hosted as a self-hosted HTTPS route within this app (not a separate AWS Lambda deployment) that calls the existing My CookBooks recipe/cookbook logic in-process.
- Define **Account Linking** via OAuth2 Authorization Code grant (PKCE) so Alexa can associate an Echo user with a My CookBooks account, using Better-Auth's official `@better-auth/oauth-provider` plugin rather than a bespoke authorization server.
- Define a new **read-only external API surface** (`alexa` tRPC router or a dedicated `/api/alexa/*` route group) that intentionally re-shapes existing recipe/cookbook queries for voice+screen consumption (search, get-by-id, list-cookbook), rather than exposing internal routers directly to a third-party runtime.
- Define **APL (Alexa Presentation Language) documents** for the Echo Show recipe card, recipe detail (ingredients/steps), and cookbook browse views, matching the existing dark-first design system content hierarchy (not necessarily its exact tokens, since APL has its own styling model).
- Define the **voice interaction model**: intents for searching recipes (by name, meal, course, ingredient), reading out a recipe, stepping through instructions ("Alexa, next step"), and browsing a cookbook.
- Define entitlement/tier handling for the skill: unauthenticated/guest use is limited to public recipes; linked accounts get their own private recipes and cookbooks, subject to the same tier limits enforced elsewhere in the app.
- **BREAKING**: none. This is purely additive; no existing capability's requirements change.

## Capabilities

### New Capabilities

- `alexa-skill-integration`: Voice/visual recipe discovery and playback on Alexa Echo Show devices via a custom Alexa Skill, including account linking, the external read API it depends on, the interaction model, and the APL visual presentation.

### Modified Capabilities

None — no existing spec's requirements change. The skill consumes existing recipe/cookbook read behavior through a new adapter layer; it does not alter how recipes or cookbooks behave for web users.

## Impact

- **New code (future implementation, not this change):** a self-hosted skill route (Node.js, `ask-sdk-core` + `ask-sdk-express-adapter`) within `src/routes/api/alexa/*`, a new read-only Alexa adapter, `@better-auth/oauth-provider` + `jwt()` configuration alongside `src/lib/auth.ts` plus a consent-page UI, APL document templates, ASK interaction model JSON.
- **Existing systems touched conceptually:** `recipes` and `cookbooks` tRPC routers (as data sources, called internally, not modified), Better-Auth (extended via an official plugin, not replaced, for account linking), tier/entitlement policy in `src/server/trpc/routers/_helpers.ts` (reused as-is per "Keep tier entitlement checks centralized in shared policy code").
- **Dependencies:** Amazon Developer Console skill registration, `ask-sdk-core`/`ask-sdk-model`/`ask-sdk-express-adapter`, `@better-auth/oauth-provider`, an APL-capable interaction model. No new AWS account/Lambda/IAM required.
- **Out of scope for this change:** writing/mutating recipes by voice, publishing the skill to the Alexa Skill Store (certification), and any actual code — this change produces `proposal.md`, `design.md`, `specs/alexa-skill-integration/spec.md`, and `tasks.md` only (this OpenSpec schema has no separate `tests.md` artifact; test-first steps are embedded directly in `tasks.md` instead).
