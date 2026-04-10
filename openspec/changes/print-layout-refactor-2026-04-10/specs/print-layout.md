## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED PrintLayout component enforces a fixed light context

The system SHALL render a `PrintLayout` component that wraps its children in a `div` with `className="bg-white text-gray-900"`, overriding the dark cascade inherited from `<html class="dark">` for all descendants that do not use explicit `dark:` variants.

#### Scenario: Screen rendering — print routes appear light

- **Given** the user navigates to `/cookbooks/:id/toc` or `/cookbooks/:id/print`
- **When** the page renders on screen
- **Then** the root wrapper has class `bg-white` and `text-gray-900`, producing a white background with dark-gray text

#### Scenario: PrintLayout does not affect components outside its subtree

- **Given** the user navigates to a normal recipe page (`/recipes/:id`)
- **When** the page renders
- **Then** `RecipeDetail` and all site components render with the existing dark-mode styling unchanged

### Requirement: ADDED Cookbook print routes wrapped in PrintLayout

The system SHALL wrap the content of `cookbooks.$cookbookId_.toc.tsx` and `cookbooks.$cookbookId_.print.tsx` in `<PrintLayout>`.

#### Scenario: TOC route uses PrintLayout

- **Given** the TOC route component renders
- **When** the component tree is inspected
- **Then** `CookbookStandalonePage` and all its descendants are children of `PrintLayout`

#### Scenario: Print route uses PrintLayout

- **Given** the print route component renders
- **When** the component tree is inspected
- **Then** `CookbookStandalonePage`, `CookbookTocList`, `RecipeDetail` sections, and `CookbookAlphaIndex` are all descendants of `PrintLayout`

## MODIFIED Requirements

### Requirement: MODIFIED Print-surface components use plain light-mode Tailwind classes

The system SHALL render print-surface components (`CookbookStandalonePage`, `CookbookPageHeader`, `CookbookTocList`, `TocRecipeItem`, `RecipePageRow`, `CookbookAlphaIndex`, `RecipeTimeSpan`) without `print:text-*`, `print:bg-*`, or `print:border-*` color overrides.

#### Scenario: No print color variants in affected component files

- **Given** the implementation is complete
- **When** `src/components/cookbooks/CookbookStandaloneLayout.tsx` is examined
- **Then** no class string contains `print:text-`, `print:bg-`, or `print:border-` color utilities

#### Scenario: Print output retains correct light styling

- **Given** a cookbook with at least two recipes is rendered at `/cookbooks/:id/print`
- **When** the page is printed (or the `print` media query is emulated)
- **Then** text is black or dark-gray, backgrounds are white, borders are light-gray — matching the current baseline print output

### Requirement: MODIFIED CookbookStandalonePage removes print color overrides

The system SHALL render `CookbookStandalonePage` without `print:bg-white` or `print:text-black` — these are superseded by `PrintLayout`.

#### Scenario: CookbookStandalonePage no longer applies the dark gradient

- **Given** `CookbookStandalonePage` renders inside `PrintLayout`
- **When** the component is inspected
- **Then** its `className` contains `min-h-screen` and does NOT contain `bg-gradient-to-b`, `from-slate-900`, `via-slate-800`, `to-slate-900`, `print:bg-white`, or `print:text-black`

## REMOVED Requirements

### Requirement: REMOVED Paired dark/print color variants on print-surface components

The previous requirement that each colored element in the print surface declare both a dark-context class and a matching `print:` override is removed.

**Reason for removal:** `PrintLayout` establishes a fixed light context, making both the dark-context class and the `print:` override redundant for color properties. Layout-only `print:` utilities (`print:hidden`, `print:break-*`, `print:columns-*`, etc.) are not removed.

## Traceability

- Proposal: New `PrintLayout` component → Requirement: ADDED PrintLayout component enforces a fixed light context
- Proposal: Wrap TOC and print routes in `<PrintLayout>` → Requirement: ADDED Cookbook print routes wrapped in PrintLayout
- Proposal: Remove `print:` color overrides → Requirement: MODIFIED Print-surface components use plain light-mode Tailwind classes
- Proposal: `CookbookStandalonePage` simplification → Requirement: MODIFIED CookbookStandalonePage removes print color overrides
- Design Decision 1 → ADDED PrintLayout, ADDED routes wrapped
- Design Decision 3 → MODIFIED components, REMOVED paired variants
- Design Decision 4 → MODIFIED CookbookStandalonePage
- ADDED PrintLayout → Task: Create `src/components/cookbooks/PrintLayout.tsx`
- MODIFIED components → Task: Audit and strip `print:` color variants from `CookbookStandaloneLayout.tsx`
- ADDED routes wrapped → Task: Update TOC and print route files

## Non-Functional Acceptance Criteria

### Requirement: Reliability — no regressions in print output

#### Scenario: Existing E2E print tests pass

- **Given** the implementation is complete
- **When** `npm run test:e2e` is executed
- **Then** all tests pass with no failures related to the print surface

#### Scenario: Existing unit tests pass

- **Given** the implementation is complete
- **When** `npm run test` is executed
- **Then** all tests in `src/components/cookbooks/__tests__/` pass

### Requirement: Maintainability — CSS variable migration path documented

#### Scenario: PrintLayout contains a migration comment

- **Given** `src/components/cookbooks/PrintLayout.tsx` is read
- **When** the file is inspected
- **Then** a comment is present explaining that hardcoded values should be replaced with CSS variable overrides when theming (#281) lands
