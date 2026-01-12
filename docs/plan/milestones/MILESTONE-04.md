# Milestone 04: Cookbook Management

**Duration**: 2 weeks
**Status**: Not Started
**Dependencies**: Milestones 02 (Core Recipe Management), 03 (Classification & Taxonomy)

## Overview

Implement cookbook functionality allowing users to create collections of recipes with custom ordering, table of contents, and print-friendly views.

---

## 4.1 Cookbook Database & API

### Tasks

- [ ] Create cookbooks table migration
- [ ] Create cookbook_recipes junction table migration
- [ ] Add order field to junction table for recipe ordering
- [ ] Create cookbooks tRPC router
- [ ] Implement createCookbook mutation
- [ ] Implement updateCookbook mutation
- [ ] Implement deleteCookbook mutation
- [ ] Implement getCookbook query with recipes
- [ ] Implement listCookbooks query
- [ ] Implement addRecipeToCookbook mutation
- [ ] Implement removeRecipeFromCookbook mutation
- [ ] Implement reorderRecipes mutation

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

- [ ] Create /cookbooks route
- [ ] Build cookbooks list page
- [ ] Create CookbookCard component
- [ ] Add "Create Cookbook" button
- [ ] Build cookbook creation modal/page
- [ ] Create cookbook form with validation
- [ ] Implement cookbook creation
- [ ] Add success/error handling

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

- [ ] Create /cookbooks/[id] route
- [ ] Build cookbook detail page
- [ ] Display cookbook title and description
- [ ] Show list of recipes in order
- [ ] Add "Add Recipe" button
- [ ] Build recipe selector modal
- [ ] Implement add recipe functionality
- [ ] Add remove recipe buttons
- [ ] Implement remove recipe functionality
- [ ] Add drag-and-drop reordering
- [ ] Implement reorder persistence
- [ ] Add edit cookbook button
- [ ] Build edit cookbook modal
- [ ] Add delete cookbook button with confirmation

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

- [ ] Add "Table of Contents" view toggle
- [ ] Build TOC layout component
- [ ] Display recipe names as links
- [ ] Add page numbers (for print)
- [ ] Style for print media
- [ ] Add chapter/section support (optional)

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

- [ ] Add "Print Cookbook" button
- [ ] Create print layout stylesheet
- [ ] Format for A4/Letter paper
- [ ] Add page breaks between recipes
- [ ] Include TOC at start
- [ ] Add cookbook title on each page
- [ ] Remove navigation/UI elements
- [ ] Optimize images for print
- [ ] Test print preview

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
