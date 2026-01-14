# Milestone 02: Core Recipe Management

**Duration**: 2 weeks
**Status**: Not Started
**Dependencies**: Milestone 01 (Foundation & Infrastructure)

## Overview

Implement complete recipe CRUD functionality including list views, detail pages, creation/editing forms, and deletion. This is the core feature of the application.

---

## 2.1 Recipe Data Access Layer

### tRPC Recipe Router

**Queries:**
```typescript
recipes.list({
  filters?: { classificationId, sourceId, mealIds, courseIds, prepIds, isMarked, userId },
  sort?: { field: 'name' | 'date_added', order: 'asc' | 'desc' },
  pagination: { page, pageSize },
  search?: string
})

recipes.getById(id)
recipes.getBySlug(slug)
recipes.getUserRecipes(userId) // User's own recipes
recipes.getPublicRecipes() // All public recipes
recipes.getMarked() // Current user's marked recipes
```

**Mutations:**
```typescript
recipes.create(data) // Protected
recipes.update(id, data) // Protected, ownership check
recipes.delete(id) // Protected, ownership check
recipes.toggleMarked(id) // Protected
recipes.updateImage(id, imageUrl) // Protected
```

### Tasks

1. [ ] Create Zod validation schema for recipe creation
2. [ ] Create Zod validation schema for recipe updates
3. [ ] Create Zod validation schema for recipe filters
4. [ ] Create Zod validation schema for recipe search
5. [ ] Implement `recipes.list` query base structure
6. [ ] Add classification filter to `recipes.list`
7. [ ] Add source filter to `recipes.list`
8. [ ] Add meal IDs filter to `recipes.list`
9. [ ] Add course IDs filter to `recipes.list`
10. [ ] Add preparation IDs filter to `recipes.list`
11. [ ] Add marked filter to `recipes.list`
12. [ ] Add user ID filter to `recipes.list`
13. [ ] Implement full-text search on recipe name
14. [ ] Implement full-text search on ingredients
15. [ ] Add sorting by name (ascending)
16. [ ] Add sorting by name (descending)
17. [ ] Add sorting by date_added (newest first)
18. [ ] Add sorting by date_added (oldest first)
19. [ ] Implement pagination offset calculation
20. [ ] Implement pagination limit
21. [ ] Add total count query for pagination
22. [ ] Optimize `recipes.list` with JOINs for relationships
23. [ ] Test `recipes.list` with various filter combinations
24. [ ] Implement `recipes.getById` query
25. [ ] Add relationship loading to `recipes.getById` (classification, source, etc.)
26. [ ] Implement `recipes.getBySlug` query
27. [ ] Add slug uniqueness check
28. [ ] Implement `recipes.getUserRecipes` query
29. [ ] Implement `recipes.getPublicRecipes` query
30. [ ] Implement `recipes.getMarked` query for authenticated user
31. [ ] Implement `recipes.create` mutation base structure
32. [ ] Add slug auto-generation from recipe name
33. [ ] Add user association to created recipe
34. [ ] Add many-to-many relationship saving for meals
35. [ ] Add many-to-many relationship saving for courses
36. [ ] Add many-to-many relationship saving for preparations
37. [ ] Test recipe creation with all fields
38. [ ] Implement `recipes.update` mutation base structure
39. [ ] Add ownership check middleware for updates
40. [ ] Add slug regeneration on name change (optional)
41. [ ] Add relationship updates for meals
42. [ ] Add relationship updates for courses
43. [ ] Add relationship updates for preparations
44. [ ] Test recipe updates with ownership validation
45. [ ] Implement `recipes.delete` mutation
46. [ ] Add ownership check middleware for deletion
47. [ ] Add cascade delete for recipe_meals
48. [ ] Add cascade delete for recipe_courses
49. [ ] Add cascade delete for recipe_preparations
50. [ ] Add cascade delete for cookbook_recipes
51. [ ] Add cascade delete for recipe_images
52. [ ] Add cascade delete for recipe_likes
53. [ ] Test deletion with cascade
54. [ ] Implement `recipes.toggleMarked` mutation
55. [ ] Add user-specific marking logic
56. [ ] Test toggle functionality
57. [ ] Implement `recipes.updateImage` mutation placeholder
58. [ ] Add database indexes for recipe search performance
59. [ ] Test query performance with large dataset
60. [ ] Add query performance monitoring/logging

### Acceptance Criteria

