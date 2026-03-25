# Recipe Delete Cascade — Design

## Infrastructure: Replica Set

### Docker Compose

MongoDB transactions require a replica set. The `docker-compose.yml` is updated to:

1. Add `--replSet rs0` to the MongoDB service command
2. Add a one-shot `mongo-init` service that waits for MongoDB to be ready then calls `rs.initiate()`

```yaml
services:
  mongodb:
    image: mongo:7
    command: ["--replSet", "rs0", "--bind_ip_all"]
    ports: ["27017:27017"]
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 5s
      timeout: 3s
      retries: 10

  mongo-init:
    image: mongo:7
    depends_on:
      mongodb:
        condition: service_healthy
    command: >
      mongosh --host mongodb:27017 --eval
      "try { rs.status() } catch(e) { rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'localhost:27017' }] }) }"
    restart: "no"
```

**Note for developers:** After updating docker-compose, run `docker compose down -v && docker compose up -d` to re-initialise with the replica set. Existing data volumes from the standalone node are incompatible and must be cleared.

### Test Environment

`src/test-helpers/db-global-setup.ts` switches from `MongoMemoryServer` to `MongoMemoryReplSet`:

```ts
import { MongoMemoryReplSet } from 'mongodb-memory-server'

let mongod: MongoMemoryReplSet

export async function setup() {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } })
  const uri = mongod.getUri()
  process.env.MONGODB_URI = uri
  await mongoose.connect(uri)
}
```

## Backend: Transaction Pattern

```
delete mutation execution order:
──────────────────────────────────────────────
1. verifyOwnership()                    [guard — before session, fail fast]
2. mongoose.startSession()              [open session]
3. session.withTransaction(async () => {
     Recipe.findByIdAndDelete(id, { session })
     Cookbook.updateMany(
       { 'recipes.recipeId': id },
       { $pull: { recipes: { recipeId: id } } },
       { session }
     )
     RecipeLike.deleteMany({ recipeId: id }, { session })
   })                                   [all-or-nothing]
4. session.endSession()
5. return { success: true }
──────────────────────────────────────────────
On any throw from step 3:
  → TRPCError(INTERNAL_SERVER_ERROR, 'Failed to delete recipe. Please try again.')
  → session.endSession() in finally block
```

`Cookbook` is imported alongside `Recipe` and `RecipeLike` from `@/db/models`. `mongoose` is imported for `startSession()`.

## Frontend: Error in Modal

### DeleteConfirmModal

Adds an optional `error?: string` prop. When set, renders a `FormError` component above the action buttons:

```
┌─────────────────────────────────────────────┐
│  Delete Recipe                              │
│                                             │
│  Are you sure you want to delete "Pasta"?   │
│  This action cannot be undone.              │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ⚠ Failed to delete recipe. Please  │   │
│  │   try again.                        │   │  ← FormError (role="alert")
│  └─────────────────────────────────────┘   │
│                                             │
│                      [ Cancel ] [ Delete ]  │
└─────────────────────────────────────────────┘
```

### $recipeId.tsx

```ts
const [deleteError, setDeleteError] = useState<string | undefined>()

const deleteMutation = useMutation(
  trpc.recipes.delete.mutationOptions({
    onSuccess: () => { ... },
    onError: (err) => setDeleteError(err.message),
  }),
)
```

The modal stays open on error (it already stays open since navigation only fires in `onSuccess`). `deleteError` is cleared when the modal is cancelled or the delete succeeds.

## Test Coverage

All new tests are written **before** the implementation (TDD).

### New integration test cases in `recipes.test.ts`

| Test | What it verifies |
|------|-----------------|
| delete removes recipe from cookbook recipes array | `Cookbook.recipes` no longer contains the deleted `recipeId` |
| delete removes all RecipeLike documents for the recipe | `RecipeLike` collection has zero docs for the deleted `recipeId` |
| delete cleans up both cookbooks and likes in a single call | Both checks pass after one `caller.recipes.delete()` |
| delete with no cookbook or like references still succeeds | No crash when there's nothing to cascade |

Each test uses `withCleanDb`, seeds a user, recipe, cookbook with embedded entry, and like document, then calls the delete mutation and asserts the downstream documents are gone.
