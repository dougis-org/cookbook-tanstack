# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feature/recipe-image-upload` then
  immediately `git push -u origin feature/recipe-image-upload`

## Execution

### task-0: Install current ImageKit Node SDK and configure env vars

- [x] Run `npm install @imagekit/nodejs@latest`
- [x] Add to `.env.example`:

```text
IMAGE_KIT_API_KEY=
```

- [x] Confirm actual `IMAGE_KIT_API_KEY` value exists in `.env.local` (not committed)
- [x] Create `src/lib/imagekit.ts` — server-side singleton exporting configured `@imagekit/nodejs` client
- **Verify:** `npm run build` succeeds; no client bundle references to `IMAGE_KIT_API_KEY`

### task-1: Write tests for POST /api/upload route (TDD first)

- [x] Create `src/routes/api/upload/__tests__/-upload.test.ts`
- [x] Test: authenticated request with valid file → HTTP 200 `{ url, fileId }`
- [x] Test: unauthenticated request → HTTP 401
- [x] Test: missing file field → HTTP 400
- [x] Test: unsupported file type → HTTP 400
- [x] Test: ImageKit SDK throws → HTTP 500
- [x] Mock `src/lib/imagekit.ts` and Better-Auth `auth.api.getSession`
- **Verify:** `npx vitest run src/routes/api/upload/__tests__/-upload.test.ts` — all tests fail as expected
  before implementation.

### task-2: Implement POST /api/upload and DELETE /api/upload/:fileId routes

- [x] Create `src/routes/api/upload/index.tsx`:
  - `POST` handler: verify session → `request.formData()` → validate file field → upload via
    `client.files.upload(...)` → return `{ url, fileId }`
  - Enforce 10 MB limit server-side
  - Convert uploaded `File` to `Buffer` before passing it to the ImageKit SDK
  - Restrict uploads to JPEG, PNG, WebP, and GIF images
  - Persist uploaded `fileId` ownership for the authenticated user
- [x] Create `src/routes/api/upload/$fileId.tsx`:
  - `DELETE` handler: verify session → verify file ownership → call `client.files.delete(fileId)` →
    return `{ success: true }`
  - Handle 404 from ImageKit → return HTTP 404
- [x] Write tests for DELETE route in same test file
- **Verify:** `npx vitest run src/routes/api/upload/__tests__/-upload.test.ts` — all tests pass

### task-3: Write tests for ImageUploadField component (TDD first)

- [x] Create `src/components/ui/__tests__/ImageUploadField.test.tsx`
- [x] Test: idle state renders upload prompt, no preview
- [x] Test: file selected → spinner shown → on fetch resolve → preview renders
- [x] Test: file > 10 MB → error shown, no fetch called
- [x] Test: fetch returns error → error shown, no preview
- [x] Test: Remove button on pending upload → DELETE fetch called, preview cleared, `onRemove` called
- [x] Test: Remove button on existing URL (no fileId) → no DELETE fetch, preview cleared, `onRemove` called
- [x] Test: upload image A then image B → DELETE called with A's fileId, B's preview shown
- [x] Mock `fetch` globally in tests
- **Verify:** `npx vitest run src/components/ui/__tests__/ImageUploadField.test.tsx` — all fail (expected)

### task-4: Implement ImageUploadField component

- [x] Create `src/components/ui/ImageUploadField.tsx`
- [x] Props interface:

  ```typescript
  interface ImageUploadFieldProps {
    value: string | null        // current imageUrl (from form state)
    initialUrl?: string | null  // from initialData (existing saved image)
    onUpload: (url: string, fileId: string) => void
    onRemove: () => void
  }
  ```

- [x] Internal state: `uploading: boolean`, `error: string | null`, `pendingFileId: string | null`
- [x] Idle state: dashed border, camera icon, "Click to upload" label, hidden `<input type="file" accept="image/*">`
- [x] Uploading state: spinner, "Uploading…" text
- [x] Preview state: `<img>` with `value` URL, "Remove" and "Change" buttons
- [x] Error state: inline error message below field
- [x] `onChange` handler: validate size → POST `/api/upload` → call `onUpload(url, fileId)` or set error
- [x] Remove handler: if `pendingFileId` → DELETE `/api/upload/:fileId`; always call `onRemove()`
- [x] Replace handler: if `pendingFileId` → DELETE old; then upload new
- **Verify:** `npx vitest run src/components/ui/__tests__/ImageUploadField.test.tsx` — all pass

