# Milestone 05: Search & Navigation

**Duration**: 2 weeks
**Status**: Not Started
**Dependencies**: Milestone 02 (Core Recipe Management)

## Overview

Implement comprehensive search functionality with full-text search, advanced filtering, sorting options, and enhanced navigation throughout the application.

---

## 5.1 Full-Text Search

### Tasks

1. [ ] Add full-text search index on recipes.name column
2. [ ] Add full-text search index on recipes.ingredients column
3. [ ] Add full-text search index on recipes.instructions column
4. [ ] Generate migration for search indexes
5. [ ] Run migration on local database
6. [ ] Test search index performance
7. [ ] Create search Zod validation schema
8. [ ] Create `search.recipes` tRPC query
9. [ ] Implement PostgreSQL full-text search (tsvector)
10. [ ] Add search across recipe names
11. [ ] Add search across ingredients
12. [ ] Add search across instructions
13. [ ] Implement relevance ranking for search results
14. [ ] Add minimum 2-character search requirement
15. [ ] Implement case-insensitive search
16. [ ] Support partial word matches
17. [ ] Create SearchBar base component
18. [ ] Add search input field to SearchBar
19. [ ] Add search icon to input
20. [ ] Add debouncing to search input (300ms)
21. [ ] Add clear button to SearchBar
22. [ ] Add loading indicator during search
23. [ ] Integrate SearchBar into recipes list page
24. [ ] Add global SearchBar to application header
25. [ ] Create search results highlighting utility
26. [ ] Highlight matched terms in recipe names
27. [ ] Highlight matched terms in ingredient text
28. [ ] Highlight matched terms in instruction text
29. [ ] Create search autocomplete dropdown component
30. [ ] Connect autocomplete to `search.recipes` query
31. [ ] Display top 5-10 recipe suggestions
32. [ ] Show recipe thumbnail in suggestions
33. [ ] Show recipe name in suggestions
34. [ ] Add keyboard navigation (arrow keys) to autocomplete
35. [ ] Add Enter key to select suggestion
36. [ ] Close autocomplete on outside click
37. [ ] Close autocomplete on Escape key
38. [ ] Make suggestion items clickable to navigate
39. [ ] Implement search query parsing for special syntax (optional)
40. [ ] Create "No results" empty state component
41. [ ] Display helpful message in empty state
42. [ ] Suggest clearing filters or trying different terms
43. [ ] Test search returns correct results
44. [ ] Test search performance (< 500ms)
45. [ ] Test autocomplete functionality
46. [ ] Make SearchBar responsive for mobile

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

47. [ ] Create FilterSidebar component (if not already in Milestone 02)
48. [ ] Verify classification filter working (from Milestone 02)
49. [ ] Verify source filter working (from Milestone 02)
50. [ ] Verify meal filter working (from Milestone 02/03)
51. [ ] Verify course filter working (from Milestone 02/03)
52. [ ] Verify preparation filter working (from Milestone 02/03)
53. [ ] Add servings range filter to FilterSidebar
54. [ ] Create range slider component for servings
55. [ ] Add minimum servings input
56. [ ] Add maximum servings input
57. [ ] Validate servings range
58. [ ] Wire servings filter to recipes query
59. [ ] Add "Has images" toggle to FilterSidebar
60. [ ] Create toggle/checkbox component for "Has images"
61. [ ] Wire "Has images" filter to recipes query
62. [ ] Verify "Marked" (favorites) toggle working (from Milestone 02)
63. [ ] Create "Clear All Filters" button
64. [ ] Wire button to reset all filter state
65. [ ] Reset URL parameters on clear all
66. [ ] Create active filter badge component
67. [ ] Display active filter badges above results
68. [ ] Make each badge removable individually
69. [ ] Update results when badge removed
70. [ ] Add filter count indicator
71. [ ] Verify filter state syncs with URL
72. [ ] Verify URL can be shared with filters
73. [ ] Verify browser back button restores filters
74. [ ] Verify bookmarked URLs preserve filters
75. [ ] Make FilterSidebar collapsible on mobile (if not already)
76. [ ] Add toggle button for mobile filter sidebar
77. [ ] Add smooth animations for sidebar
78. [ ] Test all filters work individually
79. [ ] Test multiple filters combine correctly (AND logic)
80. [ ] Test filter updates are immediate
81. [ ] Make FilterSidebar responsive for all devices

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

