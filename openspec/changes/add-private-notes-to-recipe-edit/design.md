## Context

- Relevant architecture:
  - `src/components/recipes/PrivateRecipeNotes.tsx` is self-contained: own `privateRecipeNotes.get` query, optimistic `upsert` mutation, tier/auth gating with `RecipeNotesUpgradeNudge`.
  - `src/components/recipes/RecipeForm.tsx` (react-hook-form + zod; autosave in edit mode via `useAutoSave`; local draft in create mode) renders the public `notes` textarea.
  - `src/routes/recipes/$recipeId_.edit.tsx` renders `<RecipeForm initialData={recipe} />`; `isEdit = !!initialData`.
- Dependencies: `trpc.privateRecipeNotes.get/upsert`, `useTierEntitlements().canUsePrivateRecipeNotes`, `useAuth`, TanStack Query cache.
- Interfaces/contracts touched: `PrivateRecipeNotes` props (additive: `variant`); `RecipeForm` markup. No router, schema, or model changes.

## Goals / Non-Goals

### Goals

- Same private-notes display/edit/nudge behavior on the edit screen as on the detail page.
- One-click, non-lossy move from public notes to private notes.
- No accidental recipe submission from note controls.

### Non-Goals

- Autosave of private notes (follow-up issue).
- Atomic recipe+note save.
- Server changes.

## Decisions

### Decision 1: Reuse `PrivateRecipeNotes` as-is inside `RecipeForm` (edit mode)

- Chosen: Mount the existing component beneath the public Notes field; independent Save/Cancel.
- Alternatives considered: Fold a private textarea into react-hook-form state and persist via the recipe submit (two backends behind one submit; partial-failure and autosave/draft interplay).
- Rationale: Lowest risk, identical behavior to detail page, preserves all tier/nudge logic and tests.
- Trade-offs: Second Save button on the page; private note not covered by the form's autosave/dirty tracking.

### Decision 2: `type="button"` on all `PrivateRecipeNotes` buttons

- Chosen: Explicit `type="button"` on Save, Cancel, Add a note, Edit.
- Alternatives considered: Mount the panel outside the `<form>` element (layout-constrained; hides it from the Notes field context).
- Rationale: Fixes the latent nested-submit hazard at the source; safe on the detail page too.
- Trade-offs: None material.

### Decision 3: `variant` prop for visual integration

- Chosen: `variant?: 'detail' | 'embedded'` (default `detail`). `embedded` drops `max-w-4xl mx-auto rounded-b-lg shadow-lg` and uses a bordered inset (`border border-[var(--theme-border)] rounded-lg p-4`) with `--theme-*` tokens; nudges and skeleton follow the same wrapper.
- Alternatives considered: Wrapper div overriding styles with CSS; duplicating the component.
- Rationale: Keeps the detail page byte-identical by default.
- Trade-offs: One more prop.

### Decision 4: Create-mode hint instead of panel

- Chosen: When `!isEdit`, render a muted hint "Save this recipe first to add private notes." in the same slot (shown to all tiers; no tier info leak).
- Alternatives considered: Hide entirely; allow note creation post-create via a redirect flow.
- Rationale: Notes need a recipe ID; hint explains the absence.
- Trade-offs: Hint shown to below-tier users in create mode too (harmless).

### Decision 5: "Move to Private Notes" lives in `RecipeForm`, uses the shared mutation and query key

- Chosen: Button under the public Notes textarea, rendered when `isEdit && canUsePrivateRecipeNotes && notes.trim()` and the panel is not in edit mode. Handler:
  1. Read current private body from the `privateRecipeNotes.get` cache (fetch if absent).
  2. `combined = existing.trim() ? existing + "\n\n" + publicNotes : publicNotes`. If `combined.length > 10000`, show error, abort.
  3. `privateRecipeNotes.upsert({ recipeId, body: combined })`.
  4. On success: `setValue('notes', '', { shouldDirty: true })` and invalidate the get query; the existing form save/autosave persists the clear.
  5. On error: leave the public field untouched; show inline error.
