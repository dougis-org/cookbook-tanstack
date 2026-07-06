## Context

- Relevant architecture: `src/components/recipes/RecipeForm.tsx` is a single shared component used for both recipe creation and recipe editing (`initialData` prop toggles mode). Fields are wired via `react-hook-form`'s `register()`. No server/API surface is involved — `spellCheck` is a purely client-side, native HTML attribute that affects only browser rendering behavior, not form state, validation, or the submitted payload shape.
- Dependencies: none added. Native HTML `spellcheck` attribute, no libraries.
- Interfaces/contracts touched: none. `RecipeForm` props, `react-hook-form` schema, and the `Recipe`/`RecipeDetail` types (`src/types/recipe.ts`) are unchanged.

## Goals / Non-Goals

### Goals

- Every editable free-text field in `RecipeForm.tsx` (`name`, `notes`, `ingredients`, `instructions`) explicitly opts in to browser spellcheck via the bare `spellCheck` JSX boolean shorthand.
- Resolve the 3 open DeepSource review threads on PR #570 (antipattern: `spellCheck={true}` should be `spellCheck`).
- Land this work by amending PR #570's existing branch, not by opening a new competing PR.

### Non-Goals

- No custom spellcheck engine, dictionary, or suppression list for domain terms (ingredient units, abbreviations).
- No change to numeric fields, selects, or checkboxes.
- No change to any form outside `RecipeForm.tsx`.

## Decisions

### Decision 1: Use bare `spellCheck` boolean shorthand, not `spellCheck={true}`

- Chosen: `<textarea spellCheck ...>` / `<input spellCheck ...>` (JSX boolean attribute shorthand).
- Alternatives considered: Keep `spellCheck={true}` as PR #570 has it.
- Rationale: `spellCheck={true}` is functionally identical to bare `spellCheck` in JSX, but DeepSource's JavaScript analyzer flags the explicit `={true}` form as an antipattern (3 occurrences, all currently unresolved on PR #570). Using the shorthand resolves those findings without behavior change and matches the project's existing code style expectations enforced by CI.
- Trade-offs: None functionally; purely a lint-conformance choice.

### Decision 2: Add `spellCheck` to the `name` (title) field, extending PR #570's scope

- Chosen: Add `spellCheck` to the `name` text input (`RecipeForm.tsx` ~line 397-401), in addition to fixing the three fields PR #570 already touched.
- Alternatives considered: Leave `name` out, matching the issue's literal acceptance-criteria checklist (which only names "instructions" and "description").
- Rationale: The requester explicitly clarified scope as "any editable text field" (title, notes, ingredients, etc.), which is broader than and supersedes the original issue checklist. Title is a free-text field prone to the same typo risk as notes/instructions.
- Trade-offs: Slightly diverges from the letter of the original issue's checkboxes, but is a direct, explicit instruction from the requester and captured in `proposal.md`.

### Decision 3: Reuse/amend PR #570 rather than opening a new PR

- Chosen: Check out `copilot/featforms-implement-native-spell-check`, apply the fixes on top of the existing commits, push to the same branch.
- Alternatives considered: Open a fresh PR from a new branch and close #570.
- Rationale: PR #570 already has the majority of the work, an open review, and CI history tied to it. Amending in place avoids duplicate review overhead and keeps a single source of truth for issue #568.
- Trade-offs: Requires care to avoid force-push conflicts if the branch has other in-flight commits; must confirm no one else is actively pushing to it before amending.

## Proposal to Design Mapping

- Proposal element: Add `spellCheck` to `name`, `notes`, `ingredients`, `instructions`.
  - Design decision: Decision 1 (bare shorthand), Decision 2 (name field addition).
  - Validation approach: RecipeForm unit test asserts `spellcheck="true"` on all four labeled fields.
- Proposal element: Resolve PR #570's 3 open DeepSource threads before merge.
  - Design decision: Decision 1 (fixes the root cause the threads flag).
  - Validation approach: Re-check PR #570 status/review-thread state after push; confirm DeepSource JavaScript check returns success and all threads show `is_resolved: true`.
