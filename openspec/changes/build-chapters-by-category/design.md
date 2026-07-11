## Context

- Relevant architecture: `cookbook-chapters` capability (`openspec/specs/cookbook-chapters/spec.md`). `Cookbook` documents embed `chapters: [{ _id, name, orderIndex }]` and `recipes: [{ recipeId, orderIndex, chapterId? }]`. All chapter mutations live in `src/server/trpc/routers/cookbooks.ts` as `verifiedProcedure`s gated by `fetchEditableCookbook` (owner or `editor` collaborator). The cookbook detail page (`src/routes/cookbooks.$cookbookId.tsx`) renders the "New Chapter"/"Add Recipe" header buttons and hosts existing confirm-style modals (Add Recipe, Invite Collaborator).
- Dependencies: `Recipe.classificationId` (ref `Classification`), already populated/joined elsewhere in `cookbooks.ts` (e.g. `.populate` calls, `classificationName` already surfaced on `CookbookRecipe` client-side type). No schema changes required.
- Interfaces/contracts touched:
  - New tRPC mutation `cookbooks.buildChaptersByCategory`.
  - `src/routes/cookbooks.$cookbookId.tsx` (new button + modal).
  - `openspec/specs/cookbook-chapters/spec.md` (new requirement).

## Goals / Non-Goals

### Goals

- Provide a single mutation that deterministically groups all unchaptered recipes by category and applies the result atomically.
- Let the owner preview the effect (chapters to be created, chapters to be merged into, recipe counts) before committing.
- Reuse the existing full-state-replace pattern (`$set` on `recipes`, `$push`/`$set` on `chapters`) rather than introducing a new mutation shape.

### Non-Goals

- Grouping by any taxonomy dimension other than `classificationId`.
- Persisting or scheduling repeated/live re-grouping.
- Any UI for undoing the operation beyond existing chapter delete/rename tools.

## Decisions

### Decision 1: Single mutation with a `dryRun` flag, not two separate endpoints

- Chosen: `cookbooks.buildChaptersByCategory` accepts `{ cookbookId, dryRun?: boolean }`. When `dryRun: true`, the grouping/merge computation runs and the summary is returned without touching the database. When omitted/false, the same computation runs and is followed by the atomic write.
- Alternatives considered: A separate `cookbooks.previewBuildChaptersByCategory` query plus a `cookbooks.buildChaptersByCategory` mutation.
- Rationale: The grouping/merge-matching logic must be identical between preview and commit to avoid the preview lying to the owner (e.g. a race where a recipe's category changes between preview and confirm). Sharing one implementation function guarantees this; a `dryRun` flag is the smallest change that guarantees it structurally.
- Trade-offs: Slightly unusual for a "mutation" to sometimes not mutate; mitigated by using a `.mutation()` still (tRPC convention in this router already mixes read-like checks into mutations, e.g. `addRecipe`'s duplicate check) and clear naming/typing on the `dryRun` field.

### Decision 2: Grouping key resolution — `classificationName` with `"Uncategorized"` fallback

- Chosen: Server loads the current `Recipe` docs for all unchaptered stubs (`Recipe.find({ _id: { $in: [...] } }).select("classificationId").populate("classificationId", "name")`), builds a group key per recipe: `recipe.classificationId ? classification.name : "Uncategorized"`.
- Alternatives considered: Trust the client-supplied `classificationName` already present in the cookbook detail page's local state (avoids a query) — rejected because the client value can be stale (recipe's category could have changed since the cookbook page loaded) and because a server-authoritative mutation must not trust client-supplied grouping data for a bulk write.
- Rationale: Consistent with the codebase's existing pattern of re-fetching/validating recipe state server-side before mutating (see `addRecipe`'s `Recipe.findOne` visibility check).
- Trade-offs: One extra query per invocation; negligible given cookbook recipe counts already handled elsewhere in this router.

### Decision 3: Merge-matching normalization

- Chosen: Build a `Map<normalizedName, chapter>` from existing chapters where `normalizedName = chapter.name.trim().toLowerCase()`. A category group merges into `map.get(category.trim().toLowerCase())` if present; otherwise it becomes a new chapter.
- Alternatives considered: Exact match (`chapter.name === category`) — rejected per proposal's explicit design decision (avoids near-duplicate chapters from casing/whitespace drift, e.g. "dessert " vs "Dessert").
- Rationale: Matches confirmed user decision during exploration; keeps matching cheap (single pass, `Map` lookup).
- Trade-offs: A category literally intended to be distinct from a similarly-named chapter (e.g. chapter "MAIN" created for an unrelated reason) will unexpectedly receive merged recipes. Mitigated by the preview modal surfacing every merge target before commit.

### Decision 4: New-chapter ordering

