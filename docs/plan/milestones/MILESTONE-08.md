# Milestone 08: Additional Features

**Duration**: 1 week  
**Status**: Not Started  
**Dependencies**: All previous milestones

## Overview

Implement launch-focused quality-of-life features: print styles, recipe JSON export/import, and serving size adjustment.

Contact form and outbound email features are deferred to a dedicated post-launch stream to reduce launch complexity and keep email delivery work in one place.

---

## 8.1 Print Styles

### Tasks

1. [ ] Create dedicated print stylesheet file (`@media print`)
2. [ ] Import print styles in root layout
3. [ ] Set print margins and readable font sizes
4. [ ] Hide navigation and non-essential UI in print
5. [ ] Add recipe detail print formatting (title, ingredients, instructions)
6. [ ] Add recipe list print formatting (cards/list)
7. [ ] Prevent page breaks inside ingredient and instruction blocks
8. [ ] Ensure black-and-white readability
9. [ ] Test print preview in Chrome
10. [ ] Test print preview in Firefox
11. [ ] Test print preview in Safari
12. [ ] Test print preview in Edge

### Acceptance Criteria

- [ ] Recipe detail pages print clearly with core content visible
- [ ] Recipe list pages print without filters/navigation clutter
- [ ] Print output is readable in black and white
- [ ] Cross-browser print preview is acceptable

### Deliverables

- Print stylesheet
- Print-optimized recipe detail and list layouts

---

## 8.2 Recipe Export

### Tasks

13. [ ] Implement JSON export utility
14. [ ] Include complete recipe data and export `_version` metadata
15. [ ] Add Export button to recipe detail page
16. [ ] Trigger browser file download (`recipe-name.json`)
17. [ ] Add success and error feedback states
18. [ ] Test export formatting and file download behavior

### Acceptance Criteria

- [ ] Recipe exports as valid JSON
- [ ] Export includes required recipe fields and metadata
- [ ] Download starts reliably from recipe detail page
- [ ] Filename is deterministic and user friendly

### Deliverables

- JSON export functionality
- Export UI on recipe detail

---

## 8.3 Recipe Import

### Tasks

19. [ ] Create `/import` route and Import page
20. [ ] Add drag-and-drop JSON file upload
21. [ ] Parse and validate JSON with shared schema
22. [ ] Show import preview modal before save
23. [ ] Implement confirm flow to create recipe
24. [ ] Handle invalid files and validation errors clearly
25. [ ] Redirect to imported recipe detail on success
26. [ ] Add Import entry point in navigation or recipe management UI
27. [ ] Test import flow end-to-end with exported JSON

### Acceptance Criteria

- [ ] Users can upload valid JSON and preview before import
- [ ] Invalid JSON/files are rejected with clear feedback
- [ ] Confirmed import creates a new recipe
- [ ] Successful import redirects to the new recipe

### Deliverables

- Import page and upload flow
- Import preview and validation UX
- Server mutation for import creation

---

## 8.4 Serving Size Adjuster

### Tasks

28. [ ] Create `ServingSizeAdjuster` component
29. [ ] Add increment/decrement controls with minimum guard
30. [ ] Scale ingredient quantities proportionally
31. [ ] Add reset to original servings action
32. [ ] Integrate adjuster into recipe detail page
33. [ ] Add unit tests for scaling utility
34. [ ] Add component tests for adjuster interactions
35. [ ] Add E2E test for serving adjustment behavior

### Acceptance Criteria

- [ ] Current serving size is visible and adjustable
- [ ] Ingredient quantities update correctly when servings change
- [ ] Reset returns values to original servings
- [ ] Component is responsive on mobile and desktop

### Deliverables

- Serving size adjuster component
- Scaled ingredient rendering on recipe detail

---

## 8.5 Deferred to Post-Launch

### Deferred Items

- Contact form (`/contact`) and contact email delivery
- Outbound email provider setup (Resend/SendGrid)
- Email notification templates and preferences
- CAPTCHA/bot protection for contact/email endpoints

### Rationale

- [ ] Keep launch scope focused on core and high-value UX improvements
- [ ] Remove launch dependency on outbound email infrastructure
- [ ] Implement all email-related features in a single post-launch stream

---

## Testing Checklist

### Unit Tests

- [ ] Export data formatting
- [ ] Import data validation
- [ ] Serving size calculations

### Integration Tests

- [ ] Recipe export correctness
- [ ] Recipe import correctness
- [ ] Print styles on key pages
- [ ] Serving adjuster integration

### Manual Testing

- [ ] Print recipe detail
- [ ] Print recipe list
- [ ] Export recipe as JSON
- [ ] Import recipe from JSON
- [ ] Adjust serving sizes

---

## Definition of Done

- [ ] All tasks completed
- [ ] All acceptance criteria met
- [ ] All tests passing
- [ ] Documentation updated
- [ ] No critical bugs
- [ ] Feature behavior verified in supported browsers

---

## Dependencies

- All previous milestones

---

## Blockers and Risks

**Potential Blockers:**
- Cross-browser print behavior differences
- Import schema drift between versions

**Mitigation:**
- Test print styles in all target browsers and document known limits
- Version export format and validate import strictly

---

## Notes

- Keep M08 tightly scoped to launch essentials.
- Route all email-related work to post-launch planning and implementation.