**Query Implementation:**
- [ ] `recipes.list` returns paginated recipes with correct filters applied
- [ ] Can filter by classification, source, meals, courses, preparations
- [ ] Can filter by marked status (favorites)
- [ ] Can filter by user (creator)
- [ ] Can search by recipe name
- [ ] Can search by ingredients
- [ ] Sorting works correctly (name asc/desc, date asc/desc)
- [ ] Pagination returns correct page with correct page size
- [ ] Total count returned for pagination
- [ ] Related data (classification, source, etc.) loaded efficiently (no N+1)
- [ ] `recipes.getById` returns complete recipe with all relationships
- [ ] `recipes.getBySlug` returns recipe by slug
- [ ] Slug generation is unique
- [ ] Public recipes only shown to unauthenticated users
- [ ] User can see all their own recipes (public and private)

**Mutation Implementation:**
- [ ] `recipes.create` creates new recipe in database
- [ ] Created recipe associated with authenticated user
- [ ] Slug auto-generated from recipe name
- [ ] Many-to-many relationships saved (meals, courses, preparations)
- [ ] Recipe validation enforced (required fields)
- [ ] `recipes.update` updates existing recipe
- [ ] Ownership check prevents editing others' recipes
- [ ] Can update basic fields
- [ ] Can update relationships
- [ ] Slug updated if name changes (optional)
- [ ] `recipes.delete` removes recipe from database
- [ ] Ownership check prevents deleting others' recipes
- [ ] Cascade delete relationships
- [ ] `recipes.toggleMarked` marks/unmarks recipe as favorite
- [ ] User can only mark recipes for themselves
- [ ] Toggle state persists correctly

**Validation:**
- [ ] Recipe name required and validated
- [ ] Classification required
- [ ] Source validated if provided
- [ ] Servings must be positive number
- [ ] Times must be positive numbers
- [ ] Nutritional values validated if provided
- [ ] Ingredients format validated
- [ ] Instructions format validated

**Performance:**
- [ ] Queries execute in < 100ms for typical datasets
- [ ] Proper indexes used
- [ ] No N+1 query problems
- [ ] Pagination efficient for large datasets

### Deliverables

- Complete recipe tRPC router
- Validated input/output types
- Optimized database queries
- Unit tests for all procedures

---

## 2.2 Recipe List Page

**Route: `/recipes`**

### Features

- Display grid of recipe cards
- Search bar with real-time filtering
- Sort dropdown (name A-Z, name Z-A, newest, oldest)
- Filter sidebar (classification, meals, courses, preparations, source, marked, my recipes)
- Pagination controls (20, 30, 40, all)
- "Create Recipe" button (protected)
- Empty state when no recipes found

### Tasks

61. [ ] Create `/recipes` page route
62. [ ] Create tRPC recipe list query hook
63. [ ] Create RecipeGrid component layout (responsive grid)
64. [ ] Create RecipeCard component base structure
65. [ ] Add recipe image display to RecipeCard (with placeholder)
66. [ ] Add recipe name to RecipeCard
67. [ ] Add classification badge to RecipeCard
68. [ ] Add prep time display to RecipeCard
69. [ ] Add cook time display to RecipeCard
70. [ ] Add difficulty badge to RecipeCard (easy/medium/hard)
71. [ ] Add favorite indicator icon to RecipeCard
72. [ ] Add hover effect to RecipeCard
73. [ ] Make RecipeCard clickable to recipe detail
74. [ ] Create SearchBar component
75. [ ] Add debouncing to SearchBar (300ms delay)
76. [ ] Add search input styling
77. [ ] Add clear search button
78. [ ] Add search loading indicator
79. [ ] Create FilterSidebar component base structure
80. [ ] Add classification filter dropdown to FilterSidebar
81. [ ] Create multi-select component for meals
82. [ ] Add meals filter to FilterSidebar
83. [ ] Create multi-select component for courses
84. [ ] Add courses filter to FilterSidebar
85. [ ] Create multi-select component for preparations
86. [ ] Add preparations filter to FilterSidebar
87. [ ] Add source filter dropdown to FilterSidebar
88. [ ] Add "Show marked only" toggle to FilterSidebar (protected)
89. [ ] Add "Show my recipes" toggle to FilterSidebar (protected)
90. [ ] Add active filter count badge to FilterSidebar
91. [ ] Add "Clear all filters" button to FilterSidebar
92. [ ] Make FilterSidebar collapsible on mobile
93. [ ] Create SortDropdown component
94. [ ] Add "Name A-Z" sort option
95. [ ] Add "Name Z-A" sort option
96. [ ] Add "Newest first" sort option
97. [ ] Add "Oldest first" sort option
98. [ ] Create Pagination component
99. [ ] Add page size selector (20, 30, 40, All)
100. [ ] Add "Page X of Y" display
101. [ ] Add "Showing X-Y of Z recipes" display
102. [ ] Add Previous button with disabled state
103. [ ] Add Next button with disabled state
104. [ ] Implement scroll to top on page change
105. [ ] Implement URL query parameters for filters
106. [ ] Implement URL query parameters for sort
107. [ ] Implement URL query parameters for pagination
108. [ ] Implement URL query parameters for search term
109. [ ] Sync URL state with component state
110. [ ] Create loading skeleton for RecipeCard
111. [ ] Show loading skeletons during data fetch
112. [ ] Create error state component
113. [ ] Show error message on query failure
114. [ ] Create empty state component
115. [ ] Add empty state illustration
116. [ ] Add empty state helpful message
117. [ ] Add "Clear filters" suggestion in empty state
118. [ ] Create "Create Recipe" button (authenticated users only)
119. [ ] Position "Create Recipe" button prominently
120. [ ] Make RecipeGrid responsive (1 col mobile)
121. [ ] Make RecipeGrid responsive (2 col tablet)
122. [ ] Make RecipeGrid responsive (3+ col desktop)
123. [ ] Make FilterSidebar drawer on mobile
124. [ ] Test touch interactions on mobile
125. [ ] Test all filters work correctly
126. [ ] Test pagination navigation
127. [ ] Test search functionality
128. [ ] Test responsive layouts on all screen sizes

