## MODIFIED Requirements

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
