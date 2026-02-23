// @vitest-environment node
import { describe, it, expect, vi, afterAll } from "vitest"
import { withDbTx, closeTestPool, type TestDb } from "@/test-helpers/with-db-tx"
import * as schema from "@/db/schema"

vi.mock("@/db", () => ({ db: {} }))
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }))

afterAll(async () => {
  await closeTestPool()
})

const RUN_ID = Date.now()
let seq = 0
function uid() {
  return `${RUN_ID}-${++seq}`
}

async function seedUser(db: TestDb) {
  const id = uid()
  const [user] = await db
    .insert(schema.users)
    .values({ email: `cb-${id}@test.com`, username: `cb-${id}`, displayUsername: `CbUser ${id}` })
    .returning()
  return user
}

async function seedCookbook(db: TestDb, userId: string, overrides: Partial<typeof schema.cookbooks.$inferInsert> = {}) {
  const [cb] = await db
    .insert(schema.cookbooks)
    .values({ userId, name: `Cookbook-${uid()}`, isPublic: true, ...overrides })
    .returning()
  return cb
}

async function seedRecipe(db: TestDb, userId: string) {
  const [r] = await db
    .insert(schema.recipes)
    .values({ name: `Recipe-${uid()}`, userId, isPublic: true })
    .returning()
  return r
}

async function makeAnonCaller(db: TestDb) {
  const { appRouter } = await import("@/server/trpc/router")
  return appRouter.createCaller({ db: db as never, session: null, user: null })
}

async function makeAuthCaller(db: TestDb, userId: string) {
  const { appRouter } = await import("@/server/trpc/router")
  return appRouter.createCaller({ db: db as never, session: { id: "s1" } as never, user: { id: userId } as never })
}

// ─── cookbooks.list ───────────────────────────────────────────────────────────

describe("cookbooks.list", () => {
  it("anon user sees public cookbooks but not private ones", async () => {
    await withDbTx(async (db) => {
      const owner = await seedUser(db)
      await seedCookbook(db, owner.id, { name: `PublicCB-${uid()}`, isPublic: true })
      const privateCb = await seedCookbook(db, owner.id, { name: `PrivateCB-${uid()}`, isPublic: false })

      const caller = await makeAnonCaller(db)
      const result = await caller.cookbooks.list()
      const ids = result.map((c) => c.id)
      expect(ids).not.toContain(privateCb.id)
    })
  })

  it("owner sees their own private cookbooks", async () => {
    await withDbTx(async (db) => {
      const owner = await seedUser(db)
      const privateCb = await seedCookbook(db, owner.id, { isPublic: false })

      const caller = await makeAuthCaller(db, owner.id)
      const result = await caller.cookbooks.list()
      expect(result.map((c) => c.id)).toContain(privateCb.id)
    })
  })
})

// ─── cookbooks.byId ──────────────────────────────────────────────────────────

describe("cookbooks.byId", () => {
  it("returns null for a non-existent cookbook", async () => {
    await withDbTx(async (db) => {
      const caller = await makeAnonCaller(db)
      const result = await caller.cookbooks.byId({ id: "00000000-0000-0000-0000-000000000000" })
      expect(result).toBeNull()
    })
  })

  it("returns cookbook with recipes ordered by orderIndex", async () => {
    await withDbTx(async (db) => {
      const owner = await seedUser(db)
      const cb = await seedCookbook(db, owner.id)
      const r1 = await seedRecipe(db, owner.id)
      const r2 = await seedRecipe(db, owner.id)

      await db.insert(schema.cookbookRecipes).values([
        { cookbookId: cb.id, recipeId: r1.id, orderIndex: 1 },
        { cookbookId: cb.id, recipeId: r2.id, orderIndex: 0 },
      ])

      const caller = await makeAnonCaller(db)
      const result = await caller.cookbooks.byId({ id: cb.id })
      expect(result).not.toBeNull()
      expect(result!.recipes.map((r) => r.id)).toEqual([r2.id, r1.id])
    })
  })

  it("returns null for a private cookbook to anon user", async () => {
    await withDbTx(async (db) => {
      const owner = await seedUser(db)
      const cb = await seedCookbook(db, owner.id, { isPublic: false })
      const caller = await makeAnonCaller(db)
      expect(await caller.cookbooks.byId({ id: cb.id })).toBeNull()
    })
  })
})

