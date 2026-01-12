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

- [ ] Implement `recipes.list` query with all filters
- [ ] Implement `recipes.getById` query
- [ ] Implement `recipes.getBySlug` query
- [ ] Implement `recipes.getUserRecipes` query
- [ ] Implement `recipes.getPublicRecipes` query
- [ ] Implement `recipes.getMarked` query
- [ ] Implement `recipes.create` mutation
- [ ] Implement `recipes.update` mutation
- [ ] Implement `recipes.delete` mutation
- [ ] Implement `recipes.toggleMarked` mutation
- [ ] Implement `recipes.updateImage` mutation
- [ ] Add ownership validation middleware
- [ ] Implement PostgreSQL full-text search
- [ ] Add pagination logic
- [ ] Add sorting logic
- [ ] Create recipe validation schemas with Zod
- [ ] Handle recipe relationships (meals, courses, preparations)
- [ ] Optimize queries with proper JOINs
- [ ] Add query performance monitoring

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

- [ ] Create `/recipes` route
- [ ] Create recipe list query hook using tRPC
- [ ] Build RecipeGrid component
- [ ] Build RecipeCard component
  - Show recipe image or placeholder
  - Show recipe name
  - Show classification badge
  - Show prep/cook time
  - Show difficulty badge
  - Show favorite indicator
- [ ] Create SearchBar component with debouncing
- [ ] Build FilterSidebar component
  - Classification filter
  - Meal filter (multi-select)
  - Course filter (multi-select)
  - Preparation filter (multi-select)
  - Source filter
  - Show marked only (toggle)
  - Show my recipes only (toggle, protected)
- [ ] Create SortDropdown component
- [ ] Build Pagination component
  - Page size selector
  - Page number display ("Page X of Y")
  - Previous/Next buttons
  - Total count display
- [ ] Implement URL state management for filters/sort/pagination
- [ ] Add loading skeletons
- [ ] Add error states
- [ ] Make responsive for mobile
- [ ] Add empty state illustration and message

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

- [ ] Create `/recipes/[slug]` route
- [ ] Create recipe detail query hook
- [ ] Build RecipeHeader component
  - Recipe image
  - Recipe title
  - Author info with avatar
  - Date added
  - Classification badge
- [ ] Build RecipeMetadata component
  - Servings
  - Prep time
  - Cook time
  - Difficulty
  - Source link
- [ ] Build IngredientsList component
  - Parse ingredients by line
  - Format display
  - Print-friendly
- [ ] Build InstructionsList component
  - Parse instructions by line
  - Number steps
  - Format display
  - Print-friendly
- [ ] Build NutritionPanel component
  - Calories
  - Fat
  - Cholesterol
  - Sodium
  - Protein
- [ ] Build RecipeMetadata component
  - Show meals badges
  - Show courses badges
  - Show preparations badges
- [ ] Build RecipeActions component
  - "Mark as Favorite" button
  - "Edit Recipe" button (owner only)
  - "Delete Recipe" button (owner only)
  - "Share" button
  - "Print" button
- [ ] Build ImageGallery component
  - Show primary image large
  - Show additional images as thumbnails
  - Click to expand
  - Swipe on mobile
- [ ] Implement delete confirmation modal
- [ ] Add share functionality
  - Copy link button
  - Social share buttons (optional)
- [ ] Build RelatedRecipes component
  - Show 3-6 related recipes
  - Based on classification
  - Exclude current recipe
- [ ] Build NotesSection component
  - Format multi-line notes
  - Collapsible if long
- [ ] Add print-friendly CSS
  - Hide navigation
  - Optimize for A4/Letter
  - Page break handling
- [ ] Make responsive for all devices

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

- [ ] Install React Hook Form
  ```bash
  npm install react-hook-form @hookform/resolvers zod
  ```
- [ ] Create recipe form schema with Zod validation
- [ ] Create `/recipes/new` route
- [ ] Create `/recipes/[slug]/edit` route (protected)
- [ ] Build RecipeForm component
- [ ] Build BasicInfoSection component
  - Recipe name input
  - Description textarea
  - Classification dropdown
  - Source selector (autocomplete)
  - Is public checkbox
- [ ] Build TimingsServingsSection component
  - Prep time input
  - Cook time input
  - Servings input
  - Difficulty selector
- [ ] Build DynamicIngredientList component
  - List of ingredient inputs
  - Add ingredient button
  - Remove ingredient button
  - Drag to reorder
  - Simple text area option
- [ ] Build DynamicInstructionList component
  - List of instruction inputs
  - Add step button
  - Remove step button
  - Drag to reorder
  - Auto-numbering
- [ ] Build TaxonomySelector components
  - Meals multi-select
  - Courses multi-select
  - Preparations multi-select
- [ ] Build NutritionInputs component
  - Calories input
  - Fat input
  - Cholesterol input
  - Sodium input
  - Protein input
- [ ] Build ImageUploader component (basic placeholder for now)
- [ ] Implement form validation with error display
- [ ] Add autosave to localStorage (draft)
- [ ] Implement submit handler
  - Call tRPC create/update mutation
  - Handle loading state
  - Handle success (redirect)
  - Handle errors (display)
- [ ] Add loading states during save
- [ ] Add success/error notifications
- [ ] Handle edit mode (pre-populate form)
- [ ] Implement cancel with unsaved changes warning
- [ ] Add form progress indicator
- [ ] Add keyboard shortcuts (Ctrl+S to save)

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

- [ ] Create delete mutation in tRPC (already done in 2.1)
- [ ] Build DeleteConfirmationModal component
- [ ] Add delete button to recipe detail page
- [ ] Implement cascade delete
  - Remove from cookbook_recipes
  - Remove from recipe_meals
  - Remove from recipe_courses
  - Remove from recipe_preparations
  - Remove recipe_images
  - Remove recipe_likes
  - Remove recipe itself
- [ ] Add loading state during delete
- [ ] Redirect to recipe list after successful delete
- [ ] Show error message if delete fails
- [ ] Check ownership before allowing delete

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
