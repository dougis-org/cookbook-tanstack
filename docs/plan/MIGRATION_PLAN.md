# CookBook-TanStack Complete Migration Plan

## Executive Summary

This document outlines the complete migration from the Laravel-based recipe application to a modern TanStack Start application. This plan integrates authentication, ownership, and modern features from the start rather than as afterthoughts.

**Estimated Timeline**: 8-12 weeks (200-250 hours)
**Current Completion**: ~15% (UI/Layout only)

---

## Technology Stack

### Frontend
- **Framework**: TanStack Start with React 19
- **Styling**: Tailwind CSS 4
- **State Management**: TanStack Router + React Query (built-in)
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

### Backend
- **API Layer**: TanStack Start server functions + tRPC for complex operations
- **Database ORM**: Drizzle ORM (TypeScript-native, type-safe)
- **Database**: PostgreSQL (recommended) or MySQL
- **Authentication**: Better-Auth or Lucia
- **File Storage**: Cloudinary or AWS S3 for images
- **Email**: Resend or SendGrid

### DevOps
- **Hosting**: Vercel (frontend) + Neon/Supabase (database)
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry for errors, Vercel Analytics
- **Testing**: Vitest + React Testing Library

---

## Phase 1: Foundation & Infrastructure (Week 1-2)

### 1.1 Project Setup & Configuration

**Tasks:**
- [ ] Install and configure Drizzle ORM
  ```bash
  npm install drizzle-orm postgres
  npm install -D drizzle-kit
  ```
- [ ] Set up database connection
- [ ] Configure environment variables (.env.local, .env.production)
- [ ] Set up Drizzle config file
- [ ] Create database instance (local + staging + production)

**Deliverables:**
- Working database connection
- Environment configuration
- Drizzle config files

---

### 1.2 Database Schema Design

**Schema Tables:**

```typescript
// Core Tables
- users (id, email, username, password_hash, name, avatar_url, created_at, updated_at)
- recipes (id, user_id, name, ingredients, instructions, notes, servings, 
           source_id, classification_id, date_added, calories, fat, cholesterol, 
           sodium, protein, marked, image_url, is_public, created_at, updated_at)
- classifications (id, name, description, slug, created_at, updated_at)
- sources (id, name, url, created_at, updated_at)
- cookbooks (id, user_id, name, description, is_public, image_url, created_at, updated_at)

// Taxonomy Tables
- meals (id, name, description, slug, created_at, updated_at)
- courses (id, name, description, slug, created_at, updated_at)
- preparations (id, name, description, slug, created_at, updated_at)

// Junction Tables
- recipe_meals (recipe_id, meal_id)
- recipe_courses (recipe_id, course_id)
- recipe_preparations (recipe_id, preparation_id)
- cookbook_recipes (cookbook_id, recipe_id, order_index)

// Additional Tables
- recipe_images (id, recipe_id, url, alt_text, order_index, is_primary)
- recipe_likes (user_id, recipe_id, created_at)
- cookbook_followers (user_id, cookbook_id, created_at)
```

**Tasks:**
- [ ] Create Drizzle schema files in `src/db/schema/`
- [ ] Define all table schemas with proper types
- [ ] Set up foreign key relationships
- [ ] Create indexes for performance
- [ ] Write initial migration
- [ ] Run migration to create tables

**Key Features:**
- `user_id` on recipes and cookbooks for ownership
- `is_public` flags for privacy control
- `marked` field for user favorites
- Image support built-in
- Proper indexes on foreign keys and search fields

**Deliverables:**
- Complete Drizzle schema files
- Database migration scripts
- Seeder scripts for taxonomy data

---

### 1.3 Authentication System

**Implementation: Better-Auth**

**Tasks:**
- [ ] Install Better-Auth
  ```bash
  npm install better-auth
  ```
- [ ] Configure auth with email/password + OAuth (Google, GitHub optional)
- [ ] Create auth configuration file
- [ ] Set up auth routes and handlers
- [ ] Create auth middleware for protected routes
- [ ] Implement session management
- [ ] Create auth context/hooks for React

**Auth Routes:**
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/auth/logout` - Logout handler
- `/auth/forgot-password` - Password reset request
- `/auth/reset-password` - Password reset form

**Protected Features:**
- Create/edit/delete own recipes
- Create/edit/delete own cookbooks
- Mark recipes as favorites
- Follow cookbooks

**Public Features:**
- View public recipes
- View public cookbooks
- Search all public content
- Browse categories

**Tasks:**
- [ ] Create user registration flow
- [ ] Create login flow with email/password
- [ ] Implement "Remember me" functionality
- [ ] Create password reset flow
- [ ] Set up session storage and management
- [ ] Create protected route wrapper components
- [ ] Build user profile page
- [ ] Create auth context hooks (`useAuth`, `useUser`)

**Deliverables:**
- Working authentication system
- Protected routes
- User session management
- Auth UI components (login, register forms)

---

### 1.4 API Layer with tRPC

**tRPC Setup:**

**Tasks:**
- [ ] Install tRPC
  ```bash
  npm install @trpc/server @trpc/client @trpc/react-query @tanstack/react-query
  ```
- [ ] Create tRPC router structure
- [ ] Set up tRPC context with user session
- [ ] Configure tRPC with Drizzle
- [ ] Create base queries and mutations
- [ ] Set up React Query integration
- [ ] Create tRPC client hooks

**Router Structure:**
```
src/server/trpc/
  ├── trpc.ts (base setup)
  ├── context.ts (session + db)
  ├── routers/
  │   ├── recipes.ts
  │   ├── cookbooks.ts
  │   ├── classifications.ts
  │   ├── sources.ts
  │   ├── meals.ts
  │   ├── courses.ts
  │   ├── preparations.ts
  │   └── users.ts
  └── root.ts (app router)
