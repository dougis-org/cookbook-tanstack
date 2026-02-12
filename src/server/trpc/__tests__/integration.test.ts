import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/db", () => ({
  db: {},
}))

vi.mock("@/db/schema", () => ({
  users: { id: "id", email: "email" },
  sessions: {},
  accounts: {},
  verifications: {},
  meals: {},
  courses: {},
  preparations: {},
  recipes: {
    id: "id",
    name: "name",
    classificationId: "cid",
    userId: "uid",
    isPublic: "pub",
  },
  cookbooks: { id: "id", userId: "uid" },
  classifications: { id: "id" },
  sources: { id: "id" },
  recipeMeals: { recipeId: "rid" },
  recipeCourses: { recipeId: "rid" },
  recipePreparations: { recipeId: "rid" },
  cookbookRecipes: { cookbookId: "cid" },
  recipeImages: { recipeId: "rid" },
  recipeLikes: {},
  cookbookFollowers: {},
}))

vi.mock("@/lib/auth", () => ({
  auth: {
    api: { getSession: vi.fn() },
  },
}))

describe("tRPC integration", () => {
  let appRouter: Awaited<typeof import("@/server/trpc/router")>["appRouter"]

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import("@/server/trpc/router")
    appRouter = mod.appRouter
  })

  describe("router structure", () => {
    it("has all expected sub-routers", () => {
      const procedures = Object.keys(appRouter._def.record)
      expect(procedures).toContain("recipes")
      expect(procedures).toContain("cookbooks")
      expect(procedures).toContain("classifications")
      expect(procedures).toContain("sources")
      expect(procedures).toContain("meals")
      expect(procedures).toContain("courses")
      expect(procedures).toContain("preparations")
      expect(procedures).toContain("users")
    })
  })

  describe("auth middleware enforcement", () => {
    const protectedProcedures = [
      { path: "recipes.create", input: { name: "Test" } },
      {
        path: "recipes.update",
        input: { id: "00000000-0000-0000-0000-000000000000", name: "Test" },
      },
      {
        path: "recipes.delete",
        input: { id: "00000000-0000-0000-0000-000000000000" },
      },
      { path: "cookbooks.create", input: { name: "Test" } },
      {
        path: "cookbooks.update",
        input: { id: "00000000-0000-0000-0000-000000000000", name: "Test" },
      },
      {
        path: "cookbooks.delete",
        input: { id: "00000000-0000-0000-0000-000000000000" },
      },
      { path: "sources.create", input: { name: "Test" } },
      { path: "users.me", input: undefined },
      {
        path: "users.updateProfile",
        input: { name: "Test" },
      },
    ]

    for (const { path, input } of protectedProcedures) {
      it(`rejects unauthenticated call to ${path}`, async () => {
        const db = createNoopDb()
        const caller = appRouter.createCaller({
          db,
          session: null,
          user: null,
        })

        const [routerName, procName] = path.split(".") as [
          keyof typeof caller,
          string,
        ]
        const proc = (caller[routerName] as Record<string, Function>)[procName]

        await expect(proc(input)).rejects.toThrow("UNAUTHORIZED")
      })
    }
  })

  describe("Zod validation", () => {
    it("rejects invalid UUID for recipes.byId", async () => {
      const db = createNoopDb()
      const caller = appRouter.createCaller({
        db,
        session: null,
        user: null,
      })

      await expect(
        caller.recipes.byId({ id: "not-a-uuid" }),
      ).rejects.toThrow()
    })

    it("rejects invalid UUID for classifications.byId", async () => {
      const db = createNoopDb()
      const caller = appRouter.createCaller({
        db,
        session: null,
        user: null,
      })

      await expect(
        caller.classifications.byId({ id: "invalid" }),
      ).rejects.toThrow()
    })

    it("rejects empty name for recipes.create", async () => {
      const db = createNoopDb()
      const caller = appRouter.createCaller({
        db,
        session: { id: "s1" } as never,
        user: { id: "u1" } as never,
      })

      await expect(caller.recipes.create({ name: "" })).rejects.toThrow()
    })

    it("rejects invalid URL for sources.create", async () => {
      const db = createNoopDb()
      const caller = appRouter.createCaller({
        db,
        session: { id: "s1" } as never,
        user: { id: "u1" } as never,
      })

      await expect(
        caller.sources.create({ name: "Test", url: "not-a-url" }),
      ).rejects.toThrow()
    })
  })

  describe("public access", () => {
    it("allows unauthenticated access to meals.list", async () => {
      const mockFrom = vi.fn().mockReturnValue([
        { id: "1", name: "Breakfast", slug: "breakfast" },
      ])
      const db = { select: vi.fn().mockReturnValue({ from: mockFrom }) } as never

      const caller = appRouter.createCaller({
        db,
        session: null,
        user: null,
      })

      const result = await caller.meals.list()
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("Breakfast")
    })

    it("allows unauthenticated access to courses.list", async () => {
      const mockFrom = vi.fn().mockReturnValue([])
      const db = { select: vi.fn().mockReturnValue({ from: mockFrom }) } as never

      const caller = appRouter.createCaller({
        db,
        session: null,
        user: null,
      })

      const result = await caller.courses.list()
      expect(result).toEqual([])
    })

    it("allows unauthenticated access to preparations.list", async () => {
      const mockFrom = vi.fn().mockReturnValue([])
      const db = { select: vi.fn().mockReturnValue({ from: mockFrom }) } as never

      const caller = appRouter.createCaller({
        db,
        session: null,
        user: null,
      })

      const result = await caller.preparations.list()
      expect(result).toEqual([])
    })
  })
})

function createNoopDb() {
  const mockWhere = vi.fn().mockReturnValue([])
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
  const mockReturning = vi.fn().mockReturnValue([])
  const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
  const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
  const mockUpdateWhere = vi.fn().mockReturnValue({
    returning: vi.fn().mockReturnValue([]),
  })
  const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere })
  const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
  const mockDeleteWhere = vi.fn().mockResolvedValue(undefined)
  const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere })
  return {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  } as never
}
