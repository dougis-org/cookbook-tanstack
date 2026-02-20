// @vitest-environment node
import { describe, it, expect, vi, afterAll } from "vitest"
import { withDbTx, closeTestPool, type TestDb } from "@/test-helpers/with-db-tx"
import * as schema from "@/db/schema"

vi.mock("@/db", () => ({ db: {} }))
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }))

afterAll(async () => {
  await closeTestPool()
})

const VALID_UUID = "00000000-0000-0000-0000-000000000000"

// Unique suffix per test run prevents slug/email collisions when tests share
// a container. Each seedUser call produces a fresh UUID anyway, so userId
// scoping (not row counts) is the correct isolation mechanism.
const RUN_ID = Date.now()
let seq = 0
function uid() {
  return `${RUN_ID}-${++seq}`
}

/** Insert a minimal user and return it. */
async function seedUser(db: TestDb) {
  const id = uid()
  const [user] = await db
    .insert(schema.users)
    .values({ email: `user-${id}@recipe.test`, username: `rcp-${id}`, displayUsername: `User ${id}` })
    .returning()
  return user
}

async function makeAnonCaller(db: TestDb) {
  const { appRouter } = await import("@/server/trpc/router")
  return appRouter.createCaller({ db: db as never, session: null, user: null })
}

async function makeAuthCaller(db: TestDb, userId: string) {
  const { appRouter } = await import("@/server/trpc/router")
  return appRouter.createCaller({ db: db as never, session: { id: "s1" } as never, user: { id: userId } as never })
}

// ─── recipes.list — visibility filtering ─────────────────────────────────────
//
// Each test scopes list() to a specific userId so the assertion is exclusive
// to our test data and independent of anything else in the shared container.