- Proposal element: Build on PR #570's branch instead of a new PR.
  - Design decision: Decision 3.
  - Validation approach: Confirm commits land on `copilot/featforms-implement-native-spell-check` and PR #570 (not a new PR number) reflects the updated diff.

## Functional Requirements Mapping

- Requirement: `name` field has `spellCheck` enabled.
  - Design element: Decision 2.
  - Acceptance criteria reference: specs — "Title field spellcheck enabled" scenario.
  - Testability notes: RTL test — render `RecipeForm`, query by label `/name/i` or `/title/i`, assert `spellcheck="true"` attribute.
- Requirement: `notes`, `ingredients`, `instructions` fields keep `spellCheck` enabled, now via bare shorthand.
  - Design element: Decision 1.
  - Acceptance criteria reference: specs — "Free-text field spellcheck enabled" scenario.
  - Testability notes: Existing RTL test in `RecipeForm.test.tsx` already covers these three; extend it to include `name`.
- Requirement: No regression to form submission/state.
  - Design element: N/A — `spellCheck` is presentation-only, does not touch `register()` wiring.
  - Acceptance criteria reference: specs — "No functional regression" scenario.
  - Testability notes: Existing RecipeForm submit/validation tests continue to pass unmodified; `npm run dev` and `npm run build` produce no new warnings/errors.

## Non-Functional Requirements Mapping

- Requirement category: reliability/operability (CI gating)
  - Requirement: PR #570 must reach a green CI state with all review threads resolved before merge, per this repo's `required_review_thread_resolution` branch protection rule.
  - Design element: Decision 1 (removes the root cause), plus explicit thread-resolution step in tasks.md.
  - Acceptance criteria reference: specs — "CI and review-thread gating" scenario.
  - Testability notes: Poll PR status via `gh pr checks` / GitHub API after push; confirm DeepSource JavaScript check is `success` and thread `is_resolved` is `true` for all 3 threads.

## Risks / Trade-offs

- Risk/trade-off: Amending an existing PR branch authored by a different actor (Copilot agent) could conflict with assumptions about ownership.
  - Impact: Possible confusion about who "owns" the PR going forward.
  - Mitigation: Leave a PR comment explaining the scope extension and the fixes applied, referencing this OpenSpec change.
- Risk/trade-off: Scope now exceeds the original issue's literal acceptance-criteria checkboxes (title wasn't listed).
  - Impact: Issue #568's checklist won't literally match the delivered scope unless updated.
  - Mitigation: Update the issue's acceptance criteria (or add a comment) reflecting the requester-confirmed broader scope, so the issue and shipped work stay in sync.

## Rollback / Mitigation

- Rollback trigger: If the `spellCheck` shorthand change or `name` field addition introduces an unexpected regression (e.g., a new DeepSource finding, a broken test, or a form-state regression) that can't be fixed quickly.
- Rollback steps: Revert the specific commit(s) on `copilot/featforms-implement-native-spell-check`; since `spellCheck` is presentation-only and additive, reverting is a simple attribute removal with no data migration.
- Data migration considerations: None — no persisted data, schema, or API contract is touched.
- Verification after rollback: Re-run `RecipeForm.test.tsx` and confirm the DeepSource check returns to its prior state (still failing on the original antipattern, if only PR #570's original commits remain).

## Operational Blocking Policy

- If CI checks fail: Diagnose the specific failing check (currently DeepSource JavaScript), fix the root cause (attribute shorthand), push, and re-verify before proceeding to merge.
- If security checks fail: None expected — no security-sensitive surface is touched. If an unrelated security finding appears, treat as out-of-scope/pre-existing and flag to the user rather than attempting an unscoped fix.
- If required reviews are blocked/stale: Resolve each open review thread explicitly (via GraphQL `resolveReviewThread`, per this repo's established convention) after addressing the underlying comment; do not merge until all threads show resolved.
- Escalation path and timeout: If CI or review-thread resolution stalls for more than 3 push/fix iterations with no progress, stop and report the stall to the user with specifics, rather than continuing to iterate blindly.

## Open Questions

- None blocking implementation. The scope-defining ambiguity (title-only vs. broader "any editable text field") was resolved directly by the requester in this conversation and is recorded in `proposal.md`.
