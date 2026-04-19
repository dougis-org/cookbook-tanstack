---
name: tests
description: Tests for the recipe-image-upload change
---

# Tests

## Overview

All work follows strict TDD: write failing test → implement to pass → refactor. Each test case maps to a
task in `tasks.md` and an acceptance scenario in `specs/`.

## Testing Steps

For each task:

1. **Write failing test** — capture requirement, run, confirm it fails
2. **Write minimal implementation** — make test pass
3. **Refactor** — improve quality, re-run tests

---

## Test Cases

### task-1 / task-2: POST /api/upload route

File: `src/routes/api/upload/__tests__/-upload.test.ts`
Spec: `specs/upload-api.md`

- [ ] **POST — authenticated, valid file → 200 `{ url, fileId }`**
  - Mock ImageKit `client.files.upload()` returning `{ url: "https://ik.imagekit.io/...", fileId: "abc123" }`
  - Mock `auth.api.getSession` returning a valid session
  - Assert response status 200, body contains `url` and `fileId`
  - Spec: "Valid authenticated upload"

- [ ] **POST — unauthenticated → 401**
  - Mock `auth.api.getSession` returning null
  - Assert response status 401, body `{ error: "Unauthorized" }`
  - Spec: "Unauthenticated upload attempt"

- [ ] **POST — missing file field → 400**
  - Send empty FormData
  - Assert response status 400, body `{ error: "No file provided" }`
  - Spec: "Missing file field"

- [ ] **POST — ImageKit SDK throws → 500**
  - Mock ImageKit `client.files.upload()` throwing an error
  - Assert response status 500, body `{ error: "Upload failed" }`
  - Spec: "ImageKit SDK error"

- [ ] **DELETE — authenticated, valid fileId → 200 `{ success: true }`**
  - Mock ImageKit `client.files.delete()` resolving
  - Assert response status 200, body `{ success: true }`
  - Spec: "Valid authenticated delete"

- [ ] **DELETE — unauthenticated → 401**
  - Mock session as null
  - Assert response status 401
  - Spec: "Unauthenticated delete attempt"

- [ ] **DELETE — fileId not found → 404**
  - Mock ImageKit `client.files.delete()` throwing a 404-like error
  - Assert response status 404, body `{ error: "File not found" }`
  - Spec: "FileId not found in ImageKit"

---

### task-3 / task-4: ImageUploadField component

File: `src/components/ui/__tests__/ImageUploadField.test.tsx`
Spec: `specs/image-upload-field.md`

- [ ] **Idle state — renders upload prompt, no preview**
  - Render with `value={null}`
  - Assert upload prompt text visible, no `<img>` element
  - Spec: (implicit idle state)

- [ ] **File selected → spinner → preview on success**
  - Mock fetch `POST /api/upload` resolving `{ url: "https://...", fileId: "x1" }`
  - Simulate file input change with a valid 1 MB JPEG File object
  - Assert spinner shown during fetch, then `<img src="https://...">` rendered after resolve
  - Spec: "User selects a valid image file"

- [ ] **File > 10 MB → error shown, no fetch**
  - Simulate file input change with 11 MB File object
  - Assert error message "File must be under 10 MB" shown, fetch not called
  - Spec: "User selects oversized file"

- [ ] **Fetch returns error → error shown, no preview**
  - Mock fetch returning 500
  - Simulate valid file select
  - Assert error message shown, no `<img>` rendered
  - Spec: "Upload fails with server error"

- [ ] **Remove pending upload → DELETE called, preview cleared, onRemove called**
  - After successful upload (pendingFileId set), click Remove
  - Assert `DELETE /api/upload/x1` called, preview cleared, `onRemove` spy called
  - Spec: "User removes a pending upload"

- [ ] **Remove existing URL (no fileId) → no DELETE, preview cleared, onRemove called**
  - Render with `value="https://existing.url"`, `initialUrl="https://existing.url"` (no pendingUpload)
  - Click Remove
  - Assert no DELETE fetch called, `onRemove` spy called
  - Spec: "User removes an existing saved image URL"

- [ ] **Replace: upload A then upload B → DELETE A's fileId, B uploaded**
  - Upload image A → pendingFileId = "A"
  - Simulate second file select for image B
  - Assert `DELETE /api/upload/A` called before B's upload
  - Assert final state shows B's preview
  - Spec: "User uploads a second image"

---

### task-5 / task-6: RecipeForm image integration

File: `src/components/recipes/__tests__/RecipeForm.test.tsx`
Spec: `specs/recipe-form-image.md`

- [ ] **ImageUploadField rendered in form**
  - Render `RecipeForm` without `initialData`
  - Assert `ImageUploadField` is present (or its upload prompt text)
  - Spec: "New recipe form shows empty image upload field"

- [ ] **initialData.imageUrl passed to ImageUploadField**
  - Render with `initialData` containing `imageUrl: "https://existing.jpg"`
  - Assert `ImageUploadField` receives `value="https://existing.jpg"`
  - Spec: "Edit recipe form pre-populates image from existing data"

- [ ] **imageUrl included in create mutation payload after upload**
  - Simulate upload interaction → `onUpload("https://ik.url", "fid")` called
  - Submit form
  - Assert `recipes.create` called with `imageUrl: "https://ik.url"`
  - Spec: "Recipe created with image"

- [ ] **imageUrl included in update mutation payload after upload**
  - Render with `initialData` (edit mode), simulate upload, submit
  - Assert `recipes.update` payload includes `imageUrl`
  - Spec: "Recipe saved with image"

- [ ] **imageUrl absent from payload when no image uploaded**
  - Submit form without interacting with image field
  - Assert mutation payload does not include `imageUrl` (or is undefined/null)
  - Spec: "Recipe saved without image"

- [ ] **blocker.proceed calls DELETE on pendingUpload**
  - Simulate upload (pendingUpload set), trigger navigation-away, confirm in blocker dialog
  - Assert `DELETE /api/upload/:fileId` called before navigation
  - Spec: "User uploads image then navigates away and confirms"

- [ ] **blocker cancel does NOT call DELETE**
  - Simulate upload, trigger nav-away, cancel in blocker dialog
  - Assert no DELETE called
  - Spec: "User uploads image then navigates away but cancels"

- [ ] **handleRevert calls DELETE and resets imageUrl**
  - Edit mode, upload new image, click Revert
  - Assert DELETE called, `imageUrl` reverts to `initialData.imageUrl`
  - Spec: "User uploads image then reverts"

---

### E2E (Playwright)

File: `e2e/` (new test file)
Spec: all three specs

- [ ] **Full upload flow: upload image, save recipe, image displays on card**
  - Navigate to create recipe
  - Fill required fields
  - Select a small test image file
  - Assert preview shown in form
  - Submit form
  - Assert `RecipeCard` renders the image (not the placeholder)

- [ ] **Cancel after upload: pending image deleted**
  - Upload image in new recipe form
  - Click Cancel, confirm in dialog
  - Assert no orphan exists (requires ImageKit API check or test-mode mock)
  - Note: this may be approximated by asserting the DELETE request was made via network intercept
