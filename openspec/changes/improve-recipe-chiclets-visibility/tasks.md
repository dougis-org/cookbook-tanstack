# Tasks: Improve Recipe Chiclet Visibility

## 0. Setup & Branch Preparation

- [ ] 0.1 Switch to main branch: `git checkout main`

- [ ] 0.2 Pull latest changes from remote: `git pull origin main`

- [ ] 0.3 Create feature branch: `git checkout -b improve-recipe-chiclets-visibility`

## 1. RED Phase: Write Failing Tests

### 1.1 Unit Tests - TaxonomyBadge

- [ ] 1.1.1 Create/update tests for TaxonomyBadge (`src/components/ui/__tests__/TaxonomyBadge.test.ts`)
  - Test opacity is 60-70% and text color is dark variant (amber-900, violet-900, emerald-900)
  - Test icon is rendered before badge text
  - Test all three variants: meal (Utensils icon), course (BookOpen icon), preparation (Timer icon)
  - Test `aria-hidden="true"` on icons

### 1.2 Unit Tests - ClassificationBadge

- [ ] 1.2.1 Create/update tests for ClassificationBadge (`src/components/ui/__tests__/ClassificationBadge.test.ts`)
  - Test solid background styling (`bg-cyan-600 text-white`)
  - Test `plain` variant renders as non-clickable span
  - Test `linkable` variant renders as Link component
  - Test icon is rendered with solid background

### 1.3 Unit Tests - RecipeMetadataHeader

- [ ] 1.3.1 Create tests for RecipeMetadataHeader (`src/components/recipes/__tests__/RecipeMetadataHeader.test.ts`)
  - Test 2-column layout rendering on desktop (md breakpoint+)
  - Test stacked layout on mobile (below md breakpoint)
  - Test category badge displays non-linkable with solid styling
  - Test source displays as link when URL present
  - Test source displays as plain text when URL absent
  - Test source link has correct `target="_blank"` and `rel="noopener noreferrer"`
  - Test missing category/source handled gracefully

### 1.4 Unit Tests - RecipeDetail

- [ ] 1.4.1 Update tests for RecipeDetail (`src/components/recipes/__tests__/RecipeDetail.test.ts`)
  - Test RecipeMetadataHeader is integrated at top of content
  - Test taxonomy badges grouped with labels ("Meals:", "Courses:", "Preparations:")
  - Test category badge is not linkable (no navigation on click)
  - Test each taxonomy icon renders correctly
  - Test responsive layout behavior with mocked breakpoints
  - Test combinations: category+source+taxonomy, category only, taxonomy without category, no metadata

### 1.5 Unit Tests - RecipeCard

- [ ] 1.5.1 Update tests for RecipeCard (`src/components/recipes/__tests__/RecipeCard.test.ts`)
  - Test ClassificationBadge with new solid styling is applied
  - Test category badge is prominent/visible above recipe title

### 1.6 E2E Tests - Recipe List

- [ ] 1.6.1 Update E2E tests (`src/e2e/recipes-list.spec.ts`)
  - Test category badge is visible and readable on recipe cards
  - Test badge shows solid background (not semi-transparent)
  - Test badge text is clearly legible

### 1.7 E2E Tests - Recipe Detail

