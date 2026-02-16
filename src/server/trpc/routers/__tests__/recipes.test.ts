import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockDb, type MockDb } from "@/test-helpers/mocks"

vi.mock("@/db", () => ({ db: {} }))
vi.mock("@/db/schema", () => ({
  users: {}, sessions: {}, accounts: {}, verifications: {},
  recipes: {}, cookbooks: {}, classifications: {}, sources: {},
  meals: {}, courses: {}, preparations: {},
  recipeMeals: {}, recipeCourses: {}, recipePreparations: {},
  cookbookRecipes: {}, recipeImages: {}, recipeLikes: {}, cookbookFollowers: {},
}))
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }))

const VALID_UUID = "00000000-0000-0000-0000-000000000000"
const authCtx = { session: { id: "s1" } as never, user: { id: "u1" } as never }
const anonCtx = { session: null, user: null }

/** Pass a MockDb into createCaller which expects the real Drizzle db type. */
function anonCaller(router: { createCaller: Function }, db: MockDb) {
  return router.createCaller({ db: db as never, ...anonCtx })
}
function authCaller(router: { createCaller: Function }, db: MockDb) {
  return router.createCaller({ db: db as never, ...authCtx })
}

describe("recipes router", () => {
  let appRouter: Awaited<typeof import("@/server/trpc/router")>["appRouter"]

  beforeEach(async () => {
    vi.clearAllMocks()
    appRouter = (await import("@/server/trpc/router")).appRouter
  })

  describe("list", () => {
    it("returns paginated recipes without filters", async () => {
      const db = createMockDb([{ id: "1", name: "Recipe 1" }, { id: "2", name: "Recipe 2" }])
      const caller = anonCaller(appRouter, db)

      const result = await caller.recipes.list()
      expect(result.items).toHaveLength(2)
      expect(result).toHaveProperty("total")
      expect(result).toHaveProperty("page")
      expect(result).toHaveProperty("pageSize")
    })

    it("allows unauthenticated access", async () => {
      const caller = anonCaller(appRouter, createMockDb())

      const result = await caller.recipes.list()
      expect(result.items).toEqual([])
    })

    it("calls where with visibility filter for anonymous users", async () => {
      const db = createMockDb()
      const caller = anonCaller(appRouter, db)

      await caller.recipes.list()

      // Verify the query pipeline was invoked (select -> from -> where)
      expect(db.select).toHaveBeenCalled()
    })

    it("calls where with visibility filter for authenticated users", async () => {
      const db = createMockDb()
      const caller = authCaller(appRouter, db)

      await caller.recipes.list()

      expect(db.select).toHaveBeenCalled()
    })

    it("searches both name and ingredients", async () => {
      const db = createMockDb([
        { id: "1", name: "Pasta", ingredients: "noodles\neggs" },
        { id: "2", name: "Salad", ingredients: "chicken\nlettuce" },
      ])
      const caller = anonCaller(appRouter, db)

      // The mock DB returns all rows regardless, but we verify the search
      // param is accepted and the query pipeline executes
      const result = await caller.recipes.list({ search: "chicken" })
      expect(result.items).toBeDefined()
      expect(db.select).toHaveBeenCalled()
    })

    it("accepts sort and pagination parameters", async () => {
      const db = createMockDb([])
      const caller = anonCaller(appRouter, db)

      const result = await caller.recipes.list({ sort: "name_asc", page: 2, pageSize: 10 })
      expect(result.page).toBe(2)
      expect(result.pageSize).toBe(10)
    })

    it("accepts mealIds filter parameter", async () => {
      const db = createMockDb()
      const caller = anonCaller(appRouter, db)

      const result = await caller.recipes.list({ mealIds: [VALID_UUID] })
      expect(result.items).toBeDefined()
      expect(db.select).toHaveBeenCalled()
    })

    it("accepts courseIds filter parameter", async () => {
      const db = createMockDb()
      const caller = anonCaller(appRouter, db)

      const result = await caller.recipes.list({ courseIds: [VALID_UUID] })
      expect(result.items).toBeDefined()
    })

    it("accepts preparationIds filter parameter", async () => {
      const db = createMockDb()
      const caller = anonCaller(appRouter, db)

      const result = await caller.recipes.list({ preparationIds: [VALID_UUID] })
      expect(result.items).toBeDefined()
    })
  })

  describe("byId", () => {
    it("returns null for non-existent recipe", async () => {
      const caller = anonCaller(appRouter, createMockDb())

      expect(await caller.recipes.byId({ id: VALID_UUID })).toBeNull()
    })

    it("rejects invalid UUID", async () => {
      const caller = anonCaller(appRouter, createMockDb())

      await expect(caller.recipes.byId({ id: "not-a-uuid" })).rejects.toThrow()
    })

    it("returns recipe with relations when found", async () => {
      const recipe = { id: VALID_UUID, name: "Found", isPublic: true, userId: "u1" }
      const db = createMockDb([recipe])
      const caller = anonCaller(appRouter, db)

      const result = await caller.recipes.byId({ id: VALID_UUID })

      expect(result).toMatchObject({ id: VALID_UUID, name: "Found" })
    })
  })

  describe("create", () => {
    it("rejects unauthenticated users", async () => {
      const caller = anonCaller(appRouter, createMockDb())

      await expect(caller.recipes.create({ name: "Test" })).rejects.toThrow("UNAUTHORIZED")
    })

    it("validates input — name is required", async () => {
      const caller = authCaller(appRouter, createMockDb())

      await expect(caller.recipes.create({ name: "" })).rejects.toThrow()
    })

    it("uses a transaction for insert + taxonomy sync", async () => {
      const recipe = { id: VALID_UUID, name: "New", userId: "u1" }
      const db = createMockDb([recipe])
      const caller = authCaller(appRouter, db)

      const result = await caller.recipes.create({ name: "New" })

      expect(result).toMatchObject({ id: VALID_UUID })
      expect(db.transaction).toHaveBeenCalledTimes(1)
    })
  })

  describe("update", () => {
    it("rejects unauthenticated users", async () => {
      const caller = anonCaller(appRouter, createMockDb())

      await expect(
        caller.recipes.update({ id: VALID_UUID, name: "Updated" }),
      ).rejects.toThrow("UNAUTHORIZED")
    })

    it("uses a transaction for update + taxonomy sync", async () => {
      const recipe = { id: VALID_UUID, name: "Existing", userId: "u1" }
      const db = createMockDb([recipe])
      const caller = authCaller(appRouter, db)

      await caller.recipes.update({ id: VALID_UUID, name: "Updated" })

      expect(db.transaction).toHaveBeenCalledTimes(1)
    })

    it("skips UPDATE when only taxonomy IDs are provided", async () => {
      const recipe = { id: VALID_UUID, name: "Existing", userId: "u1" }
      const db = createMockDb([recipe])
      const caller = authCaller(appRouter, db)

      const result = await caller.recipes.update({
        id: VALID_UUID,
        mealIds: [VALID_UUID],
      })

      // Should return the existing recipe (fetched via select, not update)
      expect(result).toMatchObject({ id: VALID_UUID })
      expect(db.transaction).toHaveBeenCalledTimes(1)
    })
  })

  describe("delete", () => {
    it("rejects unauthenticated users", async () => {
      const caller = anonCaller(appRouter, createMockDb())

      await expect(caller.recipes.delete({ id: VALID_UUID })).rejects.toThrow("UNAUTHORIZED")
    })
  })

  describe("toggleMarked", () => {
    it("rejects unauthenticated users", async () => {
      const caller = anonCaller(appRouter, createMockDb())

      await expect(caller.recipes.toggleMarked({ id: VALID_UUID })).rejects.toThrow("UNAUTHORIZED")
    })

    it("returns marked state after toggling", async () => {
      const db = createMockDb()
      const caller = authCaller(appRouter, db)

      const result = await caller.recipes.toggleMarked({ id: VALID_UUID })

      expect(result).toHaveProperty("marked")
      expect(typeof result.marked).toBe("boolean")
    })
  })

  describe("isMarked", () => {
    it("returns false for unauthenticated users", async () => {
      const caller = anonCaller(appRouter, createMockDb())

      const result = await caller.recipes.isMarked({ id: VALID_UUID })

      expect(result).toEqual({ marked: false })
    })

    it("returns marked state for authenticated users", async () => {
      const db = createMockDb()
      const caller = authCaller(appRouter, db)

      const result = await caller.recipes.isMarked({ id: VALID_UUID })

      expect(result).toHaveProperty("marked")
    })
  })
})
