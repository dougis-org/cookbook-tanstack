## Context

- Relevant architecture:
  - Better-Auth `additionalFields` on the `user` Mongo collection (`src/lib/auth.ts:62-78`) already carries `tier`, `isAdmin`, `theme`. `theme` is the direct precedent for this change: a flat boolean/string field, `defaultValue`, `required: false`, saved client-side via `authClient.updateUser(...)` (not the tRPC `updateProfile` mutation), and surfaced back through `session.user.<field>` (`src/hooks/useAuth.ts`).
  - `src/routes/account_.settings.tsx` already exists with a working Theme section: local edited-state seeded from `session?.user?.theme` via `useEffect`, a `hasEdited` guard so the session doesn't clobber in-progress edits, `handleSave` calling `authClient.updateUser(...)`, and `idle/saving/success/error` status affordances.
  - `RecipeDetail.tsx` is a presentational component (project decision: "Keep RecipeDetail presentational; resolve personal notes in the route"). It already has one preference-shaped prop precedent: `personalNote?: string | null`, resolved and tier/ownership-checked by the calling route, not by `RecipeDetail` itself. The print-only "Personal Notes" section (`hidden print:block`, lines 384-396) is the exact shape the four other sections need.
  - Two routes render `RecipeDetail` for print: `src/routes/recipes/$recipeId.tsx` (single recipe, already resolves and passes `personalNote`) and `src/routes/cookbooks.$cookbookId_.print.tsx` (cookbook print, does not currently pass `personalNote` and this proposal does not add that).
  - The "top segment" toggle target is `printMetaLine` (`RecipeDetail.tsx:280-296`, `data-testid="print-meta-line"`), a collapsed string built from prep/cook/servings/difficulty/addedBy — not the on-screen `print:hidden` meta grid, which never prints regardless of any toggle.
- Dependencies: #608 (personal notes printing, merged) and #609 (settings/preferences pattern, merged) are both complete; this change extends their landed shape rather than building new infrastructure.
- Interfaces/contracts touched:
  - `src/lib/auth.ts` — `additionalFields` (Better-Auth config, affects session shape and Mongo `user` documents).
  - `RecipeDetailProps` (`src/components/recipes/RecipeDetail.tsx`) — new prop.
  - `src/routes/recipes/$recipeId.tsx`, `src/routes/cookbooks.$cookbookId_.print.tsx` — new preference-resolution + prop-passing.
  - `src/routes/account_.settings.tsx` — new UI section, no new mutation/endpoint (uses existing `authClient.updateUser`).

## Goals / Non-Goals

### Goals

