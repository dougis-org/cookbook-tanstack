# Milestone 08: Additional Features

**Duration**: 1 week
**Status**: Not Started
**Dependencies**: All previous milestones

## Overview

Implement additional features including contact form, print styles, recipe export/import, email notifications, and other enhancements.

---

## 8.1 Contact Form

### Tasks

1. [ ] Create `/contact` page route
2. [ ] Build ContactPage component
3. [ ] Create contact form
4. [ ] Add name input field (required)
5. [ ] Add email input field (required, validated)
6. [ ] Add subject input field (optional)
7. [ ] Add message textarea (required, min 10 chars)
8. [ ] Add character counter for message
9. [ ] Add Zod validation schema
10. [ ] Add form validation on submit
11. [ ] Display validation errors inline
12. [ ] Choose email service (Resend recommended)
13. [ ] Install email service SDK
14. [ ] Configure API credentials
15. [ ] Create `contact.send` tRPC mutation
16. [ ] Create contact email template
17. [ ] Format email with form data
18. [ ] Set reply-to to user's email
19. [ ] Send email to configured admin
20. [ ] Add success confirmation message
21. [ ] Clear form after success
22. [ ] Handle email sending errors
23. [ ] Implement rate limiting (max 3/hour per user)
24. [ ] Add CAPTCHA integration (optional)
25. [ ] Test contact form submission
26. [ ] Test email delivery
27. [ ] Make contact form responsive

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

28. [ ] Create dedicated print stylesheet file
29. [ ] Import print styles with `@media print`
30. [ ] Set page size to A4/Letter
31. [ ] Set print margins (appropriate for paper)
32. [ ] Adjust font sizes for print readability
33. [ ] Hide navigation bar in print
34. [ ] Hide sidebar in print
35. [ ] Hide buttons and UI controls in print
36. [ ] Hide footer in print
37. [ ] Add print-specific styles to recipe detail
38. [ ] Format recipe title for print
39. [ ] Format ingredients list for print
40. [ ] Format instructions for print
41. [ ] Optimize images for print (max width, grayscale optional)
42. [ ] Add page breaks before recipes (if multiple)
43. [ ] Prevent page breaks mid-recipe
44. [ ] Add print styles to recipe list
45. [ ] Format recipe cards for print
46. [ ] Remove filters/sidebar from print
47. [ ] Ensure black and white friendly
48. [ ] Test print preview in Chrome
49. [ ] Test print preview in Firefox
50. [ ] Test print preview in Safari
51. [ ] Test print preview in Edge
52. [ ] Test print to PDF
53. [ ] Test actual printer output

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

54. [ ] Create `recipes.export` tRPC query
55. [ ] Implement JSON export format
56. [ ] Include all recipe fields in export
57. [ ] Include metadata (created_at, updated_at)
58. [ ] Format JSON properly
59. [ ] Add "Export" button to recipe detail page
60. [ ] Create export modal component
61. [ ] Add format selection (JSON, PDF)
62. [ ] Wire JSON export to download
63. [ ] Generate filename: recipe-name.json
64. [ ] Implement PDF export (optional)
65. [ ] Install PDF generation library (optional)
66. [ ] Create PDF template (optional)
67. [ ] Include recipe image in PDF (optional)
68. [ ] Format PDF layout professionally (optional)
69. [ ] Wire PDF export to download (optional)
70. [ ] Generate filename: recipe-name.pdf (optional)
71. [ ] Add export history tracking (optional)
72. [ ] Support bulk export of multiple recipes (optional)
73. [ ] Test JSON export
74. [ ] Test PDF export (optional)
75. [ ] Test download functionality

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

76. [ ] Create `/import` page route
77. [ ] Build ImportPage component
78. [ ] Create `recipes.import` tRPC mutation
79. [ ] Add Zod validation for import data
80. [ ] Create file upload component
81. [ ] Support drag-and-drop for file upload
82. [ ] Accept .json files only
83. [ ] Read file contents
84. [ ] Parse JSON data
85. [ ] Validate data structure
86. [ ] Check required fields present
87. [ ] Create import preview modal
88. [ ] Display parsed recipe data
89. [ ] Allow editing preview data
90. [ ] Wire confirm button to import mutation
91. [ ] Create recipe from imported data
92. [ ] Handle mapping of fields
93. [ ] Handle import errors gracefully
94. [ ] Display clear error messages
95. [ ] Add URL import field (optional)
96. [ ] Implement URL scraping (optional)
97. [ ] Parse common recipe formats (optional)
98. [ ] Extract ingredients and instructions (optional)
99. [ ] Test JSON import
100. [ ] Test URL import (optional)
101. [ ] Make import page responsive

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

102. [ ] Set up email service (Resend recommended)
103. [ ] Install email service SDK
104. [ ] Configure API credentials
105. [ ] Set up sender email domain
106. [ ] Create email template utility
107. [ ] Create welcome email template
108. [ ] Add getting started links to welcome email
109. [ ] Wire welcome email to registration
110. [ ] Test welcome email delivery
111. [ ] Create password reset email template
112. [ ] Add secure reset link to email
113. [ ] Add expiration notice (1 hour)
114. [ ] Wire password reset email to forgot password
115. [ ] Test password reset email delivery
116. [ ] Create cookbook share email template (optional)
117. [ ] Create follower notification email template (optional)
118. [ ] Create `/settings/email` page route
119. [ ] Build email preferences form
120. [ ] Add notification toggles
121. [ ] Add unsubscribe option
122. [ ] Save preferences to database
123. [ ] Create unsubscribe handler route
124. [ ] Process unsubscribe requests
125. [ ] Add unsubscribe link to all emails
126. [ ] Test email preferences saving
127. [ ] Test unsubscribe functionality
128. [ ] Verify emails not marked as spam

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

129. [ ] Create ServingSizeAdjuster component
130. [ ] Display current servings
131. [ ] Add increase button (+)
132. [ ] Add decrease button (-)
133. [ ] Calculate ingredient quantity scaling
134. [ ] Update ingredient display with scaled values
135. [ ] Scale nutritional info (if present)
136. [ ] Add visual feedback for changes
137. [ ] Add reset to original servings button
138. [ ] Integrate adjuster into recipe detail page
139. [ ] Create recipe_notes table schema (user_id, recipe_id, text)
140. [ ] Generate migration for recipe_notes
141. [ ] Run migration
142. [ ] Create `recipes.addNote` mutation
143. [ ] Create `recipes.updateNote` mutation
144. [ ] Create `recipes.deleteNote` mutation
145. [ ] Create RecipeNotes component
146. [ ] Display user's notes on recipe detail
147. [ ] Add "Add Note" button
148. [ ] Create note editing textarea
149. [ ] Wire save to mutation
150. [ ] Add delete button for notes
151. [ ] Add nutritional calculator (optional)
152. [ ] Create shopping list feature (optional)
153. [ ] Create recipe timer feature (optional)
154. [ ] Test serving size adjuster
155. [ ] Test recipe notes functionality
156. [ ] Make enhancements responsive

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
