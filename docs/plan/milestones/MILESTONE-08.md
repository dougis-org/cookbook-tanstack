# Milestone 08: Additional Features

**Duration**: 1 week
**Status**: Not Started
**Dependencies**: All previous milestones

## Overview

Implement additional features including contact form, print styles, recipe export/import, email notifications, and other enhancements.

---

## 8.1 Contact Form

### Tasks

- [ ] Create /contact route
- [ ] Build contact page
- [ ] Create contact form
- [ ] Add field validation
- [ ] Implement email service (Resend/SendGrid)
- [ ] Create contact email template
- [ ] Send email on form submission
- [ ] Add confirmation message
- [ ] Implement rate limiting
- [ ] Add CAPTCHA (optional)

### Acceptance Criteria

**Form:**
- [ ] Name field (required)
- [ ] Email field (required, validated)
- [ ] Subject field (optional)
- [ ] Message field (required, min 10 chars)
- [ ] Submit button
- [ ] Clear form validation errors
- [ ] Character count for message

**Functionality:**
- [ ] Form validates on submit
- [ ] Email sent successfully
- [ ] Confirmation shown to user
- [ ] Form clears after success
- [ ] Error handling works
- [ ] Rate limiting prevents spam
- [ ] CAPTCHA prevents bots (optional)

**Email:**
- [ ] Formatted email template
- [ ] Contains all form data
- [ ] Reply-to set to user's email
- [ ] Sent to configured admin email
- [ ] Delivered reliably

### Deliverables

- Contact page and form
- Email service integration
- Email template

---

## 8.2 Print Styles

### Tasks

- [ ] Create print stylesheet
- [ ] Add print styles to recipe detail
- [ ] Add print styles to recipe list
- [ ] Optimize for A4/Letter paper
- [ ] Remove navigation in print
- [ ] Remove unnecessary UI elements
- [ ] Adjust font sizes for print
- [ ] Ensure images print correctly
- [ ] Add page breaks appropriately
- [ ] Test across browsers

### Acceptance Criteria

**Recipe Detail Print:**
- [ ] Recipe prints on clean page
- [ ] Title, image, ingredients, instructions visible
- [ ] Navigation/UI removed
- [ ] Readable font size
- [ ] Proper margins
- [ ] Page breaks appropriate
- [ ] Images sized correctly
- [ ] Black and white friendly

**Recipe List Print:**
- [ ] List prints cleanly
- [ ] Recipe cards formatted
- [ ] Filters removed
- [ ] Multiple recipes per page
- [ ] Clear separation between recipes

**Browser Compatibility:**
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge

### Deliverables

- Print stylesheet
- Print-optimized layouts

---

## 8.3 Recipe Export

### Tasks

- [ ] Create export tRPC query
- [ ] Implement JSON export
- [ ] Implement PDF export (optional)
- [ ] Add "Export" button to recipe detail
- [ ] Build export options modal
- [ ] Implement download functionality
- [ ] Add export history tracking (optional)
- [ ] Support bulk export (optional)

### Acceptance Criteria

**JSON Export:**
- [ ] Exports recipe as JSON
- [ ] Includes all recipe data
- [ ] Includes metadata (created, updated)
- [ ] Properly formatted
- [ ] Downloads as file
- [ ] Filename: recipe-name.json

**PDF Export (Optional):**
- [ ] Exports recipe as PDF
- [ ] Professional layout
- [ ] Includes image
- [ ] Includes all sections
- [ ] Downloads as file
- [ ] Filename: recipe-name.pdf

**UI:**
- [ ] Export button visible on recipe detail
- [ ] Modal shows export options
- [ ] Can choose format
- [ ] Download starts immediately
- [ ] Success feedback
- [ ] Error handling

### Deliverables

- JSON export functionality
- Export button and modal
- PDF export (optional)

---

## 8.4 Recipe Import

### Tasks

- [ ] Create import tRPC mutation
- [ ] Build import page
- [ ] Support JSON import
- [ ] Support recipe URL import (optional)
- [ ] Implement file upload
- [ ] Parse and validate imported data
- [ ] Map fields correctly
- [ ] Create recipe from import
- [ ] Handle import errors
- [ ] Show import preview

### Acceptance Criteria

**JSON Import:**
- [ ] Can upload JSON file
- [ ] Parses file correctly
- [ ] Validates data structure
- [ ] Shows preview before import
- [ ] Can edit preview data
- [ ] Creates recipe on confirm
- [ ] Handles invalid files gracefully

