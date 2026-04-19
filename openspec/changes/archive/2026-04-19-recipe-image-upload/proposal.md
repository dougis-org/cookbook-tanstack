## GitHub Issues

- #318

## Why

- Problem statement: `RecipeForm` has no way to upload an image. `imageUrl` exists in the schema and is
  already rendered in `RecipeCard` and `RecipeDetail`, but users cannot populate it.
- Why now: Display infrastructure is complete — the field is wired end-to-end except for the upload input.
  Completing this closes the loop on recipe presentation quality.
- Business/user impact: Recipes without images show generic placeholders. Image upload is a standard expectation
  for a recipe app; omitting it reduces engagement and perceived quality.

## Problem Space

- Current behavior: `RecipeForm` has no `imageUrl` field. Users can't attach images to recipes. `RecipeCard`
  and `RecipeDetail` silently omit the image section when `imageUrl` is null.
- Desired behavior: Users can select an image file in `RecipeForm`. It uploads inline, shows a preview, and
  stores the URL in `imageUrl` on save. Images are stored in ImageKit.io.
- Constraints:
  - tRPC doesn't handle `multipart/form-data` — upload must go through a separate Nitro API route.
  - The existing `recipes.update` tRPC mutation already accepts `imageUrl` via `recipeFields.partial()`;
    no tRPC changes needed.
  - ImageKit private API key must stay server-side only.
  - Orphaned uploads (uploaded but form cancelled) must be cleaned up via DELETE call on cancel.
- Assumptions:
  - ImageKit.io free tier is acceptable (20 GB storage, 20 GB bandwidth/mo, unlimited transformations).
  - A single upload folder in ImageKit (`/cookbook/recipes/`) is sufficient.
  - File size limit of 10 MB per image is acceptable.
  - Accepted formats: JPEG, PNG, WebP, GIF.
- Edge cases considered:
  - User uploads image A, then uploads image B (replace): image A must be deleted from ImageKit immediately.
  - User uploads image then cancels/navigates away: pending upload must be deleted via `blocker.proceed`
    hook and `handleRevert`.
  - User edits recipe that already has a saved image, uploads a new one, then cancels: only the new pending
    image is deleted; existing saved image is untouched.
  - Upload fails mid-flight: error shown inline, `imageUrl` not updated, no orphan created.
  - Remove button clicked on a pending upload: DELETE call fires immediately.
  - Remove button clicked on an existing saved image: `imageUrl` cleared in form state, no DELETE call to
    ImageKit; server-side cleanup is out of scope for v1.

## Scope

### In Scope

- `ImageUploadField` UI component (upload, preview, remove, loading states)
- `POST /api/upload` Nitro route — accepts multipart file, uploads to ImageKit, returns `{ url, fileId }`
- `DELETE /api/upload/:fileId` Nitro route — deletes file from ImageKit by fileId
- `RecipeForm` changes: add `imageUrl` to schema, `pendingUpload` state, cleanup on cancel/revert/navigate-away
- ImageKit Node SDK installation (`@imagekit/nodejs` package)
- Environment variable setup (`IMAGE_KIT_API_KEY`)
- Vitest unit tests for new component and routes
- Playwright E2E test for upload flow

### Out of Scope

- Deleting the old ImageKit image when an existing saved `imageUrl` is replaced (v1 accepts orphans for this case)
- Image cropping or client-side resize
- Drag-and-drop upload (file input click is sufficient for v1)
- Cookbook image upload (separate feature)
- CDN URL transformation parameters on display side

## What Changes

- New file: `src/routes/api/upload/index.tsx` — POST upload handler
- New file: `src/routes/api/upload/$fileId.tsx` — DELETE handler
- New file: `src/components/ui/ImageUploadField.tsx` — reusable upload UI component
- Modified: `src/components/recipes/RecipeForm.tsx` — add image upload field, pending upload state, cleanup hooks
- Modified: `.env.example` — add ImageKit env var keys
- Modified: `.env.local` — add ImageKit credentials (not committed)
- New package: `@imagekit/nodejs`

## Risks

- Risk: ImageKit outage blocks image uploads
  - Impact: Medium — users can't upload images, but existing recipes and other features unaffected
  - Mitigation: Upload errors shown inline; recipe save still works without image

- Risk: private API key leaked via client bundle
  - Impact: High — attacker could upload/delete arbitrary files
  - Mitigation: ImageKit API key used only in Nitro server routes, never imported client-side; reviewed
    in security pass before merge

- Risk: Orphaned images accumulate (cancelled uploads)
  - Impact: Low — storage cost negligible at this scale
  - Mitigation: Option B cleanup — DELETE on cancel via blocker hook and handleRevert; covers the primary path

- Risk: Large files cause slow inline uploads
  - Impact: Low-medium — 10 MB limit enforced client-side before upload starts

## Open Questions

No unresolved ambiguity. All design decisions confirmed during exploration:

- Storage provider: ImageKit.io ✓
- Upload timing: inline on file select ✓
- Orphan strategy: Option B (delete on cancel) ✓
- Upload endpoint: separate Nitro route (not tRPC) ✓

## Non-Goals

- Image hosting for any entity other than recipes in this change
- Client-side image editing (crop, rotate, filter)
- Bulk image import from existing recipe data
- CDN configuration or custom domain for ImageKit

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
