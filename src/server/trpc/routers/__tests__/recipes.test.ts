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

/** Insert a minimal user and return it. */
async function seedUser(db: TestDb, suffix: string) {
  const [user] = await db
    .insert(schema.users)
    .values({ email: `${suffix}@recipe.test`, username: `rcp-${suffix}`, displayUsername: `Rcp ${suffix}` })
    .returning()
  return user
}

type CallerOptions = { db: TestDb; userId?: string }

async function makeCallerFrom({ db, userId }: CallerOptions) {
  const { appRouter } = await import("@/server/trpc/router")
  if (userId) {
    return appRouter.createCaller({ db: db as never, session: { id: "s1" } as never, user: { id: userId } as never })
  }
  return appRouter.createCaller({ db: db as never, session: null, user: null })
}

// ─── recipes.list — visibility filtering ────────────────────────────────────

describe("recipes.list", () => {
  describe("visibility filtering (real DB)", () => {
    it("returns only public recipes for anonymous users", async () => {
      await withDbTx(async (db) => {
        const u1 = await seedUser(db, "anon1")
        const u2 = await seedUser(db, "anon2")
        await db.insert(schema.recipes).values([
          { name: "Public Recipe", userId: u1.id, isPublic: true },
          { name: "Private Recipe", userId: u2.id, isPublic: false },
        ])

        const caller = await makeCallerFrom({ db })
        const result = await caller.recipes.list()

        expect(result.items).toHaveLength(1)
        expect(result.items[0]).toMatchObject({ name: "Public Recipe" })
      })
    })

    it("shows own private recipe alongside public recipes for authenticated user", async () => {
      await withDbTx(async (db) => {
        const owner = await seedUser(db, "own-auth")
        const other = await seedUser(db, "oth-auth")
        await db.insert(schema.recipes).values([
          { name: "Other Public", userId: other.id, isPublic: true },
          { name: "My Private", userId: owner.id, isPublic: false },
        ])

        const caller = await makeCallerFrom({ db, userId: owner.id })
        const result = await caller.recipes.list()

        const names = result.items.map((r) => r.name).sort()
        expect(names).toEqual(["My Private", "Other Public"])
      })
    })

    it("hides another user's private recipe from an authenticated user", async () => {
      await withDbTx(async (db) => {
        const viewer = await seedUser(db, "viewer")
        const owner = await seedUser(db, "pvt-own")
        await db.insert(schema.recipes).values({ name: "Hidden", userId: owner.id, isPublic: false })

        const caller = await makeCallerFrom({ db, userId: viewer.id })
        const result = await caller.recipes.list()

        expect(result.items).toEqual([])
      })
    })

    it("returns empty result set with correct pagination metadata", async () => {
      await withDbTx(async (db) => {
        const caller = await makeCallerFrom({ db })
        const result = await caller.recipes.list({ page: 2, pageSize: 5 })

        expect(result.page).toBe(2)
        expect(result.pageSize).toBe(5)
        expect(result.total).toBe(0)
        expect(result.items).toEqual([])
      })
    })
  })

  describe("search (real DB)", () => {
    it("filters by name using case-insensitive partial match", async () => {
      await withDbTx(async (db) => {
        const user = await seedUser(db, "srch")
        await db.insert(schema.recipes).values([
          { name: "Pasta Carbonara", userId: user.id, isPublic: true },
          { name: "Beef Stew", userId: user.id, isPublic: true },
        ])

        const caller = await makeCallerFrom({ db })
        const result = await caller.recipes.list({ search: "pasta" })

        expect(result.items).toHaveLength(1)
        expect(result.items[0]).toMatchObject({ name: "Pasta Carbonara" })
      })
    })

    it("filters by ingredients", async () => {
      await withDbTx(async (db) => {
        const user = await seedUser(db, "ingr")
        await db.insert(schema.recipes).values([
          { name: "Soup", userId: user.id, isPublic: true, ingredients: "chicken broth\nnoodles" },
          { name: "Salad", userId: user.id, isPublic: true, ingredients: "lettuce\ntomato" },
        ])

        const caller = await makeCallerFrom({ db })
        const result = await caller.recipes.list({ search: "chicken" })

        expect(result.items).toHaveLength(1)
        expect(result.items[0]).toMatchObject({ name: "Soup" })
      })
    })
  })

  describe("filter parameters (real DB)", () => {
    it("accepts mealIds filter without error", async () => {
      await withDbTx(async (db) => {
        const caller = await makeCallerFrom({ db })
        const result = await caller.recipes.list({ mealIds: [VALID_UUID] })
        expect(result).toHaveProperty("items")
      })
    })

    it("accepts courseIds filter without error", async () => {
      await withDbTx(async (db) => {
        const caller = await makeCallerFrom({ db })
        const result = await caller.recipes.list({ courseIds: [VALID_UUID] })
        expect(result).toHaveProperty("items")
      })
    })

    it("accepts preparationIds filter without error", async () => {
      await withDbTx(async (db) => {
        const caller = await makeCallerFrom({ db })
        const result = await caller.recipes.list({ preparationIds: [VALID_UUID] })
        expect(result).toHaveProperty("items")
      })
    })

    it("accepts sort parameter", async () => {
      await withDbTx(async (db) => {
        const caller = await makeCallerFrom({ db })
        const result = await caller.recipes.list({ sort: "name_asc" })
        expect(result).toHaveProperty("items")
      })
    })
  })
})