### Acceptance Criteria

**Page Rendering:**
- [ ] Page accessible at `/recipes`
- [ ] Recipe cards displayed in grid layout
- [ ] Grid responsive (1 col mobile, 2 col tablet, 3+ col desktop)
- [ ] Loading skeleton shown while fetching
- [ ] Error message shown if query fails

**Recipe Cards:**
- [ ] Each card shows recipe image or placeholder
- [ ] Recipe name displayed
- [ ] Classification badge shown with correct styling
- [ ] Prep time and cook time displayed
- [ ] Difficulty badge shown (easy/medium/hard)
- [ ] Favorite indicator shown for marked recipes
- [ ] Card clickable to recipe detail
- [ ] Hover effect on card

**Search:**
- [ ] Search bar visible at top of page
- [ ] Search input debounced (300ms)
- [ ] Search queries by recipe name
- [ ] Search queries by ingredients
- [ ] Clear search button appears when searching
- [ ] Search term preserved in URL
- [ ] Loading indicator during search

**Filters:**
- [ ] Filter sidebar visible on desktop
- [ ] Filter sidebar collapsible on mobile
- [ ] Can filter by classification
- [ ] Can filter by multiple meals
- [ ] Can filter by multiple courses
- [ ] Can filter by multiple preparations
- [ ] Can filter by source
- [ ] "Show marked only" toggle works (when logged in)
- [ ] "Show my recipes" toggle works (when logged in)
- [ ] Active filter count badge shown
- [ ] "Clear all filters" button works
- [ ] Filters preserved in URL
- [ ] Filters update results immediately

**Sorting:**
- [ ] Sort dropdown visible
- [ ] Can sort by name (A-Z)
- [ ] Can sort by name (Z-A)
- [ ] Can sort by date added (newest first)
- [ ] Can sort by date added (oldest first)
- [ ] Sort selection preserved in URL
- [ ] Results update immediately on sort change

**Pagination:**
- [ ] Page size selector shows options (20, 30, 40, All)
- [ ] Page size selection works
- [ ] "Page X of Y" displayed correctly
- [ ] "Showing X-Y of Z recipes" displayed
- [ ] Previous button works (disabled on page 1)
- [ ] Next button works (disabled on last page)
- [ ] Page number in URL
- [ ] Scroll to top on page change
- [ ] "All" option shows all recipes (no pagination)

**Create Button:**
- [ ] "Create Recipe" button visible to authenticated users
- [ ] Button hidden for unauthenticated users
- [ ] Button navigates to `/recipes/new`
- [ ] Button prominently styled

**Empty State:**
- [ ] Shown when no recipes match filters
- [ ] Shows helpful message
- [ ] Shows illustration or icon
- [ ] Suggests clearing filters or creating recipe

**Responsiveness:**
- [ ] Layout works on mobile (320px+)
- [ ] Layout works on tablet (768px+)
- [ ] Layout works on desktop (1024px+)
- [ ] Filter sidebar drawer on mobile
- [ ] Touch-friendly on mobile

