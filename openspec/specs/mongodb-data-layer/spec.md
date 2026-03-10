# MongoDB Data Layer Spec

### Requirement: MongoDB connection singleton
The system SHALL establish a single Mongoose connection to MongoDB using `MONGODB_URI` environment variable, exported from `src/db/index.ts`. The connection SHALL throw an error on startup if `MONGODB_URI` is not set. If the connection fails, the process SHALL exit with a non-zero code via a `.catch()` handler.

#### Scenario: Missing MONGODB_URI
- **WHEN** the server starts without `MONGODB_URI` set
- **THEN** the application throws an explicit error: "MONGODB_URI environment variable is not set"

#### Scenario: Successful connection
- **WHEN** `MONGODB_URI` is valid and MongoDB is reachable
- **THEN** Mongoose connects and the db module exports the mongoose instance without error

#### Scenario: Connection failure at startup
- **WHEN** `MONGODB_URI` is set but MongoDB is unreachable
- **THEN** the process exits with a non-zero code and logs the error to stderr

### Requirement: Mongoose models replace Drizzle schema
The system SHALL define Mongoose models in `src/db/models/` covering all entities: User, Session, Account, Verification, Recipe, Cookbook, Classification, Source, Meal, Course, Preparation, RecipeLike. Each model SHALL be exported from a barrel `src/db/models/index.ts`.

#### Scenario: Recipe model has embedded taxonomy arrays
- **WHEN** a Recipe document is created
- **THEN** it SHALL contain `mealIds`, `courseIds`, and `preparationIds` as arrays of ObjectId references, replacing the junction collections

#### Scenario: Cookbook model has embedded recipe entries
- **WHEN** a Cookbook document is created
- **THEN** it SHALL contain a `recipes` array of `{ recipeId: ObjectId, orderIndex: number }` subdocuments, replacing the `cookbook_recipes` junction collection

#### Scenario: RecipeLike is a separate collection
- **WHEN** a user likes a recipe
- **THEN** a RecipeLike document is created in its own collection with `userId`, `recipeId`, and `createdAt` fields

### Requirement: Better-Auth uses MongoDB adapter
The system SHALL configure Better-Auth using `mongodbAdapter` (native MongoDB driver) by deriving a `MongoClient` from the active Mongoose connection. The `drizzleAdapter` and `advanced.database.generateId` config SHALL be removed.

#### Scenario: Auth tables stored in MongoDB
- **WHEN** a user registers or logs in
- **THEN** Better-Auth reads and writes user, session, account, and verification documents from the MongoDB database

#### Scenario: No separate auth DB connection
- **WHEN** the application initializes
- **THEN** Better-Auth shares the MongoDB connection established by Mongoose (no second connection string or client instantiation)

### Requirement: tRPC ID validators use ObjectId format
All tRPC router input schemas that validate MongoDB IDs SHALL use a shared `objectId` Zod validator (`z.string().regex(/^[a-f0-9]{24}$/i)`) exported from `src/server/trpc/routers/_helpers.ts`. Plain `z.string()` or `z.string().uuid()` SHALL NOT be used for ObjectId fields.

#### Scenario: Valid ObjectId accepted
- **WHEN** a tRPC procedure receives a valid 24-char hex ObjectId as an ID parameter
- **THEN** the request succeeds and the document is found

#### Scenario: Invalid ID rejected at validation layer
- **WHEN** an invalid ID string (non-hex, wrong length, or UUID format) is passed to a tRPC procedure
- **THEN** Zod validation fails with "Invalid ID format" and the request returns HTTP 400 before reaching the database

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
- **THEN** each suite connects to its own in-memory MongoDB instance (or the collections are cleared between tests using `withCleanDb`)

### Requirement: Environment variable migration
The environment configuration SHALL replace `DATABASE_URL` (PostgreSQL connection string) with `MONGODB_URI` (MongoDB connection string). `.env.example` SHALL document the default local development value (`mongodb://localhost:27017/cookbook`).

#### Scenario: Local development default
- **WHEN** a developer copies `.env.example` to `.env.local` without modification
- **THEN** the application connects to a local MongoDB instance on the default port

#### Scenario: Atlas connection string accepted
- **WHEN** `MONGODB_URI` is set to a valid MongoDB Atlas SRV connection string
- **THEN** the application connects to Atlas without code changes
