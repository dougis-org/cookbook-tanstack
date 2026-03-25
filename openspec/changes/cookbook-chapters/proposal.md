## Why

Cookbooks currently present recipes as a single flat list with no structural grouping. As cookbooks grow, users need a way to organize recipes into meaningful sections (e.g. Starters, Mains, Desserts) so that both editing and reading the cookbook feel like working with a real book rather than an unsorted pile.

## What Changes

- **New**: `chapters` embedded array added to the Cookbook Mongoose model (additive, no migration required on existing documents).
- **New**: `chapterId` optional field added to cookbook recipe stubs — absent when no chapters exist, always set when any chapter exists.
- **New**: Chapter CRUD tRPC procedures: `createChapter`, `renameChapter`, `deleteChapter`, `reorderChapters`.
- **Changed**: `cookbooks.addRecipe` — accepts optional `chapterId`; required when chapters exist.
- **Changed**: `cookbooks.reorderRecipes` — input changes from a flat `recipeIds[]` to `chapters: [{ chapterId, recipeIds }]` supporting cross-chapter drag. **BREAKING** for any client calling the old shape.
- **Changed**: `cookbooks.byId` — response now includes `chapters[]` and each recipe carries `chapterId?`.
- **Changed**: `cookbooks.list` — each summary now includes `chapterCount`.
- **New**: Two-mode drag-and-drop UI: expanded (recipe reorder, cross-chapter drag) and collapsed (chapter reorder).
- **Changed**: `CookbookCard` — shows chapter count when chapters exist.
- **Changed**: Cookbook detail header — adds "+ New Chapter" button and updated counts.
- **Changed**: TOC page — renders chapter names as section headers with global recipe numbering.
- **Changed**: Add Recipe modal — shows chapter picker dropdown when chapters exist.

## Capabilities

### New Capabilities

- `cookbook-chapters`: Chapter management within a cookbook — create, rename, delete, and reorder chapters; assign recipes to chapters; enforce the no-orphan invariant; two-mode drag-and-drop UI.

### Modified Capabilities

- `cookbook-auth-gating`: Chapter mutations (create, rename, delete, reorder) must be owner-only, consistent with existing recipe mutation gating.

## Impact

**Files changed:**
- `src/db/models/cookbook.ts` — schema update
- `src/server/trpc/routers/cookbooks.ts` — new/changed procedures
- `src/server/trpc/routers/__tests__/cookbooks.test.ts` — new test cases
- `src/routes/cookbooks.$cookbookId.tsx` — chapter UI, two-mode DnD
- `src/routes/cookbooks.$cookbookId_.toc.tsx` — chapter section headers
- `src/components/cookbooks/CookbookCard.tsx` — chapter count display
- `src/e2e/cookbooks-auth.spec.ts` — chapter auth gating E2E

**Dependencies:** `@dnd-kit/core`, `@dnd-kit/sortable` already installed — no new packages required.

**Breaking change:** `cookbooks.reorderRecipes` input shape changes; callers must be updated before deploy.

## Risks

- **DnD complexity**: Multi-container cross-chapter drag with `@dnd-kit` requires a more complex `handleDragEnd` — risk of edge-case bugs (e.g. drop on chapter header, drag between non-adjacent chapters).
- **Invariant enforcement**: The "all recipes in a chapter when chapters exist" rule is enforced at the application layer only; a direct DB write could violate it. Acceptable for now — no external DB access exists.
- **reorderRecipes breaking change**: Any cached tRPC call with the old input shape will fail after deploy. Single-owner app so no external API consumers, but tests must all be updated.

## Non-Goals

- Per-chapter images or descriptions (chapters are structural only).
- Sharing or reusing chapters across cookbooks.
- Chapter-level access control (chapters inherit cookbook visibility).
- Pagination of chapters or recipes within a chapter.

## Open Questions

None — all decisions resolved in exploration session (GH issue #209).

---

*If scope changes after approval, proposal.md, design.md, specs/, and tasks.md must all be updated before implementation proceeds.*
