# Milestone 06: Image Management

**Duration**: 1 week
**Status**: Not Started
**Dependencies**: Milestones 02 (Core Recipe Management), 04 (Cookbook Management)

## Overview

Implement comprehensive image management including upload, storage, optimization, galleries, and display throughout the application using Cloudinary or AWS S3.

---

## 6.1 Storage Setup

### Tasks

- [ ] Choose storage solution (Cloudinary vs S3)
- [ ] Create storage account
- [ ] Configure API credentials
- [ ] Set up environment variables
- [ ] Create storage service module
- [ ] Implement upload function
- [ ] Implement delete function
- [ ] Implement transformation/optimization
- [ ] Set up CDN (if using S3)
- [ ] Configure CORS

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

- [ ] Create image upload tRPC mutation
- [ ] Build ImageUpload component
- [ ] Implement drag-and-drop
- [ ] Add file selection button
- [ ] Implement file validation (type, size)
- [ ] Add upload progress indicator
- [ ] Implement preview before upload
- [ ] Add crop/resize functionality (optional)
- [ ] Implement multiple file upload
- [ ] Add image to recipe mutation
- [ ] Handle upload errors

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

- [ ] Update recipe schema for multiple images
- [ ] Create recipe_images junction table
- [ ] Add imageOrder field
- [ ] Create gallery tRPC mutations
- [ ] Build ImageGallery component
- [ ] Implement gallery view on recipe detail
- [ ] Add "Add Images" button
- [ ] Implement image reordering (drag-drop)
- [ ] Add image deletion
- [ ] Add "Set as Primary" functionality
- [ ] Build lightbox for full-size view

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

- [ ] Create Image component with lazy loading
- [ ] Implement responsive image sizes
- [ ] Add blur placeholder (LQIP)
- [ ] Implement automatic WebP conversion
- [ ] Add srcset for responsive images
- [ ] Implement lazy loading
- [ ] Add fade-in animation on load
- [ ] Handle missing images gracefully
- [ ] Add image alt text support
- [ ] Implement image caching

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

- [ ] Build image manager for recipes
- [ ] Add "Manage Images" button to recipe detail
- [ ] Create image management modal
- [ ] Show all images with actions
- [ ] Implement bulk delete
- [ ] Add image metadata editing
- [ ] Implement alt text editing
- [ ] Add image search (optional)
- [ ] Build image library view (optional)

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
