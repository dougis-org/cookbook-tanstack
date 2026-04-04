### Requirement: Chapter data model
The Cookbook document SHALL embed a `chapters` array of `{ _id, name, orderIndex }` entries and each recipe stub SHALL carry an optional `chapterId` field that references a chapter in that array.

#### Scenario: No chapters on new cookbook
- **WHEN** a cookbook is created
- **THEN** its `chapters` array is empty and no recipe stub has a `chapterId`

#### Scenario: Recipe stubs include chapterId when chapters exist
- **WHEN** a cookbook has one or more chapters
- **THEN** every recipe stub in `recipes[]` has a `chapterId` that matches an entry in `chapters[]`

---

### Requirement: Create chapter
The system SHALL allow the cookbook owner to create a new chapter via `cookbooks.createChapter`. The new chapter SHALL be named `"Chapter N"` where N is `chapters.length + 1` at creation time.

#### Scenario: First chapter migrates existing recipes
- **WHEN** the owner calls `createChapter` on a cookbook that has recipes but no chapters
- **THEN** a chapter named "Chapter 1" is created AND all existing recipe stubs are assigned to it in a single atomic update

#### Scenario: Subsequent chapter is added empty
- **WHEN** the owner calls `createChapter` on a cookbook that already has chapters
- **THEN** a new chapter is appended with the next sequential default name and no recipes are reassigned

#### Scenario: Non-owner cannot create chapter
- **WHEN** a user who does not own the cookbook calls `createChapter`
- **THEN** the server returns a FORBIDDEN error

---

### Requirement: Rename chapter
The system SHALL allow the cookbook owner to rename a chapter via `cookbooks.renameChapter`. The new name SHALL be stored immediately.

#### Scenario: Owner renames chapter inline
- **WHEN** the owner submits a new name via the pencil-icon rename UI
- **THEN** the chapter name is updated and the new name is reflected in the list

#### Scenario: Non-owner cannot rename
- **WHEN** a non-owner calls `renameChapter`
- **THEN** the server returns a FORBIDDEN error

---

### Requirement: Delete chapter
The system SHALL allow the cookbook owner to delete a chapter via `cookbooks.deleteChapter`.

#### Scenario: Delete chapter with recipes — recipes move to first remaining
- **WHEN** the owner deletes a chapter that contains recipes and at least one other chapter exists
- **THEN** all recipes from the deleted chapter are reassigned to the chapter with the lowest `orderIndex` AND the deleted chapter is removed

#### Scenario: Delete last chapter — recipes become unchaptered
- **WHEN** the owner deletes the only remaining chapter
- **THEN** all recipe stubs have their `chapterId` cleared AND the `chapters` array becomes empty

#### Scenario: Non-owner cannot delete
- **WHEN** a non-owner calls `deleteChapter`
- **THEN** the server returns a FORBIDDEN error

---

### Requirement: Reorder chapters
The system SHALL allow the cookbook owner to reorder chapters via `cookbooks.reorderChapters`, accepting an ordered array of all chapter IDs.

#### Scenario: Chapter order is persisted
- **WHEN** the owner submits a new chapter ID order
- **THEN** each chapter's `orderIndex` is updated to match the submitted order

#### Scenario: Non-owner cannot reorder chapters
- **WHEN** a non-owner calls `reorderChapters`
- **THEN** the server returns a FORBIDDEN error

---

### Requirement: Add recipe with chapter assignment
When chapters exist, `cookbooks.addRecipe` SHALL require a `chapterId`. When no chapters exist, `chapterId` SHALL be ignored.

#### Scenario: Recipe added to specified chapter
- **WHEN** the owner calls `addRecipe` with a valid `chapterId` on a cookbook that has chapters
- **THEN** the recipe stub is added with that `chapterId` and an appropriate `orderIndex` at the end of that chapter's recipes

#### Scenario: Missing chapterId when chapters exist returns error
- **WHEN** `addRecipe` is called without a `chapterId` on a cookbook that has chapters
- **THEN** the server returns a BAD_REQUEST error

#### Scenario: Adding recipe to chapter-free cookbook unchanged
- **WHEN** `addRecipe` is called on a cookbook with no chapters
- **THEN** the recipe is added without a `chapterId` (existing behavior)

---

### Requirement: Reorder recipes across chapters
`cookbooks.reorderRecipes` SHALL accept `{ cookbookId, chapters: [{ chapterId, recipeIds }] }` and replace the full recipe ordering in a single update.

#### Scenario: Within-chapter reorder is persisted
- **WHEN** the owner drags a recipe to a new position within the same chapter
- **THEN** the recipe's `orderIndex` within that chapter is updated

#### Scenario: Cross-chapter recipe move is persisted
- **WHEN** the owner drags a recipe from one chapter to another
- **THEN** the recipe stub's `chapterId` is updated to the target chapter and `orderIndex` values reflect the new position

