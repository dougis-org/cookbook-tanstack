# Milestone 03: Classification & Taxonomy System

**Duration**: 1 week
**Status**: Not Started
**Dependencies**: Milestone 02 (Core Recipe Management)

## Overview

Implement the taxonomy system for classifying and categorizing recipes including classifications (categories), sources, meals, courses, and preparations with complete CRUD operations and filtering capabilities.

---

## 3.1 Classifications (Categories)

**Routes:**
- `/classifications` - List all classifications
- `/classifications/[slug]` - Recipes in classification

### Tasks

1. [ ] Create classifications tRPC router file
2. [ ] Implement `classifications.list` query
3. [ ] Add recipe count to classification query results
4. [ ] Implement `classifications.getBySlug` query
5. [ ] Implement `classifications.create` mutation (admin only)
6. [ ] Implement `classifications.update` mutation (admin only)
7. [ ] Implement `classifications.delete` mutation (admin only)
8. [ ] Add Zod validation schemas for classification operations
9. [ ] Create `/classifications` page route
10. [ ] Create ClassificationGrid component layout
11. [ ] Create ClassificationCard component
12. [ ] Add classification name to ClassificationCard
13. [ ] Add classification description to ClassificationCard
14. [ ] Add recipe count display to ClassificationCard
15. [ ] Add classification image/icon to ClassificationCard
16. [ ] Make ClassificationCard clickable to detail page
17. [ ] Add hover effects to ClassificationCard
18. [ ] Create `/classifications/[slug]` dynamic route
19. [ ] Reuse RecipeList component with classification filter applied
20. [ ] Add breadcrumb navigation showing classification context
21. [ ] Create ClassificationBadge reusable component
22. [ ] Style ClassificationBadge consistently
23. [ ] Use ClassificationBadge in RecipeCard
24. [ ] Use ClassificationBadge in RecipeHeader
25. [ ] Use ClassificationBadge in recipe form
26. [ ] Create classification admin panel page (optional)
27. [ ] Build classification form for admin create/edit (optional)
28. [ ] Add admin authentication check (optional)
29. [ ] Test classifications list page displays all items
30. [ ] Test classification detail page shows filtered recipes
31. [ ] Test classification badge displays consistently
32. [ ] Make ClassificationGrid responsive for all devices

### Acceptance Criteria

- [ ] Can view all classifications in grid layout
- [ ] Each classification shows recipe count
- [ ] Clicking classification shows all recipes in that classification
- [ ] Classification page uses existing recipe list with filter applied
- [ ] Classifications loaded from database
- [ ] Classification badges display consistently across app
- [ ] Admin can create/edit/delete classifications (optional)

### Deliverables

- Classifications list page
- Classification detail page (filtered recipes)
- Classification badge component
- Admin management interface (optional)

---

## 3.2 Sources Management

### Features

- Source dropdown in recipe form with autocomplete
- Ability to add new source inline
- View all recipes from a source
- Source management page (optional)

### Tasks

33. [ ] Create sources tRPC router file
34. [ ] Implement `sources.list` query
35. [ ] Implement `sources.search` query for autocomplete
36. [ ] Implement `sources.getById` query
37. [ ] Implement `sources.getBySlug` query
38. [ ] Implement `sources.create` mutation
39. [ ] Implement `sources.update` mutation (admin only)
40. [ ] Implement `sources.delete` mutation (admin only)
41. [ ] Add Zod validation schemas for source operations
42. [ ] Create SourceSelector component base structure
43. [ ] Add input field to SourceSelector
44. [ ] Implement autocomplete dropdown in SourceSelector
45. [ ] Connect SourceSelector to `sources.search` query
46. [ ] Add debouncing to SourceSelector search (300ms)
47. [ ] Display autocomplete suggestions in dropdown
48. [ ] Add keyboard navigation to autocomplete dropdown
49. [ ] Add "Create new source" option in dropdown
50. [ ] Create inline source creation modal/form
51. [ ] Add source name input to inline form
52. [ ] Add source URL input to inline form (optional)
53. [ ] Validate inline source form
54. [ ] Call `sources.create` mutation from inline form
55. [ ] Add newly created source to SourceSelector immediately
56. [ ] Close inline form after successful creation
57. [ ] Integrate SourceSelector into recipe form (BasicInfoSection)
58. [ ] Create `/sources` list page (optional)
59. [ ] Create SourceCard component for list page (optional)
60. [ ] Create `/sources/[slug]` detail page route
61. [ ] Display source information on detail page
62. [ ] Show all recipes from source on detail page
63. [ ] Reuse RecipeList component with source filter applied
64. [ ] Create SourceBadge/SourceLink component
65. [ ] Display source as link if external URL exists
66. [ ] Display source as text if no URL
67. [ ] Use SourceBadge in recipe detail page
68. [ ] Test SourceSelector autocomplete functionality
69. [ ] Test inline source creation
70. [ ] Test source detail page displays correct recipes
71. [ ] Make SourceSelector accessible (keyboard navigation, screen readers)