- [ ] 1.7.1 Update E2E tests (`src/e2e/recipes-crud.spec.ts`)
  - Test 2-column metadata header displays on wide screens
  - Test category badge appears left, source appears right
  - Test category badge is not clickable (clicking doesn't navigate)
  - Test taxonomy badges display with labels and icons
  - Test layout stacks vertically on mobile (< md breakpoint)
  - Test source link is clickable and opens in new tab
  - Test source displays as plain text when no URL provided

### 1.8 Run Tests to Confirm Failures

- [ ] 1.8.1 Run all tests: `npm run test && npm run test:e2e` (all should fail—RED phase)

- [ ] 1.8.2 Verify specific test names match tasks (aids in tracking during GREEN phase)

## 2. GREEN Phase: Implement Code to Pass Tests

### 2.1 Update TaxonomyBadge Component

- [ ] 2.1.1 Update `src/components/ui/TaxonomyBadge.tsx` to pass opacity + text color tests
  - Change opacity from 20% to 60-70%
  - Update text color to dark variants: `text-amber-900`, `text-violet-900`, `text-emerald-900`
  - Update background opacity: `bg-amber-500/60`, `bg-violet-500/60`, `bg-emerald-500/60`

- [ ] 2.1.2 Add icon imports (Utensils, BookOpen, Timer from lucide-react)

- [ ] 2.1.3 Modify TaxonomyBadge props to accept icon variant parameter

- [ ] 2.1.4 Render icon before badge text with `aria-hidden="true"`

- [ ] 2.1.5 Run tests to confirm TaxonomyBadge tests pass: `npm run test -- TaxonomyBadge`

### 2.2 Update ClassificationBadge Component

- [ ] 2.2.1 Update `src/components/ui/ClassificationBadge.tsx` with solid background styling
  - Change to `bg-cyan-600 text-white`
  - Increase text size from `text-xs` to `text-sm`
  - Add padding: `px-3 py-1.5`

- [ ] 2.2.2 Add variant support (`plain` default, `linkable` for links)
  - `plain` variant: renders as non-clickable `<span>`
  - `linkable` variant: renders as `<Link>` component

- [ ] 2.2.3 Add icon import and render with `aria-hidden="true"`

- [ ] 2.2.4 Run tests to confirm ClassificationBadge tests pass: `npm run test -- ClassificationBadge`

### 2.3 Create RecipeMetadataHeader Component

- [ ] 2.3.1 Create `src/components/recipes/RecipeMetadataHeader.tsx`
  - Accept props: categoryId, categoryName, sourceName, sourceUrl
  - Render 2-column layout on `md` and above using Tailwind flex
  - Render stacked layout below `md` using `flex-col`

- [ ] 2.3.2 Left column: Category badge using ClassificationBadge with `plain` variant

- [ ] 2.3.3 Right column: Source info
  - Render Link/ExternalLink icon with `aria-hidden="true"`
  - If sourceUrl provided: render as `<a>` with `target="_blank"` and `rel="noopener noreferrer"`
  - If no sourceUrl: render as plain text

- [ ] 2.3.4 Run tests to confirm RecipeMetadataHeader tests pass: `npm run test -- RecipeMetadataHeader`

### 2.4 Refactor RecipeDetail Component

- [ ] 2.4.1 Update `src/components/recipes/RecipeDetail.tsx` to use RecipeMetadataHeader
  - Place metadata header at top of recipe content (below title)
  - Remove old inline source rendering

- [ ] 2.4.2 Reorganize taxonomy badges into visual groups:
  - Section "Meals:" followed by meal badges
  - Section "Courses:" followed by course badges
  - Section "Preparations:" followed by preparation badges

- [ ] 2.4.3 Ensure all TaxonomyBadge calls pass icon variant parameter

- [ ] 2.4.4 Run tests to confirm RecipeDetail tests pass: `npm run test -- RecipeDetail`

### 2.5 Update RecipeCard Component

- [ ] 2.5.1 Modify `src/components/recipes/RecipeCard.tsx`
  - Use ClassificationBadge with solid styling
  - Ensure category badge is positioned above recipe title
  - Adjust spacing if needed (don't crimp the badge)

- [ ] 2.5.2 Run tests to confirm RecipeCard tests pass: `npm run test -- RecipeCard`

### 2.6 Run Full Test Suite - GREEN

- [ ] 2.6.1 Run unit tests: `npm run test` (all unit tests should pass)

- [ ] 2.6.2 Run E2E tests: `npm run test:e2e` (all E2E tests should pass)

- [ ] 2.6.3 Fix any failing tests before proceeding to REFACTOR phase

## 3. REFACTOR Phase: Improve Code Quality

### 3.1 Type Safety & Build Validation

- [ ] 3.1.1 Run TypeScript compiler: `npx tsc --noEmit` (no errors)

- [ ] 3.1.2 Run linter (if available): `npm run lint --fix` to auto-fix issues

- [ ] 3.1.3 Verify all component exports are correct and consistent

### 3.2 Accessibility Validation

- [ ] 3.2.1 Verify WCAG AA contrast ratios for all badge colors:
  - `bg-cyan-600 text-white` → 4.5:1+ on white background ✓
  - `bg-amber-500/60 text-amber-900` → 4.5:1+ on white background ✓
  - `bg-violet-500/60 text-violet-900` → 4.5:1+ on white background ✓
  - `bg-emerald-500/60 text-emerald-900` → 4.5:1+ on white background ✓

- [ ] 3.2.2 Confirm `aria-hidden="true"` on all decorative icons

- [ ] 3.2.3 Verify source link has proper `rel="noopener noreferrer"`

### 3.3 Code Review & Refactoring

- [ ] 3.3.1 Review component implementations for:
  - Unnecessary re-renders
  - Duplicate logic
  - Clarity and maintainability
  - Consistent naming and structure

- [ ] 3.3.2 Refactor any identified issues without breaking tests

- [ ] 3.3.3 Re-run tests after refactoring: `npm run test && npm run test:e2e`

### 3.4 Manual Testing & Edge Cases

- [ ] 3.4.1 Start dev server: `npm run dev`

- [ ] 3.4.2 Test recipe list on desktop and mobile:
  - Category badge is prominent and readable
  - Badge shows solid styling (not semi-transparent)

- [ ] 3.4.3 Test recipe detail on desktop and mobile:
  - 2-column metadata header on wide screens
  - Stacked metadata on narrow screens
  - Category badge is non-clickable
  - Taxonomy badges grouped with labels
  - Source displays as link (with URL) or plain text (without)

- [ ] 3.4.4 Test edge cases:
  - Recipe with no category (badge hidden)
  - Recipe with no source (source section hidden)
  - Recipe with no taxonomy (taxonomy section hidden)
  - Very long category/source names (overflow behavior)
  - Mobile screen sizes (responsive behavior)

### 3.5 Final Validation

- [ ] 3.5.1 Run full test suite: `npm run test && npm run test:e2e`

- [ ] 3.5.2 Build project: `npm run build` (no errors)

- [ ] 3.5.3 Verify TypeScript: `npx tsc --noEmit` (no errors)

## 4. Execution Summary

- [ ] 4.1 Verify you're on the feature branch: `git branch` (should show `improve-recipe-chiclets-visibility` with `*`)

- [ ] 4.2 Run final test suite before moving to PR: `npm run test && npm run test:e2e`

## 5. PR and Merge

- [ ] 5.1 Create pull request with clear title and description linking to issue #166
  - Title: "Improve recipe chiclet visibility (2-column layout, enhanced opacity)"
  - Description: Link to #166, summary of design decisions

- [ ] 5.2 Ensure all CI checks pass before requesting review:
  - TypeScript compilation ✓
  - Linter ✓
  - Unit tests ✓
  - E2E tests ✓
  - Build verification ✓

- [ ] 5.3 If any CI check fails:
  - Address the specific failure
  - Re-run checks locally: `npm run test && npm run test:e2e`
  - Push fixes and verify CI passes again

- [ ] 5.4 Request review from team
  - Include before/after screenshots of detail view (desktop + mobile)
  - Include before/after screenshots of recipe card
  - Highlight the design decisions:
    - 2-column metadata header (category left, source right)
    - Increased opacity (20% → 60-70%) with dark text
    - Taxonomy grouping with labels
    - Category badge as non-clickable solid display

- [ ] 5.5 Address review comments and re-test affected areas

- [ ] 5.6 Enable auto-merge once all checks pass and comments are resolved

- [ ] 5.7 Monitor PR for automatic merge completion

## 6. Post-Merge Cleanup & Documentation

- [ ] 6.1 Delete feature branch after merge: `git branch -d improve-recipe-chiclets-visibility`

- [ ] 6.2 Verify merged code on main: `git pull origin main` then manual QA on live branch

- [ ] 6.3 Close issue #166 with reference to the merged PR

- [ ] 6.4 Archive this change in OpenSpec: `openspec archive change improve-recipe-chiclets-visibility`

---

## Verification Commands (Throughout Workflow)

**RED phase** (confirm all tests fail):
```bash
npm run test && npm run test:e2e
```

**GREEN phase** (confirm all tests pass):
```bash
npm run test && npm run test:e2e
```

**REFACTOR phase** (final validation):
```bash
npx tsc --noEmit
npm run test && npm run test:e2e
npm run build
```

**Pre-PR checklist**:
```bash
npm run test && npm run test:e2e
npm run build
npx tsc --noEmit
```

---

## Success Criteria

✅ All unit tests pass (RED → GREEN → REFACTOR workflow)
✅ All E2E tests pass
✅ TypeScript compilation succeeds with no errors
✅ Build completes successfully
✅ Recipe detail view displays 2-column metadata header (desktop) and stacked (mobile)
✅ Category badge uses solid background, is prominent, includes icon, non-clickable
✅ Source info visible alongside or below category (responsive)
✅ Taxonomy badges grouped with labels, all have 60-70% opacity with dark text
✅ Icons render correctly on all badges
✅ WCAG AA contrast ratios validated (4.5:1 minimum)
✅ No console errors or warnings during manual testing
✅ Responsive design tested on multiple breakpoints
✅ PR approved, all checks pass, auto-merged
✅ Feature branch cleaned up, change archived