- Chosen: Categories with no merge target are sorted alphabetically (locale-aware `localeCompare`) by category name, then assigned `orderIndex = maxExistingOrderIndex + 1, +2, ...` in that sorted order. Merged categories do not change the `orderIndex` of the chapter they merge into.
- Alternatives considered: Re-sort the entire `chapters` array alphabetically on every run — rejected because it would silently reorder chapters the owner deliberately arranged (via drag-and-drop `reorderChapters`), violating the "only unchaptered recipes are examined" boundary from the proposal.
- Rationale: Matches confirmed user decision; keeps the blast radius of the mutation limited to unchaptered recipes and newly created chapters only.
- Trade-offs: None significant.

### Decision 5: Atomic write shape

- Chosen: Compute the full new `chapters` array (existing chapters unchanged + newly created ones appended) and the full new `recipes` array (previously-chaptered stubs unchanged + newly grouped stubs given their resolved `chapterId` and an `orderIndex` continuing the existing global counter), then issue one `Cookbook.findByIdAndUpdate(cookbookId, { $set: { chapters: updatedChapters, recipes: updatedRecipes } })`.
- Alternatives considered: Multiple `$push`/`$pull` operations per group — rejected because it isn't atomic across groups and risks partial application if one group's update fails mid-sequence.
- Rationale: Directly mirrors `reorderRecipes`'s "Full-state replace is atomic" invariant and `deleteChapter`'s combined `$set` of both arrays in one call.
- Trade-offs: Requires loading the full current `recipes`/`chapters` arrays into memory first (already required by every other chapter mutation in this router — no new cost).

### Decision 6: Authorization

- Chosen: `verifiedProcedure` + `fetchEditableCookbook(cookbookId, ctx.user.id)`, identical to `createChapter`/`deleteChapter`/`reorderRecipes`. No new permission tier introduced.
- Alternatives considered: Owner-only (excluding editor collaborators) — rejected as inconsistent with every other chapter-mutating endpoint, which already allows `editor` role collaborators.
- Rationale: Consistency with existing capability; avoids introducing asymmetric permissions across chapter operations.
- Trade-offs: None.

### Decision 7: Button/empty-state behavior

- Chosen: The "Build Chapters by Category" button is rendered next to "New Chapter"/"Add Recipe" under the same `canEdit` gate, and is `disabled` (not hidden) when there are zero unchaptered recipes, with a `title` tooltip explaining why. Clicking it (when enabled) first calls the mutation with `dryRun: true` to populate the confirm modal.
- Alternatives considered: Hide the button entirely when there's nothing to do — rejected because a disabled-with-tooltip affordance is more discoverable and consistent with how `createChapterMutation.isPending` already disables (not hides) the "New Chapter" button.
- Rationale: UI consistency with existing header button behavior.
- Trade-offs: None significant.

## Proposal to Design Mapping

- Proposal element: New `cookbooks.buildChaptersByCategory` mutation
  - Design decision: Decision 1 (dryRun flag), Decision 5 (atomic write), Decision 6 (authorization)
  - Validation approach: Unit tests on the router (mocked `Cookbook`/`Recipe` models) covering dry-run vs commit parity, atomicity of the single `$set`, and `FORBIDDEN` for non-owner/non-editor callers.
- Proposal element: Grouping by `classificationId`/`classificationName`, `null` → `"Uncategorized"`
  - Design decision: Decision 2
  - Validation approach: Unit test with a mix of categorized/uncategorized recipes asserting correct group membership.
- Proposal element: Case-insensitive/trimmed merge matching into existing chapters
  - Design decision: Decision 3
  - Validation approach: Unit tests with chapter names like `"dessert "`, `"DESSERT"`, `"Dessert"` all merging into one chapter; a genuinely distinct chapter name does not merge.
- Proposal element: Alphabetical ordering of newly created chapters, appended after existing `orderIndex`
  - Design decision: Decision 4
  - Validation approach: Unit test asserting `orderIndex` values for new chapters are sequential, alphabetically ordered, and start above the pre-existing max.
- Proposal element: Preview/confirm modal before committing
  - Design decision: Decision 1 (dryRun), Decision 7 (button/empty-state)
  - Validation approach: Component test opening the modal and asserting rendered summary matches a mocked dry-run response; e2e test covering the full click-through-confirm-verify flow.
- Proposal element: Button disabled when no unchaptered recipes exist
  - Design decision: Decision 7
  - Validation approach: Component test asserting `disabled` attribute when all recipe stubs carry a `chapterId`.
- Proposal element: First-chapter-creation parity with `createChapter`
  - Design decision: Decision 4, Decision 5 (chapters array starts empty, so `maxExistingOrderIndex` defaults to `-1`, giving `orderIndex` starting at 0 — same convention as `createChapter`)
  - Validation approach: Unit test on a chapter-free cookbook with recipes asserting chapters are created starting at `orderIndex: 0`.

