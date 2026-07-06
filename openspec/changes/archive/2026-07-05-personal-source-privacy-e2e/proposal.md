## GitHub Issues

- #509

## Why

- Problem statement: The Personal source privacy contract is implemented in the server and UI (#504–#508), but has no end-to-end test coverage. Without E2E tests, a regression in the server strip logic, the tRPC response, or the RecipeDetail render could silently break privacy for recipe owners.
- Why now: Issues #507 (form wiring) and #508 (detail display) are both closed. The feature is complete; E2E tests are the final gate before the Personal source initiative is declared done.
- Business/user impact: The privacy promise ("only you can see the personal name") is the core value proposition of the Personal source feature. A regression would expose a user's private attribution (e.g. "Grandma's recipe") to other users without any visible error.

## Problem Space

- Current behavior: No E2E tests exist for Personal source. The server strips `personalSourceName` for non-owners in `_helpers.ts:sanitizeRecipePersonalSource`. The SourceSelector shows a conditional "Personal Name" input. RecipeDetail renders `Personal · <name>` for owners and `Personal` only for non-owners.
- Desired behavior: Five scenarios verified in CI on every push: owner sees the name, non-owner does not (enforced at the network level, not just DOM), unauthenticated viewer does not, source-switch nulls the name on save, and the form's conditional input follows source selection correctly.
- Constraints: The SourceSelector is a combobox/typeahead (not a `<select>`), requiring debounce-aware interaction. tRPC uses `httpBatchLink` + `superjson`, so network assertions must hit `/api/trpc/recipes.byId` directly via `page.request`.
- Assumptions: The "Personal" source is seeded in the DB (`slug: "personal"`, `name: "Personal"`) via `seedSources()`. Tests run against a real MongoDB and live dev server (standard for this project's E2E suite).
- Edge cases considered: superjson encoding preserves plain ASCII strings verbatim, so `body.includes("Aunt Mary")` is a reliable network-level check. The X button that clears source selection has no accessible label — it is targeted by `page.locator('#sourceId').getByRole('button')`.

## Scope

### In Scope

- New E2E spec file: `src/e2e/personal-source-privacy.spec.ts`
- New helper function `selectPersonalSource(page, name)` added to `src/e2e/helpers/recipes.ts`
- Five test scenarios as specified in issue #509

### Out of Scope

- Changes to production application code (all feature code is done)
- Unit or integration tests (already exist for form and detail components)
- Any new API endpoints or schema changes

## What Changes

- `src/e2e/helpers/recipes.ts` — add `selectPersonalSource(page: Page, name: string)` helper that types into the source combobox, waits for the `sources.search` tRPC response, clicks the "Personal" dropdown result, and fills the Personal Name input
- `src/e2e/personal-source-privacy.spec.ts` — new spec with five `test()` blocks covering the full privacy contract

## Risks

- Risk: SourceSelector debounce + network round-trip makes source selection timing-sensitive in CI
  - Impact: Flaky tests if the dropdown result isn't present when Playwright clicks
  - Mitigation: Use `page.waitForResponse(/sources\.search/)` in the helper rather than `waitForTimeout`

- Risk: tRPC batch URL format could change with library upgrades
  - Impact: Network assertion would break
  - Mitigation: The assertion is isolated to one helper-level function; easy to update if format changes. Document the format in a comment.

- Risk: "Personal" source not seeded in test DB
  - Impact: Source combobox search returns no results; test setup fails
  - Mitigation: `seedSources()` is idempotent and already called in DB seed. CI runs seeds before E2E. Add a clear error message in the helper if Personal is not found.

## Open Questions

No unresolved ambiguity. All design decisions were confirmed during exploration:
- SourceSelector interaction pattern confirmed by reading `src/components/ui/SourceSelector.tsx`
- Network assertion URL format confirmed by reading `src/lib/trpc.ts` and `src/routes/api/trpc/$.tsx`
- Server strip location confirmed in `src/server/trpc/routers/_helpers.ts`
- Multi-user test pattern confirmed from `src/e2e/cookbooks-collaboration.spec.ts`

## Non-Goals

- Testing Personal source on cookbook or other non-recipe entities
- Testing the tier-gating of Personal source (if any)
- Performance or load testing of the privacy strip

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
