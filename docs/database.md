# Database

CookBook uses MongoDB 7 with Mongoose ODM for type-safe database access.

## Quick Start

```bash
docker compose up -d     # Start MongoDB (or set MONGODB_URI to Atlas SRV string)
npm run db:seed          # Seed taxonomy data (idempotent)
npm run db:connect       # Verify connection is reachable
```

To use MongoDB Atlas instead of Docker, set `MONGODB_URI` in `.env.local` to your Atlas SRV connection string. No other code changes needed.

## Collections Overview

Twelve collections organized into four groups:

### Core Collections

| Collection | Purpose |
|------------|---------|
| `recipes` | Recipe content, nutrition, taxonomy references |
| `classifications` | Recipe classifications (e.g., cuisine type) |
| `sources` | Recipe sources (books, websites, etc.) |
| `cookbooks` | User-curated recipe collections |

### Taxonomy Collections

| Collection | Purpose |
|------------|---------|
| `meals` | Meal types (Breakfast, Lunch, Dinner, etc.) |
| `courses` | Course types (Appetizer, Main Course, Dessert, etc.) |
| `preparations` | Preparation methods (Baked, Grilled, Steamed, etc.) |

All taxonomy collections share the same structure: `_id` (ObjectId), `name`, `description`, `slug` (unique), `createdAt`, `updatedAt`. Slugs enable URL-friendly lookups.

### Auth Collections (Better-Auth managed)

| Collection | Purpose |
|------------|---------|
| `user` | User accounts (managed by Better-Auth + username plugin) |
| `session` | Active user sessions with expiry |
| `account` | OAuth / credential account links |
| `verification` | Email verification tokens |

### Social Collections

| Collection | Purpose |
|------------|---------|
| `recipelikes` | Recipe favorites — compound unique index on `(userId, recipeId)` |
| `recipe-notes` | Private per-user notes on a recipe — compound unique index on `(userId, recipeId)` |

#### recipe-notes

Stores one private markdown note per `(userId, recipeId)` pair.

| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId | ref: `users` — required |
| `recipeId` | ObjectId | ref: `recipes` — required |
| `body` | string | maxlength 10000, trimmed on save — required |
| `createdAt` | Date | auto-managed by `timestamps: true` |
| `updatedAt` | Date | auto-managed by `timestamps: true` |

**Index:** compound unique `(userId, recipeId)` — enforced at the database layer, so duplicate notes for the same user+recipe are rejected with MongoDB error code `11000`.

**Tier gate:** access is enforced at the API layer (`hasAtLeastTier(user, 'sous-chef')`). No visibility flag is stored on the document. Downgraded users retain their stored notes but are denied access until they re-upgrade.

## Document Design

### Recipe Document

Recipes embed taxonomy references as ObjectId arrays, replacing the old junction tables:

```typescript
{
  _id: ObjectId,
  userId: ObjectId,          // ref: User
  name: string,
  ingredients: string,
  instructions: string,
  notes: string,
  servings: number,
  prepTime: number,          // minutes
  cookTime: number,          // minutes
  difficulty: 'easy' | 'medium' | 'hard',
  sourceId: ObjectId,        // ref: Source
  classificationId: ObjectId, // ref: Classification
  dateAdded: Date,
  calories: number,
  fat: number,
  cholesterol: number,
  sodium: number,
  protein: number,
  imageUrl: string,
  isPublic: boolean,
  marked: boolean,
  hiddenByTier: boolean,       // true when owner's tier drops below recipe limit
  pendingVerification: boolean, // true while owner's email is unverified; excludes from public listings
  mealIds: ObjectId[],       // ref: Meal (replaces recipe_meals junction)
  courseIds: ObjectId[],     // ref: Course (replaces recipe_courses junction)
  preparationIds: ObjectId[], // ref: Preparation (replaces recipe_preparations junction)
  createdAt: Date,
  updatedAt: Date,
}
```

### Cookbook Document

Cookbooks embed recipe entries with ordering, replacing the old `cookbook_recipes` junction table:

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  name: string,
  description: string,
  isPublic: boolean,
  imageUrl: string,
  recipes: [               // replaces cookbook_recipes junction table
    { recipeId: ObjectId, orderIndex: number }
  ],
  createdAt: Date,
  updatedAt: Date,
}
```

## Connection

`src/db/index.ts` is the Mongoose connection singleton:

- Reads `MONGODB_URI` from environment; throws if missing
- Calls `mongoose.set('strict', true)` globally before connecting
- Exports `getMongoClient()` → `mongoose.connection.getClient()` for Better-Auth's native MongoDB adapter
- Connection is initiated once when the module is first imported

## Models

All Mongoose models live in `src/db/models/`:

```
src/db/models/
├── columns.ts          # Shared helpers (ObjectIdType)
├── verification.ts
├── classification.ts
├── source.ts
├── meal.ts
├── course.ts
├── preparation.ts
├── recipe.ts
├── cookbook.ts
├── recipe-like.ts
└── index.ts            # Barrel export of all models
```

All models use `timestamps: true` in Mongoose schema options (auto-manages `createdAt` / `updatedAt`) except `RecipeLike` which only has `createdAt`.

## Seeds

`src/db/seeds/` contains idempotent seed scripts for taxonomy data. Each entry is upserted by `slug`:

```bash
npm run db:seed   # runs src/db/seeds/index.ts via tsx
```

Seeds connect to MongoDB using `MONGODB_URI` and disconnect when finished.

## Testing

Integration tests use `mongodb-memory-server` for in-process isolation — no Docker required for `npm run test`. The global setup in `src/test-helpers/db-global-setup.ts` starts the in-memory server, connects Mongoose, and sets `MONGODB_URI` before any tests run.