## Functional Requirements Mapping

- Requirement: Only recipe stubs without a `chapterId` are examined and regrouped; already-chaptered recipes and their chapters are untouched.
  - Design element: Decision 5 (full-state replace preserves untouched stubs unchanged)
  - Acceptance criteria reference: New scenario in `openspec/specs/cookbook-chapters/spec.md` — "Only unchaptered recipes are examined"
  - Testability notes: Unit test asserting a pre-existing chaptered recipe's `chapterId`/`orderIndex` is byte-identical before/after the mutation.
- Requirement: Recipes with no category are grouped into an "Uncategorized" chapter.
  - Design element: Decision 2
  - Acceptance criteria reference: Scenario — "Uncategorized recipes get their own chapter"
  - Testability notes: Unit test with `classificationId: null`.
- Requirement: Matching existing chapter names merge rather than duplicate.
  - Design element: Decision 3
  - Acceptance criteria reference: Scenario — "Category matching an existing chapter name merges instead of duplicating"
  - Testability notes: Unit test as described in mapping above.
- Requirement: Non-owner/non-editor cannot invoke.
  - Design element: Decision 6
  - Acceptance criteria reference: Scenario — "Non-owner/non-editor cannot build chapters by category"
  - Testability notes: Unit test asserting `FORBIDDEN` TRPCError for an unrelated user.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: The operation must be atomic — either all groups are applied or none are (no partial chapter creation on failure).
  - Design element: Decision 5
  - Acceptance criteria reference: Scenario — "Full-state replace is atomic" (mirrors existing `reorderRecipes` scenario of the same name)
  - Testability notes: Single `findByIdAndUpdate` call is inherently atomic at the document level (Mongo single-document writes are atomic); verified by asserting only one write call occurs in the mocked-model unit test.
- Requirement category: security
  - Requirement: Only owner/editor collaborators can trigger the bulk write.
  - Design element: Decision 6
  - Acceptance criteria reference: Scenario — "Non-owner/non-editor cannot build chapters by category"
  - Testability notes: Covered above.
- Requirement category: operability
  - Requirement: The owner must be able to see the effect before it happens, given the operation can move many recipes at once.
  - Design element: Decision 1, Decision 7
  - Acceptance criteria reference: Scenario — "Preview shows planned chapters and merges before commit"
  - Testability notes: Component + e2e coverage as described in mapping above.

## Risks / Trade-offs

- Risk/trade-off: Case-insensitive merge matching (Decision 3) can merge into a chapter the owner didn't intend.
  - Impact: Recipes land in an unexpected chapter.
  - Mitigation: Preview modal is mandatory before commit (Decision 1/7); no silent bypass path is exposed in the UI.
- Risk/trade-off: "Category" interpretation (classification vs. meal/course/preparation) may not match issue #562's intent (carried over from proposal).
  - Impact: Feature may need rework post-ship.
  - Mitigation: Explicitly documented; low cost to revisit since the grouping key is isolated to Decision 2's helper function.

## Rollback / Mitigation

- Rollback trigger: If the merged/created chapters turn out wrong after commit (e.g. bad merge match), or a bug in the shipped mutation misgroups recipes.
- Rollback steps: No data migration is needed to roll back the *code* (revert the PR; the mutation is additive — no existing mutations or schema fields are altered). For *data* already written by a buggy run, the owner can use existing `deleteChapter`/`renameChapter`/`reorderRecipes` tools to manually fix affected chapters, since the operation only ever touches `chapterId`/`orderIndex` on previously-unchaptered stubs and appends to `chapters[]` — it never deletes or renames pre-existing chapters or recipes.
- Data migration considerations: None — no schema changes; this change only adds a new mutation and UI entry point.
- Verification after rollback: Confirm `cookbooks.buildChaptersByCategory` is no longer reachable (button removed) and existing chapter mutations (`createChapter`, `reorderRecipes`, etc.) still pass their existing test suites unchanged.

## Operational Blocking Policy

- If CI checks fail: Fix the failing test/lint/type-check before merge; this change has no infrastructure or deployment dependencies that could fail independently of the code itself.
- If security checks fail: Treat as blocking — this mutation performs a bulk write gated by user-supplied `cookbookId`; any Codacy/Snyk finding related to authorization or injection must be resolved before merge, per project-standard `.github/instructions/` gates.
- If required reviews are blocked/stale: Address reviewer comments and re-request review; do not merge with unresolved AI-reviewer threads (per project convention — all review threads must be resolved before auto-merge).
- Escalation path and timeout: If blocked more than one business day awaiting review/CI infra (not code issues), flag to the repository owner (dougis) directly; no automated escalation exists for this project.

## Open Questions

- None beyond the single open question already tracked in `proposal.md` (confirming the "category" = classification interpretation with the issue reporter), which is explicitly marked non-blocking for apply.
