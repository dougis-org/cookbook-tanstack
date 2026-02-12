import { describe, it, expect, vi } from "vitest"
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

const sampleRows = [
  { id: "1", name: "Breakfast", slug: "breakfast", description: null },
  { id: "2", name: "Lunch", slug: "lunch", description: null },
]

describe.each(["meals", "courses", "preparations"] as const)(
  "%s.list",
  (routerName) => {
    it("returns all rows via public access", async () => {
      const { appRouter } = await import("@/server/trpc/router")
      const db = createMockDb(sampleRows)
      const caller = appRouter.createCaller({ db, session: null, user: null })

      const result = await (caller[routerName] as { list: () => Promise<unknown[]> }).list()

      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty("name", "Breakfast")
    })
  },
)