### Deliverables

- Functional recipe list page
- Working search and filters
- Pagination controls
- Responsive design
- Reusable components

---

## 2.3 Recipe Detail Page

**Route: `/recipes/[slug]`**

### Features

- Full recipe display with all information
- Ingredients list (formatted)
- Instructions (step-by-step)
- Nutritional information panel
- Notes section
- Tags/Labels (meals, courses, preparations)
- Image gallery
- "Mark as Favorite" button (protected)
- "Edit" button (owner only)
- "Delete" button (owner only)
- Author information
- Related recipes section

### Tasks

129. [ ] Create `/recipes/[slug]` dynamic route
130. [ ] Create tRPC recipe detail query hook
131. [ ] Add 404 handling for invalid slugs
132. [ ] Create RecipeHeader component
133. [ ] Add large recipe image to RecipeHeader (with placeholder)
134. [ ] Add recipe title to RecipeHeader
135. [ ] Add author name and avatar to RecipeHeader
136. [ ] Add date added to RecipeHeader (formatted)
137. [ ] Add classification badge to RecipeHeader
138. [ ] Create breadcrumb navigation component
139. [ ] Create RecipeMetadata component
140. [ ] Add servings display to RecipeMetadata
141. [ ] Add prep time display with formatting
142. [ ] Add cook time display with formatting
143. [ ] Add total time calculation and display
144. [ ] Add difficulty badge to RecipeMetadata
145. [ ] Add source display (as link if external)
146. [ ] Add source display (as text if internal)
147. [ ] Create IngredientsList component
148. [ ] Parse ingredients by line in IngredientsList
149. [ ] Format ingredients with proper styling
150. [ ] Preserve empty lines for ingredient sections
151. [ ] Add print-friendly styles to IngredientsList
152. [ ] Create InstructionsList component
153. [ ] Parse instructions by line in InstructionsList
154. [ ] Auto-number instruction steps
155. [ ] Format instructions with proper styling
156. [ ] Preserve empty lines for instruction sections
157. [ ] Add print-friendly styles to InstructionsList
158. [ ] Create NutritionPanel component
159. [ ] Display calories in NutritionPanel
160. [ ] Display fat in NutritionPanel
161. [ ] Display cholesterol in NutritionPanel
162. [ ] Display sodium in NutritionPanel
163. [ ] Display protein in NutritionPanel
164. [ ] Show units for all nutritional values
165. [ ] Hide NutritionPanel if no data exists
166. [ ] Create RecipeTags component
167. [ ] Display meal badges in RecipeTags
168. [ ] Display course badges in RecipeTags
169. [ ] Display preparation badges in RecipeTags
170. [ ] Make tag badges clickable to filter
171. [ ] Style badges consistently
172. [ ] Create RecipeActions component
173. [ ] Add "Mark as Favorite" button (authenticated only)
174. [ ] Show current marked state in button
175. [ ] Add toggle functionality to favorite button
176. [ ] Add optimistic update for favorite toggle
177. [ ] Add "Edit Recipe" button (owner only)
178. [ ] Make "Edit" button navigate to edit page
179. [ ] Add "Delete Recipe" button (owner only)
180. [ ] Style "Delete" button as danger action
181. [ ] Add "Share" button with copy link functionality
182. [ ] Show success message after link copied
183. [ ] Add "Print" button to open print dialog
184. [ ] Create ImageGallery component
185. [ ] Display primary image large in ImageGallery
186. [ ] Display additional images as thumbnails
187. [ ] Add click to expand thumbnail functionality
188. [ ] Add swipe gesture support for mobile
189. [ ] Add lightbox view for full-screen (optional)
190. [ ] Create NotesSection component
191. [ ] Format multi-line notes with proper spacing
192. [ ] Make NotesSection collapsible if very long
193. [ ] Hide NotesSection if no notes exist
194. [ ] Create DeleteConfirmationModal component
195. [ ] Show recipe name in confirmation modal
196. [ ] Add "Cancel" button to modal
197. [ ] Add "Delete" button to modal (danger styled)
198. [ ] Add modal close on outside click
199. [ ] Add modal close on Escape key
200. [ ] Implement focus trap in modal
201. [ ] Create RelatedRecipes component
202. [ ] Query 3-6 related recipes by classification
203. [ ] Exclude current recipe from related recipes
204. [ ] Display related recipes as cards
205. [ ] Make related recipe cards clickable
206. [ ] Create print-specific CSS file
207. [ ] Hide navigation in print styles
208. [ ] Optimize layout for A4/Letter in print
209. [ ] Handle page breaks in print
210. [ ] Optimize images for print
211. [ ] Make RecipeHeader responsive for mobile
212. [ ] Make RecipeMetadata responsive for tablet
213. [ ] Make IngredientsList responsive for all devices
214. [ ] Make InstructionsList responsive for all devices
215. [ ] Make ImageGallery responsive with touch support
216. [ ] Test complete recipe detail page on mobile
217. [ ] Test complete recipe detail page on tablet
218. [ ] Test complete recipe detail page on desktop
219. [ ] Test print functionality
220. [ ] Test share functionality

