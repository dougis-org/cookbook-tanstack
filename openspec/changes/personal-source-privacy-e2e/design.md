## Context

- Relevant architecture: TanStack Start + tRPC + Playwright E2E suite. The privacy strip runs server-side in `src/server/trpc/routers/_helpers.ts:sanitizeRecipePersonalSource`. The `recipes.byId` public procedure applies it before returning. The SourceSelector (`src/components/ui/SourceSelector.tsx`) is a combobox with a 300ms debounce feeding `trpc.sources.search`. RecipeDetail (`src/components/recipes/RecipeDetail.tsx`) renders `Source: Personal · <name>` when `personalSourceName` is present, relying on the server having already stripped the field for non-owners.
- Dependencies: Seeded "Personal" source (`slug: "personal"`) via `src/db/seeds/sources.ts:seedSources()`. E2E auth helpers in `src/e2e/helpers/auth.ts`. Recipe form helpers in `src/e2e/helpers/recipes.ts`. tRPC HTTP endpoint at `/api/trpc` (fetch adapter, `httpBatchLink`, superjson transformer).
- Interfaces/contracts touched: `src/e2e/helpers/recipes.ts` (additive), `src/e2e/personal-source-privacy.spec.ts` (new file only). No production code changes.

## Goals / Non-Goals

### Goals

- Verify the owner sees `personalSourceName` in the UI and in the API response
- Verify non-owners and unauthenticated viewers never receive `personalSourceName` in the API response (network-level, not just DOM)
- Verify server normalization clears `personalSourceName` when source is switched away from Personal
- Verify the SourceSelector conditional shows/hides the Personal Name input correctly

### Non-Goals

- Testing production application code (it is already implemented)
- Unit or integration test coverage (already exists for components and router)

## Decisions

### Decision 1: Network assertion via direct `page.request.get` to tRPC endpoint

- Chosen: In the cross-user and unauthenticated tests, after navigating to the recipe detail page, make a direct HTTP GET to `/api/trpc/recipes.byId?batch=1&input=<encoded>` using `page.request.get()`. Assert the raw response text does not contain the private name string.
- Alternatives considered: (a) `page.waitForResponse()` intercepting the page-load tRPC batch call. (b) DOM-only assertion (`not.toBeVisible()`).
- Rationale: `page.request` shares the cookie jar so User B's session is in scope automatically. DOM-only assertions don't prove the field is absent from the wire — the server could be sending it and the component simply not rendering it. Direct GET is deterministic and doesn't depend on page-load batching behavior.
- Trade-offs: Couples to the tRPC batch URL format. Mitigated by isolating the call to one helper and documenting the format.

### Decision 2: `waitForResponse` debounce guard in `selectPersonalSource` helper

- Chosen: After filling the source combobox input, call `page.waitForResponse(/\/api\/trpc\/sources\.search/)` before clicking the dropdown result.
- Alternatives considered: `page.waitForTimeout(350)` fixed delay.
- Rationale: Fixed timeouts are the primary source of flakiness in CI. `waitForResponse` ties the test to the actual network event, not an arbitrary pause.
- Trade-offs: Requires sources.search to fire; if the word "Personal" is already cached (e.g., second call in same test), the query may not fire. Mitigation: the test creates fresh users each run, so the cache is cold.

### Decision 3: Shared setup via `beforeEach` creates the Personal recipe once per test group

- Chosen: A `beforeEach` block in the owner suite registers User A, creates the Personal recipe, and captures `recipeId` and `recipeUrl`. Privacy tests each clear cookies and set up their viewer context independently.
- Alternatives considered: A single `beforeAll` shared across all tests.
- Rationale: `beforeEach` isolation avoids inter-test state leakage. Each test starts from a known user A session and a known recipe URL.
- Trade-offs: Slightly slower (creates a new recipe per test group run). Acceptable for a 5-test file.

### Decision 4: X-button targeted by `page.locator('#sourceId').getByRole('button')`

- Chosen: When Personal is selected, SourceSelector renders `<div id={id}>` (where `id="sourceId"` from the form label) containing a name span and a bare `<button>` wrapping the X icon. Target with `page.locator('#sourceId').getByRole('button')`.
- Alternatives considered: CSS selector for the SVG, or adding an `aria-label` to the button.
- Rationale: `#sourceId` is already the element the form label points to (`htmlFor="sourceId"`), making it a stable selector. `getByRole('button')` within that locator is unambiguous since there is only one button there when a source is selected.
- Trade-offs: If the SourceSelector `id` prop binding changes, the selector breaks. Low risk — `id="sourceId"` is set by the form and SourceSelector has used it since inception.

## Proposal to Design Mapping

- Proposal element: Owner happy path (sees "Personal · Aunt Mary")
  - Design decision: Decision 3 (beforeEach creates recipe), standard RecipeDetail assertion
  - Validation approach: `expect(page.getByText(/Personal.*·.*Aunt Mary/)).toBeVisible()`

