# Milestone 04: Cookbook Management

**Duration**: 2 weeks
**Status**: Not Started
**Dependencies**: Milestones 02 (Core Recipe Management), 03 (Classification & Taxonomy)

## Overview

Implement cookbook functionality allowing users to create collections of recipes with custom ordering, table of contents, and print-friendly views.

---

## 4.1 Cookbook Database & API

### Tasks

1. [ ] Create cookbooks table schema in Drizzle
2. [ ] Add id, user_id, name, description fields to cookbooks table
3. [ ] Add is_public, image_url fields to cookbooks table
4. [ ] Add created_at, updated_at timestamps to cookbooks table
5. [ ] Create cookbook_recipes junction table schema
6. [ ] Add cookbook_id, recipe_id to junction table
7. [ ] Add order_index field to junction table for ordering
8. [ ] Set up primary key on junction table (cookbook_id, recipe_id)
9. [ ] Add foreign key constraint for cookbook_id
10. [ ] Add foreign key constraint for recipe_id
11. [ ] Configure cascade delete for cookbooks
12. [ ] Configure cascade delete for cookbook_recipes
13. [ ] Add index on cookbook_id in junction table
14. [ ] Add index on recipe_id in junction table
15. [ ] Add index on order_index in junction table
16. [ ] Generate migration for cookbooks and cookbook_recipes tables
17. [ ] Run migration on local database
18. [ ] Verify tables created correctly
19. [ ] Create cookbooks tRPC router file
20. [ ] Create Zod validation schema for cookbook creation
21. [ ] Create Zod validation schema for cookbook updates
22. [ ] Create Zod validation schema for recipe management
23. [ ] Implement `cookbooks.create` mutation
24. [ ] Add user association to created cookbook
25. [ ] Add slug generation for cookbook name
26. [ ] Implement `cookbooks.update` mutation
27. [ ] Add ownership check for updates
28. [ ] Implement `cookbooks.delete` mutation
29. [ ] Add ownership check for deletion
30. [ ] Verify cascade delete removes cookbook_recipes
31. [ ] Implement `cookbooks.getById` query
32. [ ] Load all recipes with cookbook in order
33. [ ] Add recipe count to cookbook response
34. [ ] Implement `cookbooks.getBySlug` query
35. [ ] Implement `cookbooks.list` query (user's cookbooks)
36. [ ] Implement `cookbooks.listPublic` query (all public cookbooks)
37. [ ] Implement `cookbooks.addRecipe` mutation
38. [ ] Calculate order_index for new recipe (append to end)
39. [ ] Add ownership check for adding recipes
40. [ ] Implement `cookbooks.removeRecipe` mutation
41. [ ] Add ownership check for removing recipes
42. [ ] Implement `cookbooks.reorderRecipes` mutation
43. [ ] Update order_index for all affected recipes
44. [ ] Add ownership check for reordering
45. [ ] Test cookbook creation with valid data
46. [ ] Test cookbook update with ownership
47. [ ] Test cookbook deletion with cascade
48. [ ] Test adding recipes to cookbook
49. [ ] Test removing recipes from cookbook
50. [ ] Test reordering recipes persists correctly

### Acceptance Criteria

**Database:**
- [ ] cookbooks table exists with id, title, description, userId, createdAt, updatedAt
- [ ] cookbook_recipes junction table with cookbookId, recipeId, order
- [ ] Foreign keys properly constrained
- [ ] Indexes on foreign keys
- [ ] Cascade deletes configured

**API:**
- [ ] Can create cookbook with title and description
- [ ] Can update cookbook details
- [ ] Can delete cookbook
- [ ] Can fetch cookbook with all recipes in order
- [ ] Can list all cookbooks for user
- [ ] Can add recipe to cookbook
- [ ] Can remove recipe from cookbook
- [ ] Can reorder recipes in cookbook
- [ ] Order persists correctly

**Authorization:**
- [ ] Users can only create cookbooks for themselves
- [ ] Users can only edit their own cookbooks
- [ ] Users can only delete their own cookbooks
- [ ] Public cookbooks viewable by all (optional)

### Deliverables

- Cookbook database schema
- Cookbook tRPC router
- CRUD mutations
- Recipe management mutations

---

## 4.2 Cookbook List & Creation

### Tasks

51. [ ] Create `/cookbooks` page route
52. [ ] Create tRPC cookbooks list query hook
53. [ ] Build CookbooksGrid component layout
54. [ ] Create CookbookCard component base structure
55. [ ] Add cookbook name to CookbookCard
56. [ ] Add cookbook description to CookbookCard (truncated)
57. [ ] Add recipe count to CookbookCard
58. [ ] Add thumbnail image to CookbookCard (from first recipe)
59. [ ] Add fallback image if no recipes in cookbook
60. [ ] Make CookbookCard clickable to detail page
61. [ ] Add hover effects to CookbookCard
62. [ ] Add "Created on" date to CookbookCard
63. [ ] Create empty state component for no cookbooks
64. [ ] Add "Create Cookbook" button to list page
65. [ ] Position button prominently (authenticated users only)
66. [ ] Create cookbook creation modal component
67. [ ] Add modal open/close functionality
68. [ ] Create cookbook form in modal
69. [ ] Add cookbook name input field (required)
70. [ ] Add name validation (min 3 characters)
71. [ ] Add cookbook description textarea (optional)
72. [ ] Add description validation (max 500 characters)
73. [ ] Add "Is public" checkbox to form
74. [ ] Set default value for "Is public" (false)
75. [ ] Add form validation error display
76. [ ] Wire form submit to `cookbooks.create` mutation
77. [ ] Add loading state during submission
78. [ ] Disable form inputs during submission
79. [ ] Show spinner on submit button
80. [ ] Handle successful creation
81. [ ] Show success toast notification
82. [ ] Close modal after success
83. [ ] Redirect to new cookbook detail page
84. [ ] Handle creation errors
85. [ ] Show error toast notification
86. [ ] Display validation errors inline
87. [ ] Make CookbooksGrid responsive (1 col mobile, 2 col tablet, 3+ col desktop)
88. [ ] Test cookbook list page displays all user cookbooks
89. [ ] Test empty state shown when no cookbooks
90. [ ] Test create cookbook button opens modal
91. [ ] Test form validation works correctly
92. [ ] Test successful cookbook creation

### Acceptance Criteria

**List Page:**
- [ ] Shows all user's cookbooks
- [ ] Grid or card layout
- [ ] Shows cookbook title, description, recipe count
- [ ] Shows thumbnail from first recipe
- [ ] Responsive design
- [ ] Empty state if no cookbooks

**Creation:**
- [ ] "Create Cookbook" button visible
- [ ] Form has title field (required)
- [ ] Form has description field (optional)
- [ ] Title validation (min 3 chars)
- [ ] Description validation (max 500 chars)
- [ ] Form submission creates cookbook
- [ ] Success message displayed
- [ ] Redirects to new cookbook detail page
- [ ] Error handling for failures

### Deliverables

- Cookbooks list page
- Cookbook creation form
- CookbookCard component

---

## 4.3 Cookbook Detail & Recipe Management

### Tasks

93. [ ] Create `/cookbooks/[id]` dynamic route
94. [ ] Create tRPC cookbook detail query hook
95. [ ] Add 404 handling for invalid cookbook IDs
96. [ ] Add ownership/visibility check for private cookbooks
97. [ ] Create CookbookHeader component
98. [ ] Display cookbook name in header
99. [ ] Display cookbook description in header
100. [ ] Add cookbook image/cover to header
101. [ ] Display recipe count in header
102. [ ] Display "Created by" author information
103. [ ] Create CookbookRecipeList component
104. [ ] Display recipes in order_index order
105. [ ] Create CookbookRecipeCard component (smaller than full RecipeCard)
106. [ ] Add recipe thumbnail to card
107. [ ] Add recipe name to card
108. [ ] Add recipe servings to card
109. [ ] Add recipe prep/cook time to card
110. [ ] Make recipe card clickable to recipe detail
111. [ ] Add drag handle icon to recipe card
112. [ ] Add remove button to each recipe card (owner only)
113. [ ] Create empty state for cookbook with no recipes
114. [ ] Add "Add Recipe" button (owner only)
115. [ ] Position "Add Recipe" button prominently
116. [ ] Create recipe selector modal component
117. [ ] Add modal open/close functionality
118. [ ] Create recipe search in modal
119. [ ] Add debounced search input (300ms)
120. [ ] Display user's recipes in modal
121. [ ] Add recipe thumbnails in modal list
122. [ ] Exclude already-added recipes from modal list
123. [ ] Add "Add" button to each recipe in modal
124. [ ] Wire "Add" button to `cookbooks.addRecipe` mutation
125. [ ] Show loading state during add operation
126. [ ] Close modal after successful add
127. [ ] Show success toast notification
128. [ ] Update recipe list immediately (optimistic update)
129. [ ] Handle add recipe errors
130. [ ] Show error toast notification
131. [ ] Create remove recipe confirmation modal
132. [ ] Show recipe name in confirmation
133. [ ] Add "Cancel" and "Remove" buttons to confirmation
134. [ ] Wire "Remove" button to `cookbooks.removeRecipe` mutation
135. [ ] Show loading state during remove operation
136. [ ] Update recipe list immediately (optimistic update)
137. [ ] Show success toast notification
138. [ ] Handle remove recipe errors
139. [ ] Install drag-and-drop library (e.g., @dnd-kit/core)
140. [ ] Set up drag-and-drop context
141. [ ] Make CookbookRecipeList draggable container
142. [ ] Make each CookbookRecipeCard draggable item
143. [ ] Add visual feedback during drag (dragging state)
144. [ ] Add drop zones between recipes
145. [ ] Handle drop event to calculate new order
146. [ ] Wire reorder to `cookbooks.reorderRecipes` mutation
147. [ ] Show loading indicator during reorder
148. [ ] Update recipe list with new order
149. [ ] Handle reorder errors
150. [ ] Add touch support for mobile drag-and-drop
151. [ ] Test drag-and-drop on mobile devices
152. [ ] Add "Edit Cookbook" button to header (owner only)
153. [ ] Create edit cookbook modal component
154. [ ] Pre-populate form with existing cookbook data
155. [ ] Add cookbook name input (required)
156. [ ] Add cookbook description textarea (optional)
157. [ ] Add "Is public" checkbox
158. [ ] Add form validation
159. [ ] Wire form submit to `cookbooks.update` mutation
160. [ ] Show loading state during update
161. [ ] Show success toast notification
162. [ ] Close modal after success
163. [ ] Update header with new data
164. [ ] Handle update errors
165. [ ] Add "Delete Cookbook" button to header (owner only)
166. [ ] Style delete button as danger action
167. [ ] Create delete confirmation modal
168. [ ] Show cookbook name in confirmation
169. [ ] Add warning text about permanent deletion
170. [ ] Add "Cancel" and "Delete" buttons
171. [ ] Wire "Delete" button to `cookbooks.delete` mutation
172. [ ] Show loading state during deletion
173. [ ] Redirect to cookbooks list after deletion
174. [ ] Show success toast notification
175. [ ] Handle deletion errors
176. [ ] Test complete cookbook detail page functionality
177. [ ] Test adding recipes
178. [ ] Test removing recipes
179. [ ] Test reordering recipes
180. [ ] Test editing cookbook
181. [ ] Test deleting cookbook
182. [ ] Make page responsive for all devices

### Acceptance Criteria

**Detail Page:**
- [ ] Shows cookbook title and description
- [ ] Shows all recipes in correct order
- [ ] Recipe cards show thumbnail, title, servings
- [ ] Recipe cards clickable to detail page
- [ ] Empty state if no recipes

**Adding Recipes:**
- [ ] "Add Recipe" button visible
- [ ] Opens modal with recipe search/list
- [ ] Can search recipes
- [ ] Can select recipe to add
- [ ] Recipe added to end of list
- [ ] Success message displayed
- [ ] List updates immediately

**Removing Recipes:**
- [ ] Each recipe has remove button
- [ ] Confirmation dialog shown
- [ ] Recipe removed from cookbook
- [ ] Success message displayed
- [ ] List updates immediately

**Reordering:**
- [ ] Can drag recipes to reorder
- [ ] Visual feedback during drag
- [ ] Drop updates order
- [ ] Order persisted to database
- [ ] Works on mobile (touch events)

**Editing:**
- [ ] Can edit cookbook title
- [ ] Can edit cookbook description
- [ ] Validation applied
- [ ] Changes saved
- [ ] Success message displayed

**Deleting:**
- [ ] Delete button visible
- [ ] Confirmation dialog with warning
- [ ] Cookbook deleted from database
- [ ] Redirects to cookbook list
- [ ] Success message displayed

### Deliverables

- Cookbook detail page
- Recipe management UI
- Drag-and-drop reordering
- Edit cookbook functionality
- Delete cookbook functionality

---

## 4.4 Table of Contents View

### Tasks

183. [ ] Add "View Table of Contents" button to cookbook detail page
184. [ ] Create `/cookbooks/[id]/toc` route (or modal)
185. [ ] Create TableOfContents component
186. [ ] Display cookbook title at top of TOC
187. [ ] Create numbered list of all recipes
188. [ ] Display recipe names as clickable links
189. [ ] Link each recipe to its detail page
190. [ ] Calculate page numbers for print view
191. [ ] Display page numbers next to recipe names
192. [ ] Add TOC styling (clean, professional)
193. [ ] Create print-specific TOC styles
194. [ ] Add chapter/section headers (optional)
195. [ ] Group recipes by classification (optional)
196. [ ] Make TOC responsive for all devices
197. [ ] Test TOC displays all recipes correctly
198. [ ] Test TOC links navigate properly
199. [ ] Test TOC renders correctly in print preview

### Acceptance Criteria

- [ ] TOC view shows numbered list of recipes
- [ ] Recipe names clickable to detail
- [ ] Page numbers calculated for print
- [ ] Clean, professional layout
- [ ] Print styles applied
- [ ] Responsive design

### Deliverables

- Table of contents view
- Print-friendly layout

---

## 4.5 Print Functionality

### Tasks

200. [ ] Add "Print Cookbook" button to cookbook detail page
201. [ ] Create dedicated print stylesheet file
202. [ ] Import print styles with `@media print`
203. [ ] Set page size to A4/Letter format
204. [ ] Set appropriate margins for print
205. [ ] Set readable font sizes for print
206. [ ] Hide navigation bar in print view
207. [ ] Hide sidebar in print view
208. [ ] Hide action buttons in print view
209. [ ] Hide UI controls in print view
210. [ ] Show table of contents on first page(s)
211. [ ] Add page break after TOC
212. [ ] Add page break before each recipe
213. [ ] Prevent page breaks mid-recipe (avoid orphans)
214. [ ] Add cookbook title to page header
215. [ ] Add page numbers to page footer
216. [ ] Format recipe titles as print headings
217. [ ] Format ingredients list for print
218. [ ] Format instructions for print
219. [ ] Optimize recipe images for print
220. [ ] Set max image width for print
221. [ ] Convert images to grayscale (optional)
222. [ ] Ensure print layout is black and white friendly
223. [ ] Test print preview in Chrome
224. [ ] Test print preview in Firefox
225. [ ] Test print preview in Safari
226. [ ] Test print to PDF functionality
227. [ ] Test actual print to printer
228. [ ] Verify multi-page cookbooks render correctly
229. [ ] Verify page breaks occur in correct places
230. [ ] Test print layout with different cookbook sizes (5, 10, 20 recipes)
231. [ ] Make print button trigger browser print dialog
232. [ ] Add loading state while preparing print view (optional)
233. [ ] Consider adding PDF export option (optional)

### Acceptance Criteria

**Layout:**
- [ ] Print button triggers browser print dialog
- [ ] TOC appears on first pages
- [ ] Each recipe starts on new page
- [ ] Cookbook title in header
- [ ] Page numbers in footer
- [ ] Images sized appropriately
- [ ] No UI elements in print

**Formatting:**
- [ ] Readable font size
- [ ] Proper margins
- [ ] Ingredients and instructions clear
- [ ] Black and white friendly
- [ ] No broken page breaks mid-recipe

**Testing:**
- [ ] Print preview looks correct
- [ ] Can print to PDF
- [ ] Can print to printer
- [ ] Multiple pages handled correctly

### Deliverables

- Print stylesheet
- Print-optimized layout
- Print button functionality

---

## Testing Checklist

### Unit Tests

- [ ] Cookbook creation validates input
- [ ] Cookbook update validates input
- [ ] Recipe ordering logic correct
- [ ] Authorization checks work

### Integration Tests

- [ ] Can create cookbook
- [ ] Can list cookbooks
- [ ] Can view cookbook detail
- [ ] Can add recipe to cookbook
- [ ] Can remove recipe from cookbook
- [ ] Can reorder recipes
- [ ] Can edit cookbook
- [ ] Can delete cookbook
- [ ] Print layout renders correctly

### Manual Testing

- [ ] Create new cookbook
- [ ] Add multiple recipes
- [ ] Drag to reorder recipes
- [ ] Remove a recipe
- [ ] Edit cookbook details
- [ ] View table of contents
- [ ] Print cookbook
- [ ] Delete cookbook

---

## Definition of Done

- [ ] All tasks completed
- [ ] All acceptance criteria met
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] No critical bugs
- [ ] Print functionality working
- [ ] Ready for next milestone

---

## Dependencies

- Milestone 02 (Core Recipe Management)
- Milestone 03 (Classification & Taxonomy)

---

## Blockers & Risks

**Potential Blockers:**
- Drag-and-drop complexity on mobile
- Print layout inconsistencies across browsers

**Mitigation:**
- Use proven DnD library (dnd-kit)
- Test print layouts in Chrome, Firefox, Safari
- Provide PDF export as alternative

---

## Notes

- Consider adding cookbook sharing (future)
- Consider cookbook templates (future)
- Keep print layout simple and functional
- Focus on core features before enhancements
