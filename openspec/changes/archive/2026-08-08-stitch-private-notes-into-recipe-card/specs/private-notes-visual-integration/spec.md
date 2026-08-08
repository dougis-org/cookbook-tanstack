## ADDED Requirements

This document details *changes* to requirements and is additive to the
`design.md` document, not a replacement.

### Requirement: PrivateRecipeNotes matches the recipe card's width

The `PrivateRecipeNotes` component SHALL render every one of its states
(loading skeleton, `anonymous` nudge, `below-tier` nudge,
`hidden-by-downgrade` nudge, loaded/read content, editing content) inside a
container constrained to the same maximum width and horizontal centering as
`RecipeDetail`'s card (`max-w-4xl mx-auto`).

#### Scenario: Loaded note content matches recipe card width

- **Given** a Sous Chef+ user viewing a recipe with a saved private note
- **When** the recipe detail page renders on a viewport wider than 56rem
- **Then** the `PrivateRecipeNotes` container has the same computed width and
  horizontal position as the `RecipeDetail` card above it

#### Scenario: Loading skeleton matches recipe card width

- **Given** a Sous Chef+ user viewing a recipe whose private note is still
  loading
- **When** the recipe detail page renders on a viewport wider than 56rem
- **Then** the `data-testid="private-notes-skeleton"` element has the same
  computed width and horizontal position as the `RecipeDetail` card above it

#### Scenario: Upgrade nudge states match recipe card width

- **Given** an anonymous, below-tier, or downgraded-with-existing-note user
  viewing a recipe
- **When** the recipe detail page renders on a viewport wider than 56rem
- **Then** the rendered `RecipeNotesUpgradeNudge` wrapper has the same
  computed width and horizontal position as the `RecipeDetail` card above it

### Requirement: PrivateRecipeNotes renders as a visual continuation of the recipe card

The `PrivateRecipeNotes` component SHALL render immediately adjacent to the
bottom of `RecipeDetail`'s card, with no vertical gap and no independent
top border, and SHALL use a bottom corner radius and shadow consistent with
`RecipeDetail`'s card so the two read as a single continuous surface.

#### Scenario: No gap between recipe card and private notes

- **Given** any `PrivateRecipeNotes` render state
- **When** the recipe detail page renders
- **Then** there is no visible vertical gap between the bottom edge of the
  `RecipeDetail` card and the top edge of the `PrivateRecipeNotes` container

#### Scenario: No doubled border at the seam

- **Given** any `PrivateRecipeNotes` render state
- **When** the recipe detail page renders
- **Then** the `PrivateRecipeNotes` container does not render its own top
  border independent of `RecipeDetail`'s card

#### Scenario: Bottom corners are rounded, top corners are square

- **Given** any `PrivateRecipeNotes` render state
- **When** the recipe detail page renders
- **Then** the `PrivateRecipeNotes` container's bottom-left and bottom-right
  corners are rounded and its top-left and top-right corners are square

### Requirement: Visual integration holds across all supported themes

The stitched appearance of `PrivateRecipeNotes` against `RecipeDetail`'s
card SHALL remain legible and intentional-looking under all four supported
themes (`dark`, `dark-greens`, `light-cool`, `light-warm`).

#### Scenario: Seam is legible in every theme

- **Given** the recipe detail page with a `PrivateRecipeNotes` state visible
- **When** the active theme is `dark`, `dark-greens`, `light-cool`, or
  `light-warm`
- **Then** the seam between `RecipeDetail`'s card and `PrivateRecipeNotes`
  is not visually broken (no hard mismatched-color line, no illegible
  contrast) in any of the four themes

## MODIFIED Requirements

None. This change does not alter `PrivateRecipeNotes`'s data fetching,
tier-gating, edit/save behavior, or the `Requirement: MODIFIED Recipe
detail page layout` requirement in `private-recipe-notes-component`
(component ordering relative to `RecipeDetail` and the action buttons is
unchanged — only its visual chrome changes).

## REMOVED Requirements

None.

## Traceability

- Proposal "What Changes" (wrapper classes across all render branches) ->
  `Requirement: PrivateRecipeNotes matches the recipe card's width`,
  `Requirement: PrivateRecipeNotes renders as a visual continuation of the
  recipe card`
- Design "Decision: Match width by wrapping each branch in max-w-4xl
  mx-auto" -> `Requirement: PrivateRecipeNotes matches the recipe card's
  width`
- Design "Decision: Use rounded-b-lg shadow-lg" -> `Requirement:
  PrivateRecipeNotes renders as a visual continuation of the recipe card`
- Design Risk (theme-specific seam legibility) -> `Requirement: Visual
  integration holds across all supported themes`
- Requirement -> Task(s): all requirements above -> tasks 1-3 in tasks.md

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: No additional client-side processing path is introduced

- **Given** the `PrivateRecipeNotes` render path
- **When** its wrapper markup is restyled
- **Then** no new asynchronous work, network calls, or data-fetching steps
  are introduced

### Requirement: Security

#### Scenario: No change in data exposure

- **Given** any `PrivateRecipeNotes` render state
- **When** the wrapper markup is restyled
- **Then** the component continues to expose the same note data under the
  same tier-gating rules as before this change (no new fields rendered, no
  gating logic altered)

### Requirement: Reliability

#### Scenario: Print output is unaffected

- **Given** a recipe with a saved private note, printed via the browser
  print dialog
- **When** the page is rendered for print
- **Then** `PrivateRecipeNotes` remains absent from print output (`print:hidden`
  unchanged) and the private note continues to reach print only via
  `RecipeDetail`'s existing `personalNote` prop / "Personal Notes" print
  section
