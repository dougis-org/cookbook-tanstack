# Tasks: Issue #235 - Auto-sync `.github/openspec-shared` to `main`

## 1) Discovery & Baseline

- [x] Review existing workflows under `.github/workflows/` for current submodule automation.
- [x] Confirm current submodule config for `.github/openspec-shared` (remote + tracked branch).
- [x] Confirm there is no conflicting automation that updates this submodule via PR flow.

## 2) RED (Validation-first)

- [x] Define expected workflow behavior scenarios before implementation:
  - push to `main` with outdated submodule -> commit + push to `main`
  - push to `main` with up-to-date submodule -> no-op
  - automation commit event -> no recursive update loop
- [x] Add/adjust workflow validation checks (lint/syntax and dry-run expectations where available) so missing trigger/guard logic is detectable.

## 3) GREEN (Implementation)

- [x] Create or update workflow to trigger on `push` to `main` (covers direct push + merge-to-main outcomes).
- [x] Add concurrency control to prevent overlapping sync jobs on `main`.
- [x] In workflow steps:
  - [x] checkout with submodules enabled
  - [x] fetch/update `.github/openspec-shared` to upstream `main`
  - [x] detect pointer change
  - [x] commit only `.github/openspec-shared` when changed
  - [x] push commit directly to `main`
- [x] Configure guard(s) to prevent recursion from automation-generated commits.
- [x] Ensure permissions are minimal but sufficient (`contents: write`).

## 4) REFACTOR & Hardening

- [x] Keep commit message deterministic (for traceability and loop guards).
- [x] Ensure script/workflow logs clearly indicate no-op vs updated state.
- [x] Verify workflow does not stage or commit unrelated files.

## 5) Verification

- [x] Validate workflow YAML correctness.
- [ ] Run a controlled test on a temporary branch/repo context to confirm behavior.
- [ ] Verify final behavior on `main`:
  - [ ] immediate run on push/merge
  - [ ] direct-to-main commit when submodule drift exists
  - [ ] no-op when already current

## 6) Completion Criteria

- [x] All acceptance criteria in `proposal.md` are satisfied.
- [x] Scope remains limited to `.github/openspec-shared` updates.
- [x] Change is ready for implementation handoff/review.

