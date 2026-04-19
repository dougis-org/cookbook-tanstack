## Context

- Relevant architecture:
  - TanStack Start with Nitro — file-based routing in `src/routes/`, API handlers at `src/routes/api/`
  - tRPC over fetch at `/api/trpc/$` — cannot handle `multipart/form-data`
  - Existing `recipes.update` tRPC mutation accepts `imageUrl?: string` via `recipeFields.partial()`
  - `RecipeCard` and `RecipeDetail` already render `imageUrl` when non-null
  - `RecipeForm` uses `react-hook-form` + zod + `useBlocker` for navigation guard
  - Auth: Better-Auth sessions, `protectedProcedure` in tRPC context
- Dependencies:
  - `@imagekit/nodejs` npm package (current Node SDK for ImageKit.io; verified latest `7.5.0`)
  - ImageKit.io account with server API key in env: `IMAGE_KIT_API_KEY`
- Interfaces/contracts touched:
  - `RecipeFormValues` zod schema (add `imageUrl`)
  - `RecipeForm` props/state (add `pendingUpload` state, cleanup hooks)
  - New REST routes: `POST /api/upload`, `DELETE /api/upload/:fileId`

## Goals / Non-Goals

### Goals

- Users can upload a recipe image inline in `RecipeForm`; preview shows immediately
- Upload fires on file select, not on form submit
- Pending uploads (not yet saved to DB) are deleted from ImageKit on cancel/revert/navigate-away
- Upload/delete goes through server-side Nitro routes (`IMAGE_KIT_API_KEY` never exposed to client)
- `imageUrl` flows into existing `recipes.update` mutation unchanged

### Non-Goals

- Deleting the old ImageKit file when a saved `imageUrl` is replaced
- Image transformations, cropping, or client-side resize
- Drag-and-drop
- Cookbook image upload

## Decisions

### Decision 1: Separate Nitro API routes for upload/delete (not tRPC)

- Chosen: `POST /api/upload` and `DELETE /api/upload/$fileId` as TanStack Start file-based API routes
  using `server.handlers`
- Alternatives considered: tRPC mutation accepting base64-encoded file data
- Rationale: tRPC's fetch adapter doesn't natively support `multipart/form-data`. Web `Request.formData()`
  in Nitro handles it natively with no extra dependencies. Matches existing API route patterns.
- Trade-offs: Two endpoints to maintain vs one tRPC mutation; slight auth duplication in the route handler
  instead of tRPC context.

### Decision 2: ImageKit.io as storage provider

- Chosen: ImageKit.io with the current `@imagekit/nodejs` Node SDK
- Alternatives considered: Cloudinary (more ecosystem), S3/R2 (presigned upload)
- Rationale: Unlimited real-time URL transformations on free tier, clean Node SDK, and one environment that
  works in dev and production with no local/cloud branching.
- Trade-offs: Smaller ecosystem than Cloudinary; free tier bandwidth cap could be hit if traffic grows.

### Decision 3: Inline upload on file select with pendingUpload state

- Chosen: Upload fires immediately on `<input type="file">` change event. `pendingUpload` is tracked in
  React state alongside RHF form state.
- Alternatives considered: Upload on form submit (simpler state, no orphan problem); URL-only text field (no UX)
- Rationale: User needs preview before committing. Inline upload is the standard pattern. `pendingUpload`
  only tracks session-uploaded images that have not been persisted to DB.
- Trade-offs: Requires cleanup hooks on three exit paths (save, cancel/blocker, revert)

### Decision 4: Option B orphan cleanup (delete on cancel)

- Chosen: `pendingUpload.fileId` deleted via `DELETE /api/upload/:fileId` on `blocker.proceed`,
  `handleRevert`, and replace.
- Alternatives considered: Accept all orphans (Option A); ImageKit TTL folder (Option C)
- Rationale: Explicit cleanup prevents storage waste without requiring external TTL configuration. `blocker`
  already intercepts navigation-away scenarios when the form is dirty.
- Trade-offs: Three cleanup points to maintain; async DELETE fire-and-forget on cancel (non-blocking)

### Decision 5: Authentication on upload routes

- Chosen: Read session from Better-Auth in route handler using
  `auth.api.getSession({ headers: request.headers })`; return 401 if no session.
- Alternatives considered: No auth on upload (anyone can upload); tRPC protectedProcedure (not applicable)
- Rationale: Prevents unauthenticated file uploads consuming ImageKit quota. Matches the auth pattern already
  used in `src/lib/auth.ts`.
- Trade-offs: Slight coupling between upload route and Better-Auth session shape

## Proposal to Design Mapping

- Proposal element: tRPC `recipes.update` already accepts `imageUrl`
  - Design decision: Decision 1 — upload route returns URL, form passes it to existing mutation unchanged
  - Validation approach: Integration test — upload → update → verify DB field

- Proposal element: Inline upload with preview
  - Design decision: Decision 3 — `pendingUpload` state drives preview, upload on file select
  - Validation approach: Unit test `ImageUploadField` state transitions; E2E Playwright test

- Proposal element: Option B orphan cleanup
  - Design decision: Decision 4 — cleanup on blocker.proceed, handleRevert, and replace
  - Validation approach: Unit test each cleanup path; mock `DELETE /api/upload/:fileId`

