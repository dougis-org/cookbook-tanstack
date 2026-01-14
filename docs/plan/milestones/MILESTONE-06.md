# Milestone 06: Image Management

**Duration**: 1 week
**Status**: Not Started
**Dependencies**: Milestones 02 (Core Recipe Management), 04 (Cookbook Management)

## Overview

Implement comprehensive image management including upload, storage, optimization, galleries, and display throughout the application using Cloudinary or AWS S3.

---

## 6.1 Storage Setup

### Tasks

1. [ ] Evaluate Cloudinary vs AWS S3 for storage needs
2. [ ] Choose storage solution (Cloudinary recommended)
3. [ ] Create Cloudinary account (or AWS account)
4. [ ] Retrieve API key and secret
5. [ ] Configure API credentials in environment
6. [ ] Add CLOUDINARY_URL to `.env` file
7. [ ] Add cloud credentials to `.env.example` (without actual values)
8. [ ] Create storage service module file (`src/lib/storage.ts`)
9. [ ] Install storage SDK (cloudinary or aws-sdk)
10. [ ] Initialize storage client in service module
11. [ ] Create upload function (`uploadImage()`)
12. [ ] Add file type validation to upload
13. [ ] Add file size validation to upload
14. [ ] Implement image upload to cloud
15. [ ] Return uploaded image URL
16. [ ] Create delete function (`deleteImage()`)
17. [ ] Extract public ID from image URL
18. [ ] Delete image from cloud storage
19. [ ] Create get URL function (`getImageUrl()`)
20. [ ] Configure automatic transformations (resize, quality)
21. [ ] Set up automatic format conversion (WebP)
22. [ ] Enable auto-quality optimization
23. [ ] Define folder structure for organization
24. [ ] Configure upload presets (if using Cloudinary)
25. [ ] Set up CDN (if using S3 with CloudFront)
26. [ ] Configure CORS for storage bucket
27. [ ] Add error handling to all storage functions
28. [ ] Add TypeScript types for storage functions
29. [ ] Test upload function with sample image
30. [ ] Test delete function
31. [ ] Test URL generation
32. [ ] Verify transformations work correctly

### Acceptance Criteria

**Cloudinary (Recommended):**
- [ ] Account created
- [ ] API keys configured
- [ ] Upload preset created
- [ ] Transformations configured (resize, quality)
- [ ] Auto-format enabled
- [ ] Auto-quality enabled
- [ ] Folder structure defined

**AWS S3 (Alternative):**
- [ ] S3 bucket created
- [ ] IAM user created
- [ ] Bucket policy configured
- [ ] CloudFront CDN setup
- [ ] CORS configured
- [ ] Lambda for image processing (optional)

**Service Module:**
- [ ] uploadImage() function works
- [ ] deleteImage() function works
- [ ] getImageUrl() function works
- [ ] Transformations applied correctly
- [ ] Error handling implemented
- [ ] Type safety enforced

### Deliverables

- Storage account configured
- Storage service module
- Environment configuration

---

## 6.2 Image Upload

### Tasks

33. [ ] Create `images.upload` tRPC mutation
34. [ ] Add Zod validation for image upload
35. [ ] Wire mutation to storage service upload function
36. [ ] Return image URL from mutation
37. [ ] Create ImageUpload component base structure
38. [ ] Add file input element
39. [ ] Style file input with custom button
40. [ ] Create drag-and-drop zone
41. [ ] Add drag-over visual feedback
42. [ ] Handle drop event
43. [ ] Handle file selection from input
44. [ ] Validate file type (jpg, png, webp)
45. [ ] Validate file size (< 10MB)
46. [ ] Display validation errors
47. [ ] Prevent invalid file uploads
48. [ ] Create file preview component
49. [ ] Display image preview before upload
50. [ ] Show file name and size
51. [ ] Add remove file button
52. [ ] Create upload progress bar
53. [ ] Display upload percentage
54. [ ] Add cancel upload button
55. [ ] Handle upload cancellation
56. [ ] Call tRPC upload mutation on file selection
57. [ ] Show loading spinner during upload
58. [ ] Display success message on completion
59. [ ] Display error message on failure
60. [ ] Add image crop/resize modal (optional)
61. [ ] Integrate cropping library (optional)
62. [ ] Support multiple file selection
63. [ ] Display multiple file previews
64. [ ] Upload files sequentially or in parallel
65. [ ] Show progress for each file
66. [ ] Create `recipes.addImage` mutation
67. [ ] Save image URL to database
68. [ ] Associate image with recipe
69. [ ] Integrate ImageUpload into recipe form
70. [ ] Test single file upload
71. [ ] Test multiple file upload
72. [ ] Test drag-and-drop functionality
73. [ ] Test file validation
74. [ ] Make ImageUpload responsive for mobile

