# Milestone 05: Search & Navigation

**Duration**: 2 weeks
**Status**: Not Started
**Dependencies**: Milestone 02 (Core Recipe Management)

## Overview

Implement comprehensive search functionality with full-text search, advanced filtering, sorting options, and enhanced navigation throughout the application.

---

## 5.1 Full-Text Search

### Tasks

- [ ] Add full-text search indexes to database
- [ ] Create search tRPC query
- [ ] Implement search across recipe names, ingredients, instructions
- [ ] Build SearchBar component
- [ ] Add search to recipes list page
- [ ] Add search to header (global)
- [ ] Implement search results highlighting
- [ ] Add search suggestions/autocomplete
- [ ] Implement search query parsing
- [ ] Add "No results" state

### Acceptance Criteria

**Database:**
- [ ] Full-text indexes on recipe.name
- [ ] Full-text indexes on recipe.ingredients
- [ ] Full-text indexes on recipe.instructions
- [ ] Search queries performant (< 500ms)

**Search Functionality:**
- [ ] Can search by recipe name
- [ ] Can search by ingredients
- [ ] Can search by instructions
- [ ] Partial matches work
- [ ] Case-insensitive search
- [ ] Results ranked by relevance
- [ ] Minimum 2 characters to search

**UI Components:**
- [ ] Search bar visible on recipes page
- [ ] Global search in header
- [ ] Clear button to reset search
- [ ] Loading indicator during search
- [ ] Results update as user types (debounced)
- [ ] Search terms highlighted in results
- [ ] Empty state shows helpful message

**Autocomplete:**
- [ ] Suggests recipe names as user types
- [ ] Shows top 5-10 suggestions
- [ ] Can click suggestion to navigate
- [ ] Keyboard navigation (arrow keys, enter)
- [ ] Closes on outside click or escape

### Deliverables

- Full-text search implementation
- SearchBar component
- Search results highlighting
- Autocomplete functionality

---

## 5.2 Advanced Filtering

### Filters to Implement

1. Classifications (categories)
2. Sources
3. Meals
4. Courses
5. Preparations
6. Servings range
7. Has images
8. "Marked" (favorites)

### Tasks

- [ ] Build FilterSidebar component
- [ ] Create multi-select filter controls
- [ ] Implement classification filter
- [ ] Implement source filter
- [ ] Implement meal filter
- [ ] Implement course filter
- [ ] Implement preparation filter
- [ ] Implement servings range filter
- [ ] Implement "has images" toggle
- [ ] Implement "marked" toggle
- [ ] Add "Clear All Filters" button
- [ ] Implement filter persistence in URL
- [ ] Add active filter badges
- [ ] Make sidebar collapsible on mobile

### Acceptance Criteria

**Filter Controls:**
- [ ] All filters render correctly
- [ ] Multi-select filters allow multiple selections
- [ ] Range filters use sliders or inputs
- [ ] Toggle filters use checkboxes/switches
- [ ] Filter state syncs with URL

**Filtering Logic:**
- [ ] Classification filter works
- [ ] Source filter works
- [ ] Meal filter works (multiple selections)
- [ ] Course filter works (multiple selections)
- [ ] Preparation filter works (multiple selections)
- [ ] Servings range filter works
- [ ] "Has images" filter works
- [ ] "Marked" filter works
- [ ] Multiple filters combine correctly (AND logic)
- [ ] Filters update results immediately

**UX:**
- [ ] Active filters shown as badges
- [ ] Can remove individual filters
- [ ] "Clear All" removes all filters
- [ ] Filter counts show number of recipes
- [ ] Sidebar collapsible on mobile
- [ ] Smooth animations
- [ ] Responsive design

**URL Persistence:**
- [ ] Filters encoded in URL query params
- [ ] Can share filtered URL
- [ ] Back button restores previous filters
- [ ] Bookmarked URLs work

### Deliverables

- FilterSidebar component
- Individual filter controls
- URL persistence
- Active filter badges

---

## 5.3 Sorting Options

### Sort Fields

1. Name (A-Z, Z-A)
2. Date Added (Newest, Oldest)
3. Servings (Low to High, High to Low)
4. Recently Updated

### Tasks

- [ ] Add sorting to tRPC query
- [ ] Build SortDropdown component
- [ ] Implement name sorting
- [ ] Implement date sorting
- [ ] Implement servings sorting
- [ ] Implement updated date sorting
- [ ] Add sort direction toggle
- [ ] Persist sort in URL
- [ ] Add sort indicator in UI

### Acceptance Criteria