### Acceptance Criteria

**Page Rendering:**
- [ ] Page accessible at `/recipes/[slug]`
- [ ] Recipe loaded and displayed
- [ ] Loading skeleton shown while fetching
- [ ] 404 page shown for invalid slug
- [ ] Error message shown if query fails
- [ ] Breadcrumb navigation shown

**Recipe Header:**
- [ ] Large recipe image displayed (or placeholder)
- [ ] Recipe title prominent
- [ ] Author name and avatar shown
- [ ] Date added formatted nicely
- [ ] Classification badge displayed

**Metadata:**
- [ ] Servings shown
- [ ] Prep time formatted (X mins or X hrs Y mins)
- [ ] Cook time formatted
- [ ] Total time calculated and shown
- [ ] Difficulty badge styled correctly
- [ ] Source displayed as link (if external)
- [ ] Source displayed as text (if internal)

**Ingredients:**
- [ ] Ingredients list formatted nicely
- [ ] Each ingredient on separate line
- [ ] Empty lines preserved for sections
- [ ] List printable

**Instructions:**
- [ ] Instructions formatted as steps
- [ ] Steps auto-numbered
- [ ] Empty lines preserved for sections
- [ ] Instructions readable
- [ ] Instructions printable

**Nutrition Panel:**
- [ ] Panel shown if nutrition data exists
- [ ] Panel hidden if no nutrition data
- [ ] All values displayed with units
- [ ] Panel styled nicely

**Tags:**
- [ ] Meal tags shown as badges
- [ ] Course tags shown as badges
- [ ] Preparation tags shown as badges
- [ ] Badges styled consistently
- [ ] Badges clickable to filter

**Notes:**
- [ ] Notes section shown if notes exist
- [ ] Multi-line formatting preserved
- [ ] Section collapsible if very long

**Image Gallery:**
- [ ] Primary image shown large
- [ ] Additional images shown as thumbnails
- [ ] Click thumbnail to view large
- [ ] Swipe to change image on mobile
- [ ] Lightbox for full-screen view (optional)

**Actions:**
- [ ] "Mark as Favorite" button shown to authenticated users
- [ ] Button shows current marked state
- [ ] Toggle updates state immediately
- [ ] Optimistic update for better UX
- [ ] "Edit" button shown to recipe owner only
- [ ] "Edit" navigates to edit page
- [ ] "Delete" button shown to recipe owner only
- [ ] "Delete" shows confirmation modal
- [ ] Delete redirects to recipe list after success
- [ ] "Share" button copies link to clipboard
- [ ] "Share" shows success message
- [ ] "Print" button opens print dialog

**Related Recipes:**
- [ ] Section shown at bottom
- [ ] 3-6 related recipes displayed
- [ ] Related by classification
- [ ] Current recipe excluded
- [ ] Cards link to recipe detail

**Responsive:**
- [ ] Layout works on mobile
- [ ] Layout works on tablet
- [ ] Layout works on desktop
- [ ] Images responsive
- [ ] Gallery works on touch devices

**Print Styles:**
- [ ] Print CSS loaded
- [ ] Navigation hidden in print
- [ ] Layout optimized for print
- [ ] Images sized appropriately
- [ ] Page breaks handled well

### Deliverables

- Complete recipe detail page
- All recipe information displayed
- Owner actions working
- Print-friendly layout
- Responsive design
- Reusable components

---

## 2.4 Recipe Create/Edit Forms

**Routes: `/recipes/new`, `/recipes/[slug]/edit`**

### Form Sections

1. Basic Information
2. Timings & Servings
3. Ingredients (dynamic list)
4. Instructions (dynamic list)
5. Additional Details (taxonomy)
6. Nutritional Information
7. Images

### Tasks

221. [ ] Install React Hook Form packages
     ```bash
     npm install react-hook-form @hookform/resolvers zod
     ```
