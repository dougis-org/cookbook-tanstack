---
name: tests
description: Tests for the restrict-import-to-executive-chef change
---

# Tests

## Overview

This document outlines the tests for the `restrict-import-to-executive-chef` change. All work follows strict TDD: write the failing test first, then implement against it, then refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve code quality and structure while ensuring the test still passes.

## Test Cases

### T3 — Header tier-gated import link (write tests before T1 implementation)

File: `src/components/__tests__/Header.test.tsx`

- [ ] **T3-a** (modify): Update `mockSession` to include `tier: 'executive-chef'`; rename test "shows Import Recipe link when session is non-null" → "shows Import Recipe link when session tier is executive-chef"; assert `getByText('Import Recipe')` is present
  - Spec: AC-2 — import link visible for executive-chef
  - Run: `npx vitest run src/components/__tests__/Header.test.tsx` — expect test to pass (after T1)

- [ ] **T3-b** (add): "does not show Import Recipe link when session tier is sous-chef" — set `mockAuthResult` with `{ session: { user: { id: 'u1', tier: 'sous-chef' } }, isPending: false }`; render Header; assert `queryByText('Import Recipe')` is null
  - Spec: AC-1 — import link hidden for sous-chef
  - Run: `npx vitest run src/components/__tests__/Header.test.tsx` — expect FAIL before T1, pass after

- [ ] **T3-c** (add): "does not show Import Recipe link when session tier is prep-cook" — set tier to `prep-cook`; same assertion as T3-b
  - Spec: AC-1 — import link hidden for all tiers below executive-chef
  - Run: `npx vitest run src/components/__tests__/Header.test.tsx` — expect FAIL before T1, pass after

### T4 — Import page tier-wall on load (write tests before T2 implementation)

File: `src/routes/__tests__/-import.test.tsx`

- [ ] **T4-a** (add mock): Add `vi.mock('@/hooks/useTierEntitlements', () => ({ useTierEntitlements: () => ({ canImport: true }) }))` at the top of the test file; verify all existing tests still pass with `canImport: true` default
  - Spec: AC-4 — full import UI for executive-chef users (regression guard)
  - Run: `npx vitest run src/routes/__tests__/-import.test.tsx` — all existing tests must pass

- [ ] **T4-b** (add): "shows inline TierWall when canImport is false" — override mock in test to return `canImport: false`; render `ImportPage`; assert `screen.getByText('Import requires Executive Chef')` is in the document
  - Spec: AC-3 — inline upsell on page load for non-entitled users
  - Run: `npx vitest run src/routes/__tests__/-import.test.tsx` — expect FAIL before T2, pass after

- [ ] **T4-c** (add): "does not render ImportDropzone when canImport is false" — with `canImport: false` mock; render `ImportPage`; assert `ImportDropzone` mock is not called (or use `queryBy` on a known dropzone element)
  - Spec: AC-3 — dropzone hidden for non-entitled users
  - Run: `npx vitest run src/routes/__tests__/-import.test.tsx` — expect FAIL before T2, pass after

## Traceability

| Test | Task | Spec AC |
|------|------|---------|
| T3-a | T1, T3 | AC-2 |
| T3-b | T1, T3 | AC-1 |
| T3-c | T1, T3 | AC-1 |
| T4-a | T4 | AC-4 (regression) |
| T4-b | T2, T4 | AC-3 |
| T4-c | T2, T4 | AC-3 |
