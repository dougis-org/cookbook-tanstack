## Context

- Relevant architecture: Print-facing content is rendered primarily through `src/components/recipes/RecipeDetail.tsx`, `src/components/cookbooks/CookbookStandaloneLayout.tsx`, `src/routes/cookbooks.$cookbookId_.print.tsx`, and `src/styles/print.css`.
- Dependencies: Existing Tailwind utility usage, current print-only classes such as `print:hidden`, and current cookbook print specs under `openspec/specs/cookbook-print-view/`, `openspec/specs/cookbook-toc-print-layout/`, and `openspec/specs/cookbook-alpha-index/`.
- Interfaces/contracts touched: Component class names and print-only styling contracts for headings; no API, routing, or data contracts are expected to change.

## Goals / Non-Goals

### Goals

- Introduce a reusable print-heading density pattern that can be applied consistently across print-facing recipe and cookbook components.
- Reduce print-only heading size and vertical spacing while preserving a clear hierarchy between page titles, section headings, and subordinate headings.
- Keep all changes isolated to print behavior so screen layouts remain unchanged.
- Define validation that protects the intended print-facing heading treatment from regression.

### Non-Goals

- Restructure recipe content, including adding a new `Notes` heading.
- Change print pagination algorithms, TOC data ordering, or page map logic.
- Apply a global print reset to all `h1`-`h6` elements across the application.

## Decisions

### Decision 1: Use a shared print-heading utility pattern at the component level

- Chosen: Apply shared print-focused utility class patterns to explicit heading elements in print-facing components rather than relying on global `h1`-`h6` selectors.
- Alternatives considered: A global `@media print` heading reset in `src/styles/print.css`; one-off per-heading tweaks with no shared pattern.
- Rationale: Component-level application keeps scope limited to print-facing surfaces and avoids unintentionally changing unrelated pages, while still establishing a consistent pattern.
- Trade-offs: More explicit class maintenance in components, but safer scoping and clearer regression tests.

### Decision 2: Preserve heading hierarchy with level-specific print density tiers

- Chosen: Define at least two print density tiers, one for major page headings and one for section/subsection headings, with conservative reductions in size and spacing.
- Alternatives considered: Flatten all print headings to a near-uniform size; aggressively compress margins and padding for maximum density.
- Rationale: The issue asks for better page-space usage without a cramped feel, so hierarchy and readability need to remain visible in print.
- Trade-offs: Slightly less absolute space savings than an aggressive compression pass, but better scanability and lower readability risk.

### Decision 3: Cover both recipe and cookbook print surfaces in one pass

- Chosen: Apply the shared pattern to headings rendered in recipe print content and cookbook print structures, including recipe section headings and cookbook print headings such as title, chapter, and alphabetical index headings.
- Alternatives considered: Fix only recipe section headings first; broaden later if more print issues are reported.
- Rationale: The approved scope is to make the best use of print page space whenever a user prints, which spans the existing print-facing cookbook experience as well as the recipe section headings within it.
- Trade-offs: Slightly broader edit surface and test surface, but better consistency and fewer follow-up changes.

### Decision 4: Validate via structural tests rather than visual snapshotting

- Chosen: Add unit and integration-style assertions for the presence of the intended print classes on targeted heading elements, supplemented by existing print-route coverage where relevant.
- Alternatives considered: Pure manual print verification; screenshot-based snapshot tests.
- Rationale: Existing test patterns in the repo already assert print classes and structural contracts, making this approach stable and maintainable.
- Trade-offs: Tests verify intended styling hooks rather than actual printed pixel output, so a brief manual validation step remains valuable during implementation.

## Proposal to Design Mapping

- Proposal element: Define a shared print-heading density approach for print-facing recipe and cookbook views.
  - Design decision: Decision 1 and Decision 3
  - Validation approach: Unit tests asserting shared print class usage on targeted heading elements.
- Proposal element: Reduce print-only font sizes, margins, padding, and related spacing for existing print-facing headings.
  - Design decision: Decision 2
  - Validation approach: Assertions against the print utility classes or print-specific class hooks used by headings.
- Proposal element: Preserve heading hierarchy across page titles, section headings, and index/chapter headings.
  - Design decision: Decision 2
  - Validation approach: Tests confirm different heading groups retain distinct print class tiers.