222. [ ] Create Zod schema for recipe form validation
223. [ ] Add recipe name validation rules (required, min 3, max 100)
224. [ ] Add classification validation rule (required)
225. [ ] Add servings validation rule (positive number)
226. [ ] Add time validation rules (positive numbers)
227. [ ] Add nutrition validation rules (optional, positive numbers)
228. [ ] Add ingredients validation rule (minimum 1 required)
229. [ ] Add instructions validation rule (minimum 1 required)
230. [ ] Create `/recipes/new` route
231. [ ] Create `/recipes/[slug]/edit` route
232. [ ] Add authentication check to `/recipes/new`
233. [ ] Add ownership check to `/recipes/[slug]/edit`
234. [ ] Create RecipeForm component base structure
235. [ ] Initialize React Hook Form with Zod resolver
236. [ ] Create BasicInfoSection component
237. [ ] Add recipe name input field
238. [ ] Add name input validation and error display
239. [ ] Add description textarea
240. [ ] Create classification dropdown
241. [ ] Populate classification dropdown from database
242. [ ] Add classification validation and error display
243. [ ] Create source selector with autocomplete
244. [ ] Load existing sources for autocomplete
245. [ ] Add "Create new source" functionality inline
246. [ ] Add "Is public" checkbox with label
247. [ ] Set "Is public" default to true
248. [ ] Create TimingsServingsSection component
249. [ ] Add prep time input (minutes)
250. [ ] Add cook time input (minutes)
251. [ ] Calculate and display total time
252. [ ] Add servings input with validation
253. [ ] Create difficulty selector (easy/medium/hard)
254. [ ] Create DynamicIngredientList component
255. [ ] Set up field array for ingredients using React Hook Form
256. [ ] Add "Add Ingredient" button
257. [ ] Add "Remove Ingredient" button for each item
258. [ ] Add ingredient text input for each item
259. [ ] Implement drag-to-reorder functionality for ingredients
260. [ ] Add validation for minimum 1 ingredient
261. [ ] Create simple textarea mode toggle for ingredients
262. [ ] Create DynamicInstructionList component
263. [ ] Set up field array for instructions using React Hook Form
264. [ ] Add "Add Step" button
265. [ ] Add "Remove Step" button for each item
266. [ ] Add instruction textarea for each item
267. [ ] Implement auto-numbering for instruction steps
268. [ ] Implement drag-to-reorder functionality for instructions
269. [ ] Add validation for minimum 1 instruction
270. [ ] Create TaxonomySelectors component
271. [ ] Create meals multi-select component
272. [ ] Populate meals from database
273. [ ] Create courses multi-select component
274. [ ] Populate courses from database
275. [ ] Create preparations multi-select component
276. [ ] Populate preparations from database
277. [ ] Display selected items as removable badges
278. [ ] Create NutritionInputs component
279. [ ] Add calories input field (optional)
280. [ ] Add fat input field (optional)
281. [ ] Add cholesterol input field (optional)
282. [ ] Add sodium input field (optional)
283. [ ] Add protein input field (optional)
284. [ ] Add unit labels to all nutrition inputs
285. [ ] Add number-only validation to nutrition inputs
286. [ ] Create ImageUploader component (basic placeholder)
287. [ ] Add file input for image upload
288. [ ] Add image preview functionality
289. [ ] Display inline validation errors for all fields
290. [ ] Implement autosave to localStorage
291. [ ] Set autosave interval to 30 seconds
292. [ ] Restore draft from localStorage on page load
293. [ ] Add "Draft saved" indicator
294. [ ] Clear localStorage draft after successful submit
295. [ ] Implement form submit handler
296. [ ] Call tRPC create mutation for new recipes
297. [ ] Call tRPC update mutation for edit mode
298. [ ] Add loading state during submission
299. [ ] Disable form inputs during submission
300. [ ] Show spinner on submit button
301. [ ] Handle successful creation (redirect to detail page)
302. [ ] Handle successful update (show success message)
303. [ ] Handle submission errors (display to user)
304. [ ] Add success notification toast
305. [ ] Add error notification toast
306. [ ] Implement edit mode data loading
307. [ ] Pre-populate all form fields in edit mode
308. [ ] Load and display existing relationships (meals, courses, preparations)
309. [ ] Create "Cancel" button
310. [ ] Add navigation to previous page on cancel
311. [ ] Implement unsaved changes detection
312. [ ] Show warning modal on cancel if unsaved changes
313. [ ] Show warning on browser back if unsaved changes
314. [ ] Show warning on page unload if unsaved changes
315. [ ] Create form progress indicator (optional)
316. [ ] Add keyboard shortcut for save (Ctrl+S / Cmd+S)
317. [ ] Prevent default browser save dialog
318. [ ] Make form sections responsive for mobile
319. [ ] Make form sections responsive for tablet
320. [ ] Test complete form submission (create)
321. [ ] Test complete form submission (update)
322. [ ] Test form validation errors
323. [ ] Test autosave and draft restoration
324. [ ] Test unsaved changes warnings

