## ADDED Requirements

### Requirement: Responsive card grid layout
The cookbook detail recipe list SHALL render recipe items as cards in a responsive CSS grid with 1 column on phones, 2 columns on tablets (≥640px), and 3 columns on desktops (≥1024px). Each chapter (when present) SHALL have its own independent grid container. The flat (no-chapter) recipe list SHALL also use this grid.

#### Scenario: Desktop renders 3-column grid
- **WHEN** a cookbook detail page is viewed on a desktop viewport (≥1024px)
- **THEN** recipe cards are arranged in a 3-column grid

#### Scenario: Tablet renders 2-column grid
- **WHEN** a cookbook detail page is viewed on a tablet viewport (640px–1023px)
- **THEN** recipe cards are arranged in a 2-column grid

#### Scenario: Phone renders single column
- **WHEN** a cookbook detail page is viewed on a phone viewport (<640px)
- **THEN** recipe cards are arranged in a single column

---

### Requirement: Card anatomy — image and metadata
Each recipe card SHALL display a `CardImage` at height `h-32`, the recipe name as a link to the recipe detail page, and available metadata (prep time, cook time, servings) in a single line below the name.

#### Scenario: Card shows image and name link
- **WHEN** a recipe card is rendered
- **THEN** it shows a `CardImage` at `h-32` and the recipe name as a clickable link to `/recipes/:recipeId`

#### Scenario: Card shows available metadata
- **WHEN** a recipe has prepTime, cookTime, or servings
- **THEN** they are displayed in a single metadata line below the name (e.g. "Prep 20m · Cook 35m · 4 servings")

#### Scenario: Card omits absent metadata fields
- **WHEN** a recipe has no prepTime, cookTime, or servings
- **THEN** no metadata line is rendered

---

### Requirement: Card anatomy — index number
Each recipe card SHALL display the recipe's 1-based position within its chapter (or within the flat list when no chapters exist) as a small muted number to the left of the recipe name.

#### Scenario: Index resets per chapter
- **WHEN** a cookbook with chapters is viewed
- **THEN** the first recipe in each chapter has index 1

#### Scenario: Index is sequential in flat list
- **WHEN** a cookbook with no chapters is viewed
- **THEN** recipes are numbered sequentially from 1

---

### Requirement: Owner drag handle on card
Recipe cards rendered for the cookbook owner SHALL include an explicit drag handle button on the left of the card body (below the image). The handle SHALL use `GripVertical` icon, `cursor-grab` styling, and `aria-label="Drag to reorder"`.

#### Scenario: Owner sees drag handle on each card
- **WHEN** the authenticated owner views a cookbook detail page with at least one recipe
- **THEN** each recipe card has a drag handle button with `aria-label="Drag to reorder"`

#### Scenario: Non-owner sees no drag handle
- **WHEN** a non-owner views a cookbook detail page
- **THEN** no drag handle is rendered on any card

---

### Requirement: Owner remove button on card
Recipe cards rendered for the cookbook owner SHALL include a remove button overlaid at the top-right corner of the card. The button SHALL be hidden by default and revealed on card hover. It SHALL carry `aria-label="Remove <recipe name>"`.

#### Scenario: Owner sees remove button on hover
- **WHEN** the authenticated owner hovers over a recipe card
- **THEN** a remove button appears at the top-right of the card with `aria-label="Remove <recipe name>"`

#### Scenario: Non-owner sees no remove button
- **WHEN** a non-owner views a cookbook detail page
- **THEN** no remove button is rendered on any card

---

### Requirement: Drag-and-drop reordering works in grid layout
The cookbook recipe grid SHALL support drag-and-drop reordering of cards within a chapter and across chapters (when chapters exist), using `rectSortingStrategy` for correct 2D snap behaviour. The underlying reorder mutations and cross-chapter logic SHALL be unchanged.

#### Scenario: Within-chapter drag reorders cards
- **WHEN** the owner drags a recipe card to a new position within the same chapter
- **THEN** the cards visually reorder and `reorderRecipes` is called with the updated order

#### Scenario: Cross-chapter drag moves card to target chapter
- **WHEN** the owner drags a recipe card from one chapter to another
- **THEN** the card appears in the target chapter at the drop position and `reorderRecipes` is called with the updated chapter assignments

#### Scenario: Flat list drag reorders cards
- **WHEN** the owner drags a recipe card in a cookbook with no chapters
- **THEN** the cards visually reorder and `reorderRecipes` is called

---

### Requirement: DragOverlay renders recipe card
While a drag is in progress, the `DragOverlay` SHALL render a recipe card (without drag handle or remove button) at `opacity-90` to represent the item being moved.

#### Scenario: DragOverlay shows card during drag
- **WHEN** the owner begins dragging a recipe card
- **THEN** a card-shaped overlay follows the pointer representing the dragged recipe

---

### Requirement: Empty chapter drop zone is full-width
When a chapter contains no recipes, its drop zone SHALL render as a full-width dashed-border area spanning the entire container width (not card-sized). The drop zone SHALL highlight when a draggable item is hovered over it.

#### Scenario: Empty chapter shows full-width drop zone
- **WHEN** a chapter has no recipes
- **THEN** a full-width dashed drop zone is rendered in place of the card grid

#### Scenario: Drop zone highlights on hover
- **WHEN** the owner drags a recipe card over an empty chapter's drop zone
- **THEN** the drop zone border and text change to the active (cyan) highlight state
