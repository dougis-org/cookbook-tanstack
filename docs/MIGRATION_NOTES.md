# Migration Notes: Removing Redundant Auth Collections

This document describes the cleanup of legacy authentication collections (`users`, `sessions`, `accounts`) that were previously created during the Laravel/Migrations era.

## Why this change happened

The CookBook app now uses **Better-Auth** as the single source of truth for authentication. Better-Auth manages its own set of MongoDB collections (`user`, `session`, `account`, `verification`). The old collections (`users`, `sessions`, `accounts`) are no longer used by the application and should be removed to avoid confusion and potential stale data.

## What changed

- Code no longer references the legacy collections `users`, `sessions`, or `accounts`.
- The database schema documentation has been updated to reflect the current collection set.
- Database seed scripts and initialization code no longer attempt to create or populate the legacy collections.

## Cleanup steps (optional)

If you have an existing MongoDB database that might still have the legacy collections, you can drop them manually.

```js
// Connect using the MongoDB shell (mongo or mongosh)
use cookbook

// Drop legacy collections if they exist
db.users.drop()
db.sessions.drop()
db.accounts.drop()
```

> ⚠️ **Warning:** Dropping collections is destructive. Only run these commands if you are sure the collections are no longer needed and you have backups.

## Verifying your database

To confirm the current auth collections are present and being used by the app, you can query them:

```js
use cookbook

// Better-Auth collections (expected to exist)
db.user.countDocuments()
db.session.countDocuments()
db.account.countDocuments()
db.verification.countDocuments()
```

If any of these commands errors because the collection does not exist, it may simply mean no documents have been created yet.