- Proposal element: Add automated coverage for print-specific heading behavior.
  - Design decision: Decision 4
  - Validation approach: Extend existing component tests and print-route checks.

## Functional Requirements Mapping

- Requirement: Print-facing recipe section headings consume less vertical space in print without affecting screen styling.
  - Design element: Shared component-level print heading utilities applied in `src/components/recipes/RecipeDetail.tsx`.
  - Acceptance criteria reference: New spec requirement in a print-heading-density capability and related recipe print acceptance criteria.
  - Testability notes: Assert print classes on Ingredients, Instructions, and Nutrition headings in component tests.
- Requirement: Cookbook print headings also use denser print typography while preserving hierarchy.
  - Design element: Tiered print heading utilities applied in `src/components/cookbooks/CookbookStandaloneLayout.tsx`.
  - Acceptance criteria reference: New spec requirement covering cookbook print-facing headings.
  - Testability notes: Assert print classes on cookbook title, chapter headings, and alphabetical index heading.
- Requirement: The change remains scoped to print-facing components and does not change content structure.
  - Design element: Explicit component targeting and no new sections or heading labels.
  - Acceptance criteria reference: Spec non-goal and out-of-scope statements.
  - Testability notes: Existing content-rendering tests should continue to pass without textual changes.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Avoid regressions to screen layouts and unrelated pages.
  - Design element: Component-level `print:` classes instead of global heading selectors.
  - Acceptance criteria reference: Spec requirement that screen styling remains unchanged.
  - Testability notes: Implementation review should confirm all density changes are print-only.
- Requirement category: operability
  - Requirement: Keep styling behavior easy to reason about and maintain.
  - Design element: Shared print heading pattern with explicit usage sites.
  - Acceptance criteria reference: Spec requirement for consistent print heading treatment.
  - Testability notes: Tests should key off stable class contracts rather than brittle DOM order.
- Requirement category: usability
  - Requirement: Improve page-space efficiency without creating a cramped printed page.
  - Design element: Conservative density tiers that preserve hierarchy and whitespace.
  - Acceptance criteria reference: Spec requirement for readable, denser print headings.
  - Testability notes: Automated tests confirm intended tiers; manual print preview remains useful for final tuning.
- Requirement category: security
  - Requirement: No new security exposure is introduced.
  - Design element: Styling-only change with no new inputs, network calls, or dependencies.
  - Acceptance criteria reference: Implicit in unchanged behavior outside presentation.
  - Testability notes: Standard repo quality gates are sufficient; no special security validation is required unless tooling flags unrelated issues.

## Risks / Trade-offs

- Risk/trade-off: Shared classes may still need small per-surface exceptions if recipe and cookbook headings do not compress equally well.
  - Impact: Some duplication or tier refinement may be required during implementation.
  - Mitigation: Start with shared tiers and allow limited, explicit exceptions only if readability or spacing clearly demands them.
- Risk/trade-off: Structural tests can miss nuanced visual crowding in real print output.
  - Impact: A change could pass tests but still feel slightly too tight in print preview.
  - Mitigation: Include a manual print preview verification step in tasks and keep density changes conservative.

## Rollback / Mitigation

- Rollback trigger: Printed headings become hard to scan, layout regressions appear outside print mode, or review identifies unintended scope expansion.
- Rollback steps: Revert the print-heading class additions and any related print stylesheet hooks introduced by this change; rerun affected tests.
- Data migration considerations: None. This change does not alter persisted data or schemas.
- Verification after rollback: Confirm existing recipe and cookbook print tests pass and that headings return to their prior class/state contracts.

## Operational Blocking Policy

- If CI checks fail: Fix the failing tests or typing issues before merge; do not waive failures for styling-only rationale.
- If security checks fail: Review whether findings are related to the change. If related, remediate before merge; if unrelated, document the distinction and follow repo policy for existing issues.
- If required reviews are blocked/stale: Refresh the branch if needed, answer review comments, and avoid implementation drift beyond approved proposal/design/specs/tasks.
- Escalation path and timeout: If blocked after one review cycle or one failed CI rerun without clear resolution, pause implementation and update the OpenSpec artifacts or scope before proceeding.

## Open Questions

- None after proposal approval. The design assumes print density improvements remain limited to existing print-facing heading elements and do not introduce new content sections.
