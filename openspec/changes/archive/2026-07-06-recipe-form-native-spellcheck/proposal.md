## GitHub Issues

- #568

## Why

- Problem statement: Users writing recipe titles, notes, ingredients, and instructions have no in-line feedback loop for typos before saving. The browser already ships spell-checking dictionaries, but our recipe form inputs don't opt in to them.
- Why now: Issue #568 requested this, and a first-pass implementation (PR #570) is already open against `main` but only partially covers the intended fields and has 3 unresolved CI review findings blocking merge.
- Business/user impact: Zero-bundle-size UX improvement — catches typos in exactly the free-text fields most likely to contain prose (title, notes, ingredients, instructions) without adding a dependency or server-side spell-check pipeline.

## Problem Space

- Current behavior: `src/components/recipes/RecipeForm.tsx` does not set `spellCheck` on any field, so browsers fall back to their default (usually on for `<textarea>`/text `<input>`, but not guaranteed across all browsers/embeds). PR #570 explicitly enabled `spellCheck={true}` on three fields (`notes`, `ingredients`, `instructions`) but missed the `name` (title) field, and used `spellCheck={true}` instead of the bare boolean-attribute shorthand `spellCheck`, which DeepSource's JavaScript analysis flags as an antipattern on all three lines it touched (3 open, unresolved review threads).
- Desired behavior: every editable free-text field in the recipe create/edit form — `name` (title), `notes`, `ingredients`, `instructions` — explicitly declares `spellCheck` (bare boolean shorthand) so behavior is consistent and intentional rather than relying on unspecified browser defaults, and existing form state/validation wiring (`react-hook-form` `register()`) is untouched.
- Constraints:
  - Must not change `react-hook-form` registration, validation, or submit behavior for any field.
  - Must resolve all 3 open DeepSource review threads on PR #570 before merge, per this repo's branch protection (`required_review_thread_resolution: true`).
  - No new dependencies; this is a native HTML/browser attribute only.
- Assumptions:
  - The issue's acceptance criterion "Recipe description input" refers to a field conceptually described as free-text/description-like content on a recipe. The `Recipe` type (`src/types/recipe.ts`) has no field literally named `description` — the closest match is `notes`. The requester has confirmed the resolution rule directly: **scope is "any editable text field"** (title, notes, ingredients, etc.), which supersedes the need to resolve the literal "description" naming ambiguity — `notes` is in scope regardless of whether it was the field originally meant.
  - Numeric inputs (`prepTime`, `cookTime`, `servings`, `calories`, `fat`, `cholesterol`, `sodium`, `protein`) and non-text controls (`classificationId`/`sourceId` selects, `difficulty` select, `isPublic` checkbox) are not "editable text fields" in the relevant sense and are excluded.
- Edge cases considered:
  - Ingredient/instruction lines are short, structured, line-per-item text (quantities, units, imperative verbs) rather than long-form prose; spellcheck may flag units/abbreviations as false positives. Accepted as a minor, native-browser-owned UX tradeoff — no custom dictionary or suppression is in scope.
  - Editing an existing recipe (edit mode) uses the same `RecipeForm` component/fields as create mode, so the fix applies to both without additional branching.

## Scope

### In Scope

- Add explicit `spellCheck` (bare boolean shorthand, not `spellCheck={true}`) to the `name` (title) text input in `src/components/recipes/RecipeForm.tsx`.
- Fix the existing `spellCheck={true}` usages on `notes`, `ingredients`, and `instructions` in the same file to use the bare `spellCheck` shorthand, resolving the DeepSource antipattern.
- Update/extend the `RecipeForm` test suite to assert `spellcheck="true"` on all four fields (`name`, `notes`, `ingredients`, `instructions`).
- Reconcile with in-flight PR #570: build on top of its branch/commits rather than duplicating the work; resolve its 3 open DeepSource review threads as part of this change.

### Out of Scope

- Numeric fields and non-text controls (selects, checkboxes) in `RecipeForm.tsx`.
- Any other forms in the app (cookbook forms, source forms, auth forms, recipe notes/private-notes feature) — issue #568 and this change are scoped to the recipe creation/editing form only.
- Custom or third-party spell-check tooling, dictionaries, or suppression of specific false-positive terms (e.g., ingredient units).
- Server-side or API-level spelling validation.

## What Changes

- `src/components/recipes/RecipeForm.tsx`: add `spellCheck` to the `name` input; change `spellCheck={true}` to `spellCheck` on `notes`, `ingredients`, `instructions`.
- `src/components/recipes/__tests__/RecipeForm.test.tsx`: extend the existing spellcheck test (or add a new assertion) to cover the `name` field alongside `notes`, `ingredients`, `instructions`.
- PR #570: push the above fixes to its existing branch (`copilot/featforms-implement-native-spell-check`) and resolve its 3 open DeepSource threads, rather than opening a competing PR.

## Risks

- Risk: Diverging from PR #570's branch history could create merge conflicts or duplicate commits.
  - Impact: Wasted rework, confusing git history, possible duplicate PRs against the same issue.
  - Mitigation: Implementation work happens directly on the existing PR #570 branch; tasks.md must check out that branch (not create a new one) before making changes.
- Risk: DeepSource or another static analysis tool could flag the bare `spellCheck` shorthand differently than expected, or introduce a new finding.
  - Impact: CI stays red, merge stays blocked.
  - Mitigation: Re-run/observe CI after pushing the fix and address any new findings before requesting merge.
- Risk: Widening scope to `name` after PR #570 was already reviewed/tested could surprise the original PR author/reviewer.
  - Impact: Minor — needs a heads-up in the PR description/comment explaining the scope change.
  - Mitigation: Update the PR description to reflect the four-field scope and reference this OpenSpec change.

## Open Questions

- None blocking. The primary ambiguity from the original issue (whether "description" means a field that doesn't exist, i.e. `notes`) has been resolved by the requester's explicit scope clarification: any editable text field in the recipe form is in scope. This makes the literal "description" naming question moot.

## Non-Goals

- Do not implement custom spell-check dictionaries or ingredient-unit suppression lists.
- Do not extend spellcheck to other forms/components outside `RecipeForm.tsx`.
- Do not change validation, submission, or `react-hook-form` wiring for any field.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