describe("recipes.list", () => {
  describe("visibility filtering", () => {
    it("anon user sees a public recipe but not a private recipe from the same owner", async () => {
      await withDbTx(async (db) => {
        const owner = await seedUser(db)
        await db.insert(schema.recipes).values([
          { name: "Public One", userId: owner.id, isPublic: true },
          { name: "Private One", userId: owner.id, isPublic: false },
        ])

        const caller = await makeAnonCaller(db)
        // Scope to this owner so we only see their recipes, not anyone else's
        const result = await caller.recipes.list({ userId: owner.id })

        expect(result.items).toHaveLength(1)
        expect(result.items[0]).toMatchObject({ name: "Public One" })
      })
    })

    it("authenticated owner sees their own private recipe", async () => {
      await withDbTx(async (db) => {
        const owner = await seedUser(db)
        await db.insert(schema.recipes).values({ name: "My Private", userId: owner.id, isPublic: false })

        const caller = await makeAuthCaller(db, owner.id)
        const result = await caller.recipes.list({ userId: owner.id })

        expect(result.items).toHaveLength(1)
        expect(result.items[0]).toMatchObject({ name: "My Private" })
      })
    })

    it("anon user sees nothing when scoped to an owner who has only private recipes", async () => {
      await withDbTx(async (db) => {
        const owner = await seedUser(db)
        await db.insert(schema.recipes).values({ name: "Hidden", userId: owner.id, isPublic: false })

        const caller = await makeAnonCaller(db)
        const result = await caller.recipes.list({ userId: owner.id })

        expect(result.items).toEqual([])
      })
    })

    it("another authenticated user cannot see a private recipe through userId scoping", async () => {
      await withDbTx(async (db) => {
        const secretOwner = await seedUser(db)
        const viewer = await seedUser(db)
        await db.insert(schema.recipes).values({ name: "Top Secret", userId: secretOwner.id, isPublic: false })

        const caller = await makeAuthCaller(db, viewer.id)
        const result = await caller.recipes.list({ userId: secretOwner.id })

        expect(result.items).toEqual([])
      })
    })

    it("pagination metadata reflects scoped result count", async () => {
      await withDbTx(async (db) => {
        const owner = await seedUser(db)
        // No recipes for this user — scoped total should be 0
        const caller = await makeAnonCaller(db)
        const result = await caller.recipes.list({ userId: owner.id, page: 2, pageSize: 5 })

        expect(result.page).toBe(2)
        expect(result.pageSize).toBe(5)
        expect(result.total).toBe(0)
        expect(result.items).toEqual([])
      })
    })
  })

  describe("search", () => {
    it("filters by name using case-insensitive partial match within a user's recipes", async () => {
      await withDbTx(async (db) => {
        const user = await seedUser(db)
        await db.insert(schema.recipes).values([
          { name: "Pasta Carbonara", userId: user.id, isPublic: true },
          { name: "Beef Stew", userId: user.id, isPublic: true },
        ])

        const caller = await makeAnonCaller(db)
        const result = await caller.recipes.list({ userId: user.id, search: "pasta" })

        expect(result.items).toHaveLength(1)
        expect(result.items[0]).toMatchObject({ name: "Pasta Carbonara" })
      })
    })

    it("filters by ingredients text within a user's recipes", async () => {
      await withDbTx(async (db) => {
        const user = await seedUser(db)
        await db.insert(schema.recipes).values([
          { name: "Soup", userId: user.id, isPublic: true, ingredients: "chicken broth\nnoodles" },
          { name: "Salad", userId: user.id, isPublic: true, ingredients: "lettuce\ntomato" },
        ])

        const caller = await makeAnonCaller(db)
        const result = await caller.recipes.list({ userId: user.id, search: "chicken" })

        expect(result.items).toHaveLength(1)
        expect(result.items[0]).toMatchObject({ name: "Soup" })
      })
    })
  })

  describe("filter parameters", () => {
    it("accepts mealIds filter without error", async () => {
      await withDbTx(async (db) => {
        const caller = await makeAnonCaller(db)
        const result = await caller.recipes.list({ mealIds: [VALID_UUID] })
        expect(result).toHaveProperty("items")
      })
    })

    it("accepts courseIds filter without error", async () => {
      await withDbTx(async (db) => {
        const caller = await makeAnonCaller(db)
        const result = await caller.recipes.list({ courseIds: [VALID_UUID] })
        expect(result).toHaveProperty("items")
      })
    })

    it("accepts preparationIds filter without error", async () => {
      await withDbTx(async (db) => {
        const caller = await makeAnonCaller(db)
        const result = await caller.recipes.list({ preparationIds: [VALID_UUID] })
        expect(result).toHaveProperty("items")
      })
    })

    it("accepts sort parameter without error", async () => {
      await withDbTx(async (db) => {
        const caller = await makeAnonCaller(db)
        const result = await caller.recipes.list({ sort: "name_asc" })
        expect(result).toHaveProperty("items")
      })
    })
  })
})

// ─── recipes.byId ─────────────────────────────────────────────────────────────

describe("recipes.byId", () => {
  it("returns null when recipe does not exist", async () => {
    await withDbTx(async (db) => {
      const caller = await makeAnonCaller(db)
      expect(await caller.recipes.byId({ id: VALID_UUID })).toBeNull()
    })
  })

  it("rejects an invalid UUID", async () => {
    await withDbTx(async (db) => {
      const caller = await makeAnonCaller(db)
      await expect(caller.recipes.byId({ id: "not-a-uuid" })).rejects.toThrow()
    })
  })

  it("returns a public recipe when found", async () => {
    await withDbTx(async (db) => {
      const user = await seedUser(db)
      const [recipe] = await db
        .insert(schema.recipes)
        .values({ name: "Found Recipe", userId: user.id, isPublic: true })
        .returning()

      const caller = await makeAnonCaller(db)
      const result = await caller.recipes.byId({ id: recipe.id })

      expect(result).toMatchObject({ id: recipe.id, name: "Found Recipe" })
    })
  })
})

// ─── recipes.create ───────────────────────────────────────────────────────────