// ─── cookbooks.create ─────────────────────────────────────────────────────────

describe("cookbooks.create", () => {
  it("rejects unauthenticated requests", async () => {
    await withDbTx(async (db) => {
      const caller = await makeAnonCaller(db)
      await expect(caller.cookbooks.create({ name: "Test" })).rejects.toThrow("UNAUTHORIZED")
    })
  })

  it.each([
    [{ name: "My Recipes" },                              { name: "My Recipes", isPublic: true }],
    [{ name: "Private Eats", isPublic: false },           { name: "Private Eats", isPublic: false }],
    [{ name: "With Desc", description: "A description" }, { name: "With Desc", description: "A description" }],
  ])("creates cookbook with %o and returns the record", async (input, expected) => {
    await withDbTx(async (db) => {
      const user = await seedUser(db)
      const caller = await makeAuthCaller(db, user.id)
      const result = await caller.cookbooks.create(input)
      expect(result).toMatchObject({ ...expected, userId: user.id })
    })
  })
})

// ─── cookbooks.update ────────────────────────────────────────────────────────

describe("cookbooks.update", () => {
  it("rejects update by non-owner", async () => {
    await withDbTx(async (db) => {
      const owner = await seedUser(db)
      const other = await seedUser(db)
      const cb = await seedCookbook(db, owner.id)
      const caller = await makeAuthCaller(db, other.id)
      await expect(caller.cookbooks.update({ id: cb.id, name: "Hacked" })).rejects.toThrow("Not your cookbook")
    })
  })

  it("owner can update name and description", async () => {
    await withDbTx(async (db) => {
      const owner = await seedUser(db)
      const cb = await seedCookbook(db, owner.id, { name: "Old Name" })
      const caller = await makeAuthCaller(db, owner.id)
      const result = await caller.cookbooks.update({ id: cb.id, name: "New Name", description: "Updated" })
      expect(result).toMatchObject({ name: "New Name", description: "Updated" })
    })
  })
})

// ─── cookbooks.delete ────────────────────────────────────────────────────────

describe("cookbooks.delete", () => {
  it("rejects delete by non-owner", async () => {
    await withDbTx(async (db) => {
      const owner = await seedUser(db)
      const other = await seedUser(db)
      const cb = await seedCookbook(db, owner.id)
      const caller = await makeAuthCaller(db, other.id)
      await expect(caller.cookbooks.delete({ id: cb.id })).rejects.toThrow("Not your cookbook")
    })
  })

  it("owner can delete their cookbook", async () => {
    await withDbTx(async (db) => {
      const owner = await seedUser(db)
      const cb = await seedCookbook(db, owner.id)
      const caller = await makeAuthCaller(db, owner.id)
      const result = await caller.cookbooks.delete({ id: cb.id })
      expect(result).toMatchObject({ success: true })
      expect(await caller.cookbooks.byId({ id: cb.id })).toBeNull()
    })
  })
})

// ─── cookbooks.addRecipe ─────────────────────────────────────────────────────