### Acceptance Criteria

**Validation:**
- [ ] Only accepts image files (jpg, png, webp)
- [ ] Rejects files > 10MB
- [ ] Shows validation errors
- [ ] Prevents invalid uploads

**Upload UI:**
- [ ] Drag-and-drop zone visible
- [ ] File input fallback works
- [ ] Shows selected file preview
- [ ] Progress bar during upload
- [ ] Success message on completion
- [ ] Error message on failure
- [ ] Can cancel upload

**Functionality:**
- [ ] Single file upload works
- [ ] Multiple file upload works
- [ ] Images stored in cloud
- [ ] Image URL saved to database
- [ ] Thumbnail generated automatically
- [ ] Original preserved

**UX:**
- [ ] Visual feedback during drag
- [ ] Clear upload state indicators
- [ ] Responsive design
- [ ] Accessible (keyboard, screen readers)
- [ ] Mobile-friendly

### Deliverables

- ImageUpload component
- Upload tRPC mutation
- File validation
- Progress indicators

---

## 6.3 Recipe Image Galleries

### Tasks

75. [ ] Update recipe schema to support multiple images (verify if needed)
76. [ ] Verify recipe_images table exists (from Milestone 01)
77. [ ] Ensure recipe_images has id, recipe_id, url, alt_text fields
78. [ ] Add order_index field to recipe_images
79. [ ] Add is_primary field to recipe_images
80. [ ] Generate migration for recipe_images updates
81. [ ] Run migration on local database
82. [ ] Create `recipes.addImages` mutation
83. [ ] Create `recipes.removeImage` mutation
84. [ ] Create `recipes.reorderImages` mutation
85. [ ] Create `recipes.setPrimaryImage` mutation
86. [ ] Add Zod validation for image operations
87. [ ] Create ImageGallery component base structure
88. [ ] Query recipe images with order
89. [ ] Display images in grid layout
90. [ ] Show thumbnail versions in grid
91. [ ] Highlight primary image visually
92. [ ] Add empty state for no images
93. [ ] Create "Add Images" button (owner only)
94. [ ] Wire button to ImageUpload component/modal
95. [ ] Integrate image gallery into recipe detail page
96. [ ] Install drag-and-drop library for images
97. [ ] Make gallery grid draggable
98. [ ] Add drag handles to images
99. [ ] Add visual feedback during drag
100. [ ] Handle drop to reorder
101. [ ] Call reorder mutation on drop
102. [ ] Update gallery immediately (optimistic)
103. [ ] Add delete button to each image (owner only)
104. [ ] Create delete confirmation modal
105. [ ] Wire delete button to `removeImage` mutation
106. [ ] Remove from gallery immediately (optimistic)
107. [ ] Add "Set as Primary" button to each image
108. [ ] Highlight current primary image
109. [ ] Wire button to `setPrimaryImage` mutation
110. [ ] Update gallery to show new primary
111. [ ] Create Lightbox component
112. [ ] Open lightbox on image click
113. [ ] Display full-size image in lightbox
114. [ ] Add close button to lightbox
115. [ ] Add ESC key to close lightbox
116. [ ] Add previous/next navigation arrows
117. [ ] Add keyboard navigation (Left/Right arrows)
118. [ ] Add swipe gestures for mobile
119. [ ] Dim background with overlay
120. [ ] Add image counter (X of Y)
121. [ ] Test image gallery displays correctly
122. [ ] Test image reordering
123. [ ] Test image deletion
124. [ ] Test set primary functionality
125. [ ] Test lightbox navigation
126. [ ] Make ImageGallery responsive for all devices