- [ ] Sort dropdown renders all options
- [ ] Can select sort field
- [ ] Can toggle sort direction
- [ ] Results sort correctly
- [ ] Sort persists in URL
- [ ] Sort state visible in UI
- [ ] Works with filters and search
- [ ] Default sort: name A-Z

### Deliverables

- SortDropdown component
- Sorting implementation
- URL persistence

---

## 5.4 Pagination

### Tasks

- [ ] Implement pagination in tRPC query
- [ ] Build Pagination component
- [ ] Add page size selector (10, 25, 50, 100)
- [ ] Implement page navigation
- [ ] Add first/last page buttons
- [ ] Add page number display
- [ ] Persist page in URL
- [ ] Scroll to top on page change
- [ ] Add keyboard shortcuts (optional)

### Acceptance Criteria

**Functionality:**
- [ ] Can navigate between pages
- [ ] Can change page size
- [ ] Total count displayed
- [ ] Current page displayed
- [ ] First/last buttons work
- [ ] Previous/next buttons work
- [ ] Disabled states when appropriate
- [ ] URL reflects current page

**UX:**
- [ ] Pagination visible at top and bottom
- [ ] Page changes smooth
- [ ] Loading state during fetch
- [ ] Scroll to top on page change
- [ ] Responsive design
- [ ] Accessible (ARIA labels)

**Performance:**
- [ ] Only fetches current page data
- [ ] Pagination query optimized
- [ ] No N+1 queries
- [ ] Caches page data

### Deliverables

- Pagination component
- Page size selector
- URL persistence

---

## 5.5 Enhanced Navigation

### Tasks

- [ ] Add breadcrumb navigation
- [ ] Implement "Back" button functionality
- [ ] Add "Recently Viewed" tracking
- [ ] Build "Recently Viewed" sidebar widget
- [ ] Add "Quick Actions" menu
- [ ] Improve header navigation
- [ ] Add keyboard shortcuts
- [ ] Add mobile navigation improvements

### Acceptance Criteria

**Breadcrumbs:**
- [ ] Breadcrumbs show on detail pages
- [ ] Breadcrumbs show on filter pages
- [ ] Breadcrumbs clickable
- [ ] Current page highlighted
- [ ] Responsive design

**Recently Viewed:**
- [ ] Tracks last 10 viewed recipes
- [ ] Stores in localStorage
- [ ] Shows thumbnails and titles
- [ ] Clickable to navigate
- [ ] Updates on view

**Keyboard Shortcuts:**
- [ ] `/` focuses search
- [ ] `n` creates new recipe
- [ ] `?` shows shortcuts help
- [ ] Arrow keys navigate results
- [ ] `Esc` closes modals

**Mobile:**
- [ ] Bottom navigation bar (optional)
- [ ] Swipe gestures (optional)
- [ ] Improved touch targets
- [ ] Collapsible filters

### Deliverables

- Breadcrumb component
- Recently viewed widget
- Keyboard shortcuts
- Mobile navigation enhancements

---

## Testing Checklist

### Unit Tests

- [ ] Search query parsing works
- [ ] Filter logic correct
- [ ] Sort logic correct
- [ ] Pagination calculations correct

### Integration Tests

- [ ] Search returns correct results
- [ ] Filters work individually
- [ ] Filters work in combination
- [ ] Sorting works with filters
- [ ] Pagination works with filters and search
- [ ] URL persistence works
- [ ] Recently viewed tracking works

### Performance Tests

- [ ] Search completes in < 500ms
- [ ] Filter updates in < 200ms
- [ ] Pagination loads in < 300ms
- [ ] No unnecessary re-renders
- [ ] No memory leaks

### Manual Testing

- [ ] Search for various terms
- [ ] Apply multiple filters
- [ ] Try all sort options
- [ ] Navigate through pages
- [ ] Test on mobile
- [ ] Test keyboard shortcuts
- [ ] Share filtered URL

---

## Definition of Done

- [ ] All tasks completed
- [ ] All acceptance criteria met
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] No critical bugs
- [ ] Accessibility verified
- [ ] Ready for next milestone

---

## Dependencies

- Milestone 02 (Core Recipe Management)

---

## Blockers & Risks

**Potential Blockers:**
- Full-text search performance
- Complex filter combinations
- Mobile filter UX

**Mitigation:**
- Database indexes optimized
- Query optimization and caching
- Thorough mobile testing
- Consider search service (Algolia/Typesense) if needed

---

## Notes

- Start with basic search, enhance iteratively
- Monitor search performance metrics
- Consider search analytics (popular searches)
- Keep filter UI simple and intuitive
- Pagination defaults: 25 per page