```

**Core Procedures:**
- Authentication-aware procedures
- Authorization checks (ownership)
- Input validation with Zod
- Error handling
- Rate limiting for public endpoints

**Deliverables:**
- Complete tRPC setup
- Router structure
- Type-safe API client
- React hooks for queries/mutations

---

## Phase 2: Core Recipe Management (Week 3-4)

### 2.1 Recipe Data Access Layer

**tRPC Recipe Router:**

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

**Tasks:**
- [ ] Implement all recipe queries with Drizzle
- [ ] Implement all recipe mutations
- [ ] Add ownership validation
- [ ] Implement search with PostgreSQL full-text search
- [ ] Add pagination logic
- [ ] Add sorting logic
- [ ] Create recipe validation schemas with Zod
- [ ] Handle recipe relationships (meals, courses, preparations)
- [ ] Optimize queries with proper JOINs

**Deliverables:**
- Complete recipe tRPC router
- Validated input/output types
- Optimized database queries

---

### 2.2 Recipe List Page

**Route: `/recipes`**

**Features:**
- Display grid of recipe cards
- Search bar with real-time filtering
- Sort dropdown (name A-Z, name Z-A, newest, oldest)
- Filter sidebar:
  - By classification
  - By meal type
  - By course
  - By preparation
  - By source
  - Show only marked
  - Show only my recipes (when logged in)
- Pagination controls (20, 30, 40, all)
- "Create Recipe" button (protected)
- Empty state when no recipes found

**Tasks:**
- [ ] Create recipe list query hook
- [ ] Build RecipeGrid component
- [ ] Build RecipeCard component (show classification, image, quick stats)
- [ ] Create SearchBar component with debouncing
- [ ] Build FilterSidebar component
- [ ] Create SortDropdown component
- [ ] Build Pagination component with page info
- [ ] Implement URL state management for filters/sort
- [ ] Add loading skeletons
- [ ] Add error states
- [ ] Make responsive for mobile

**Deliverables:**
- Functional recipe list page
- Working search and filters
- Pagination
- Responsive design

---

### 2.3 Recipe Detail Page

**Route: `/recipes/[slug]`**

**Features:**
- Full recipe display:
  - Recipe image (primary)
  - Title
  - Description
  - Classification badge
  - Source link (if external)
  - Date added
  - Servings
  - Prep time / Cook time
  - Difficulty badge
- Ingredients list (formatted)
- Instructions (step-by-step or paragraphs)
- Nutritional information panel
- Notes section
- Tags/Labels: meals, courses, preparations
- Image gallery (if multiple images)
- "Mark as Favorite" button (protected)
- "Edit" button (owner only)
- "Delete" button (owner only)
- Author information (username, avatar)
- Related recipes section

**Tasks:**
- [ ] Create recipe detail query hook
- [ ] Build RecipeHeader component
- [ ] Build IngredientsList component
- [ ] Build InstructionsList component
- [ ] Build NutritionPanel component
- [ ] Build RecipeMetadata component
- [ ] Build RecipeActions component (edit, delete, mark)
- [ ] Build ImageGallery component
- [ ] Implement delete confirmation modal
- [ ] Add share functionality (copy link, social share)
- [ ] Build RelatedRecipes component
- [ ] Add print-friendly CSS
- [ ] Make responsive

**Deliverables:**
- Complete recipe detail page
- All recipe information displayed
- Owner actions working
- Print-friendly layout

---

### 2.4 Recipe Create/Edit Forms

**Routes: `/recipes/new`, `/recipes/[slug]/edit`**

**Form Sections:**

1. **Basic Information**
   - Recipe name (required)
   - Description (optional)
   - Classification (dropdown, required)
   - Source (dropdown or custom text)
   - Is public (checkbox)

2. **Timings & Servings**
   - Prep time (minutes)
   - Cook time (minutes)
   - Servings (number)
   - Difficulty (easy/medium/hard)

3. **Ingredients**
   - Dynamic list with add/remove
   - Each ingredient: name, quantity, unit
   - Drag-to-reorder
   - Import from text (parse common formats)

4. **Instructions**
   - Dynamic step list with add/remove
   - Each step: text (rich text optional)
   - Drag-to-reorder
   - Auto-numbering

5. **Additional Details**
   - Meals (multi-select checkboxes)
   - Courses (multi-select checkboxes)
   - Preparations (multi-select checkboxes)
   - Notes (textarea)

6. **Nutritional Information** (optional)
   - Calories
   - Fat (g)
   - Cholesterol (mg)
   - Sodium (mg)
   - Protein (g)

7. **Images**
   - Primary image upload
   - Additional images (gallery)
   - Drag-to-reorder
   - Set primary image
   - Alt text for accessibility

**Tasks:**
- [ ] Install React Hook Form + Zod
- [ ] Create recipe form schema with Zod validation
- [ ] Build RecipeForm component
- [ ] Build BasicInfoSection component
- [ ] Build TimingsServingsSection component
- [ ] Build DynamicIngredientList component
- [ ] Build DynamicInstructionList component
- [ ] Build TaxonomySelector components (meals, courses, preps)
- [ ] Build NutritionInputs component
- [ ] Build ImageUploader component (with Cloudinary/S3)
- [ ] Implement form validation with error display
- [ ] Add autosave to localStorage (draft)
- [ ] Implement submit handler
- [ ] Add loading states during save
- [ ] Add success/error notifications
- [ ] Handle edit mode (pre-populate form)
- [ ] Implement cancel with unsaved changes warning

**Deliverables:**
- Complete recipe form
- Working validation
- Image upload
- Draft autosave
- Create and edit modes working

---

### 2.5 Recipe Deletion

**Tasks:**
- [ ] Create delete mutation in tRPC
- [ ] Build confirmation modal
- [ ] Implement cascade delete (images, relationships)
- [ ] Add loading state during delete
- [ ] Redirect after successful delete
- [ ] Show error if delete fails
- [ ] Check ownership before allowing delete

**Deliverables:**
- Working delete functionality
- Safe deletion with confirmation

---

## Phase 3: Classification & Taxonomy System (Week 4-5)

### 3.1 Classifications (Categories)

**Routes:**
- `/classifications` - List all
- `/classifications/[slug]` - Recipes in classification

**Features:**
- Browse all classifications
- See recipe count per classification
- View all recipes in a classification
- Admin: CRUD operations on classifications

**Tasks:**
- [ ] Create classifications tRPC router
- [ ] Build classifications list page
- [ ] Build classification detail page (recipes filter)
- [ ] Create ClassificationCard component
- [ ] Add classification admin panel (if admin role)
- [ ] Build classification form (admin only)

**Deliverables:**
- Classification browsing
- Classification filtering
- Admin management (optional)

---

### 3.2 Sources Management

**Features:**
- Dropdown in recipe form
- Auto-complete for existing sources
- Add new source inline
- View all recipes from a source

**Tasks:**
- [ ] Create sources tRPC router
- [ ] Build SourceSelector component with autocomplete
- [ ] Build sources list page (optional)
- [ ] Create "Add Source" inline form
- [ ] Build source detail page showing all recipes

**Deliverables:**
- Source selection in recipe form
- Source filtering

---

### 3.3 Meals, Courses, Preparations

**Implementation:**
These are multi-select taxonomies for recipes.

**Tasks:**
- [ ] Create tRPC routers for each taxonomy
- [ ] Build MultiSelect components for forms
- [ ] Seed database with common values:
  - **Meals**: Breakfast, Brunch, Lunch, Dinner, Snack, Dessert
  - **Courses**: Appetizer, Soup, Salad, Entree, Side Dish, Dessert, Beverage
  - **Preparations**: Bake, Grill, Fry, Slow Cook, Pressure Cook, No Cook, etc.
- [ ] Create badge displays for recipe details
- [ ] Build filter options in recipe list sidebar
- [ ] Add admin management pages (optional)

**Deliverables:**
- Working multi-select in recipe form
- Filtering by taxonomy
- Badge displays

---

## Phase 4: Cookbook Management (Week 5-6)

### 4.1 Cookbook Data Layer

**tRPC Cookbook Router:**

**Queries:**
```typescript
cookbooks.list({ userId?, isPublic? })
cookbooks.getById(id)
cookbooks.getBySlug(slug)
cookbooks.getUserCookbooks(userId)
cookbooks.getFollowed() // Current user's followed cookbooks
cookbooks.getRecipes(cookbookId) // Recipes in cookbook, ordered
```

**Mutations:**
```typescript
cookbooks.create(data) // Protected
cookbooks.update(id, data) // Protected, ownership check
cookbooks.delete(id) // Protected, ownership check
cookbooks.addRecipe(cookbookId, recipeId, orderIndex) // Protected
cookbooks.removeRecipe(cookbookId, recipeId) // Protected
cookbooks.reorderRecipes(cookbookId, recipeIds[]) // Protected
cookbooks.toggleFollow(cookbookId) // Protected
```

**Tasks:**
- [ ] Implement all cookbook queries
- [ ] Implement all cookbook mutations
- [ ] Add ownership validation
- [ ] Handle recipe ordering in cookbook
- [ ] Add follow/unfollow functionality

**Deliverables:**
- Complete cookbook tRPC router
- Recipe ordering logic

---

### 4.2 Cookbook List Page

**Route: `/cookbooks`**

**Features:**
- Grid of cookbook cards
- Show recipe count
- Show follower count
- Filter: My Cookbooks, Followed, Public
- Sort: Name, Recently Updated, Most Popular
- "Create Cookbook" button (protected)

**Tasks:**
- [ ] Build cookbooks list page
- [ ] Create CookbookCard component
- [ ] Add filtering options
- [ ] Build "Create Cookbook" button
- [ ] Add empty states

**Deliverables:**
- Functional cookbook list page
- Filtering and sorting

---

### 4.3 Cookbook Detail/View Page

**Route: `/cookbooks/[slug]`**

**Features:**

**Table of Contents View:**
- Cookbook title and description
- Author information
- Follow button (if not owner)
- Edit button (if owner)
- Total recipe count
- Table of contents grouped by classification
- Page numbers for each recipe
- Print-friendly layout

**Full Cookbook View:**
- Sequential display of all recipes
- Page break between recipes
- Page numbers on each recipe
- Navigation between recipes
- Export as PDF option

**Tasks:**
- [ ] Build cookbook detail page
- [ ] Create CookbookHeader component
- [ ] Build TableOfContents component (grouped by classification)
- [ ] Build CookbookRecipeDisplay component
- [ ] Implement page numbering
- [ ] Add print styles with page breaks
- [ ] Build recipe navigation (prev/next)
- [ ] Implement follow/unfollow button
- [ ] Add "Export PDF" functionality (optional)
- [ ] Show author info and follow count

**Deliverables:**
- Complete cookbook view
- Table of contents
- Print-friendly layout
- Navigation

---

### 4.4 Cookbook Create/Edit

**Routes: `/cookbooks/new`, `/cookbooks/[slug]/edit`**

**Form Sections:**

1. **Basic Information**
   - Cookbook name (required)
   - Description
   - Cover image upload
   - Is public (checkbox)

2. **Recipe Management**
   - Search and add recipes
   - Recipe list with drag-to-reorder
   - Remove recipes
   - Preview order
   - Group by classification toggle

**Tasks:**
- [ ] Build CookbookForm component
- [ ] Create BasicInfoSection
- [ ] Build RecipeSelector with search
- [ ] Build SortableRecipeList component
- [ ] Implement drag-and-drop reordering
- [ ] Add recipe search/filter in selector
- [ ] Show preview of cookbook
- [ ] Handle form submission
- [ ] Implement edit mode

**Deliverables:**
- Complete cookbook form
- Recipe selection and ordering
- Drag-and-drop reordering

---

## Phase 5: Search & Navigation (Week 6-7)

### 5.1 Advanced Search Implementation

**Full-Text Search:**

**Tasks:**
- [ ] Set up PostgreSQL full-text search indexes
  - Index on `recipes.name`
  - Index on `recipes.ingredients`
  - Combined GIN index for performance
- [ ] Implement search query in Drizzle
- [ ] Add search relevance scoring
- [ ] Implement search highlighting
- [ ] Add search suggestions/autocomplete
- [ ] Track popular searches (optional)

**Search Features:**
- Search by recipe name
- Search by ingredients
- Combined search across fields
- Search suggestions as you type
- Recent searches (local storage)
- Popular searches

**Tasks:**
- [ ] Build SearchBar component with autocomplete
- [ ] Implement debounced search
- [ ] Add search result highlighting
- [ ] Create SearchResults page layout
- [ ] Add "Advanced Search" modal with filters
- [ ] Show search history
- [ ] Add "Clear search" button

**Deliverables:**
- Working full-text search
- Search suggestions
- Search result highlighting

---

### 5.2 Advanced Filtering System

**Filter Options:**
- Classification (single select)
- Meals (multi-select)
- Courses (multi-select)
- Preparations (multi-select)
- Source (multi-select)
- Difficulty (multi-select)
- Max prep time (slider)
- Max cook time (slider)
- Min/max servings (range)
- Has nutritional info (checkbox)
- Is marked/favorite (checkbox, protected)
- Author (user selector)
- Date range (date picker)

**Tasks:**
- [ ] Build FilterSidebar component
- [ ] Create individual filter components
- [ ] Implement multi-select filters
- [ ] Build range sliders for times
- [ ] Add "Clear all filters" button
- [ ] Show active filter count
- [ ] Sync filters with URL parameters
- [ ] Make filters collapsible on mobile
- [ ] Add "Save filter preset" (optional)

**Deliverables:**
- Complete filter system
- URL state management
- Mobile-friendly filters

---

### 5.3 Sorting & Pagination

**Sort Options:**
- Name (A-Z, Z-A)
- Date Added (Newest, Oldest)
- Most Popular (by likes - future)
- Recently Updated
- Prep Time (Shortest, Longest)
- Cook Time (Shortest, Longest)

**Pagination Options:**
- Page size: 20, 30, 40, 60, All
- Page number display: "Page X of Y"
- "Showing X-Y of Z recipes"
- Quick jump to page
- Previous/Next buttons
- First/Last page buttons

**Tasks:**
- [ ] Build SortDropdown component
- [ ] Build Pagination component
- [ ] Implement page size selector
- [ ] Add page info display
- [ ] Create page jump input
- [ ] Sync pagination with URL
- [ ] Handle "All" option (no pagination)
- [ ] Add loading states during navigation

**Deliverables:**
- Complete sorting options
- Full pagination controls
- URL-synced state

---

### 5.4 Navigation Enhancements

**Global Navigation:**
- Persistent header with search
- User menu (when logged in)
- Quick links to: Recipes, Cookbooks, Categories
- "Create" dropdown menu
- Notifications (optional)

**Home Page:**
- Default redirect to recent recipes (like Laravel)
- Or: Featured recipes, popular categories, recent cookbooks

**Breadcrumbs:**
- Show navigation path
- Recipe > Classification > Recipe Name
- Cookbook > Cookbook Name > Recipe

**Tasks:**
- [ ] Update Header component with search
- [ ] Build user menu dropdown
- [ ] Create "Create" menu dropdown
- [ ] Build Breadcrumb component
- [ ] Update home page redirect logic
- [ ] Add keyboard shortcuts (optional)

**Deliverables:**
- Enhanced navigation
- Global search in header
- User menu

---

## Phase 6: Image Management (Week 7)

### 6.1 Image Upload Service

**Implementation: Cloudinary or AWS S3**

**Tasks:**
- [ ] Choose image service (Cloudinary recommended)
- [ ] Set up Cloudinary account and credentials
- [ ] Install Cloudinary SDK
- [ ] Create image upload server action
- [ ] Implement image optimization
  - Resize on upload
  - Generate thumbnails
  - WebP conversion
  - Lazy loading
- [ ] Handle upload progress
- [ ] Add image validation (file type, size)
- [ ] Implement upload error handling

**Deliverables:**
- Working image upload service
- Image optimization
- Error handling

---

### 6.2 Recipe Image Components

**Features:**
- Primary image for recipe
- Image gallery for additional photos
- Drag-to-reorder images
- Set primary image
- Delete images
- Alt text for accessibility
- Image preview during upload

**Tasks:**
- [ ] Build ImageUploader component
- [ ] Build ImageGallery component
- [ ] Create ImagePreview component
- [ ] Implement drag-to-reorder
- [ ] Add progress indicators
- [ ] Build delete confirmation
- [ ] Add alt text input
- [ ] Implement image cropping (optional)

**Deliverables:**
- Complete image management
- Gallery functionality
- Accessibility features

---

### 6.3 Cookbook Cover Images

**Tasks:**
- [ ] Add cover image to cookbook form
- [ ] Build CoverImageUploader component
- [ ] Display cover in cookbook list cards
- [ ] Display cover on cookbook detail page
- [ ] Add default cover images

**Deliverables:**
- Cookbook cover image support

---

## Phase 7: User Features & Social (Week 7-8)

### 7.1 User Profiles

**Route: `/users/[username]`**

**Features:**
- User avatar
- Username and display name
- Bio/description
- Recipe count
- Cookbook count
- Public recipes list
- Public cookbooks list
- Join date
- Social links (optional)

**Tasks:**
- [ ] Create users tRPC router
- [ ] Build user profile page
- [ ] Create UserHeader component
- [ ] Build UserRecipes component
- [ ] Build UserCookbooks component
- [ ] Create profile edit form
- [ ] Add avatar upload
- [ ] Build profile settings page

**Deliverables:**
- User profile pages
- Profile editing
- Avatar management

---

### 7.2 Favorites/Marked Recipes

**Features:**
- Mark/unmark recipes as favorite
- "My Favorites" page
- Filter recipes by marked status
- Quick access in navigation

**Tasks:**
- [ ] Implement mark toggle in tRPC
- [ ] Build "Mark" button component
- [ ] Create "Favorites" page at `/recipes/favorites`
- [ ] Add favorites count to user profile
- [ ] Show marked status in recipe cards
- [ ] Add favorites to user menu

**Deliverables:**
- Working favorites system
- Favorites page

---

### 7.3 Cookbook Following

**Features:**
- Follow/unfollow cookbooks
- "Following" page showing followed cookbooks
- Follower count on cookbooks
- Notifications for updates (optional)

**Tasks:**
- [ ] Implement follow toggle in tRPC
- [ ] Build "Follow" button component
- [ ] Create "Following" page at `/cookbooks/following`
- [ ] Show follower count
- [ ] Add following to user menu
- [ ] Show followed cookbooks in profile

**Deliverables:**
- Cookbook following system
- Following page

---

### 7.4 Recipe Likes/Ratings (Optional)

**Features:**
- Like recipes
- Rating system (1-5 stars)
- Sort by popularity
- Show like/rating count

**Tasks:**
- [ ] Create likes table
- [ ] Create ratings table
- [ ] Implement like toggle
- [ ] Build rating component
- [ ] Add to recipe detail page
- [ ] Update sort options

**Deliverables:**
- Like system
- Rating system (optional)

---

## Phase 8: Additional Features (Week 8)

### 8.1 Contact Form

**Route: `/contact`**

**Features:**
- Name, email, message fields
- Form validation
- Email notification to admin
- Success confirmation
- Rate limiting

**Tasks:**
- [ ] Create contact route
- [ ] Build contact form with validation
- [ ] Set up Resend or SendGrid
- [ ] Implement email sending
- [ ] Create email template
- [ ] Add rate limiting
- [ ] Build success page
- [ ] Add CAPTCHA (optional)

**Deliverables:**
- Working contact form
- Email delivery

---

### 8.2 Print Styles

**Features:**
- Print-friendly recipe detail
- Print-friendly cookbook view
- Page breaks between recipes
- Remove navigation in print
- Optimize for A4/Letter size

**Tasks:**
- [ ] Create print.css with media queries
- [ ] Hide navigation in print
- [ ] Optimize recipe layout for print
- [ ] Add page breaks in cookbook
- [ ] Show page numbers in print
- [ ] Test print output

**Deliverables:**
- Print-friendly layouts
- Cookbook printing

---

### 8.3 Export Features (Optional)

**Features:**
- Export recipe as PDF
- Export cookbook as PDF
- Export recipe data as JSON
- Share recipe via email

**Tasks:**
- [ ] Install PDF library (react-pdf or puppeteer)
- [ ] Create PDF template for recipes
- [ ] Create PDF template for cookbooks
- [ ] Build export functionality
- [ ] Add "Export" buttons
- [ ] Test PDF generation

**Deliverables:**
- PDF export functionality

---

### 8.4 Recipe Import (Optional)

**Features:**
- Import recipes from popular sites
- Parse common recipe formats
- Import from text
- Bulk import

**Tasks:**
- [ ] Research recipe schema.org markup
- [ ] Build URL parser
- [ ] Create import form
- [ ] Implement parsing logic
- [ ] Build preview before import
- [ ] Test with multiple sites

**Deliverables:**
- Recipe import from URLs

---

## Phase 9: Data Migration (Week 9)

### 9.1 Laravel Data Export

**Tasks:**
- [ ] Create Laravel export command
- [ ] Export users (if applicable) or create admin user
- [ ] Export all recipes with relationships
- [ ] Export classifications
- [ ] Export sources
- [ ] Export cookbooks with recipe associations
- [ ] Export meals, courses, preparations
- [ ] Export junction table data
- [ ] Generate JSON export files

**Export Format:**
```json
{
  "users": [...],
  "classifications": [...],
  "sources": [...],
  "meals": [...],
  "courses": [...],
  "preparations": [...],
  "recipes": [{
    "id": 1,
    "name": "...",
    "meals": [1, 2],
    "courses": [3],
    ...
  }],
  "cookbooks": [...],
  "cookbook_recipes": [...]
}
```

**Deliverables:**
- Export scripts
- JSON data files

---

### 9.2 Data Transformation

**Tasks:**
- [ ] Map Laravel schema to new schema
- [ ] Transform field names if needed
- [ ] Convert dates to ISO format
- [ ] Handle NULL values
- [ ] Generate slugs for recipes/cookbooks
- [ ] Validate data integrity
- [ ] Create transformation scripts

**Considerations:**
- Default all recipes to single admin user initially
- Mark all recipes as public
- Set created_at to date_added from Laravel
- Generate unique slugs from names

**Deliverables:**
- Data transformation scripts
- Validated transformed data

---

### 9.3 Data Import

**Tasks:**
- [ ] Create import seed script in Drizzle
- [ ] Import taxonomies first (classifications, sources, meals, courses, preparations)
- [ ] Import recipes with relationships
- [ ] Import cookbooks
- [ ] Associate recipes with cookbooks
- [ ] Verify data integrity
- [ ] Create verification script
- [ ] Test on staging database

**Verification Checks:**
- Recipe count matches
- Cookbook count matches
- All foreign keys resolved
- All many-to-many relationships intact
- No orphaned records

**Deliverables:**
- Import scripts
- Verified data in new database
- Import documentation

---

### 9.4 Image Migration (If Applicable)

**Tasks:**
- [ ] Inventory existing images from Laravel app
- [ ] Upload images to Cloudinary/S3
- [ ] Update recipe records with new image URLs
- [ ] Verify all images accessible
- [ ] Generate thumbnails for all images

**Deliverables:**
- Migrated images
- Updated image URLs

---

## Phase 10: Testing & Quality Assurance (Week 10)

### 10.1 Unit Testing

**Tasks:**
- [ ] Write tests for tRPC routers
- [ ] Test database queries
- [ ] Test authentication flows
- [ ] Test validation schemas
- [ ] Test utility functions
- [ ] Achieve >80% code coverage

**Deliverables:**
- Comprehensive test suite
- Coverage reports

---

### 10.2 Integration Testing

**Tasks:**
- [ ] Test recipe creation flow
- [ ] Test recipe editing flow
- [ ] Test cookbook creation flow
- [ ] Test search functionality
- [ ] Test filtering and sorting
- [ ] Test authentication flows
- [ ] Test image upload
- [ ] Test data migration

**Deliverables:**
- Integration test suite

---

### 10.3 E2E Testing (Optional)

**Tasks:**
- [ ] Set up Playwright
- [ ] Write E2E tests for critical flows
- [ ] Test on multiple browsers
- [ ] Test responsive behavior

**Deliverables:**
- E2E test suite

---

### 10.4 Manual QA

**Test Scenarios:**
- [ ] User registration and login
- [ ] Password reset flow
- [ ] Create recipe with all fields
- [ ] Edit existing recipe
- [ ] Delete recipe
- [ ] Search recipes
- [ ] Filter recipes by multiple criteria
- [ ] Sort recipes
- [ ] Paginate through recipes
- [ ] Mark recipe as favorite
- [ ] Create cookbook
- [ ] Add recipes to cookbook
- [ ] Reorder recipes in cookbook
- [ ] View cookbook
- [ ] Print cookbook
- [ ] Follow cookbook
- [ ] Upload images
- [ ] Contact form submission
- [ ] Mobile responsiveness
- [ ] Print layouts
- [ ] Accessibility with screen reader

**Deliverables:**
- QA checklist
- Bug reports
- Fixes for identified issues

---

## Phase 11: Performance & Optimization (Week 11)

### 11.1 Database Optimization

**Tasks:**
- [ ] Analyze slow queries
- [ ] Add missing indexes
- [ ] Optimize N+1 queries
- [ ] Implement query caching
- [ ] Set up database connection pooling
- [ ] Add database monitoring

**Deliverables:**
- Optimized queries
- Performance improvements

---

### 11.2 Frontend Optimization

**Tasks:**
- [ ] Implement image lazy loading
- [ ] Add route-based code splitting
- [ ] Optimize bundle size
- [ ] Implement virtual scrolling for long lists
- [ ] Add service worker for offline (optional)
- [ ] Optimize font loading
- [ ] Minimize CSS/JS
- [ ] Enable compression

**Deliverables:**
- Faster page loads
- Smaller bundle sizes

---

### 11.3 Caching Strategy

**Tasks:**
- [ ] Implement React Query caching
- [ ] Add stale-while-revalidate strategy
- [ ] Cache taxonomy data
- [ ] Add CDN caching headers
- [ ] Implement Redis for API caching (optional)

**Deliverables:**
- Reduced API calls
- Faster data loading

---

### 11.4 Performance Monitoring

**Tasks:**
- [ ] Set up Vercel Analytics
- [ ] Add Web Vitals tracking
- [ ] Monitor Core Web Vitals (LCP, FID, CLS)
- [ ] Set up Sentry for error tracking
- [ ] Add performance budgets
- [ ] Create performance dashboard

**Deliverables:**
- Performance monitoring
- Error tracking

---

## Phase 12: Deployment & Launch (Week 12)

### 12.1 Production Environment Setup

**Tasks:**
- [ ] Set up production database (Neon, Supabase, or AWS RDS)
- [ ] Configure production environment variables
- [ ] Set up Cloudinary production account
- [ ] Configure email service for production
- [ ] Set up domain and SSL
- [ ] Configure CORS and security headers

**Deliverables:**
- Production environment ready

---

### 12.2 Deployment

**Tasks:**
- [ ] Deploy to Vercel
- [ ] Run database migrations on production
- [ ] Import production data
- [ ] Verify all services connected
- [ ] Test production deployment
- [ ] Set up staging environment
- [ ] Configure CI/CD pipeline

**Deliverables:**
- Live application
- CI/CD pipeline

---

### 12.3 Monitoring & Logging

**Tasks:**
- [ ] Set up Sentry error tracking
- [ ] Configure Vercel logging
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Add performance monitoring
- [ ] Create alert rules
- [ ] Set up notification channels

**Deliverables:**
- Monitoring systems active
- Alert notifications configured

---

### 12.4 Documentation

**Tasks:**
- [ ] Write user documentation
- [ ] Create admin guide
- [ ] Document API endpoints
- [ ] Write deployment guide
- [ ] Create troubleshooting guide
- [ ] Document data migration process

**Deliverables:**
- Complete documentation
- User guides

---

### 12.5 Launch Checklist

**Pre-Launch:**
- [ ] All features tested
- [ ] Data migrated and verified
- [ ] Performance acceptable
- [ ] Security audit passed
- [ ] Backup strategy in place
- [ ] Monitoring active
- [ ] Documentation complete

**Launch:**
- [ ] Deploy to production
- [ ] Verify all features working
- [ ] Monitor for errors
- [ ] Test critical flows
- [ ] Announce launch

**Post-Launch:**
- [ ] Monitor performance
- [ ] Track user feedback
- [ ] Fix critical bugs quickly
- [ ] Plan next iterations

**Deliverables:**
- Launched application
- Post-launch monitoring

---

## Post-Launch Roadmap (Future Enhancements)

### Phase 13: Advanced Features

**Potential Enhancements:**
- [ ] Recipe comments and discussions
- [ ] Recipe variations/forks
- [ ] Meal planning feature
- [ ] Shopping list generation
- [ ] Ingredient inventory tracking
- [ ] Recipe scaling calculator
- [ ] Cooking timer integration
- [ ] Voice-guided cooking mode
- [ ] Recipe recommendations (ML-based)
- [ ] Social feed of recent recipes
- [ ] Recipe collections/boards
- [ ] Collaborative cookbook editing
- [ ] Public/private recipe visibility
- [ ] Recipe versioning
- [ ] Nutrition calculator integration
- [ ] Dietary restriction filters
- [ ] Ingredient substitutions
- [ ] Cost estimation per recipe
- [ ] Recipe difficulty calculator
- [ ] Multi-language support

---

## Risk Management

### Technical Risks

**Risk**: Database performance with large datasets
**Mitigation**: Implement proper indexing, query optimization, and caching from the start

**Risk**: Image storage costs
**Mitigation**: Implement image optimization, set file size limits, monitor usage

**Risk**: Authentication security
**Mitigation**: Use established auth library (Better-Auth), implement rate limiting, use secure session storage

**Risk**: Data migration failures
**Mitigation**: Test migration on staging, create rollback plan, verify data integrity

### Project Risks

**Risk**: Scope creep
**Mitigation**: Stick to phased plan, document feature requests for future phases

**Risk**: Timeline overruns
**Mitigation**: Prioritize MVP features, defer optional features to post-launch

**Risk**: Resource constraints
**Mitigation**: Focus on one phase at a time, use proven libraries, avoid over-engineering

---

## Success Metrics

**Technical Metrics:**
- Page load time < 2s
- Time to Interactive < 3s
- 95%+ uptime
- < 1% error rate
- Test coverage > 80%

**Feature Metrics:**
- All Laravel features replicated
- All data migrated successfully
- Authentication working
- Image upload working
- Search performing well

**User Metrics (Post-Launch):**
- User registration rate
- Recipe creation rate
- Search usage
- Cookbook creation rate
- Return user rate

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| **Phase 1**: Foundation | 2 weeks | Database, Auth, tRPC setup |
| **Phase 2**: Recipe Management | 2 weeks | Recipe CRUD, list, detail |
| **Phase 3**: Taxonomy | 1 week | Classifications, sources, meals, courses, preps |
| **Phase 4**: Cookbooks | 2 weeks | Cookbook CRUD, TOC, ordering |
| **Phase 5**: Search & Navigation | 2 weeks | Full-text search, filters, pagination |
| **Phase 6**: Images | 1 week | Image upload, galleries |
| **Phase 7**: User Features | 1 week | Profiles, favorites, following |
| **Phase 8**: Additional Features | 1 week | Contact, print, export |
| **Phase 9**: Data Migration | 1 week | Export, transform, import data |
| **Phase 10**: Testing & QA | 1 week | Unit, integration, E2E tests |
| **Phase 11**: Optimization | 1 week | Performance, caching |
| **Phase 12**: Deployment | 1 week | Production setup, launch |

**Total Estimated Timeline**: 12 weeks (3 months)
**Total Estimated Hours**: 200-250 hours

---

## Resource Requirements

**Development:**
- 1 Full-stack developer (primary)
- 1 Designer (for assets/branding) - optional
- 1 QA tester (part-time) - optional

**Infrastructure:**
- Database: Neon/Supabase free tier initially
- Image storage: Cloudinary free tier (25 GB)
- Email: Resend free tier (3k emails/month)
- Hosting: Vercel Pro ($20/month)
- Domain: ~$15/year
- Monitoring: Sentry free tier

**Estimated Monthly Cost**: $25-50 initially

---

## Conclusion

This migration plan provides a comprehensive roadmap for replacing the Laravel recipe application with a modern TanStack Start application. The plan includes:

✅ Complete feature parity with Laravel app
✅ Modern authentication and ownership model
✅ Enhanced features (images, following, user profiles)
✅ Scalable architecture (tRPC + Drizzle)
✅ Type-safe development
✅ Performance optimization
✅ Comprehensive testing
✅ Production-ready deployment

By following this phased approach, the migration can be completed systematically with clear milestones and deliverables at each stage.
