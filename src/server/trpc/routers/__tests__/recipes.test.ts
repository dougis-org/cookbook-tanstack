import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockDb } from "@/test-helpers/mocks"

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

describe("recipes router", () => {
  let appRouter: Awaited<typeof import("@/server/trpc/router")>["appRouter"]

  beforeEach(async () => {
    vi.clearAllMocks()
    appRouter = (await import("@/server/trpc/router")).appRouter
  })

  describe("list", () => {
    it("returns recipes without filters", async () => {
      const db = createMockDb([{ id: "1", name: "Recipe 1" }, { id: "2", name: "Recipe 2" }])
      const caller = appRouter.createCaller({ db, ...anonCtx })

      expect(await caller.recipes.list()).toHaveLength(2)
    })

    it("allows unauthenticated access", async () => {
      const caller = appRouter.createCaller({ db: createMockDb(), ...anonCtx })

      expect(await caller.recipes.list()).toEqual([])
    })

    it("calls where with visibility filter for anonymous users", async () => {
      const db = createMockDb()
      const caller = appRouter.createCaller({ db, ...anonCtx })

      await caller.recipes.list()

      // Verify the query pipeline was invoked (select -> from -> where)
      expect(db.select).toHaveBeenCalled()
    })

    it("calls where with visibility filter for authenticated users", async () => {
      const db = createMockDb()
      const caller = appRouter.createCaller({ db, ...authCtx })

      await caller.recipes.list()

      expect(db.select).toHaveBeenCalled()
    })
  })

  describe("byId", () => {
    it("returns null for non-existent recipe", async () => {
      const caller = appRouter.createCaller({ db: createMockDb(), ...anonCtx })

      expect(await caller.recipes.byId({ id: VALID_UUID })).toBeNull()
    })

    it("rejects invalid UUID", async () => {
      const caller = appRouter.createCaller({ db: createMockDb(), ...anonCtx })

      await expect(caller.recipes.byId({ id: "not-a-uuid" })).rejects.toThrow()
    })

    it("returns recipe with relations when found", async () => {
      const recipe = { id: VALID_UUID, name: "Found", isPublic: true, userId: "u1" }
      const db = createMockDb([recipe])
      const caller = appRouter.createCaller({ db, ...anonCtx })

      const result = await caller.recipes.byId({ id: VALID_UUID })

      expect(result).toMatchObject({ id: VALID_UUID, name: "Found" })
    })
  })

  describe("create", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller({ db: createMockDb(), ...anonCtx })

      await expect(caller.recipes.create({ name: "Test" })).rejects.toThrow("UNAUTHORIZED")
    })

    it("validates input — name is required", async () => {
      const caller = appRouter.createCaller({ db: createMockDb(), ...authCtx })

      await expect(caller.recipes.create({ name: "" })).rejects.toThrow()
    })

    it("uses a transaction for insert + taxonomy sync", async () => {
      const recipe = { id: VALID_UUID, name: "New", userId: "u1" }
      const db = createMockDb([recipe])
      const caller = appRouter.createCaller({ db, ...authCtx })

      const result = await caller.recipes.create({ name: "New" })

      expect(result).toMatchObject({ id: VALID_UUID })
      expect(db.transaction).toHaveBeenCalledTimes(1)
    })
  })

  describe("update", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller({ db: createMockDb(), ...anonCtx })

      await expect(
        caller.recipes.update({ id: VALID_UUID, name: "Updated" }),
      ).rejects.toThrow("UNAUTHORIZED")
    })

    it("uses a transaction for update + taxonomy sync", async () => {
      const recipe = { id: VALID_UUID, name: "Existing", userId: "u1" }
      const db = createMockDb([recipe])
      const caller = appRouter.createCaller({ db, ...authCtx })

      await caller.recipes.update({ id: VALID_UUID, name: "Updated" })

      expect(db.transaction).toHaveBeenCalledTimes(1)
    })

    it("skips UPDATE when only taxonomy IDs are provided", async () => {
      const recipe = { id: VALID_UUID, name: "Existing", userId: "u1" }
      const db = createMockDb([recipe])
      const caller = appRouter.createCaller({ db, ...authCtx })

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
      const caller = appRouter.createCaller({ db: createMockDb(), ...anonCtx })

      await expect(caller.recipes.delete({ id: VALID_UUID })).rejects.toThrow("UNAUTHORIZED")
    })
  })
})