- Five independently toggleable, per-user print preferences, defaulting to "shown" (parity with today's always-print-everything behavior).
- One shared resolution path (a plain function/type) used identically by both print-rendering routes, so single-recipe print and cookbook print stay behaviorally identical by construction, not by parallel maintenance.
- Zero behavior change for anonymous/logged-out viewers or users who never open settings.
- `RecipeDetail` stays presentational: it receives a fully-resolved preferences object, it does not fetch or interpret session state itself.

### Non-Goals

- New tRPC endpoints or Mongo query patterns — this reuses the `authClient.updateUser` / `additionalFields` / `session.user` path wholesale.
- Per-recipe or per-cookbook preference overrides.
- Fetching `personalNote` into the cookbook print flow (unchanged non-goal from #608).
- Nutrition panel suppression.

## Decisions

### Decision 1: Store preferences as five flat Better-Auth `additionalFields` booleans

- Chosen: `printShowMeta`, `printShowIngredients`, `printShowInstructions`, `printShowNotes`, `printShowPersonalNotes`, each `{ type: "boolean" as const, defaultValue: true, required: false }` in `src/lib/auth.ts`, alongside `tier`/`isAdmin`/`theme`.
- Alternatives considered: a single nested `printPreferences: { ... }` object; a separate Mongo collection/document.
- Rationale: Better-Auth `additionalFields` are documented (and already used in this codebase, see #609's issue writeup) as flat fields only — no nested-object support. Matching `theme`'s exact shape keeps this a mechanical extension of a proven pattern, not a new one.
- Trade-offs: Five top-level session fields is slightly noisier than one grouped object, but avoids inventing a serialization/parsing layer Better-Auth doesn't natively support.

### Decision 2: Save via `authClient.updateUser(...)`, not the tRPC `updateProfile` mutation

- Chosen: The settings page calls `authClient.updateUser({ printShowMeta, printShowIngredients, ... })`, mirroring the existing `handleSave` for `theme`.
- Alternatives considered: Extending `usersRouter.updateProfile` (the tRPC mutation) as #609's original issue text speculated.
- Rationale: #609, as actually implemented, did not use `updateProfile` for `theme` — it used `authClient.updateUser`. Following the mutation the code actually uses (not the mutation the issue predicted) keeps this change consistent with the real, shipped pattern and avoids introducing a second, parallel save path for user preferences.
- Trade-offs: `updateProfile` (tRPC) and `updateUser` (Better-Auth) are now two separate mutations for user-owned fields; this is pre-existing inconsistency inherited from #609, not introduced here. Out of scope to reconcile.

### Decision 3: Resolve preferences in each route; `RecipeDetail` only receives a plain data prop

- Chosen: A shared helper (e.g. `resolvePrintPreferences(session)` in a small new module, or inlined identically in both routes if a shared module feels like overreach for five booleans — implementation detail, see tasks) reads `session?.user?.printShow*`, treating `undefined`/`null`/non-boolean as `true`. Both `$recipeId.tsx` and `cookbooks.$cookbookId_.print.tsx` call it and pass the result as a new `printPreferences` prop on `RecipeDetail`.
- Alternatives considered: Have `RecipeDetail` call `useAuth()`/`useSession()` internally.
- Rationale: Matches the existing, explicit project decision to keep `RecipeDetail` presentational and resolve user-specific data (auth, tier, ownership) at the route layer — the same reasoning already applied to `personalNote` applies unchanged to preferences.
- Trade-offs: Two call sites must both remember to resolve and pass the prop; mitigated by keeping the resolution logic in one shared, tested function rather than duplicated inline logic.

### Decision 4: Gate only print-only branches/content, never on-screen rendering

- Chosen: Preference checks are added as an additional `&&` condition on the existing print-only JSX branches (`printMetaLine`, the `hidden print:block` Personal Notes section) and around the Ingredients/Instructions/Notes `<section>` print classes, following the same `print:hidden`/`hidden print:block` Tailwind convention already in the file. On-screen-only elements (the `print:hidden` meta grid, on-screen ingredient bullets/instruction numbering) are untouched.
- Alternatives considered: A single top-level "print mode" flag that swaps entire section trees.
- Rationale: Ingredients, Instructions, and Notes sections render on both screen and print today (screen and print share the same `<section>`, only inner elements toggle via Tailwind `print:` classes) — so gating them means the whole `<section>` is conditionally rendered only when the recipe *also* prints on paper, while continuing to show on screen unconditionally. This requires care: unlike `printMetaLine`/Personal Notes (already print-only), Ingredients/Instructions/Notes sections must keep showing on screen regardless of the print preference — the preference must only suppress the section's *print* rendering, not remove it from the DOM outright (which would also hide it on screen, breaking on-screen viewing for someone who only wants a lighter printout).
- Trade-offs: Because Ingredients/Instructions/Notes are shared screen+print sections, "hide from print only, keep on screen" cannot be a simple `{condition && <section>}` — it needs a `print:hidden`-style class toggle driven by the preference (e.g. conditionally including a `print:hidden` class on the section, or, for Notes, keeping the existing `trimmedNotes &&` guard for on-screen and adding a print-scoped inner wrapper). This is the trickiest implementation detail in this change and is called out explicitly in tasks.md for design-time attention per section.

## Proposal to Design Mapping

- Proposal element: Five new Better-Auth `additionalFields`
  - Design decision: Decision 1
  - Validation approach: Type-check `auth.ts` compiles; settings-page component test asserts `session.user.printShow*` round-trips through `authClient.updateUser`.
- Proposal element: New "Print Preferences" settings section, saved via existing path
  - Design decision: Decision 2
  - Validation approach: Component test on `account_.settings.tsx` mirroring existing Theme section tests (toggle → save → success state → session reflects new value on reload).
- Proposal element: `RecipeDetail` gains a `printPreferences` prop; routes resolve and pass it
  - Design decision: Decision 3
  - Validation approach: `RecipeDetail` component tests pass explicit `printPreferences` prop combinations (all-on, all-off, individually-off) and assert print-DOM presence/absence; route-level test or code review confirms both routes call the same resolution helper.
- Proposal element: Preferences apply uniformly to single-recipe print and cookbook print
  - Design decision: Decision 3 (shared resolution + shared `RecipeDetail` gating)
  - Validation approach: E2E specs extending `recipe-print-card-chrome.spec.ts` pattern, one for single-recipe print, one for cookbook print, asserting a suppressed section is absent from the print DOM in both.
- Proposal element: On-screen rendering unaffected by print preferences
  - Design decision: Decision 4
  - Validation approach: Component tests assert screen-mode (non-print) DOM is unchanged regardless of `printPreferences` values, specifically for Ingredients/Instructions/Notes.
- Proposal element: Anonymous/logged-out and never-configured users see today's behavior (show everything)
  - Design decision: Decision 3 (default-to-true resolution)
  - Validation approach: Test the resolution helper directly with `session: null` and with a session missing the new fields; both must resolve to all-`true`.

## Functional Requirements Mapping

- Requirement: User can toggle each of the five print sections independently and have the setting persist.
  - Design element: Decision 1 + Decision 2
  - Acceptance criteria reference: specs/print-preferences (to be authored)
  - Testability notes: Settings-page component test per toggle; verify persisted value via `session.user` after a simulated reload/refetch.
- Requirement: Toggling a preference off suppresses that section from print output on both single-recipe and cookbook print.
  - Design element: Decision 3 + Decision 4
  - Acceptance criteria reference: specs/print-preferences
  - Testability notes: `RecipeDetail` component tests (prop-driven) + e2e print-DOM assertions on both routes.
- Requirement: Toggling a preference off does not affect on-screen rendering of Ingredients/Instructions/Notes.
  - Design element: Decision 4
  - Acceptance criteria reference: specs/print-preferences
  - Testability notes: Component test asserting screen-mode DOM presence is preference-independent.
- Requirement: Anonymous viewers and users who never set preferences print everything (unchanged default).
  - Design element: Decision 3 (default-true resolution)
  - Testability notes: Unit test on the resolution helper with `null`/missing-field sessions.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Malformed/non-boolean values in `session.user.printShow*` (e.g. stale client cache, partial migration) must not crash rendering or silently hide content unexpectedly.
  - Design element: Decision 3 — resolution helper coerces anything not strictly `false` to `true`.
  - Acceptance criteria reference: specs/print-preferences
  - Testability notes: Unit test resolution helper with `undefined`, `null`, `"true"` (string), and `false`.
- Requirement category: security/privacy
  - Requirement: This change must not alter personal-notes authorization — `printShowPersonalNotes` only ever gates display of a note already resolved and authorized upstream (per #608's ownership/tier checks); it must never become a path to fetch or reveal a note the viewer isn't authorized to see.
  - Design element: Decision 3 (route continues to gate `personalNote` resolution by ownership/tier before the preference is even consulted)
  - Acceptance criteria reference: specs/print-preferences
  - Testability notes: Existing `PrivateRecipeNotes`/personal-note authorization tests remain unchanged and passing; new tests only add a preference-off case on top of an already-authorized note.
- Requirement category: operability
  - Requirement: No new server endpoints, migrations, or infrastructure — the change must be deployable as a pure client/session-schema addition.
  - Design element: Decision 1 (Better-Auth handles field addition without a migration; Mongo documents simply lack the field until first save, and `defaultValue: true` covers reads until then).
  - Testability notes: Confirm no `db:seed` or migration script changes are needed as part of this change.

## Risks / Trade-offs

- Risk/trade-off: Ingredients/Instructions/Notes sections are shared screen+print DOM, unlike the print-only `printMetaLine`/Personal Notes precedent — getting the "print:hidden when preference off, but still on-screen" toggle wrong could accidentally hide content from the screen view.
  - Impact: A user turning off "print Instructions" could lose on-screen visibility of instructions entirely — a much bigger regression than intended.
  - Mitigation: Explicit test coverage (Functional Requirements Mapping, third row) asserting on-screen DOM is preference-independent; code review checklist item in tasks.md calling this out per section.
- Risk/trade-off: Two independent call sites (`$recipeId.tsx`, `cookbooks.$cookbookId_.print.tsx`) must both resolve preferences identically.
  - Impact: Drift between the two routes could make cookbook print and single-recipe print behave inconsistently, undermining the "applies to all printing" requirement.
  - Mitigation: Single shared resolution function, unit-tested once and imported by both routes rather than reimplemented.

## Rollback / Mitigation

- Rollback trigger: Print output regresses for existing users (e.g. sections disappearing from print despite no preference change), or the Ingredients/Instructions/Notes on-screen-hiding risk above materializes in production.
- Rollback steps: Revert the `RecipeDetail.tsx` gating changes and the two route call sites (restores unconditional print rendering); the `additionalFields` and settings-page UI can remain (inert extra session fields with no effect) or be reverted together — no data migration is required either way since `additionalFields` don't require schema migrations to remove.
- Data migration considerations: None — Better-Auth `additionalFields` don't require a migration to add or remove; existing users without the field simply fall back to `defaultValue: true` (or, post-rollback, the field is simply unread).
- Verification after rollback: Manually print a recipe and a cookbook and confirm all five sections render as before this change.

## Operational Blocking Policy

- If CI checks fail: Fix before merge; this change touches print output and settings persistence, both covered by existing CI test suites (Vitest + Playwright) — do not bypass failing tests.
- If security checks fail: Treat any finding touching personal-notes authorization as a hard blocker (see Non-Functional Requirements: security/privacy) — this change must not weaken the existing "verify recipe access / do not reveal note text to unauthorized tiers" guarantees.
- If required reviews are blocked/stale: Follow standard project PR process (`docs/standards/ci-cd.md`); no special exception for this change.
- Escalation path and timeout: Standard project escalation — no change-specific timeout defined; this is a self-contained, low-risk UI/preference feature with no external dependencies to time out on.

## Open Questions

None — all ambiguity surfaced during the exploration session (tRPC-vs-Better-Auth save path, cookbook-print scope, meta-line vs. meta-grid target) was resolved before this design was authored, and the trickiest remaining implementation detail (Decision 4's screen/print DOM-sharing risk for Ingredients/Instructions/Notes) is captured as a design decision and mitigation rather than an open question.