### Acceptance Criteria

**Database:**
- [ ] recipe_images table exists
- [ ] Stores recipeId, imageUrl, order, isPrimary
- [ ] Foreign keys configured
- [ ] Indexes on recipeId

**Gallery Component:**
- [ ] Shows all recipe images
- [ ] Displays thumbnails in grid
- [ ] Primary image highlighted
- [ ] Can click to view full-size
- [ ] Responsive layout
- [ ] Empty state shown if no images

**Management:**
- [ ] Can upload multiple images
- [ ] Can delete images
- [ ] Can reorder by drag-drop
- [ ] Can set any image as primary
- [ ] Changes persist immediately
- [ ] Optimistic UI updates

**Lightbox:**
- [ ] Opens on image click
- [ ] Shows full-size image
- [ ] Navigation arrows (prev/next)
- [ ] Close button and ESC key
- [ ] Keyboard navigation
- [ ] Touch gestures on mobile
- [ ] Overlay dims background

### Deliverables

- recipe_images table
- ImageGallery component
- Image management mutations
- Lightbox component

---

## 6.4 Image Display & Optimization

### Tasks

127. [ ] Create optimized Image component
128. [ ] Add src, alt, width, height props
129. [ ] Add optional className prop
130. [ ] Add optional sizes prop for responsive
131. [ ] Implement lazy loading with IntersectionObserver
132. [ ] Set loading="lazy" attribute
133. [ ] Create blur placeholder (LQIP) utility
134. [ ] Generate blur hash for placeholder
135. [ ] Display blur placeholder while loading
136. [ ] Configure automatic WebP conversion in storage
137. [ ] Generate multiple image sizes (thumbnail, small, medium, large)
138. [ ] Create srcset with multiple sizes
139. [ ] Add sizes attribute for responsive selection
140. [ ] Implement fade-in animation on image load
141. [ ] Add onLoad event handler
142. [ ] Handle image loading errors
143. [ ] Display fallback image if broken
144. [ ] Show placeholder icon if image missing
145. [ ] Add alt text prop (required)
146. [ ] Validate alt text is provided
147. [ ] Add support for decorative images (alt="")
148. [ ] Configure CDN caching headers
149. [ ] Set appropriate cache-control values
150. [ ] Test lazy loading functionality
151. [ ] Test responsive image selection
152. [ ] Test fallback for broken images
153. [ ] Verify images load in < 1s
154. [ ] Test on slow network (3G)
155. [ ] Verify WebP format served to compatible browsers
156. [ ] Make Image component reusable across app

### Acceptance Criteria

**Image Component:**
- [ ] Accepts src, alt, width, height props
- [ ] Lazy loads images (IntersectionObserver)
- [ ] Shows blur placeholder while loading
- [ ] Fades in on load
- [ ] Handles errors (broken images)
- [ ] Shows fallback image if missing
- [ ] Responsive to container size

**Optimization:**
- [ ] Images converted to WebP automatically
- [ ] Multiple sizes generated (thumbnail, medium, large)
- [ ] srcset used for responsive images
- [ ] Quality optimized (80%)
- [ ] Automatic format selection
- [ ] Images cached by CDN
- [ ] Fast load times (< 1s)

**Accessibility:**
- [ ] Alt text required for uploads
- [ ] Alt text displayed on images
- [ ] Decorative images marked correctly
- [ ] Screen reader friendly

### Deliverables

- Optimized Image component
- Lazy loading implementation
- Blur placeholders
- Responsive image support

---

## 6.5 Image Management UI

### Tasks

