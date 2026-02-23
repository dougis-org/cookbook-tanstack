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

type Caller = Awaited<ReturnType<typeof makeAuthCaller>>
type Cookbook = typeof schema.cookbooks.$inferSelect
type Recipe = typeof schema.recipes.$inferSelect

// ─── Ownership guard ─────────────────────────────────────────────────────────
//
// All mutations that require cookbook ownership share the same rejection
// behaviour. A single it.each drives the setup → act → assert pattern for all
// five protected endpoints so we don't repeat the boilerplate five times.

describe("ownership guard — non-owner is rejected", () => {
  it.each([
    {
      label: "update",
      act: (caller: Caller, cb: Cookbook, _r: Recipe) =>
        caller.cookbooks.update({ id: cb.id, name: "Hacked" }),
    },
    {
      label: "delete",
      act: (caller: Caller, cb: Cookbook, _r: Recipe) =>
        caller.cookbooks.delete({ id: cb.id }),
    },
    {
      label: "addRecipe",
      act: (caller: Caller, cb: Cookbook, r: Recipe) =>
        caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r.id }),
    },
    {
      label: "removeRecipe",
      act: (caller: Caller, cb: Cookbook, r: Recipe) =>
        caller.cookbooks.removeRecipe({ cookbookId: cb.id, recipeId: r.id }),
    },
    {
      label: "reorderRecipes",
      act: (caller: Caller, cb: Cookbook, r: Recipe) =>
        caller.cookbooks.reorderRecipes({ cookbookId: cb.id, recipeIds: [r.id] }),
    },
  ])("$label", async ({ act }) => {
    await withDbTx(async (db) => {
      const owner = await seedUser(db)
      const other = await seedUser(db)
      const cb = await seedCookbook(db, owner.id)
      const r = await seedRecipe(db, owner.id)
      const caller = await makeAuthCaller(db, other.id)
      await expect(act(caller, cb, r)).rejects.toThrow("Not your cookbook")
    })
  })
})

// ─── cookbooks.list ───────────────────────────────────────────────────────────

describe("cookbooks.list", () => {
  it("anon user sees public cookbooks but not private ones", async () => {
    await withDbTx(async (db) => {
      const owner = await seedUser(db)
      await seedCookbook(db, owner.id, { isPublic: true })
      const privateCb = await seedCookbook(db, owner.id, { isPublic: false })

      const caller = await makeAnonCaller(db)
      const ids = (await caller.cookbooks.list()).map((c) => c.id)
      expect(ids).not.toContain(privateCb.id)
    })
  })

  it("owner sees their own private cookbooks", async () => {
    await withDbTx(async (db) => {
      const owner = await seedUser(db)
      const privateCb = await seedCookbook(db, owner.id, { isPublic: false })

      const caller = await makeAuthCaller(db, owner.id)
      expect((await caller.cookbooks.list()).map((c) => c.id)).toContain(privateCb.id)
    })
  })
})

// ─── cookbooks.byId ──────────────────────────────────────────────────────────

describe("cookbooks.byId", () => {
  it.each([
    {
      label: "non-existent id",
      setup: async (_db: TestDb) => "00000000-0000-0000-0000-000000000000",
    },
    {
      label: "private cookbook for anon user",
      setup: async (db: TestDb) => {
        const owner = await seedUser(db)
        const cb = await seedCookbook(db, owner.id, { isPublic: false })
        return cb.id
      },
    },
  ])("returns null for $label", async ({ setup }) => {
    await withDbTx(async (db) => {
      const id = await setup(db)
      const caller = await makeAnonCaller(db)
      expect(await caller.cookbooks.byId({ id })).toBeNull()
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
      expect(result!.recipes.map((r) => r.id)).toEqual([r2.id, r1.id])
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
      expect(await caller.cookbooks.create(input)).toMatchObject({ ...expected, userId: user.id })
    })
  })
})

// ─── cookbooks.update ────────────────────────────────────────────────────────

describe("cookbooks.update", () => {
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
  it("owner can delete their cookbook and it becomes unfetchable", async () => {
    await withDbTx(async (db) => {
      const owner = await seedUser(db)
      const cb = await seedCookbook(db, owner.id)
      const caller = await makeAuthCaller(db, owner.id)
      expect(await caller.cookbooks.delete({ id: cb.id })).toMatchObject({ success: true })
      expect(await caller.cookbooks.byId({ id: cb.id })).toBeNull()
    })
  })
})

// ─── cookbooks.addRecipe ─────────────────────────────────────────────────────

describe("cookbooks.addRecipe", () => {
  it("appends recipes in order and ignores duplicates", async () => {
    await withDbTx(async (db) => {
      const owner = await seedUser(db)
      const cb = await seedCookbook(db, owner.id)
      const r1 = await seedRecipe(db, owner.id)
      const r2 = await seedRecipe(db, owner.id)
      const caller = await makeAuthCaller(db, owner.id)

      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r1.id })
      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r2.id })
      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r1.id }) // duplicate

      const result = await caller.cookbooks.byId({ id: cb.id })
      expect(result!.recipes.map((r) => r.id)).toEqual([r1.id, r2.id])
    })
  })
})

// ─── cookbooks.removeRecipe ──────────────────────────────────────────────────

describe("cookbooks.removeRecipe", () => {
  it("owner can remove a recipe from the cookbook", async () => {
    await withDbTx(async (db) => {
      const owner = await seedUser(db)
      const cb = await seedCookbook(db, owner.id)
      const r = await seedRecipe(db, owner.id)
      await db.insert(schema.cookbookRecipes).values({ cookbookId: cb.id, recipeId: r.id, orderIndex: 0 })

      const caller = await makeAuthCaller(db, owner.id)
      await caller.cookbooks.removeRecipe({ cookbookId: cb.id, recipeId: r.id })

      expect((await caller.cookbooks.byId({ id: cb.id }))!.recipes).toHaveLength(0)
    })
  })
})

// ─── cookbooks.reorderRecipes ────────────────────────────────────────────────

describe("cookbooks.reorderRecipes", () => {
  it("persists new recipe order", async () => {
    await withDbTx(async (db) => {
      const owner = await seedUser(db)
      const cb = await seedCookbook(db, owner.id)
      const [r1, r2, r3] = await Promise.all([
        seedRecipe(db, owner.id),
        seedRecipe(db, owner.id),
        seedRecipe(db, owner.id),
      ])

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
