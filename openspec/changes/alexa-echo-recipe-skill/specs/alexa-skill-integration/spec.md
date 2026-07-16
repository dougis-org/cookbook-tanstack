## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: Public voice recipe search
The system SHALL allow an unauthenticated (not account-linked) Alexa user to search public recipes by name, meal, course, or ingredient via the `SearchRecipesIntent` and receive spoken results plus, on APL-capable devices, a visual results list.

#### Scenario: Unauthenticated user searches by recipe name
- **WHEN** an unlinked Alexa user says "Alexa, ask My CookBooks for chicken tikka masala"
- **THEN** the skill queries the read-only Alexa adapter for public recipes matching "chicken tikka masala" and speaks the top result's name, with an APL results card shown on Echo Show devices

#### Scenario: Search yields no results
- **WHEN** a search query matches no public recipes
- **THEN** the skill speaks a message indicating no matches were found and suggests trying a different search term, without erroring

### Requirement: Account linking for private content access
The system SHALL require a completed OAuth2 Authorization Code account-linking flow before exposing any recipe or cookbook owned by a specific user through the skill.

#### Scenario: Unlinked user asks for "my recipes"
- **WHEN** an unlinked Alexa user invokes an intent requesting their own recipes or cookbooks
- **THEN** the skill responds with an account-linking prompt (Alexa's linking card) and does not return any private data

#### Scenario: Linked user asks for "my recipes"
- **WHEN** an account-linked Alexa user requests their own recipes
- **THEN** the skill exchanges the linked OAuth access token for the caller's identity and returns only recipes owned by or visible to that user

#### Scenario: Expired or revoked access token
- **WHEN** the OAuth access token presented by the skill has expired or been revoked
- **THEN** the read-only Alexa adapter SHALL reject the request as unauthorized and the skill SHALL prompt the user to re-link their account

### Requirement: Tier entitlement parity with the web app
The system SHALL apply the same tier-based content limits and entitlement rules to Alexa-originated requests as it applies to web requests for the same account.

#### Scenario: Free-tier user's recipe count exceeds visible limit elsewhere
- **WHEN** a linked free-tier user's account has more recipes than their tier's limit would allow to be counted as active
- **THEN** the Alexa adapter SHALL apply the same `enforceContentLimit`/tier policy used by the web app rather than a separate or looser rule

#### Scenario: Private note content is never spoken
- **WHEN** a recipe returned to the skill has an associated private note
- **THEN** the note body SHALL NOT be included in the spoken response or APL payload for any tier

### Requirement: Read-only recipe detail with step navigation
The system SHALL let a user retrieve a specific recipe's ingredients and instructions by voice and navigate forward/backward through steps using session-scoped state.

#### Scenario: User requests recipe details
- **WHEN** a user selects or names a recipe via `GetRecipeDetailsIntent`
- **THEN** the skill speaks a short summary and, on Echo Show, renders an APL detail card with ingredients and the first instruction step

#### Scenario: User asks for the next step
- **WHEN** a user says "next step" during an active recipe session
- **THEN** the skill advances the session's step index and speaks/displays the next instruction, or indicates the recipe is complete if on the last step

#### Scenario: User asks for the next step with no active recipe
- **WHEN** `NextStepIntent` is invoked with no recipe currently active in the session
- **THEN** the skill SHALL respond that no recipe is in progress and suggest searching for one first

### Requirement: Cookbook browsing by voice
The system SHALL let a user browse the chapters/contents of a cookbook they have access to.

#### Scenario: Linked user browses one of their cookbooks
- **WHEN** a linked user invokes `BrowseCookbookIntent` naming one of their own cookbooks
- **THEN** the skill returns the cookbook's chapters and recipe entries the caller is authorized to see

#### Scenario: User references a cookbook they do not own or cannot access
- **WHEN** a user requests a cookbook name that does not resolve to a cookbook they own or have access to
- **THEN** the skill SHALL respond that it could not find that cookbook, without revealing whether a cookbook with that name exists for another user

### Requirement: Read-only external API boundary
The system SHALL expose Alexa-facing data through a dedicated, versionable, read-only adapter rather than granting the skill direct access to internal tRPC mutation procedures.

#### Scenario: Skill attempts an operation outside the adapter's exposed surface
- **WHEN** the Lambda skill handler sends any request for an operation not explicitly exposed by the Alexa read adapter (e.g., an attempt to create or delete a recipe)
- **THEN** the request SHALL be rejected, since no such procedure is exposed on the adapter surface
