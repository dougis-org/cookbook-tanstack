---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `unify-print-list-item-styling`
change. All work follows a strict TDD process: write a failing test against
`RecipeDetail.tsx`'s current markup, implement the shared `.print-list-item`
class and markup changes, confirm the test passes, then refactor if needed.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a
   test that captures the requirement. Run it and confirm it fails against
   the current (pre-change) markup.
2. **Write code to pass the test:** Make the smallest change to
   `RecipeDetail.tsx` / `src/styles/print.css` needed to pass.
3. **Refactor:** Clean up while keeping the test green.

## Test Cases

All cases below live in
`src/components/recipes/__tests__/RecipeDetail.test.tsx` unless noted
otherwise, and map to Task: "Write/update tests first (TDD)" in
`tasks.md`.

### Shared class presence (maps to spec: print-list-item-marker → "ADDED Shared print marker class drives both ingredient and instruction list items")

- [ ] Ingredient `<li>` (`.recipe-ingredient-item`) renders with `.print-list-item` in its class list — Scenario: "Ingredient list item carries the shared class"
- [ ] Instruction `<li>` (`.recipe-instruction-step`) renders with `.print-list-item` in its class list — Scenario: "Instruction list item carries the shared class"
- [ ] Ingredient spacer `<li>` (`.recipe-ingredient-spacer`) does NOT render with `.print-list-item` — Scenario: "Spacer items do not carry the shared class"
- [ ] Instruction spacer `<li>` (`.recipe-instruction-spacer`) does NOT render with `.print-list-item` — Scenario: "Spacer items do not carry the shared class"

### Ingredient marker de-duplication (maps to spec: print-list-item-marker → "ADDED Print marker is smaller than the current ingredient dot and left-aligned")

- [ ] Existing ingredient dot `<span>` renders with `print:hidden` in its class list (so only the new `::before` marker shows in print) — Scenario: "Existing literal ingredient dot span is not double-rendered in print"

### Instruction marker addition (maps to spec: print-list-item-marker → "ADDED Instruction steps render a print-only delimiter marker"; print-instruction-numbering → "MODIFIED Print output renders instruction step text left-aligned after a small delimiter marker")

- [ ] Instruction numbered-circle `<span>` still renders with `print:hidden` in its class list (unchanged from prior behavior) — Scenario: "Instruction step shows a marker in print where none existed before"
- [ ] Instruction `<ol>` still renders with `print:space-y-1` in its class list (vertical spacing unchanged) — Scenario: "Instruction marker does not increase vertical spacing between steps"

### Container-level layout unaffected (maps to spec: print-list-item-marker → "ADDED Container-level print layout is unaffected by the shared item class")

- [ ] Ingredient `<ul>` still renders with `print:columns-2 print:gap-x-8` in its class list — Scenario: "Ingredients remain two-column in print"
- [ ] Instruction `<ol>` renders with no `columns` utility class — Scenario: "Instructions remain single-column in print"

### On-screen rendering unaffected (maps to spec: print-list-item-marker → "ADDED No on-screen visual change to either section")

- [ ] Ingredient `<li>` retains its existing non-print classes (`flex items-center text-[var(--theme-fg-muted)]`) unchanged aside from the added `print-list-item` / marker-span `print:hidden` classes — Scenario: "Ingredient dot unchanged on screen"
- [ ] Instruction `<li>` retains its existing non-print classes (`flex gap-4 print:block text-[var(--theme-fg-muted)]`) unchanged aside from the added `print-list-item` class — Scenario: "Instruction numbered badge unchanged on screen"

### CSS rule structure (maps to spec: print-list-item-marker → NFAC "Print marker styling is defined in exactly one place")

- [ ] Static check (code review, not an automated test): `grep -c "print-list-item"` in `src/styles/print.css` shows exactly one rule block (plus its `::before` sub-rule) defining marker/gap/alignment, and both `RecipeDetail.tsx` call sites reference the same class name — Scenario: "Print marker styling is defined in exactly one place"
- [ ] Static check: `src/styles/print.css` still contains exactly one top-level `@media print { ... }` block after the change (new rules were added inside the existing block, not a new one)

### Print pagination regression (maps to spec: print-list-item-marker → NFAC "Print pagination behavior unaffected"; existing E2E coverage)

- [ ] Existing E2E print specs (`src/e2e/cookbooks-print.spec.ts`, `src/e2e/cookbooks-print-behavior.spec.ts`, `src/e2e/cookbooks-print-theme-contrast.spec.ts`) re-run and pass unmodified — Scenario: "Print pagination behavior unaffected"
- [ ] Manual/Playwright print-preview check (`page.emulateMedia({ media: 'print' })`) confirms `.recipe-ingredient-item` and `.recipe-instruction-step` still avoid breaking across page boundaries

## Traceability to Tasks

- All "Shared class presence," "marker de-duplication," "marker addition," and "on-screen rendering unaffected" cases → Task: "Write/update tests first (TDD)" and Task: "Update `src/components/recipes/RecipeDetail.tsx` ingredient/instruction markup"
- "CSS rule structure" cases → Task: "Add `.print-list-item` rule to `src/styles/print.css`"
- "Print pagination regression" cases → Task: "Manual print-preview verification" and existing E2E suite run in [Validation]
