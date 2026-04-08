## GitHub Issues

- #274

## Why

- Problem statement: Printed recipe and cookbook pages reuse generous on-screen heading sizes and margins, which consumes unnecessary vertical space and reduces the amount of useful content that fits on each sheet.
- Why now: GitHub issue #274 identifies wasted space in printed recipe sections, and the current print styles already support dedicated print-only tuning for other elements.
- Business/user impact: Users printing recipes or cookbook pages should get denser, more practical layouts that preserve readability while fitting more content per page.

## Problem Space

- Current behavior: Print-facing pages inherit large heading typography and spacing from screen layouts for recipe sections and cookbook print structures, with only minimal print-specific CSS overrides.
- Desired behavior: Print-facing headings use smaller type and tighter vertical rhythm in print mode so more content fits on the page without appearing cramped.
- Constraints: Changes must remain print-only, preserve screen layouts, maintain readable hierarchy across recipe and cookbook print views, and fit existing Tailwind and print CSS patterns.
- Assumptions: `Notes` remains unlabeled body copy unless a separate approved change introduces it as a titled section; the goal is to optimize existing print-facing headings, not restructure content.
- Edge cases considered: Long recipe names, cookbook chapter headings, alphabetical index headings, recipes without optional sections, and mixed content lengths that can make over-compression feel visually crowded.

## Scope

### In Scope

- Define a shared print-heading density approach for print-facing recipe and cookbook views.
- Reduce print-only font sizes, margins, padding, and related spacing for existing print-facing headings where they currently consume excess space.
- Preserve heading hierarchy so major page titles, section headings, and index/chapter headings remain visually distinct in print.
- Add automated coverage that guards the intended print-specific heading behavior.

### Out of Scope

- Introducing a new `Notes` heading or changing notes content structure.
- Changing non-print screen typography or spacing.
- Reworking page-break logic, TOC ordering, page numbering, or cookbook print data flow.
- Broad global typography changes outside the print-facing recipe and cookbook surfaces.

## What Changes

- Introduce a reusable print-focused heading density pattern for components involved in recipe and cookbook printing.
- Apply that pattern to recipe section headings such as Ingredients, Instructions, and Nutrition.
- Apply the same pattern family, with level-appropriate sizing, to cookbook print headings such as cookbook titles, chapter headings, and alphabetical index headings.
- Add tests that verify print-specific classes or styles are present on the impacted heading elements.

## Risks

- Risk: Print headings become too small or too tight, making printed pages harder to scan.
  - Impact: Reduced usability and legibility for printed recipes and cookbooks.
  - Mitigation: Keep a visible heading hierarchy, tune spacing conservatively, and validate with targeted tests around the intended print classes.
- Risk: The shared pattern unintentionally affects screen layouts or non-print pages.
  - Impact: Visual regressions outside the print experience.
  - Mitigation: Scope all density adjustments to print-only classes or print stylesheet rules and limit usage to print-facing components.
- Risk: “All heading types” is interpreted too broadly and expands implementation beyond print-facing surfaces.
  - Impact: Scope drift and inconsistent rollout.
  - Mitigation: Constrain the change to headings rendered in recipe and cookbook print experiences only.

## Open Questions

- Question: None at proposal time; the approved direction is to optimize heading density across print-facing recipe and cookbook pages while preserving readability.
  - Needed from: N/A
  - Blocker for apply: no

## Non-Goals

- Creating new content sections solely to take advantage of the print heading pattern.
- Redesigning overall print layout density for body text, lists, or metadata blocks outside heading treatment.
- Applying a repo-wide global `h1`-`h6` print reset.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
