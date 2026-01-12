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

- [ ] Create classifications tRPC router with queries and mutations
- [ ] Build classifications list page
- [ ] Build classification detail page (filtered recipes)
- [ ] Create ClassificationCard component
- [ ] Add classification admin panel (optional, for managing classifications)
- [ ] Build classification form for admin (optional)
- [ ] Add classification badge component for consistent display

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

- [ ] Create sources tRPC router
- [ ] Build SourceSelector component with autocomplete
- [ ] Implement "Add New Source" inline form
- [ ] Build sources list page (optional)
- [ ] Create source detail page showing all recipes
- [ ] Add source badge/link component

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

- [ ] Create tRPC routers for meals, courses, preparations
- [ ] Build seed script with default values
- [ ] Run seed script to populate database
- [ ] Build MultiSelect component for forms
- [ ] Integrate multi-selects into recipe form
- [ ] Create badge displays for recipe details
- [ ] Build filter options in recipe list sidebar
- [ ] Add admin management pages (optional)

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
