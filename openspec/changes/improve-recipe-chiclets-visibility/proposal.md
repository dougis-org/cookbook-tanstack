# Proposal: Improve Recipe Chiclet Visibility

## Why

Recipe category and source information is difficult to read in both detail and list views. Users report poor contrast and visual hierarchy, making it hard to quickly understand recipe metadata. This affects the core user experience of browsing and viewing recipes. The root cause is low-opacity colored badges against white backgrounds, which lack sufficient contrast for readability.

## What Changes

- **Detail view**: Restructure recipe metadata header into a 2-column layout with category (left, prominent) and source (right, secondary)
- **List view**: Increase category badge prominence and visibility
- **Taxonomy badges**: Increase background opacity from 20% to 60-70% and flip text color to dark variants for contrast against white backgrounds
- **Category badge**: Use solid, prominent styling with icon indicator
- **Iconography**: Add clear icons to category and taxonomy badges to improve scannability
- **Source display**: Move to top of detail view (alongside category in 2-column layout) with link icon

## Capabilities

### New Capabilities
- `recipe-metadata-display`: Defines standards for displaying recipe category, taxonomy, and source information with proper visual hierarchy, contrast, and iconography in both detail and list views.

### Modified Capabilities
<!-- No existing specs have requirements changing; this is a new visual component capability -->

## Impact

**Code**:
- [TaxonomyBadge.tsx](src/components/ui/TaxonomyBadge.tsx) — Update opacity and text colors
- [ClassificationBadge.tsx](src/components/ui/ClassificationBadge.tsx) — Add icon, increase opacity, solid background
- [RecipeDetail.tsx](src/components/recipes/RecipeDetail.tsx) — Restructure metadata header to 2-column layout, add source to top
- [RecipeCard.tsx](src/components/recipes/RecipeCard.tsx) — Increase category badge prominence

**Dependencies**:
- No new dependencies (using existing lucide-react icons)

**Breaking Changes**:
- None — visual changes only

## Scope

**In Scope**:
- Recipe detail view metadata header (category + source in 2-column layout)
- Recipe list card category badge visibility
- Taxonomy badge opacity and text color
- Icon selection and placement for all badge types
- Responsive behavior (stacking on mobile)

**Out of Scope**:
- Cookbook view metadata (separate feature)
- Filter chip styling (uses different component pattern)
- Source link handling/validation

## Risks

- **Icon clarity**: Icons must be unambiguous (meals vs. courses vs. preparation). Solution: Pair with labels initially, test comprehension.
- **Responsive layout**: 2-column layout on mobile. Solution: Stack vertically with breakpoints.
- **Color accessibility**: New contrast levels must meet WCAG AA standards. Solution: Validate opacity values against white background in early testing.

## Open Questions

- Should source always be clickable/link-styled even without a URL? (Current behavior: styled as text)
- Do we want to add labels (e.g., "Meals:", "Courses:") above taxonomy badges, or just icons?
- Should category badge be linkable to category page (like current behavior) or plain display in detail view?

## Non-Goals

- Animation or transition effects on badges
- Customizable color schemes
- Badge size variants beyond detail/list views
- Changing source storage/retrieval logic

---

**Change Control**: If scope changes after this proposal is approved, all downstream artifacts (design, specs, tasks) must be updated before implementation proceeds.