describe("recipes.create", () => {
  it("rejects unauthenticated requests", async () => {
    await withDbTx(async (db) => {
      const caller = await makeAnonCaller(db)
      await expect(caller.recipes.create({ name: "Test" })).rejects.toThrow("UNAUTHORIZED")
    })
  })

  it("rejects an empty name", async () => {
    await withDbTx(async (db) => {
      const user = await seedUser(db)
      const caller = await makeAuthCaller(db, user.id)
      await expect(caller.recipes.create({ name: "" })).rejects.toThrow()
    })
  })

  it("creates a recipe and returns the new record", async () => {
    await withDbTx(async (db) => {
      const user = await seedUser(db)
      const caller = await makeAuthCaller(db, user.id)
      const result = await caller.recipes.create({ name: "My New Recipe" })
      expect(result).toMatchObject({ name: "My New Recipe", userId: user.id })
    })
  })
})

// ─── recipes.update ───────────────────────────────────────────────────────────

describe("recipes.update", () => {
  it("rejects unauthenticated requests", async () => {
    await withDbTx(async (db) => {
      const caller = await makeAnonCaller(db)
      await expect(caller.recipes.update({ id: VALID_UUID, name: "Updated" })).rejects.toThrow("UNAUTHORIZED")
    })
  })

  it("updates the recipe name", async () => {
    await withDbTx(async (db) => {
      const user = await seedUser(db)
      const [recipe] = await db.insert(schema.recipes).values({ name: "Old Name", userId: user.id }).returning()

      const caller = await makeAuthCaller(db, user.id)
      const result = await caller.recipes.update({ id: recipe.id, name: "New Name" })
      expect(result).toMatchObject({ name: "New Name" })
    })
  })

  it("returns current record unchanged when only taxonomy IDs are updated", async () => {
    await withDbTx(async (db) => {
      const user = await seedUser(db)
      const id = uid()
      const [recipe] = await db.insert(schema.recipes).values({ name: "Existing", userId: user.id }).returning()
      const [meal] = await db.insert(schema.meals).values({ name: "Breakfast", slug: `bfast-${id}` }).returning()

      const caller = await makeAuthCaller(db, user.id)
      const result = await caller.recipes.update({ id: recipe.id, mealIds: [meal.id] })

      expect(result).toMatchObject({ id: recipe.id, name: "Existing" })
    })
  })
})

// ─── recipes.delete ───────────────────────────────────────────────────────────

describe("recipes.delete", () => {
  it("rejects unauthenticated requests", async () => {
    await withDbTx(async (db) => {
      const caller = await makeAnonCaller(db)
      await expect(caller.recipes.delete({ id: VALID_UUID })).rejects.toThrow("UNAUTHORIZED")
    })
  })
})

// ─── recipes.isMarked / toggleMarked ──────────────────────────────────────────

describe("recipes.isMarked", () => {
  it("returns false for anonymous users without querying DB", async () => {
    await withDbTx(async (db) => {
      const caller = await makeAnonCaller(db)
      expect(await caller.recipes.isMarked({ id: VALID_UUID })).toEqual({ marked: false })
    })
  })
})

describe("recipes.toggleMarked", () => {
  it("rejects unauthenticated requests", async () => {
    await withDbTx(async (db) => {
      const caller = await makeAnonCaller(db)
      await expect(caller.recipes.toggleMarked({ id: VALID_UUID })).rejects.toThrow("UNAUTHORIZED")
    })
  })

  it("returns a boolean marked field after toggling on an owned recipe", async () => {
    await withDbTx(async (db) => {
      const user = await seedUser(db)
      const [recipe] = await db.insert(schema.recipes).values({ name: "Toggle Me", userId: user.id }).returning()

      const caller = await makeAuthCaller(db, user.id)
      const result = await caller.recipes.toggleMarked({ id: recipe.id })

      expect(result).toHaveProperty("marked")
      expect(typeof result.marked).toBe("boolean")
    })
  })
})