157. [ ] Create ImageManager component
158. [ ] Add "Manage Images" button to recipe detail page (owner only)
159. [ ] Create image management modal
160. [ ] Wire button to open modal
161. [ ] Query all recipe images in modal
162. [ ] Display images in grid with checkboxes
163. [ ] Add "Select All" checkbox
164. [ ] Add individual image checkboxes
165. [ ] Track selected images state
166. [ ] Add bulk action toolbar
167. [ ] Show toolbar when images selected
168. [ ] Add "Delete Selected" button
169. [ ] Create bulk delete confirmation modal
170. [ ] Wire bulk delete to API
171. [ ] Update gallery after bulk delete
172. [ ] Add individual delete button per image
173. [ ] Add individual "Set as Primary" button
174. [ ] Add "Edit Alt Text" button per image
175. [ ] Create alt text editing modal/inline edit
176. [ ] Display current alt text in editor
177. [ ] Save alt text changes to database
178. [ ] Add "Download" button per image (optional)
179. [ ] Implement image download functionality
180. [ ] Add "View Full Size" button
181. [ ] Open lightbox on view full size
182. [ ] Add confirmation for all destructive actions
183. [ ] Show loading states for all operations
184. [ ] Display success toast notifications
185. [ ] Display error toast notifications
186. [ ] Add keyboard navigation in manager
187. [ ] Support arrow keys for image selection
188. [ ] Add image search/filter (optional)
189. [ ] Filter by alt text or date (optional)
190. [ ] Create image library view for all user images (optional)
191. [ ] Test image manager opens correctly
192. [ ] Test bulk delete functionality
193. [ ] Test alt text editing
194. [ ] Test all individual actions
195. [ ] Make ImageManager responsive for mobile

### Acceptance Criteria

**Image Manager:**
- [ ] Opens from recipe detail page
- [ ] Shows all recipe images
- [ ] Grid layout with checkboxes
- [ ] Can select multiple images
- [ ] Bulk actions available
- [ ] Individual actions per image
- [ ] Drag-drop reordering works

**Actions:**
- [ ] Delete single image
- [ ] Bulk delete selected
- [ ] Set as primary
- [ ] Edit alt text
- [ ] Download image
- [ ] View full-size

**UX:**
- [ ] Confirmation for destructive actions
- [ ] Loading states shown
- [ ] Success/error feedback
- [ ] Keyboard navigation
- [ ] Mobile-friendly
- [ ] Responsive grid

### Deliverables

- Image management modal
- Bulk actions
- Alt text editing

---

## Testing Checklist

### Unit Tests

- [ ] File validation works correctly
- [ ] Image upload function works
- [ ] Image delete function works
- [ ] URL generation correct
- [ ] Transformations applied

### Integration Tests

- [ ] Can upload single image
- [ ] Can upload multiple images
- [ ] Can delete image
- [ ] Can reorder images
- [ ] Can set primary image
- [ ] Images display correctly
- [ ] Lazy loading works
- [ ] Lightbox works

### Performance Tests

- [ ] Image upload < 5s
- [ ] Optimized images load < 1s
- [ ] Lazy loading reduces initial load
- [ ] No memory leaks
- [ ] CDN caching works

### Manual Testing

- [ ] Upload various image formats
- [ ] Upload large images (8-10MB)
- [ ] Try invalid files
- [ ] Test drag-and-drop
- [ ] Reorder images
- [ ] View lightbox
- [ ] Test on mobile
- [ ] Test on slow connection

---

## Definition of Done

- [ ] All tasks completed
- [ ] All acceptance criteria met
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] No critical bugs
- [ ] Images optimized and fast
- [ ] Ready for next milestone

---

## Dependencies

- Milestone 02 (Core Recipe Management)
- Milestone 04 (Cookbook Management)

---

## Blockers & Risks

**Potential Blockers:**
- Storage service costs
- Upload performance
- Image optimization complexity

**Mitigation:**
- Use Cloudinary free tier initially
- Implement upload size limits
- Use proven image libraries
- Monitor storage usage

---

## Notes

- **Recommended**: Cloudinary (easier setup, built-in optimization)
- **Alternative**: AWS S3 + CloudFront (more control, potentially cheaper at scale)
- Free tier limits:
  - Cloudinary: 25GB storage, 25GB bandwidth
  - AWS S3: 5GB storage, 20k GET requests (first year)
- Consider implementing lazy loading early for performance
- Implement image cleanup (delete unused images)
- Consider watermarking for copyright (optional)
