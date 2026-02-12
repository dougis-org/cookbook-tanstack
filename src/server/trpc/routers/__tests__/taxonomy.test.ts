import { describe, it, expect, vi } from "vitest"

vi.mock("@/db", () => ({
  db: {},
}))

vi.mock("@/db/schema", () => ({
  users: {},
  sessions: {},
  accounts: {},
  verifications: {},
  meals: { _: "meals" },
  courses: { _: "courses" },
  preparations: { _: "preparations" },
  recipes: {},
  cookbooks: {},
  classifications: {},
  sources: {},
  recipeMeals: {},
  recipeCourses: {},
  recipePreparations: {},
  cookbookRecipes: {},
  recipeImages: {},
  recipeLikes: {},
  cookbookFollowers: {},
}))

vi.mock("@/lib/auth", () => ({
  auth: {
    api: { getSession: vi.fn() },
  },
}))

describe("taxonomy routers", () => {
  const mockSelect = vi.fn()
  const mockFrom = vi.fn()

  function createMockDb() {
    mockFrom.mockReturnValue([
      { id: "1", name: "Breakfast", slug: "breakfast", description: null },
      { id: "2", name: "Lunch", slug: "lunch", description: null },
    ])
    mockSelect.mockReturnValue({ from: mockFrom })
    return { select: mockSelect } as never
  }

  it("meals.list returns all meals", async () => {
    const { appRouter } = await import("@/server/trpc/router")
    const db = createMockDb()

    const caller = appRouter.createCaller({ db, session: null, user: null })
    const result = await caller.meals.list()

    expect(result).toHaveLength(2)
    expect(result[0].name).toBe("Breakfast")
    expect(mockSelect).toHaveBeenCalled()
  })

  it("courses.list returns all courses", async () => {
    const { appRouter } = await import("@/server/trpc/router")
    const db = createMockDb()

    const caller = appRouter.createCaller({ db, session: null, user: null })
    const result = await caller.courses.list()

    expect(result).toHaveLength(2)
    expect(mockSelect).toHaveBeenCalled()
  })

  it("preparations.list returns all preparations", async () => {
    const { appRouter } = await import("@/server/trpc/router")
    const db = createMockDb()

    const caller = appRouter.createCaller({ db, session: null, user: null })
    const result = await caller.preparations.list()

    expect(result).toHaveLength(2)
    expect(mockSelect).toHaveBeenCalled()
  })
})
