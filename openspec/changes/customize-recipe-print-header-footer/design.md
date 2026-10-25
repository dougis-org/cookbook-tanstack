## Context

- Relevant architecture:
  - Per-user print preferences are Better-Auth `additionalFields` (`src/lib/auth.ts`), resolved by `resolvePrintPreferences` (`src/lib/printPreferences.ts`) at the route boundary and passed to `RecipeDetail` as `printPreferences`.
  - `RecipeDetail` (`src/components/recipes/RecipeDetail.tsx`) prints Source inline with the title, a print-only meta line (`data-testid="print-meta-line"`) gated by `printShowMeta`, and a `printFooter` slot rendered last in the content container. Category badges and the stat grid are `print:hidden`.
  - Cookbook print (`src/routes/cookbooks.$cookbookId_.print.tsx`) renders `RecipeDetail` per recipe and passes `printFooter` containing `#{pageNumber}`.
  - Settings UI lives in `src/components/account/PreferencesSection.tsx` (checkbox toggles, one Save button calling `authClient.updateUser`).
- Dependencies: Better-Auth `additionalFields` (scalars only), `authClient.updateUser`, `print.css`, Tailwind `print:` variants.
- Interfaces/contracts touched:
  - `PrintPreferences` type and `resolvePrintPreferences(session)`.
  - `RecipeDetailProps.printPreferences` and `printFooter`.
  - User document: five new string fields; `printShowMeta` kept as legacy read-only input.

## Goals / Non-Goals

### Goals

- Let a user place Category, Difficulty, Servings, Prep time and Cook time in the printed header, footer, or nowhere.
- Persist the choice per user and edit it on the account settings screen.
- Apply it to single-recipe and cookbook print with one rendering path.
- Preserve existing users' behavior without a data migration.

### Non-Goals

- Live preview (follow-up ticket), configurable Source or "Added by", per-recipe overrides, page-repeating headers and footers, removing the legacy field.

## Decisions

### Decision 1: One string field per element

- Chosen: Five `additionalFields` strings (`printCategory`, `printDifficulty`, `printServings`, `printPrepTime`, `printCookTime`), each `"header" | "footer" | "none"`.
- Alternatives considered: One JSON-serialized string field; a nested object (not supported by Better-Auth additionalFields).
- Rationale: Matches the existing `printShow*` pattern, needs no custom parsing, and each field validates independently.
- Server-side validation (required, not optional): each field is validated against the `header | footer | none` allow-list before Better-Auth persists it. Invalid or non-string values are rejected with an error and nothing is written. Implemented with the Better-Auth `additionalFields` input validator where the installed version supports it, otherwise a user-update hook; either way the check is mandatory and ships in PR 1 with a test. The resolver fallback (Decision 2) is only a read-path backstop for legacy or corrupted records.
- Trade-offs: More fields on the user document and session payload (short enum values, negligible).

### Decision 2: Lazy migration in the resolver, no DB migration

- Chosen: `resolvePrintPreferences` resolves each element as: valid new field wins; otherwise for Prep, Cook, Servings and Difficulty, legacy `printShowMeta === false` gives `none` and anything else gives `header`; Category defaults to `footer`. Invalid or non-string values fall back the same way.
- Alternatives considered: A one-off script rewriting user documents; keeping `printShowMeta` as a master switch above per-element placement.
- Rationale: Better-Auth `defaultValue` applies only at user creation, so existing documents lack the fields. Lazy resolution keeps legacy behavior with no operational step, and the first Save writes the new fields. A master switch would leave two controls for one thing.
- Trade-offs: Legacy field must stay in `auth.ts` until a later cleanup. New users get the new defaults from `defaultValue`, which must match the resolver's defaults (covered by a test).

### Decision 3: Defaults for new accounts

- Chosen: Category `footer`; Difficulty, Servings, Prep time and Cook time `none`. These are the `defaultValue`s in `auth.ts` and the resolver's anonymous/missing-session fallback.
- Alternatives considered: Defaulting the four meta items to `header` for everyone, matching today's meta line.
- Rationale: Decided in exploration; new users opt in to extra print content.
- Trade-offs: Existing users keep today's header via Decision 2, while new users start sparser.

### Decision 4: Header line reuses the meta line element

- Chosen: Items placed in `header` render in the existing print-only meta line (`data-testid="print-meta-line"`), joined with ` · `, followed by "Added by" when present. Prep and Cook time are omitted when NA. The line is not rendered when empty.
- Alternatives considered: A new element; always printing `Prep: N/A`.
- Rationale: Keeps position, styling and test hook. "Added by" is attribution and stays unconditional of preferences.
- Trade-offs: Omitting NA times changes today's output for recipes missing a time (the issue requires it).

### Decision 5: One footer row composed in `RecipeDetail`

- Chosen: `RecipeDetail` renders a single footer row at the end of the recipe, after `PrivateRecipeNotes`/notes sections: footer items on the left, the `printFooter` node on the right. Row has `break-inside: avoid`, uses `--theme-print-*` tokens, and is print-only. The row renders when there are footer items or a `printFooter`. Items join with ` · `.
- Alternatives considered: A CSS `position: fixed` repeating footer; the cookbook route owning its own footer.
- Rationale: Satisfies "once, at the end of the recipe", keeps the single-sourced `printFooter` contract, and puts the cookbook `#N` on the same line as the user's items.
- Trade-offs: The footer is per recipe, not per page; a recipe spanning pages shows its footer only on its last page.

### Decision 6: Settings UI as a three-way control per element plus static sketch