#### Scenario: Recipe dragged into an empty chapter is assigned to that chapter
- **WHEN** the owner drags a recipe from a chapter that contains two or more recipes into a chapter that is currently empty
- **THEN** the recipe stub's `chapterId` is updated to the empty target chapter, the source chapter retains its remaining recipes, and the moved recipe appears in the target chapter after the page re-renders

#### Scenario: Full-state replace is atomic
- **WHEN** `reorderRecipes` is called
- **THEN** the entire `recipes` array is replaced in a single `$set` operation

---

### Requirement: Cookbook list shows chapter count
The `cookbooks.list` query SHALL include `chapterCount` for each cookbook. The CookbookCard component SHALL display chapter count alongside recipe count when `chapterCount > 0`.

#### Scenario: No chapters — only recipe count shown
- **WHEN** a cookbook has no chapters
- **THEN** CookbookCard shows only the recipe count (e.g. "12 recipes")

#### Scenario: Chapters exist — both counts shown
- **WHEN** a cookbook has one or more chapters
- **THEN** CookbookCard shows both counts (e.g. "12 recipes · 3 chapters")

---

### Requirement: Cookbook detail header shows chapter count and management buttons
The cookbook detail page SHALL show the chapter count (when chapters exist) and SHALL show "+ New Chapter" and "+ Add Recipe" buttons to the owner.

#### Scenario: Owner sees both action buttons
- **WHEN** an authenticated owner views a cookbook detail page
- **THEN** both "+ New Chapter" and "+ Add Recipe" buttons are visible in the header

#### Scenario: Non-owner sees neither action button
- **WHEN** a non-owner views a cookbook detail page
- **THEN** neither "+ New Chapter" nor "+ Add Recipe" is rendered

---

### Requirement: Expanded recipe list with chapter headers
When chapters exist, the cookbook detail recipe list SHALL render chapter headers between chapter groups. Chapter headers SHALL show an inline pencil icon for renaming (owner only). The list SHALL include a collapse toggle button.

#### Scenario: Chapter headers render between recipe groups
- **WHEN** a cookbook with chapters is viewed in expanded mode
- **THEN** each chapter's name renders as a styled header above its recipes

#### Scenario: Pencil icon visible to owner on hover
- **WHEN** the owner hovers over a chapter header
- **THEN** the pencil (rename) icon becomes visible

#### Scenario: Pencil icon not rendered for non-owner
- **WHEN** a non-owner views a cookbook with chapters
- **THEN** no pencil icon is rendered on chapter headers

#### Scenario: No chapter UI when no chapters exist
- **WHEN** a cookbook has no chapters
- **THEN** the recipe list renders as a flat list with no chapter headers and no collapse toggle

---

### Requirement: Collapsed (chapter-sort) mode
The cookbook detail recipe list SHALL support a collapsed mode toggled by a chevron icon at the top of the recipe section. In collapsed mode each chapter renders as a single draggable row.

#### Scenario: Toggle switches to collapsed mode
- **WHEN** the owner clicks the collapse toggle
- **THEN** chapter headers collapse to single rows showing chapter name and recipe count, and recipe rows are hidden

#### Scenario: Chapters are sortable in collapsed mode
- **WHEN** the owner drags a chapter row in collapsed mode
- **THEN** the chapter order is updated and `reorderChapters` is called

#### Scenario: Toggle returns to expanded mode
- **WHEN** the owner clicks the expand toggle in collapsed mode
- **THEN** the full recipe list is restored

---

### Requirement: Add Recipe modal chapter picker
When chapters exist, the Add Recipe modal SHALL display a required chapter picker. When no chapters exist the modal SHALL behave as before.

#### Scenario: Chapter dropdown shown when chapters exist
- **WHEN** the owner opens the Add Recipe modal on a cookbook that has chapters
- **THEN** a chapter picker dropdown is displayed and must be selected before submitting

#### Scenario: Chapter dropdown not shown when no chapters
- **WHEN** the owner opens the Add Recipe modal on a cookbook with no chapters
- **THEN** no chapter picker is displayed

---

### Requirement: TOC renders chapter sections
The TOC page SHALL render chapter names as section headers when chapters exist. Recipe numbering SHALL be global (continuing across chapters).

#### Scenario: Chapter headers in TOC
- **WHEN** a cookbook with chapters is viewed on the TOC page
- **THEN** each chapter's name is rendered as a section header above its recipes

#### Scenario: Global recipe numbering
- **WHEN** a cookbook with multiple chapters is viewed on the TOC page
- **THEN** recipe numbers are sequential across all chapters (e.g. Chapter 1 has 1–3, Chapter 2 starts at 4)

#### Scenario: Flat TOC when no chapters
- **WHEN** a cookbook with no chapters is viewed on the TOC page
- **THEN** the TOC renders as a flat numbered list (existing behavior)