// ─── recipes.byId ────────────────────────────────────────────────────────────

describe("recipes.byId", () => {
  it("returns null when recipe does not exist", async () => {
    await withDbTx(async (db) => {
      const caller = await makeCallerFrom({ db })
      expect(await caller.recipes.byId({ id: VALID_UUID })).toBeNull()
    })
  })

  it("rejects an invalid UUID", async () => {
    await withDbTx(async (db) => {
      const caller = await makeCallerFrom({ db })
      await expect(caller.recipes.byId({ id: "not-a-uuid" })).rejects.toThrow()
    })
  })

  it("returns a public recipe when found", async () => {
    await withDbTx(async (db) => {
      const user = await seedUser(db, "byid")
      const [recipe] = await db
        .insert(schema.recipes)
        .values({ name: "Found Recipe", userId: user.id, isPublic: true })
        .returning()

      const caller = await makeCallerFrom({ db })
      const result = await caller.recipes.byId({ id: recipe.id })

      expect(result).toMatchObject({ id: recipe.id, name: "Found Recipe" })
    })
  })
})

// ─── recipes.create ──────────────────────────────────────────────────────────

describe("recipes.create", () => {
  it("rejects unauthenticated requests", async () => {
    await withDbTx(async (db) => {
      const caller = await makeCallerFrom({ db })
      await expect(caller.recipes.create({ name: "Test" })).rejects.toThrow("UNAUTHORIZED")
    })
  })

  it("rejects an empty name", async () => {
    await withDbTx(async (db) => {
      const user = await seedUser(db, "crt-zod")
      const caller = await makeCallerFrom({ db, userId: user.id })
      await expect(caller.recipes.create({ name: "" })).rejects.toThrow()
    })
  })

  it("creates a recipe and returns the new record", async () => {
    await withDbTx(async (db) => {
      const user = await seedUser(db, "crt")
      const caller = await makeCallerFrom({ db, userId: user.id })
      const result = await caller.recipes.create({ name: "My New Recipe" })
      expect(result).toMatchObject({ name: "My New Recipe", userId: user.id })
    })
  })
})

// ─── recipes.update ──────────────────────────────────────────────────────────

describe("recipes.update", () => {
  it("rejects unauthenticated requests", async () => {
    await withDbTx(async (db) => {
      const caller = await makeCallerFrom({ db })
      await expect(caller.recipes.update({ id: VALID_UUID, name: "Updated" })).rejects.toThrow("UNAUTHORIZED")
    })
  })

  it("updates the recipe name", async () => {
    await withDbTx(async (db) => {
      const user = await seedUser(db, "upd")
      const [recipe] = await db
        .insert(schema.recipes)
        .values({ name: "Old Name", userId: user.id })
        .returning()

      const caller = await makeCallerFrom({ db, userId: user.id })
      const result = await caller.recipes.update({ id: recipe.id, name: "New Name" })
      expect(result).toMatchObject({ name: "New Name" })
    })
  })

  it("skips UPDATE when only taxonomy IDs are provided and returns current record", async () => {
    await withDbTx(async (db) => {
      const user = await seedUser(db, "tax-upd")
      const [recipe] = await db.insert(schema.recipes).values({ name: "Existing", userId: user.id }).returning()
      const [meal] = await db.insert(schema.meals).values({ name: "Breakfast", slug: "bfast-tax" }).returning()

      const caller = await makeCallerFrom({ db, userId: user.id })
      const result = await caller.recipes.update({ id: recipe.id, mealIds: [meal.id] })

      expect(result).toMatchObject({ id: recipe.id, name: "Existing" })
    })
  })
})

// ─── recipes.delete ──────────────────────────────────────────────────────────

describe("recipes.delete", () => {
  it("rejects unauthenticated requests", async () => {
    await withDbTx(async (db) => {
      const caller = await makeCallerFrom({ db })
      await expect(caller.recipes.delete({ id: VALID_UUID })).rejects.toThrow("UNAUTHORIZED")
    })
  })
})

// ─── recipes.isMarked / toggleMarked ─────────────────────────────────────────

describe("recipes.isMarked", () => {
  it("returns false for anonymous users without querying DB", async () => {
    await withDbTx(async (db) => {
      const caller = await makeCallerFrom({ db })
      expect(await caller.recipes.isMarked({ id: VALID_UUID })).toEqual({ marked: false })
    })
  })
})

describe("recipes.toggleMarked", () => {
  it("rejects unauthenticated requests", async () => {
    await withDbTx(async (db) => {
      const caller = await makeCallerFrom({ db })
      await expect(caller.recipes.toggleMarked({ id: VALID_UUID })).rejects.toThrow("UNAUTHORIZED")
    })
  })

  it("returns a boolean marked field after toggling", async () => {
    await withDbTx(async (db) => {
      const user = await seedUser(db, "tmrk")
      const [recipe] = await db.insert(schema.recipes).values({ name: "Toggle Me", userId: user.id }).returning()

      const caller = await makeCallerFrom({ db, userId: user.id })
      const result = await caller.recipes.toggleMarked({ id: recipe.id })

      expect(result).toHaveProperty("marked")
      expect(typeof result.marked).toBe("boolean")
    })
  })
})