- Proposal element: Cross-user privacy (network-level assertion)
  - Design decision: Decision 1 (direct tRPC GET), Decision 3 (cookie jar pattern)
  - Validation approach: `expect(body).not.toContain("Aunt Mary")` on raw response text

- Proposal element: Unauthenticated privacy (network-level assertion)
  - Design decision: Decision 1 (direct tRPC GET), clearCookies without login
  - Validation approach: Same network assertion with no session cookie

- Proposal element: Source-switch clears name
  - Design decision: Decision 4 (X button selector), Decision 2 (waitForResponse)
  - Validation approach: After save + re-edit + re-select Personal, `expect(page.getByLabel("Personal Name")).toHaveValue("")`

- Proposal element: Selector conditional (show/hide Personal Name input)
  - Design decision: Decision 2 (waitForResponse), Decision 4 (clear via X button)
  - Validation approach: `.not.toBeVisible()` before selection, `.toBeVisible()` after, `.not.toBeVisible()` after clear

## Functional Requirements Mapping

- Requirement: Owner sees `personalSourceName` in UI and in raw API response
  - Design element: Test 1 (DOM), cross-verified in Test 2 setup where owner sees it before User B does not
  - Acceptance criteria reference: specs/privacy-contract.md — "owner view"
  - Testability notes: DOM assertion on `<p>` text content; regex matcher handles split text nodes

- Requirement: Non-owner never receives `personalSourceName` in API response
  - Design element: Decision 1 — direct tRPC GET after switching to User B
  - Acceptance criteria reference: specs/privacy-contract.md — "cross-user privacy"
  - Testability notes: String search on raw response body; superjson serializes plain strings verbatim

- Requirement: Unauthenticated viewer never receives `personalSourceName` in API response
  - Design element: Decision 1 — direct tRPC GET with no session cookie
  - Acceptance criteria reference: specs/privacy-contract.md — "unauthenticated privacy"
  - Testability notes: `page.context().clearCookies()` removes all session state before the request

- Requirement: Source switch causes server to null `personalSourceName`
  - Design element: Decision 4 (X button), re-select Personal after non-Personal save
  - Acceptance criteria reference: specs/source-switch-clears.md
  - Testability notes: `toHaveValue("")` on the Personal Name input after re-selecting Personal

- Requirement: SourceSelector shows/hides Personal Name input based on selection
  - Design element: Decision 2 (waitForResponse timing)
  - Acceptance criteria reference: specs/selector-conditional.md
  - Testability notes: `.not.toBeVisible()` / `.toBeVisible()` on `getByLabel("Personal Name")`

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Tests must not be flaky in CI
  - Design element: Decision 2 (`waitForResponse` instead of fixed timeouts)
  - Acceptance criteria reference: all five scenarios pass in CI (issue #509)
  - Testability notes: CI run on PR will confirm; re-run on failure is the signal

- Requirement category: security
  - Requirement: Privacy assertion must be at the network level, not DOM-only
  - Design element: Decision 1 (direct tRPC GET)
  - Acceptance criteria reference: issue #509 "Network-level assertion is explicit"
  - Testability notes: Response body string check — proves the field is absent from the wire, not just hidden by the component

## Risks / Trade-offs

- Risk/trade-off: tRPC batch URL format dependency
  - Impact: If `@trpc/client` changes the batch query string format, network assertions break
  - Mitigation: Isolate URL construction in one place in the spec; add a comment documenting the format

- Risk/trade-off: "Personal" source not present in test DB
  - Impact: `sources.search` returns no results; helper throws trying to click a missing button
  - Mitigation: `selectPersonalSource` helper waits for the response and asserts the button is visible before clicking; failure message will be clear

## Rollback / Mitigation

- Rollback trigger: New spec file causes existing CI jobs to fail on import errors or configuration issues
- Rollback steps: Delete `src/e2e/personal-source-privacy.spec.ts`; revert `src/e2e/helpers/recipes.ts` to remove `selectPersonalSource`. Both are additive changes — no production code touched.
- Data migration considerations: None (test-only changes)
- Verification after rollback: `npm run test:e2e` passes without the new file

## Operational Blocking Policy

- If CI checks fail: Investigate the specific scenario. Most likely causes: (1) "Personal" source not seeded — run `npm run db:seed`; (2) timing issue — check whether `waitForResponse` is matching the right URL pattern; (3) tRPC batch format changed — update URL construction in the spec.
- If security checks fail: Not applicable to test-only changes.
- If required reviews are blocked/stale: Re-request review after 24h; escalate to repo owner if blocked for 48h.
- Escalation path and timeout: Tag `@dougis` on the PR if CI remains red after two fix attempts.

## Open Questions

No open questions. All design decisions confirmed during codebase exploration prior to proposal creation.