- Proposal element: API key never client-side
  - Design decision: Decision 1 + 5 — all ImageKit SDK calls in Nitro server handlers only
  - Validation approach: Security review — grep for `IMAGE_KIT_API_KEY` in client bundle

- Proposal element: 10 MB file size limit
  - Design decision: Client-side validation in `ImageUploadField` before upload fires; server also enforces
    via formData size check.
  - Validation approach: Unit test with oversized mock file

## Functional Requirements Mapping

- Requirement: User can select image file and see preview before saving
  - Design element: `ImageUploadField` component with file input, upload-on-change, preview state
  - Acceptance criteria reference: specs/image-upload-field.md
  - Testability notes: Unit test state transitions (idle → uploading → preview); mock fetch

- Requirement: Upload fires to `/api/upload`, returns `{ url, fileId }`
  - Design element: `POST /api/upload` Nitro route using `request.formData()`, image type validation,
    `Buffer.from(await file.arrayBuffer())`, and `@imagekit/nodejs` `client.files.upload(...)`
  - Acceptance criteria reference: specs/upload-api.md
  - Testability notes: Unit test route handler with mock ImageKit SDK

- Requirement: Pending upload deleted on cancel/navigate-away
  - Design element: `pendingUpload` ref in RecipeForm; cleanup called in `blocker.proceed` wrapper and `handleRevert`
  - Acceptance criteria reference: specs/recipe-form-image.md
  - Testability notes: Unit test RecipeForm cancel path with mock DELETE call

- Requirement: `imageUrl` saved to DB on recipe save
  - Design element: `imageUrl` added to `recipeFormSchema`; flows through existing `toPayload` → `recipes.update`
  - Acceptance criteria reference: specs/recipe-form-image.md
  - Testability notes: Existing update mutation test; E2E upload-and-save

- Requirement: Replace image deletes previous pending upload
  - Design element: Before setting new `pendingUpload`, if current `pendingUpload` exists, fire DELETE
  - Acceptance criteria reference: specs/image-upload-field.md
  - Testability notes: Unit test: upload A → upload B → assert DELETE called with A's fileId

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: `IMAGE_KIT_API_KEY` never in client bundle
  - Design element: ImageKit SDK imported only in `src/routes/api/upload/` files (Nitro server-only)
  - Acceptance criteria reference: specs/upload-api.md
  - Testability notes: Security review; bundle analysis if needed

- Requirement category: security
  - Requirement: Only authenticated users can upload
  - Design element: Decision 5 — session check in route handler, 401 on no session
  - Acceptance criteria reference: specs/upload-api.md
  - Testability notes: Unit test route with missing/invalid session header

- Requirement category: performance
  - Requirement: 10 MB file size limit enforced before upload
  - Design element: Client-side check in `ImageUploadField` onChange; server-side formData size guard
  - Acceptance criteria reference: specs/image-upload-field.md
  - Testability notes: Unit test with 11 MB mock File object

- Requirement category: reliability
  - Requirement: Upload failure shows inline error; form remains submittable
  - Design element: `ImageUploadField` error state; upload failure does not block form save
  - Acceptance criteria reference: specs/image-upload-field.md
  - Testability notes: Unit test with fetch mock returning 500

## Risks / Trade-offs

- Risk/trade-off: DELETE call on cancel is fire-and-forget (async, not awaited before navigation)
  - Impact: Low — rare race condition where navigation completes before DELETE; image orphaned
  - Mitigation: Acceptable for v1; could add `await` in blocker.proceed if needed

- Risk/trade-off: No cleanup when saved imageUrl is replaced by new upload
  - Impact: Low — orphaned ImageKit files accumulate slowly
  - Mitigation: Documented as known v1 limitation; addressable in follow-up

- Risk/trade-off: ImageKit SDK bundled server-side only
  - Impact: Needs careful import boundaries; TanStack Start/Vite must not tree-shake it into client bundle
  - Mitigation: Import only inside `src/routes/api/upload/` which Nitro treats as server-only

## Rollback / Mitigation

- Rollback trigger: Upload endpoint throwing unhandled errors in production, or ImageKit credentials causing
  500s on recipe save attempts.
- Rollback steps:
  1. Revert `RecipeForm` changes (remove `ImageUploadField`, `imageUrl` schema field, `pendingUpload` state)
  2. Remove `src/routes/api/upload/` routes
  3. Remove `@imagekit/nodejs` package
  4. Existing `imageUrl` values in DB are unaffected — `RecipeCard`/`RecipeDetail` continue rendering them
- Data migration considerations: None — `imageUrl` is an optional field; removing upload UI does not corrupt existing data
- Verification after rollback: `npm run build` succeeds; recipe create/edit forms function without image field

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix failing tests/lint before proceeding. Upload route unit tests and
  RecipeForm cancel-path tests are required green.
- If security checks fail: Do not merge. Any scan finding `IMAGE_KIT_API_KEY` accessible client-side is
  a blocker.
- If required reviews are blocked/stale: Ping reviewer after 24h. If no response after 48h, escalate to repo owner.
- Escalation path and timeout: If blocked >48h on review, open a discussion comment on the PR tagging @dougis.

## Open Questions

No open questions. All design decisions confirmed during proposal exploration phase.