**URL Import (Optional):**
- [ ] Can paste recipe URL
- [ ] Fetches recipe data
- [ ] Parses common recipe formats
- [ ] Extracts ingredients, instructions
- [ ] Shows preview
- [ ] Creates recipe

**UI:**
- [ ] Import page accessible
- [ ] Clear instructions
- [ ] File upload drag-drop
- [ ] URL input field
- [ ] Preview modal
- [ ] Confirm/cancel buttons
- [ ] Success/error feedback

**Error Handling:**
- [ ] Invalid file format detected
- [ ] Missing required fields flagged
- [ ] Network errors handled
- [ ] Clear error messages

### Deliverables

- Recipe import page
- JSON import functionality
- URL import (optional)
- Import preview

---

## 8.5 Email Notifications

### Tasks

- [ ] Set up email service (Resend/SendGrid)
- [ ] Create email templates
- [ ] Implement welcome email
- [ ] Implement password reset email
- [ ] Implement cookbook share email (optional)
- [ ] Implement follower notification (optional)
- [ ] Add email preferences page
- [ ] Implement unsubscribe functionality
- [ ] Test email delivery

### Acceptance Criteria

**Welcome Email:**
- [ ] Sent on new user registration
- [ ] Professional template
- [ ] Includes getting started links
- [ ] Brand consistent

**Password Reset:**
- [ ] Sent on password reset request
- [ ] Contains secure reset link
- [ ] Link expires after 1 hour
- [ ] Clear instructions

**Preferences:**
- [ ] User can manage email preferences
- [ ] Can opt-out of notifications
- [ ] Can unsubscribe from all emails
- [ ] Preferences persist

**Deliverability:**
- [ ] Emails not marked as spam
- [ ] Reliable delivery
- [ ] Proper from address
- [ ] Unsubscribe link included

### Deliverables

- Email service integration
- Email templates
- Email preferences page
- Notification system

---

## 8.6 Additional Enhancements

### Tasks

- [ ] Add recipe nutritional calculator (optional)
- [ ] Implement serving size adjuster
- [ ] Add ingredient scaling
- [ ] Implement recipe notes/comments
- [ ] Add recipe tags
- [ ] Build shopping list generator (optional)
- [ ] Add recipe timer (optional)
- [ ] Implement voice commands (optional)

### Acceptance Criteria

**Serving Size Adjuster:**
- [ ] Shows current servings
- [ ] Can increase/decrease
- [ ] Ingredient quantities scale automatically
- [ ] Nutritional info scales (if present)
- [ ] Visual feedback

**Recipe Notes:**
- [ ] Can add private notes to recipes
- [ ] Notes saved per user
- [ ] Can edit/delete notes
- [ ] Notes visible on recipe detail

**Shopping List (Optional):**
- [ ] Can add recipe to shopping list
- [ ] Combines ingredients from multiple recipes
- [ ] Can check off items
- [ ] Can print/export list
- [ ] Persists across sessions

### Deliverables

- Serving size adjuster
- Recipe notes
- Selected enhancements

---

## Testing Checklist

### Unit Tests

- [ ] Contact form validation
- [ ] Export data formatting
- [ ] Import data parsing
- [ ] Email template rendering
- [ ] Serving size calculations

### Integration Tests

- [ ] Contact form sends email
- [ ] Recipe exports correctly
- [ ] Recipe imports correctly
- [ ] Emails delivered
- [ ] Print styles work
- [ ] Enhancements functional

### Manual Testing

- [ ] Submit contact form
- [ ] Export recipe as JSON
- [ ] Import recipe from JSON
- [ ] Print recipe detail
- [ ] Adjust serving sizes
- [ ] Add recipe notes
- [ ] Test emails in inbox

---

## Definition of Done

- [ ] All tasks completed
- [ ] All acceptance criteria met
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] No critical bugs
- [ ] Features working across browsers
- [ ] Ready for next milestone

---

## Dependencies

- All previous milestones

---

## Blockers & Risks

**Potential Blockers:**
- Email delivery issues
- PDF generation complexity
- URL import parsing challenges

**Mitigation:**
- Use reliable email service (Resend recommended)
- Use proven PDF library (Puppeteer/PDFKit)
- Start with JSON import, add URL later
- Test email deliverability thoroughly

---

## Notes

- Contact form should be simple and reliable
- Print styles important for usability
- Export/import adds value for users
- Email notifications enhance engagement
- Additional enhancements can be prioritized based on user feedback
- Consider analytics for feature usage