### task-5: Write tests for RecipeForm imageUrl integration (TDD first)

- [x] Add to `src/components/recipes/__tests__/RecipeForm.test.tsx`:
  - Test: `ImageUploadField` rendered in form
  - Test: `initialData.imageUrl` passed as `value` to `ImageUploadField`
  - Test: `imageUrl` included in create mutation payload after upload
  - Test: `imageUrl` included in update mutation payload after upload
  - Test: `imageUrl` absent from payload when no image uploaded
  - Test: removing an existing image sends `imageUrl: null` in the update payload
- **Verify:** new tests fail (expected)

### task-6: Update RecipeForm — schema, pendingUpload state, cleanup hooks

- [x] Add `imageUrl: z.string().nullable().optional()` to `recipeFormSchema` in
  `src/components/recipes/RecipeForm.tsx`
- [x] Add `pendingUpload: { fileId: string; url: string } | null` React state
- [x] Add `pendingUploadRef` (ref tracking pendingUpload for use in async callbacks)
- [x] Add `cleanupPendingUpload()` helper: fires `DELETE /api/upload/:fileId` if ref is set, then clears state
- [x] Wire `cleanupPendingUpload` into `blocker.proceed` (wrap with async cleanup then proceed)
- [x] Wire `cleanupPendingUpload` into `handleRevert()` (call before reset)
- [x] Add `<ImageUploadField>` in form body (below title, above ingredients):
  - `value={watch('imageUrl') ?? null}`
  - `initialUrl={initialData?.imageUrl ?? null}`
  - `onUpload={(url, fileId) => { setValue('imageUrl', url); setPendingUpload({ fileId, url }) }}`
  - `onRemove={() => { setValue('imageUrl', null); setPendingUpload(null) }}`
- [x] Add `imageUrl` to `toPayload()` mapping
- [x] On successful save: clear `pendingUpload` state (image is now permanent)
- **Verify:** `npx vitest run src/components/recipes/__tests__/RecipeForm.test.tsx` — all pass

### task-7: Type-check and build

- [x] `npx tsc --noEmit` — zero errors
- [x] `npm run build` — succeeds
- [x] Confirm `IMAGE_KIT_API_KEY` not in `.output/` client assets

## Validation

- [x] `npm run test` — all unit/integration tests pass
- [ ] `npm run test:e2e` — existing E2E tests pass
- [x] `npx tsc --noEmit` — zero type errors
- [x] `npm run build` — clean build
- [ ] Manual smoke test: start dev server (`npm run dev`), create recipe, upload image, verify preview and card display
- [ ] All tasks in Execution section marked complete

E2E note: `npm run test:e2e` is currently blocked by existing admin/cookbook auth failures unrelated to this
change. A focused serial retry reproduced failures in `src/e2e/admin/admin-users.spec.ts` and
`src/e2e/cookbooks-auth.spec.ts` before upload-specific coverage was reached.

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **E2E tests** — `npm run test:e2e` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [ ] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to `feature/recipe-image-upload` and push to remote
- [ ] Open PR from `feature/recipe-image-upload` to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them,
  commit fixes, follow all steps in [Remote push validation], push, wait 180 seconds, then repeat until no
  unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix
  the failure, commit fixes, follow all steps in [Remote push validation], push, wait 180 seconds, then repeat
  until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is
  `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user. Never wait for a human to report the
  merge; never force-merge.

Ownership metadata:

- Implementer: Claude Code agent
- Reviewer(s): @dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally (all Remote push validation steps) → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update `.env.example` documentation in `README.md` if not already done
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/recipe-image-upload/` to
  `openspec/changes/archive/2026-04-16-recipe-image-upload/` and stage both paths in a single commit
- [ ] Confirm `openspec/changes/archive/2026-04-16-recipe-image-upload/` exists and
  `openspec/changes/recipe-image-upload/` is gone
- [ ] Commit and push the archive to `main` in one commit
- [ ] `git fetch --prune` and `git branch -d feature/recipe-image-upload`