- Chosen: A segmented radio group (Header / Footer / None) per element inside the Print Preferences block, saved with the existing Save button via `authClient.updateUser`. A static layout sketch (header line, body, footer row) shows what the zones mean. The existing five section toggles (minus Meta) remain.
- Alternatives considered: Dropdowns; a live preview.
- Rationale: Reuses the theme radiogroup keyboard pattern; live preview is deferred by decision.
- Trade-offs: The sketch does not reflect the user's current selection.

### Decision 7: Three sequential PRs

- Chosen: (1) preference model, resolver, auth fields, settings UI; (2) `RecipeDetail` header and footer rendering for single-recipe print; (3) cookbook print verification and E2E.
- Alternatives considered: One PR.
- Rationale: Avoids tripping the CI complexity gate (project convention to decompose large changes).
- Trade-offs: PR 1 lands settings that have no print effect until PR 2; acceptable with a single live user.

## Proposal to Design Mapping

- Proposal element: Five placement fields and defaults
  - Design decision: 1, 3
  - Validation approach: Resolver unit tests; auth config shape test
- Proposal element: Replace `printShowMeta`, migrate existing users
  - Design decision: 2
  - Validation approach: Resolver unit tests across legacy/new combinations
- Proposal element: Header/footer rendering, NA suppression, "Added by" unchanged
  - Design decision: 4, 5
  - Validation approach: `RecipeDetail` component tests; print E2E
- Proposal element: Cookbook print inherits, `#N` preserved
  - Design decision: 5, 7
  - Validation approach: Cookbook print page tests and E2E
- Proposal element: Settings UI with static sketch
  - Design decision: 6
  - Validation approach: `PreferencesSection` tests
- Proposal element: Delivery in three PRs
  - Design decision: 7
  - Validation approach: Task ordering in `tasks.md`

## Functional Requirements Mapping

- Requirement: Placement preferences stored and resolved with safe defaults and legacy migration
  - Design element: Decisions 1-3, `printPreferences.ts`, `auth.ts`
  - Acceptance criteria reference: `specs/print-preferences/spec.md` (storage, resolution)
  - Testability notes: Pure function; table-driven unit tests
- Requirement: Settings screen edits and saves placements
  - Design element: Decision 6
  - Acceptance criteria reference: `specs/print-preferences/spec.md` (settings UI)
  - Testability notes: RTL tests asserting `updateUser` payload
- Requirement: Print renders header items and footer row per placement
  - Design element: Decisions 4, 5
  - Acceptance criteria reference: `specs/recipe-print-meta/spec.md`
  - Testability notes: RTL tests on `print-meta-line` and footer test IDs; Playwright print emulation
- Requirement: Cookbook print shows items with `#N`
  - Design element: Decision 5
  - Acceptance criteria reference: `specs/recipe-print-meta/spec.md`
  - Testability notes: `CookbookPrintPage` tests; E2E

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Malformed or missing values never hide content unexpectedly or throw
  - Design element: Decision 2 fallback
  - Acceptance criteria reference: `specs/print-preferences/spec.md` NFAC Reliability
  - Testability notes: Unit tests with non-string, unknown-string and null inputs
- Requirement category: operability
  - Requirement: No data migration or deploy-ordering requirement
  - Design element: Decision 2
  - Acceptance criteria reference: `specs/print-preferences/spec.md` NFAC Operability
  - Testability notes: Resolver test with a session lacking all new fields
- Requirement category: security
  - Requirement: Server rejects any value other than the three enum values for the new fields before persistence
  - Design element: Decision 1 (mandatory server-side allow-list validation); resolver fallback as read-path backstop
  - Acceptance criteria reference: `specs/print-preferences/spec.md` (Server rejects invalid placement values)
  - Testability notes: Integration test calling the update path with out-of-range values and asserting rejection and no write
- Requirement category: performance
  - Requirement: No added network requests or render-blocking work
  - Design element: Existing session carries the preferences; CSS-only print visibility
  - Acceptance criteria reference: Covered by structure; no separate scenario
  - Testability notes: Code review

## Risks / Trade-offs

- Risk/trade-off: Footer clipped or orphaned in cookbook print near `@page cookbook-page` margins.
  - Impact: Missing `#N` or items on a page.
  - Mitigation: `break-inside: avoid` on the row; cookbook print E2E asserts both are present.
- Risk/trade-off: The installed Better-Auth version lacks a field-level input validator.
  - Impact: Without a hook, an arbitrary string could be stored through a crafted update.
  - Mitigation: Server-side allow-list validation is required (Decision 1); use a user-update hook if the validator is unavailable. The resolver fallback is only a backstop.
- Risk/trade-off: Existing tests reference `printShowMeta` and `print-meta-line`.
  - Impact: Test churn.
  - Mitigation: Keep the test ID; update tests in the PR that changes the behavior.

## Rollback / Mitigation

- Rollback trigger: Print output regresses or settings fail to save after release.
- Rollback steps: Revert the relevant PR(s) with `git revert`; PR 2 and 3 revert independently of PR 1.
- Data migration considerations: None. Stored values are additive fields that older code ignores, and `printShowMeta` is untouched, so a revert restores the previous behavior for every user.
- Verification after rollback: Print a recipe and a cookbook; confirm the meta line follows `printShowMeta` and the settings screen saves.

## Operational Blocking Policy

- If CI checks fail: Fix locally, run the remote push validation, push, and re-check; do not enable or force auto-merge past a failing required check.
- If security checks fail: Remediate, re-scan, and push; do not waive findings without explicit human acceptance recorded in the PR.
- If required reviews are blocked/stale: Address comments, re-request review, and poll.
- Escalation path and timeout: If a gate stays blocked after three fix iterations or 24 hours with no progress, report the stall and remaining findings to the user and wait for guidance.

## Open Questions

- None unresolved. PR 1 picks the validation mechanism (field validator or update hook) the installed Better-Auth version supports; the validation itself is required either way.
