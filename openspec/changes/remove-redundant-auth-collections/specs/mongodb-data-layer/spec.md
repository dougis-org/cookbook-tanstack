## REMOVED Requirements

### Requirement: Legacy User, Session, Account model definitions
**Reason**: The old plurally-named collections (`users`, `sessions`, `accounts`) from the Laravel era are no longer used. All authentication state is exclusively managed by Better-Auth via its MongoDB adapter, which uses singular collection names (`user`, `session`, `account`, `verification`). Defining Mongoose models for the legacy collections creates confusion and technical debt.

**Migration**: All code that previously queried or wrote to the legacy `users`, `sessions`, or `accounts` collections must be updated to:
- Use Better-Auth APIs for user/session/account lookups (managed via `getMongoClient()` adapter)
- Remove direct Mongoose model references to the old collections
- Update database initialization and seed scripts to cease creating these collections

### Requirement: Mongoose models named User, Session, Account
**Reason**: Better-Auth manages authentication through its native MongoDB adapter, which stores state in its own singular-named collections. Application code should not define or query these collections directly.

**Migration**: Remove model definitions from `src/db/models/` for User, Session, and Account. Direct authentication access must go through Better-Auth's API and related server functions.

## MODIFIED Requirements

### Requirement: Mongoose models replace Drizzle schema
The system SHALL define Mongoose models in `src/db/models/` covering only non-authentication entities: Recipe, Cookbook, Classification, Source, Meal, Course, Preparation, RecipeLike. The Verification model MAY be retained if referenced by custom Better-Auth hooks; otherwise it should also be removed. Each model SHALL be exported from a barrel `src/db/models/index.ts`. Authentication entities (User, Session, Account, Verification) are exclusively managed by Better-Auth's MongoDB adapter and SHALL NOT have corresponding Mongoose models.

#### Scenario: Recipe model with embedded taxonomy arrays exists
- **WHEN** a Recipe document is created
- **THEN** it SHALL contain `mealIds`, `courseIds`, and `preparationIds` as arrays of ObjectId references, replacing the junction collections

#### Scenario: Cookbook model with embedded recipe entries exists
- **WHEN** a Cookbook document is created
- **THEN** it SHALL contain a `recipes` array of `{ recipeId: ObjectId, orderIndex: number }` subdocuments, replacing the `cookbook_recipes` junction collection

#### Scenario: RecipeLike is a separate collection
- **WHEN** a user likes a recipe
- **THEN** a RecipeLike document is created in its own collection with `userId`, `recipeId`, and `createdAt` fields

#### Scenario: No application-defined User, Session, or Account models
- **WHEN** the application initializes
- **THEN** `src/db/models/index.ts` SHALL NOT export User, Session, or Account models; all authentication state is delegated to Better-Auth

### Requirement: Better-Auth uses MongoDB adapter (single source of truth)
The system SHALL configure Better-Auth using `mongodbAdapter` (native MongoDB driver) as the exclusive manager of authentication collections. All user, session, account, and verification data SHALL reside in Better-Auth's MongoDB collections (singular names: `user`, `session`, `account`, `verification`). Application code SHALL NOT directly query or write to the legacy `users`, `sessions`, or `accounts` collections.

#### Scenario: Auth tables stored exclusively in Better-Auth collections
- **WHEN** a user registers or logs in
- **THEN** Better-Auth reads and writes user, session, account, and verification documents to its own singular-named collections in MongoDB

#### Scenario: No direct queries to legacy auth collections
- **WHEN** the application code runs
- **THEN** all references to the legacy plurally-named `users`, `sessions`, and `accounts` collections are removed; grep/audit confirms zero references

#### Scenario: No separation of auth DB connection
- **WHEN** the application initializes
- **THEN** Better-Auth shares the MongoDB connection established by Mongoose (no second connection string or client instantiation)

## ADDED Requirements

### Requirement: Code audit confirms legacy collections not referenced
The system SHALL pass a code audit verifying that the legacy plurally-named auth collections (`users`, `sessions`, `accounts`) are not referenced in any production code, server logic, tRPC procedures, middleware, routes, tests, or documentation.

#### Scenario: Grep audit shows zero references
- **WHEN** the development team runs grep/search for "users", "sessions", and "accounts" collection references
- **THEN** no production code, server files, or active test files contain references to these collections

#### Scenario: Database documentation reflects single source of truth
- **WHEN** `docs/database.md` is reviewed
- **THEN** it lists only the 8 active collections (users, recipes, classifications, sources, cookbooks, meals, courses, preparations, recipelikes, and Better-Auth's 4) with no mention of legacy `users`, `sessions`, or `accounts`

### Requirement: Seed and initialization scripts do not create legacy collections
The system SHALL remove or update any seed scripts, database initialization code, or Docker entrypoints that attempt to create documents in the legacy `users`, `sessions`, or `accounts` collections.

#### Scenario: Seed scripts only target taxonomy
- **WHEN** `npm run db:seed` executes
- **THEN** only meal, course, and preparation taxonomy documents are created; no legacy auth collections are touched

#### Scenario: Database DDL/migration does not define legacy collections
- **WHEN** database schema is initialized from migration scripts or `.env` defaults
- **THEN** only non-auth collections are created; legacy `users`, `sessions`, `accounts` collections are not auto-generated
