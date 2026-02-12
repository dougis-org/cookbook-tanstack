import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/db", () => ({
  db: {},
}))

vi.mock("@/db/schema", () => ({
  users: {},
  sessions: {},
  accounts: {},
  verifications: {},
  meals: {},
  courses: {},
  preparations: {},
  recipes: { id: "id", name: "name", classificationId: "cid", userId: "uid", isPublic: "pub" },
  cookbooks: {},
  classifications: {},
  sources: {},
  recipeMeals: { recipeId: "rid" },
  recipeCourses: { recipeId: "rid" },
  recipePreparations: { recipeId: "rid" },
  cookbookRecipes: {},
  recipeImages: { recipeId: "rid" },
  recipeLikes: {},
  cookbookFollowers: {},
}))

vi.mock("@/lib/auth", () => ({
  auth: {
    api: { getSession: vi.fn() },
  },
}))

describe("recipes router", () => {
  let appRouter: Awaited<typeof import("@/server/trpc/router")>["appRouter"]

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import("@/server/trpc/router")
    appRouter = mod.appRouter
  })

  function createMockDb(overrides: Record<string, unknown> = {}) {
    const mockWhere = vi.fn().mockReturnValue([])
    const mockFrom = vi.fn().mockReturnValue(
      overrides.selectResult ?? { where: mockWhere },
    )
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

    const mockReturning = vi.fn().mockReturnValue(
      overrides.insertResult ?? [{ id: "new-id", name: "Test Recipe", userId: "user-1" }],
    )
    const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
    const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

    const mockUpdateReturning = vi.fn().mockReturnValue(
      overrides.updateResult ?? [{ id: "recipe-1", name: "Updated" }],
    )
    const mockUpdateWhere = vi.fn().mockReturnValue({ returning: mockUpdateReturning })
    const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere })
    const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

    const mockDeleteWhere = vi.fn().mockResolvedValue(undefined)
    const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere })

    return {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      _mocks: { mockSelect, mockFrom, mockWhere, mockInsert, mockValues, mockReturning },
    } as never
  }

  describe("list", () => {
    it("returns recipes without filters", async () => {
      const mockWhere = vi.fn().mockReturnValue([
        { id: "1", name: "Recipe 1" },
        { id: "2", name: "Recipe 2" },
      ])
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      const db = { select: mockSelect } as never

      const caller = appRouter.createCaller({ db, session: null, user: null })
      const result = await caller.recipes.list()

      expect(result).toHaveLength(2)
    })

    it("allows unauthenticated access", async () => {
      const mockWhere = vi.fn().mockReturnValue([])
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      const db = { select: mockSelect } as never

      const caller = appRouter.createCaller({ db, session: null, user: null })
      const result = await caller.recipes.list()

      expect(result).toEqual([])
    })
  })

  describe("byId", () => {
    it("returns null for non-existent recipe", async () => {
      const mockWhere = vi.fn().mockReturnValue([])
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      const db = { select: mockSelect } as never

      const caller = appRouter.createCaller({ db, session: null, user: null })
      const result = await caller.recipes.byId({
        id: "00000000-0000-0000-0000-000000000000",
      })

      expect(result).toBeNull()
    })

    it("rejects invalid UUID", async () => {
      const db = createMockDb()
      const caller = appRouter.createCaller({ db, session: null, user: null })

      await expect(
        caller.recipes.byId({ id: "not-a-uuid" }),
      ).rejects.toThrow()
    })
  })

  describe("create", () => {
    it("rejects unauthenticated users", async () => {
      const db = createMockDb()
      const caller = appRouter.createCaller({ db, session: null, user: null })

      await expect(
        caller.recipes.create({ name: "Test Recipe" }),
      ).rejects.toThrow("UNAUTHORIZED")
    })

    it("validates input — name is required", async () => {
      const db = createMockDb()
      const caller = appRouter.createCaller({
        db,
        session: { id: "s1" } as never,
        user: { id: "u1" } as never,
      })

      await expect(
        caller.recipes.create({ name: "" }),
      ).rejects.toThrow()
    })
  })

  describe("update", () => {
    it("rejects unauthenticated users", async () => {
      const db = createMockDb()
      const caller = appRouter.createCaller({ db, session: null, user: null })

      await expect(
        caller.recipes.update({
          id: "00000000-0000-0000-0000-000000000000",
          name: "Updated",
        }),
      ).rejects.toThrow("UNAUTHORIZED")
    })
  })

  describe("delete", () => {
    it("rejects unauthenticated users", async () => {
      const db = createMockDb()
      const caller = appRouter.createCaller({ db, session: null, user: null })

      await expect(
        caller.recipes.delete({
          id: "00000000-0000-0000-0000-000000000000",
        }),
      ).rejects.toThrow("UNAUTHORIZED")
    })
  })
})