### Acceptance Criteria

**Page Setup:**
- [ ] Create page accessible at `/recipes/new`
- [ ] Edit page accessible at `/recipes/[slug]/edit`
- [ ] Edit page requires authentication
- [ ] Edit page requires ownership
- [ ] Non-owners redirected with error message
- [ ] Form sections organized visually

**Form Validation:**
- [ ] Recipe name required
- [ ] Recipe name min 3 characters
- [ ] Recipe name max 100 characters
- [ ] Classification required
- [ ] Servings must be positive number
- [ ] Prep time must be positive number
- [ ] Cook time must be positive number
- [ ] At least one ingredient required
- [ ] At least one instruction required
- [ ] Nutrition values validated if provided
- [ ] Validation errors displayed inline
- [ ] Form submit blocked if validation fails

**Basic Information:**
- [ ] Name input with validation
- [ ] Description textarea (optional)
- [ ] Classification dropdown populated from database
- [ ] Source selector with autocomplete
- [ ] Can select existing source
- [ ] Can add new source inline
- [ ] Is public checkbox
- [ ] Default to public

**Timings & Servings:**
- [ ] Prep time input (minutes)
- [ ] Cook time input (minutes)
- [ ] Total time calculated and displayed
- [ ] Servings input
- [ ] Difficulty selector (easy/medium/hard)

**Ingredients:**
- [ ] Can add ingredient fields dynamically
- [ ] Can remove ingredient fields
- [ ] Can drag to reorder ingredients
- [ ] Each ingredient has name input
- [ ] Optional: quantity and unit inputs
- [ ] Minimum 1 ingredient required
- [ ] Can switch to simple textarea mode

**Instructions:**
- [ ] Can add instruction fields dynamically
- [ ] Can remove instruction fields
- [ ] Can drag to reorder instructions
- [ ] Steps auto-numbered
- [ ] Each instruction is textarea
- [ ] Minimum 1 instruction required

**Taxonomy Selectors:**
- [ ] Meals multi-select populated from database
- [ ] Courses multi-select populated from database
- [ ] Preparations multi-select populated from database
- [ ] Can select multiple items
- [ ] Can deselect items
- [ ] Selected items shown as badges

**Nutrition Inputs:**
- [ ] Calories input (optional)
- [ ] Fat input (optional)
- [ ] Cholesterol input (optional)
- [ ] Sodium input (optional)
- [ ] Protein input (optional)
- [ ] All inputs accept numbers only
- [ ] Units displayed

**Image Upload:**
- [ ] Placeholder for image upload (implement fully in Milestone 6)
- [ ] Basic file input works
- [ ] Image preview shown

**Form Behavior:**
- [ ] Form autosaves to localStorage every 30 seconds
- [ ] Draft restored on page load
- [ ] Clear draft after successful submit
- [ ] Submit button shows loading state
- [ ] Form disabled during submission
- [ ] Success message shown after save
- [ ] Redirect to recipe detail after create
- [ ] Stay on page after update
- [ ] Errors displayed clearly

**Edit Mode:**
- [ ] Form pre-populated with existing recipe data
- [ ] All fields loaded correctly
- [ ] Relationships loaded (meals, courses, preparations)
- [ ] Submit updates instead of creates
- [ ] Ownership verified before allowing edit

**Cancel/Navigation:**
- [ ] Cancel button returns to previous page
- [ ] Warning shown if unsaved changes
- [ ] Browser back button shows warning if unsaved
- [ ] Page unload shows warning if unsaved

**Accessibility:**
- [ ] All inputs have labels
- [ ] Error messages announced to screen readers
- [ ] Keyboard navigation works
- [ ] Focus management correct

**Responsive:**
- [ ] Form works on mobile
- [ ] Form works on tablet
- [ ] Form works on desktop
- [ ] Touch-friendly controls

### Deliverables

- Complete recipe form
- Working validation
- Draft autosave
- Create and edit modes working
- Image upload placeholder
- Responsive design
- Accessible form