### Acceptance Criteria

- [ ] Source dropdown in recipe form populated from database
- [ ] Autocomplete suggests sources as user types
- [ ] Can add new source without leaving recipe form
- [ ] New source immediately available in dropdown
- [ ] Source selector validates input
- [ ] Can view all recipes from a specific source
- [ ] Source displayed consistently on recipe details

### Deliverables

- Source selector component with autocomplete
- Inline source creation
- Source detail page
- Source management (optional)

---

## 3.3 Meals, Courses, Preparations

### Implementation

Multi-select taxonomies for recipes with seeded default values.

### Default Values

**Meals:**
- Breakfast
- Brunch
- Lunch
- Dinner
- Snack
- Dessert

**Courses:**
- Appetizer
- Soup
- Salad
- Entree
- Side Dish
- Dessert
- Beverage

**Preparations:**
- Bake
- Grill
- Fry
- Slow Cook
- Pressure Cook
- Steam
- Boil
- Roast
- Sauté
- No Cook
- Microwave

### Tasks

72. [ ] Create meals tRPC router file
73. [ ] Implement `meals.list` query
74. [ ] Implement `meals.getById` query
75. [ ] Implement `meals.create` mutation (admin only)
76. [ ] Implement `meals.update` mutation (admin only)
77. [ ] Implement `meals.delete` mutation (admin only)
78. [ ] Create courses tRPC router file
79. [ ] Implement `courses.list` query
80. [ ] Implement `courses.getById` query
81. [ ] Implement `courses.create` mutation (admin only)
82. [ ] Implement `courses.update` mutation (admin only)
83. [ ] Implement `courses.delete` mutation (admin only)
84. [ ] Create preparations tRPC router file
85. [ ] Implement `preparations.list` query
86. [ ] Implement `preparations.getById` query
87. [ ] Implement `preparations.create` mutation (admin only)
88. [ ] Implement `preparations.update` mutation (admin only)
89. [ ] Implement `preparations.delete` mutation (admin only)
90. [ ] Add Zod validation schemas for all taxonomy operations
91. [ ] Create seed script file for taxonomy data
92. [ ] Add default meals to seed script (Breakfast, Brunch, Lunch, Dinner, Snack, Dessert)
93. [ ] Add default courses to seed script (Appetizer, Soup, Salad, Entree, Side Dish, Dessert, Beverage)
94. [ ] Add default preparations to seed script (Bake, Grill, Fry, Slow Cook, Pressure Cook, Steam, Boil, Roast, Sauté, No Cook, Microwave)
95. [ ] Run seed script to populate meals table
96. [ ] Run seed script to populate courses table
97. [ ] Run seed script to populate preparations table
98. [ ] Verify all taxonomy tables populated correctly
99. [ ] Create base MultiSelect component
100. [ ] Add dropdown trigger to MultiSelect
101. [ ] Add dropdown menu with checkboxes to MultiSelect
102. [ ] Add search/filter within MultiSelect dropdown
103. [ ] Display selected items as removable badges in MultiSelect
104. [ ] Add "Select All" option to MultiSelect
105. [ ] Add "Clear All" option to MultiSelect
106. [ ] Make MultiSelect keyboard accessible
107. [ ] Create MealsMultiSelect component using base MultiSelect
108. [ ] Connect MealsMultiSelect to `meals.list` query
109. [ ] Integrate MealsMultiSelect into recipe form (TaxonomySelectors)
110. [ ] Create CoursesMultiSelect component using base MultiSelect
111. [ ] Connect CoursesMultiSelect to `courses.list` query
112. [ ] Integrate CoursesMultiSelect into recipe form (TaxonomySelectors)
113. [ ] Create PreparationsMultiSelect component using base MultiSelect
114. [ ] Connect PreparationsMultiSelect to `preparations.list` query
115. [ ] Integrate PreparationsMultiSelect into recipe form (TaxonomySelectors)
116. [ ] Create TaxonomyBadge component for displaying tags
117. [ ] Style TaxonomyBadge for meals
118. [ ] Style TaxonomyBadge for courses
119. [ ] Style TaxonomyBadge for preparations
120. [ ] Display meal badges on recipe detail page (RecipeTags)
121. [ ] Display course badges on recipe detail page (RecipeTags)
122. [ ] Display preparation badges on recipe detail page (RecipeTags)
123. [ ] Make taxonomy badges clickable to filter recipes (optional)
124. [ ] Add meals filter to recipe list FilterSidebar
125. [ ] Add courses filter to recipe list FilterSidebar
126. [ ] Add preparations filter to recipe list FilterSidebar
127. [ ] Update recipe list query to handle meal filters
128. [ ] Update recipe list query to handle course filters
129. [ ] Update recipe list query to handle preparation filters
130. [ ] Test multi-select components in recipe form
131. [ ] Test taxonomy badges display on recipe detail
132. [ ] Test filtering recipes by meals
133. [ ] Test filtering recipes by courses
134. [ ] Test filtering recipes by preparations
135. [ ] Test multi-select filters with multiple selections
136. [ ] Create admin management page for meals (optional)
137. [ ] Create admin management page for courses (optional)
138. [ ] Create admin management page for preparations (optional)
139. [ ] Add admin forms for CRUD operations (optional)
140. [ ] Test admin can add new taxonomy items (optional)
141. [ ] Test admin can edit taxonomy items (optional)
142. [ ] Test admin can delete unused taxonomy items (optional)

