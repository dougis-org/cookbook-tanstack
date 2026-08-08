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

See [design.md](../../changes/archive/2026-08-08-stitch-private-notes-into-recipe-card/design.md) and [tasks.md](../../changes/archive/2026-08-08-stitch-private-notes-into-recipe-card/tasks.md) for the change that introduced this requirement.