---

## 2.5 Recipe Deletion

### Tasks

325. [ ] Verify delete mutation exists in tRPC router (from task 45)
326. [ ] Create DeleteConfirmationModal component (if not done in task 194)
327. [ ] Add delete button to recipe detail page RecipeActions
328. [ ] Wire delete button to open confirmation modal
329. [ ] Add recipe name display in modal
330. [ ] Add "Action is permanent" warning text to modal
331. [ ] Wire modal "Cancel" button to close modal
332. [ ] Wire modal "Delete" button to trigger delete mutation
333. [ ] Verify cascade delete for cookbook_recipes (database level)
334. [ ] Verify cascade delete for recipe_meals (database level)
335. [ ] Verify cascade delete for recipe_courses (database level)
336. [ ] Verify cascade delete for recipe_preparations (database level)
337. [ ] Verify cascade delete for recipe_images (database level)
338. [ ] Verify cascade delete for recipe_likes (database level)
339. [ ] Add loading spinner during delete operation
340. [ ] Disable modal buttons during delete
341. [ ] Add success toast notification after delete
342. [ ] Redirect to `/recipes` after successful delete
343. [ ] Add error toast notification if delete fails
344. [ ] Keep user on page if delete fails
345. [ ] Verify ownership check in tRPC delete mutation
346. [ ] Test delete with owned recipe
347. [ ] Test delete rejection with non-owned recipe
348. [ ] Test cascade delete verifies all relationships removed
349. [ ] Test error handling for network failures

### Acceptance Criteria

**Delete Button:**
- [ ] Delete button shown to recipe owner only
- [ ] Delete button not shown to non-owners
- [ ] Delete button not shown to unauthenticated users
- [ ] Button styled as danger/destructive action

**Confirmation Modal:**
- [ ] Modal opens when delete button clicked
- [ ] Modal shows recipe name
- [ ] Modal explains action is permanent
- [ ] Modal has "Cancel" button
- [ ] Modal has "Delete" button (danger styled)
- [ ] Modal closeable by clicking outside or pressing Esc
- [ ] Focus trapped in modal

**Delete Process:**
- [ ] Ownership verified server-side
- [ ] All related records deleted (cascade)
- [ ] Recipe deleted from database
- [ ] Delete operation atomic (all or nothing)
- [ ] Optimistic UI update (optional)

**Success:**
- [ ] Success message shown
- [ ] Redirect to recipe list page
- [ ] Deleted recipe no longer appears in lists

**Error Handling:**
- [ ] Error message shown if delete fails
- [ ] User not redirected on error
- [ ] Can retry delete
- [ ] Network errors handled
- [ ] Permission errors handled

### Deliverables

- Working delete functionality
- Confirmation modal
- Safe deletion with confirmation
- Cascade delete implemented
- Error handling

---

## Testing Checklist

### Unit Tests

- [ ] Recipe tRPC router tests
- [ ] Recipe validation schema tests
- [ ] Recipe form component tests
- [ ] Utility function tests

### Integration Tests

- [ ] Recipe CRUD operations
- [ ] Search functionality
- [ ] Filter functionality
- [ ] Sorting functionality
- [ ] Pagination functionality
- [ ] Mark as favorite
- [ ] Recipe ownership checks

### Manual Testing

- [ ] Create new recipe
- [ ] Edit existing recipe
- [ ] Delete recipe with confirmation
- [ ] Search recipes
- [ ] Filter by various criteria
- [ ] Sort by different fields
- [ ] Navigate between pages
- [ ] Mark recipe as favorite
- [ ] View recipe detail
- [ ] Print recipe
- [ ] Share recipe
- [ ] Test on mobile device
- [ ] Test on tablet
- [ ] Test on desktop

---

## Definition of Done

- [ ] All tasks completed
- [ ] All acceptance criteria met
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] No critical bugs
- [ ] Ready for next milestone

---

## Dependencies

- Milestone 01 (Foundation & Infrastructure) must be complete

---

## Blockers & Risks

**Potential Blockers:**
- Complex form validation
- Dynamic list management (ingredients, instructions)
- Search implementation complexity

**Mitigation:**
- Use React Hook Form for robust form handling
- Use field array features for dynamic lists
- Leverage PostgreSQL full-text search built-in features

---

## Notes

- Focus on core functionality first
- Image upload is placeholder for now (full implementation in Milestone 6)
- Keep UI simple and functional
- Performance optimization can be deferred
- Consider adding recipe versioning in future (not required for MVP)