### Acceptance Criteria

**Database:**
- [ ] All taxonomy tables seeded with default values
- [ ] Can query all meals
- [ ] Can query all courses
- [ ] Can query all preparations

**Form Integration:**
- [ ] Meals multi-select in recipe form
- [ ] Courses multi-select in recipe form
- [ ] Preparations multi-select in recipe form
- [ ] Can select multiple items
- [ ] Can deselect items
- [ ] Selected items shown as badges
- [ ] Selections saved with recipe

**Display:**
- [ ] Meals displayed as badges on recipe detail
- [ ] Courses displayed as badges on recipe detail
- [ ] Preparations displayed as badges on recipe detail
- [ ] Badges styled consistently
- [ ] Badges clickable to filter (optional)

**Filtering:**
- [ ] Can filter recipes by meal(s)
- [ ] Can filter recipes by course(s)
- [ ] Can filter recipes by preparation(s)
- [ ] Multi-select filters work correctly
- [ ] Filter results accurate

**Admin (Optional):**
- [ ] Can add new meals
- [ ] Can add new courses
- [ ] Can add new preparations
- [ ] Can edit existing items
- [ ] Can delete unused items

### Deliverables

- Taxonomy tRPC routers
- Multi-select components
- Seeded taxonomy data
- Badge displays
- Filter integration
- Admin management (optional)

---

## Testing Checklist

### Integration Tests

- [ ] Can create classification
- [ ] Can view all classifications
- [ ] Can filter recipes by classification
- [ ] Can create source
- [ ] Source autocomplete works
- [ ] Can filter recipes by source
- [ ] Taxonomy multi-selects work
- [ ] Can filter by meals
- [ ] Can filter by courses
- [ ] Can filter by preparations

### Manual Testing

- [ ] View classifications list
- [ ] Click classification to see recipes
- [ ] Create new source in recipe form
- [ ] Search for existing source
- [ ] Select multiple meals for recipe
- [ ] Select multiple courses for recipe
- [ ] Select multiple preparations for recipe
- [ ] Filter recipes by taxonomy
- [ ] View badges on recipe detail

---

## Definition of Done

- [ ] All tasks completed
- [ ] All acceptance criteria met
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] No critical bugs
- [ ] Taxonomy data seeded
- [ ] Ready for next milestone

---

## Dependencies

- Milestone 02 (Core Recipe Management) must be complete

---

## Blockers & Risks

**Potential Blockers:**
- Multi-select component complexity
- Badge styling consistency

**Mitigation:**
- Use proven multi-select library
- Create shared badge component

---

## Notes

- Keep taxonomy simple initially
- Admin features can be deferred
- Focus on user-facing features
- Ensure consistent badge styling across app