- Panel edit-mode signal: `PrivateRecipeNotes` accepts optional `onEditingChange?: (editing: boolean) => void`; RecipeForm disables Move while editing to avoid clobbering unsaved panel text.
- Alternatives considered: Replace instead of append (data-loss risk); clear public first (loss on failure); move logic inside `PrivateRecipeNotes` (couples it to form state).
- Rationale: Append-only and write-before-clear guarantee no content loss.
- Trade-offs: Public clear persists via normal form save; if the user abandons the form after Move, the public text remains server-side while the private copy also exists (duplicate, not loss).

## Proposal to Design Mapping

- Proposal element: Embed panel in edit mode, tier nudges
  - Design decision: Decisions 1, 3
  - Validation approach: Component tests per tier state; E2E on edit screen
- Proposal element: `type="button"`
  - Design decision: Decision 2
  - Validation approach: Test that clicking Save/Cancel/Add does not call `recipes.update`
- Proposal element: Create-mode hint
  - Design decision: Decision 4
  - Validation approach: RecipeForm create-mode test
- Proposal element: Move to private
  - Design decision: Decision 5
  - Validation approach: Unit tests for append, failure, overflow, disabled-while-editing; E2E
- Proposal element: Follow-up real-time save
  - Design decision: Non-goal; tracked by separate issue
  - Validation approach: Issue exists and is linked in PR description

## Functional Requirements Mapping

- Requirement: Edit screen shows private notes panel (edit mode)
  - Design element: Decisions 1, 3
  - Acceptance criteria reference: specs/recipe-edit-private-notes/spec.md — "Edit screen private notes panel"
  - Testability notes: RTL with mocked trpc; E2E
- Requirement: Create mode shows hint
  - Design element: Decision 4
  - Acceptance criteria reference: "Create-mode hint"
  - Testability notes: RTL
- Requirement: Tier nudges on edit screen
  - Design element: Decision 1 (reuse)
  - Acceptance criteria reference: "Tier nudges on edit screen"
  - Testability notes: RTL per tier
- Requirement: Note controls never submit recipe
  - Design element: Decision 2
  - Acceptance criteria reference: specs/private-recipe-notes-component/spec.md — "Buttons are non-submitting"
  - Testability notes: RTL asserting `recipes.update` not called
- Requirement: Move to private notes
  - Design element: Decision 5
  - Acceptance criteria reference: "Move to Private Notes"
  - Testability notes: RTL + E2E

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: Below-tier users never receive note bodies; Move hidden for them.
  - Design element: Existing router behavior + `canUsePrivateRecipeNotes` gate.
  - Acceptance criteria reference: "Tier nudges on edit screen"
  - Testability notes: Existing router tests; component tests.
- Requirement category: reliability
  - Requirement: No content loss on Move failure.
  - Design element: Decision 5 ordering.
  - Acceptance criteria reference: "Move failure preserves public notes"
  - Testability notes: Mock upsert rejection.
- Requirement category: operability/usability
  - Requirement: Theme tokens only; legible in all four themes; no emoji.
  - Design element: Decision 3.
  - Acceptance criteria reference: NFAC in spec.
  - Testability notes: Manual theme check at validation; no hard-coded colors (review).

## Risks / Trade-offs

- Risk/trade-off: Second Save button.
  - Impact: Minor UX friction.
  - Mitigation: Follow-up autosave issue.
- Risk/trade-off: Duplicate content if user Moves then abandons the form.
  - Impact: Public text still public.
  - Mitigation: Documented; acceptable (no loss).

## Rollback / Mitigation

- Rollback trigger: Regression on detail page or edit-form submission behavior.
- Rollback steps: Revert the PR (UI-only change).
- Data migration considerations: None. Notes written via Move are ordinary `RecipeNote` rows.
- Verification after rollback: Existing `PrivateRecipeNotes` and `RecipeForm` suites pass; edit page loads.

## Operational Blocking Policy

- If CI checks fail: fix, validate locally, push; do not merge with failing required checks.
- If security checks fail: remediate before merge; never waive without a recorded human decision.
- If required reviews are blocked/stale: re-request review; after three no-progress iterations report the stall to the user.
- Escalation path and timeout: surface to the repo owner (dougis) after the three-iteration stall or 24 hours without review activity.

## Open Questions

- None.