describe("cookbooks.addRecipe", () => {
  it("rejects add by non-owner", async () => {
    await withDbTx(async (db) => {
      const owner = await seedUser(db)
      const other = await seedUser(db)
      const cb = await seedCookbook(db, owner.id)
      const r = await seedRecipe(db, owner.id)
      const caller = await makeAuthCaller(db, other.id)
      await expect(caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r.id })).rejects.toThrow("Not your cookbook")
    })
  })

  it("appends recipe to end with correct orderIndex", async () => {
    await withDbTx(async (db) => {
      const owner = await seedUser(db)
      const cb = await seedCookbook(db, owner.id)
      const r1 = await seedRecipe(db, owner.id)
      const r2 = await seedRecipe(db, owner.id)
      const caller = await makeAuthCaller(db, owner.id)

      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r1.id })
      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r2.id })

      const result = await caller.cookbooks.byId({ id: cb.id })
      expect(result!.recipes.map((r) => r.id)).toEqual([r1.id, r2.id])
    })
  })

  it("ignores duplicate add (onConflictDoNothing)", async () => {
    await withDbTx(async (db) => {
      const owner = await seedUser(db)
      const cb = await seedCookbook(db, owner.id)
      const r = await seedRecipe(db, owner.id)
      const caller = await makeAuthCaller(db, owner.id)

      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r.id })
      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r.id })

      const result = await caller.cookbooks.byId({ id: cb.id })
      expect(result!.recipes).toHaveLength(1)
    })
  })
})

// ─── cookbooks.removeRecipe ──────────────────────────────────────────────────

describe("cookbooks.removeRecipe", () => {
  it("rejects remove by non-owner", async () => {
    await withDbTx(async (db) => {
      const owner = await seedUser(db)
      const other = await seedUser(db)
      const cb = await seedCookbook(db, owner.id)
      const r = await seedRecipe(db, owner.id)
      await db.insert(schema.cookbookRecipes).values({ cookbookId: cb.id, recipeId: r.id, orderIndex: 0 })
      const caller = await makeAuthCaller(db, other.id)
      await expect(caller.cookbooks.removeRecipe({ cookbookId: cb.id, recipeId: r.id })).rejects.toThrow("Not your cookbook")
    })
  })

  it("owner can remove a recipe from cookbook", async () => {
    await withDbTx(async (db) => {
      const owner = await seedUser(db)
      const cb = await seedCookbook(db, owner.id)
      const r = await seedRecipe(db, owner.id)
      await db.insert(schema.cookbookRecipes).values({ cookbookId: cb.id, recipeId: r.id, orderIndex: 0 })

      const caller = await makeAuthCaller(db, owner.id)
      await caller.cookbooks.removeRecipe({ cookbookId: cb.id, recipeId: r.id })

      const result = await caller.cookbooks.byId({ id: cb.id })
      expect(result!.recipes).toHaveLength(0)
    })
  })
})

// ─── cookbooks.reorderRecipes ────────────────────────────────────────────────

describe("cookbooks.reorderRecipes", () => {
  it("rejects reorder by non-owner", async () => {
    await withDbTx(async (db) => {
      const owner = await seedUser(db)
      const other = await seedUser(db)
      const cb = await seedCookbook(db, owner.id)
      const r = await seedRecipe(db, owner.id)
      const caller = await makeAuthCaller(db, other.id)
      await expect(
        caller.cookbooks.reorderRecipes({ cookbookId: cb.id, recipeIds: [r.id] }),
      ).rejects.toThrow("Not your cookbook")
    })
  })

  it("persists new recipe order", async () => {
    await withDbTx(async (db) => {
      const owner = await seedUser(db)
      const cb = await seedCookbook(db, owner.id)
      const r1 = await seedRecipe(db, owner.id)
      const r2 = await seedRecipe(db, owner.id)
      const r3 = await seedRecipe(db, owner.id)

      await db.insert(schema.cookbookRecipes).values([
        { cookbookId: cb.id, recipeId: r1.id, orderIndex: 0 },
        { cookbookId: cb.id, recipeId: r2.id, orderIndex: 1 },
        { cookbookId: cb.id, recipeId: r3.id, orderIndex: 2 },
      ])

      const caller = await makeAuthCaller(db, owner.id)
      await caller.cookbooks.reorderRecipes({ cookbookId: cb.id, recipeIds: [r3.id, r1.id, r2.id] })

      const result = await caller.cookbooks.byId({ id: cb.id })
      expect(result!.recipes.map((r) => r.id)).toEqual([r3.id, r1.id, r2.id])
    })
  })
})
