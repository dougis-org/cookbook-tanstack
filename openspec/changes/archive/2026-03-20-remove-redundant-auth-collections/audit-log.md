# Audit Log — remove-redundant-auth-collections

## 1. Legacy collection reference audit

### Findings
- No runtime code (routes, models, seed scripts, initialization code) queries collections named `users`, `sessions`, or `accounts`.
- The only occurrences of `users`, `sessions`, or `accounts` were in test code or variable names:
  - `src/lib/__tests__/trpc.test.ts` mocked `@/db/schema` and included `users`, `sessions`, `accounts`. (Removed in this change.)
  - `src/test-helpers/__tests__/with-db-tx.unit.test.ts` mocked a `users` collection name; updated to `user`.
  - Several files contain variable names like `usersCollection` but refer to the Better-Auth `user` collection.

### Notes
- Better-Auth uses the collections: `user`, `session`, `account`, `verification`. These are still present and used by the app.
- No database seed or migration scripts currently create legacy collections.

## 2. Model audit

- `src/db/models/` contains no `user.model.ts`, `session.model.ts`, or `account.model.ts` files.
- Barrel export at `src/db/models/index.ts` does not reference those models.

## 3. Seeds audit

- `src/db/seeds/` contains no references to legacy collections.

## 4. Config audit

- `.env.example` does not reference legacy collection names.
- `src/lib/auth.ts` uses Better-Auth adapter and does not mention legacy collections.
- `src/db/index.ts` creates a MongoDB connection without initializing any legacy collections.
