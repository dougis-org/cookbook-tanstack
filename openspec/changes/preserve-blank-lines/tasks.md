# Tasks — preserve-blank-lines

## 1. Branch Setup

- [x] 1.1 Checkout `main`
- [x] 1.2 Pull latest `main` from remote to ensure local is up to date
- [x] 1.3 Create and checkout feature branch `feat/preserve-blank-lines` from `main`

## 2. Update `splitLines()`

- [x] 2.1 Change `splitLines()` to preserve internal blank lines as `''`:
  split on `'\n'`, trim leading/trailing blank entries, collapse consecutive internal blanks to a single `''`
- [x] 2.2 Update the JSDoc comment on `splitLines()` to reflect new contract

## 3. Update Ingredients Render

- [x] 3.1 In the ingredients `<ul>`, check `line === ''` and render `<li key={i} className="recipe-ingredient-spacer h-2" />` (no bullet marker, no content) for spacer lines
- [x] 3.2 Confirm `ServingSizeAdjuster` still receives the full `string[]` including `''` entries (no filtering needed)

## 4. Update Instructions Render

- [x] 4.1 Replace `index + 1` step numbering with a dedicated step counter that only increments for non-blank lines
- [x] 4.2 For `line === ''`, render `<li key={i} className="recipe-instruction-spacer h-2" />` with no step number circle

## 5. Tests

- [x] 5.1 Unit tests for updated `splitLines()`:
  - internal blank lines preserved as `''`
  - leading blank lines trimmed
  - trailing blank lines trimmed
  - consecutive internal blanks collapsed to single `''`
  - `null` input returns `[]`
  - empty string input returns `[]`
  - input with no blank lines is unchanged
- [x] 5.2 Component tests for `RecipeDetail` ingredients with blank lines:
  - spacer `<li>` rendered for blank-line entries (`.recipe-ingredient-spacer` present)
  - no bullet marker on spacer items
  - content items still render normally
- [x] 5.3 Component tests for `RecipeDetail` instructions with blank lines:
  - spacer `<li>` rendered for blank-line entries (`.recipe-instruction-spacer` present)
  - step numbers are contiguous (1, 2, 3 — not 1, 2, 4 when index 2 is blank)
  - no step number circle on spacer items
- [x] 5.4 Component test: `ServingSizeAdjuster` scales correctly when ingredient array contains `''` entries

## 6. QA

- [x] 6.1 Run `npm run test` — all unit and integration tests pass
- [x] 6.2 Run `npm run build` — production build succeeds with no TypeScript errors

## 7. Pull Request

- [ ] 7.1 Commit all changes on `feat/preserve-blank-lines`
- [ ] 7.2 Push branch to remote
- [ ] 7.3 Open PR targeting `main`, referencing issue #188 in the description
- [ ] 7.4 Enable auto-merge on the PR
- [ ] 7.5 Run `/code-review:code-review` to review the PR and address all findings
- [ ] 7.6 Confirm all CI quality gates pass (tests, build, type-check, Codacy/Snyk scans)
- [ ] 7.7 Address all PR comments — whether from human reviewers or automated agents — before proceeding; for each round of changes: commit, push, re-run `/code-review:code-review`, and repeat until no unresolved comments remain
- [ ] 7.8 Confirm PR is merged to `main`

## 8. Post-Merge Cleanup

- [ ] 8.1 Delete remote feature branch `feat/preserve-blank-lines`
- [ ] 8.2 Delete local feature branch `feat/preserve-blank-lines`
- [ ] 8.3 Pull latest `main` locally to confirm merge is present

## 9. Archive Change

- [ ] 9.1 On `main`, run `/openspec-archive-change` to move `openspec/changes/preserve-blank-lines/` to `openspec/changes/archive/`
- [ ] 9.2 Commit the archive move on `main`
- [ ] 9.3 Push archive commit to `main`
- [ ] 9.4 Confirm `openspec/changes/preserve-blank-lines/` no longer exists and archived copy is on remote `main`