82. [ ] Verify sort options in tRPC recipes query (from Milestone 02)
83. [ ] Verify SortDropdown component exists (from Milestone 02)
84. [ ] Verify name A-Z sort working
85. [ ] Verify name Z-A sort working
86. [ ] Verify date added (newest) sort working
87. [ ] Verify date added (oldest) sort working
88. [ ] Add servings low-to-high sort option
89. [ ] Add servings high-to-low sort option
90. [ ] Add "Recently Updated" sort option
91. [ ] Add updated_at index to database for sort performance
92. [ ] Create sort direction toggle button
93. [ ] Add visual indicator for current sort
94. [ ] Verify sort persists in URL
95. [ ] Test sort works with filters
96. [ ] Test sort works with search
97. [ ] Set default sort to name A-Z
98. [ ] Make SortDropdown responsive

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

99. [ ] Verify pagination in tRPC recipes query (from Milestone 02)
100. [ ] Verify Pagination component exists (from Milestone 02)
101. [ ] Add page size option: 10 items
102. [ ] Add page size option: 25 items (default)
103. [ ] Add page size option: 50 items
104. [ ] Add page size option: 100 items
105. [ ] Create page size selector dropdown
106. [ ] Add first page button to pagination
107. [ ] Add last page button to pagination
108. [ ] Verify previous button working (from Milestone 02)
109. [ ] Verify next button working (from Milestone 02)
110. [ ] Add disabled states for first/last buttons
111. [ ] Display current page number
112. [ ] Display total pages count
113. [ ] Display total items count
114. [ ] Display "Showing X-Y of Z" text
115. [ ] Verify page number persists in URL
116. [ ] Verify page size persists in URL
117. [ ] Implement scroll to top on page change
118. [ ] Add smooth scroll behavior
119. [ ] Add pagination at top of results
120. [ ] Add pagination at bottom of results
121. [ ] Add loading state during page fetch
122. [ ] Add keyboard shortcuts for pagination (Left/Right arrows, optional)
123. [ ] Verify pagination works with filters
124. [ ] Verify pagination works with search
125. [ ] Verify pagination works with sort
126. [ ] Optimize pagination query (only fetch current page)
127. [ ] Add query caching for visited pages
128. [ ] Test pagination with large datasets
129. [ ] Make Pagination responsive for mobile

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

130. [ ] Create Breadcrumb component
131. [ ] Add breadcrumbs to recipe detail pages
132. [ ] Add breadcrumbs to classification pages
133. [ ] Add breadcrumbs to source pages
134. [ ] Add breadcrumbs to cookbook pages
135. [ ] Make breadcrumb items clickable
136. [ ] Highlight current page in breadcrumbs
137. [ ] Add separator between breadcrumb items
138. [ ] Create "Back" button component
139. [ ] Add back button to detail pages
140. [ ] Wire back button to browser history
141. [ ] Add fallback if no history exists
142. [ ] Create recently viewed tracking utility
143. [ ] Store recently viewed recipes in localStorage
144. [ ] Limit recently viewed to last 10 items
145. [ ] Update list on recipe view
146. [ ] Create RecentlyViewed sidebar widget
147. [ ] Display recipe thumbnails in widget
148. [ ] Display recipe names in widget
149. [ ] Make items clickable to navigate
150. [ ] Add widget to recipes list page sidebar
151. [ ] Create Quick Actions menu component
152. [ ] Add "Create Recipe" action
153. [ ] Add "Create Cookbook" action
154. [ ] Add "My Favorites" action
155. [ ] Position quick actions in header or sidebar
156. [ ] Implement keyboard shortcuts handler
157. [ ] Add "/" to focus search
158. [ ] Add "n" to create new recipe
159. [ ] Add "?" to show shortcuts help modal
160. [ ] Add arrow keys for result navigation
161. [ ] Add "Esc" to close modals
162. [ ] Create keyboard shortcuts help modal
163. [ ] List all available shortcuts
164. [ ] Add mobile bottom navigation bar (optional)
165. [ ] Add swipe gestures for navigation (optional)
166. [ ] Improve touch target sizes for mobile
167. [ ] Verify filter sidebar collapsible on mobile
168. [ ] Make breadcrumbs responsive for mobile
169. [ ] Test keyboard shortcuts work correctly
170. [ ] Test recently viewed tracking
171. [ ] Test all navigation enhancements on mobile

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
