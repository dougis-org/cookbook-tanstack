## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Personal note appears in print output when present and entitled

The system SHALL render the current user's saved private recipe note as a "Personal Notes" section in print output when the user is logged in, `canUsePrivateRecipeNotes(tier)` is true, and the saved note body is non-empty after trimming.

#### Scenario: Entitled user with a saved note sees it in print

- **Given** the user is logged in, their tier satisfies `canUsePrivateRecipeNotes`, and `privateRecipeNotes.get` returns a note with a non-empty `body`
- **When** the recipe detail page renders and the page is printed
- **Then** a "Personal Notes" section heading is visible in the print output
- **And** the note body text is visible below the heading, formatted with `whitespace-pre-wrap`

#### Scenario: Personal Notes section is hidden on screen

- **Given** the same entitled user and saved note as above
- **When** the recipe detail page renders on screen (not printed)
- **Then** the "Personal Notes" section added by this change is not visible on screen

---

### Requirement: ADDED Personal Notes section omitted when not applicable

The system SHALL NOT render the "Personal Notes" section in print output when the user is anonymous, the user's tier does not satisfy `canUsePrivateRecipeNotes`, or no non-empty saved note exists for that user and recipe.

#### Scenario: Anonymous user sees no Personal Notes section

- **Given** the viewer is not logged in
- **When** the recipe detail page is printed
- **Then** no "Personal Notes" section appears anywhere in the print output

#### Scenario: Below-tier user sees no Personal Notes section

- **Given** the user is logged in but their tier does not satisfy `canUsePrivateRecipeNotes`
- **When** the recipe detail page is printed
- **Then** no "Personal Notes" section appears anywhere in the print output, regardless of whether a note exists in storage for that user

#### Scenario: Entitled user with no saved note sees no Personal Notes section

- **Given** the user is logged in, tier-entitled, and `privateRecipeNotes.get` returns `{ hasNote: false, note: null }`
- **When** the recipe detail page is printed
- **Then** no "Personal Notes" section appears in the print output

#### Scenario: Entitled user with a whitespace-only saved note sees no Personal Notes section

- **Given** the user is logged in, tier-entitled, and the saved note body is empty or whitespace-only after trimming
- **When** the recipe detail page is printed
- **Then** no "Personal Notes" section appears in the print output

---

### Requirement: ADDED Personal Notes section positioned immediately after Notes, independent of Notes

The system SHALL render the "Personal Notes" section immediately after the existing public `Notes` section within the shared `RecipeDetail` component's section order, and this positioning SHALL NOT depend on whether the `Notes` section itself rendered.

#### Scenario: Personal Notes follows Notes when both are present

- **Given** a recipe with non-empty public `notes` content and an entitled user with a non-empty saved personal note
- **When** the recipe detail page is printed
- **Then** the "Personal Notes" section appears immediately after the "Notes" section in the printed document order

#### Scenario: Personal Notes renders standalone when public Notes is absent

- **Given** a recipe with no public `notes` content and an entitled user with a non-empty saved personal note
- **When** the recipe detail page is printed
- **Then** the "Personal Notes" section appears in the print output even though the "Notes" section is absent

#### Scenario: Neither section renders when both are absent

- **Given** a recipe with no public `notes` content and either an anonymous viewer, a below-tier user, or an entitled user with no saved note
- **When** the recipe detail page is printed
- **Then** neither the "Notes" section nor the "Personal Notes" section appears in the print output

---

### Requirement: ADDED No duplicate network request for the private note query

The system SHALL fetch the current user's private recipe note at most once per recipe-detail page load, even though both the route and the on-screen `PrivateRecipeNotes` component consume the same underlying query.

#### Scenario: Single query key shared across consumers

- **Given** a logged-in, tier-entitled user viewing a recipe detail page
- **When** the page renders both the print-only "Personal Notes" section (via the route) and the on-screen `PrivateRecipeNotes` widget
- **Then** exactly one network request is made for `trpc.privateRecipeNotes.get` for that page load

---

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element -> Requirement:
  - "Personal note appears in print output" -> `ADDED Personal note appears in print output when present and entitled`
  - "Section does not render when not applicable" -> `ADDED Personal Notes section omitted when not applicable`
  - "Section positioned immediately after Notes, independent of Notes" -> `ADDED Personal Notes section positioned immediately after Notes, independent of Notes`
  - "No duplicate network request" -> `ADDED No duplicate network request for the private note query`
- Design decision -> Requirement:
  - Decision 1 (route owns fetch, `RecipeDetail` stays pure) -> all requirements (data flow enabling every scenario)
  - Decision 2 (shared `queryOptions` factory call for dedup) -> `ADDED No duplicate network request for the private note query`
  - Decision 3 (standalone section, positioned after Notes) -> `ADDED Personal Notes section positioned immediately after Notes, independent of Notes`
- Requirement -> Task(s):
  - `ADDED Personal note appears in print output when present and entitled` -> tasks 1, 2, 3
  - `ADDED Personal Notes section omitted when not applicable` -> tasks 1, 2, 3
  - `ADDED Personal Notes section positioned immediately after Notes, independent of Notes` -> tasks 1, 3
  - `ADDED No duplicate network request for the private note query` -> tasks 2, 4

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: No additional network request beyond the existing query

See functional scenario: "Single query key shared across consumers" — this fully covers the performance requirement (at most one `privateRecipeNotes.get` request per page load); no separate latency budget applies since this is a client-side rendering change against an already-existing query.

### Requirement: Security

See functional scenarios: "Anonymous user sees no Personal Notes section" and "Below-tier user sees no Personal Notes section" — these cover access-control behavior for this change.

**Distinct NFAC — no new authorization surface introduced:**

#### Scenario: Personal note data source is scoped to the caller's own session

- **Given** the print-only "Personal Notes" section in `RecipeDetail` receives its content exclusively via a prop computed from the current session's own `privateRecipeNotes.get` query result
- **When** the component renders for any recipe
- **Then** no new server endpoint, query parameter, or data path is introduced that could return another user's note content

### Requirement: Reliability

#### Scenario: Existing RecipeDetail and PrivateRecipeNotes behavior is unaffected

- **Given** the existing `RecipeDetail` section rendering (Instructions, Notes, Nutrition, etc.) and the existing `PrivateRecipeNotes` on-screen widget behavior (loading, tier nudges, edit/save/cancel)
- **When** this change is applied
- **Then** all pre-existing `RecipeDetail` and `PrivateRecipeNotes` test suites continue to pass unmodified
