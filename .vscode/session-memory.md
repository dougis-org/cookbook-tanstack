# Remove Redundant Auth Collections - Implementation Progress

## Completed Steps (RED → GREEN → REFACTOR)

### 1. Tests Created (RED)
- ✅ Created `src/server/trpc/routers/__tests__/users.test.ts` with comprehensive tests:
  - `users.me` - returns current user from Better-Auth session
  - `users.updateProfile` - updates user name/image in MongoDB
  - Input validation tests (empty, invalid URL, name length)
  - Field preservation test

### 2. Implementation (GREEN)
- ✅ Updated `src/server/trpc/routers/users.ts`:
  - Removed Mongoose `User` model import
  - Changed `me` query to return `ctx.user` directly (from Better-Auth session)
  - Changed `updateProfile` to use MongoDB driver directly via `getMongoClient()`
  - Uses ObjectId for querying the "user" collection

### 3. Test Helpers (REFACTOR)
- ✅ Created `src/server/trpc/routers/__tests__/test-helpers.ts`:
  - Implemented `seedUserWithBetterAuth()` function using `auth.api.signUpEmail`
  - This replaces the old Mongoose-based `seedUser()` pattern

### 4. Updated Existing Tests
- ✅ `src/server/trpc/routers/__tests__/cookbooks.test.ts` - updated to use `seedUserWithBetterAuth`
- ✅ `src/server/trpc/routers/__tests__/sources.test.ts` - updated to use `seedUserWithBetterAuth`
- ✅ `src/server/trpc/routers/__tests__/recipes.test.ts` - updated to use `seedUserWithBetterAuth`

### 5. Updated Barrel Export
- ✅ `src/db/models/index.ts` - removed exports for User, Session, Account models

## Remaining Tasks

### Files to Delete (requires manual deletion or terminal)
These files are no longer imported and should be deleted:
- `src/db/models/user.ts`
- `src/db/models/session.ts`
- `src/db/models/account.ts`

These files are orphaned since the barrel export no longer references them.

### Next Steps
1. Delete the three model files listed above
2. Run TypeScript compilation: `npx tsc --noEmit`
3. Run tests: `npm run test`
4. Verify no broken imports or compilation errors
5. Create PR and enable auto-merge
6. Archive the change in OpenSpec

## Notes
- Better-Auth's `api.signUpEmail` is used for seeding users in tests
- MongoDB driver is used directly for updates instead of Mongoose
- The `ctx.user` object from Better-Auth sessions is sufficient for returning user data
