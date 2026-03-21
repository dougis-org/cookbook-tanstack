## ADDED Requirements

### Requirement: MongoDB connection singleton
The system SHALL establish a single Mongoose connection to MongoDB using `MONGODB_URI` environment variable, exported from `src/db/index.ts`. The connection SHALL throw an error on startup if `MONGODB_URI` is not set.

#### Scenario: Missing MONGODB_URI
- **WHEN** the server starts without `MONGODB_URI` set
- **THEN** the application throws an explicit error: "MONGODB_URI environment variable is not set"

#### Scenario: Successful connection
- **WHEN** `MONGODB_URI` is valid and MongoDB is reachable
- **THEN** Mongoose connects and the db module exports the mongoose instance without error

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

### Requirement: tRPC ID validators accept ObjectId strings
All tRPC router input schemas that validate IDs SHALL use `z.string()` (not `z.string().uuid()`), since MongoDB ObjectIds are 24-character hexadecimal strings, not UUID format.

#### Scenario: Valid ObjectId accepted
- **WHEN** a tRPC procedure receives a valid 24-char hex ObjectId as an ID parameter
- **THEN** the request succeeds and the document is found

#### Scenario: UUID format rejected at model layer
- **WHEN** an invalid ID string is passed to a Mongoose query
- **THEN** Mongoose throws a CastError which the tRPC router converts to a `NOT_FOUND` or `BAD_REQUEST` error

### Requirement: Taxonomy seeds work with MongoDB
The system SHALL provide idempotent seed scripts in `src/db/seeds/` that insert meals, courses, and preparations into their respective MongoDB collections. Seeds SHALL use `updateOne` with `upsert: true` keyed on `slug` to remain idempotent.

#### Scenario: Seeding runs on empty database
- **WHEN** `npm run db:seed` is run on an empty MongoDB instance
- **THEN** all taxonomy documents are created with correct `name`, `slug`, and timestamp fields

#### Scenario: Seeding is idempotent
- **WHEN** `npm run db:seed` is run twice
- **THEN** no duplicate documents are created and no errors are thrown

### Requirement: Integration tests use mongodb-memory-server
All Vitest integration tests that interact with the database SHALL use `mongodb-memory-server` to spin up an in-process MongoDB instance. Tests SHALL connect before the test suite and disconnect after.

#### Scenario: Tests run without Docker
- **WHEN** `npm run test` is executed without Docker running
- **THEN** all database integration tests pass using the in-memory server

#### Scenario: Test isolation per suite
- **WHEN** multiple test files run in parallel
- **THEN** each suite connects to its own in-memory MongoDB instance (or the collections are cleared between tests)

### Requirement: Environment variable migration
The environment configuration SHALL replace `DATABASE_URL` (PostgreSQL connection string) with `MONGODB_URI` (MongoDB connection string). `.env.example` SHALL document the default local development value (e.g., `mongodb://localhost:27017/cookbook`).

#### Scenario: Local development default
- **WHEN** a developer copies `.env.example` to `.env.local` without modification
- **THEN** the application connects to a local MongoDB instance on the default port

#### Scenario: Atlas connection string accepted
- **WHEN** `MONGODB_URI` is set to a valid MongoDB Atlas SRV connection string
- **THEN** the application connects to Atlas without code changes

### Requirement: Code audit confirms legacy collections not referenced
The system SHALL pass a code audit verifying that the legacy plurally-named auth collections (`users`, `sessions`, `accounts`) are not referenced in any production code, server logic, tRPC procedures, middleware, routes, tests, or documentation.

#### Scenario: Grep audit shows zero references
- **WHEN** the development team runs grep/search for "users", "sessions", and "accounts" collection references
- **THEN** no production code, server files, or active test files contain references to these collections

#### Scenario: Database documentation reflects single source of truth
- **WHEN** `docs/database.md` is reviewed
- **THEN** it lists the 8 active non-auth collections (recipes, classifications, sources, cookbooks, meals, courses, preparations, recipelikes) plus Better-Auth's 4 singular auth collections (`user`, `session`, `account`, `verification`), with no mention of legacy `users`, `sessions`, or `accounts`

### Requirement: Seed and initialization scripts do not create legacy collections
The system SHALL remove or update any seed scripts, database initialization code, or Docker entrypoints that attempt to create documents in the legacy `users`, `sessions`, or `accounts` collections.

#### Scenario: Seed scripts only target taxonomy
- **WHEN** `npm run db:seed` executes
- **THEN** only meal, course, and preparation taxonomy documents are created; no legacy auth collections are touched

#### Scenario: Database DDL/migration does not define legacy collections
- **WHEN** database schema is initialized from migration scripts or `.env` defaults
- **THEN** only non-auth collections are created; legacy `users`, `sessions`, `accounts` collections are not auto-generated
