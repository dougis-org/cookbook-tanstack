// @vitest-environment node
import { describe, it, expect, vi } from "vitest"
import { withCleanDb } from "@/test-helpers/with-clean-db"
import { Meal, Course, Preparation } from "@/db/models"

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }))

// Use a unique prefix per test run so assertions are independent of other
// data that may exist in the shared DB instance.
const RUN_ID = Date.now()

describe.each(["meals", "courses", "preparations"] as const)("%s.list", (routerName) => {
  const ModelMap = {
    meals: Meal,
    courses: Course,
    preparations: Preparation,
  } as const

  it("includes an inserted row in the result", async () => {
    await withCleanDb(async () => {
      const slug = `${routerName}-single-${RUN_ID}`
      await new ModelMap[routerName]({ name: "Breakfast", slug }).save()

      const { appRouter } = await import("@/server/trpc/router")
      const caller = appRouter.createCaller({ session: null, user: null })
      const result = await (caller[routerName] as { list: () => Promise<unknown[]> }).list()

      expect(result).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: "Breakfast", slug })]),
      )
    })
  })

  it("includes all inserted rows in the result", async () => {
    await withCleanDb(async () => {
      const slugA = `${routerName}-alpha-${RUN_ID}`
      const slugB = `${routerName}-beta-${RUN_ID}`
      await new ModelMap[routerName]({ name: "Alpha", slug: slugA }).save()
      await new ModelMap[routerName]({ name: "Beta", slug: slugB }).save()

      const { appRouter } = await import("@/server/trpc/router")
      const caller = appRouter.createCaller({ session: null, user: null })
      const result = await (caller[routerName] as { list: () => Promise<unknown[]> }).list()

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ slug: slugA }),
          expect.objectContaining({ slug: slugB }),
        ]),
      )
    })
  })

  it("returns an array (route is publicly accessible without auth)", async () => {
    await withCleanDb(async () => {
      const { appRouter } = await import("@/server/trpc/router")
      const caller = appRouter.createCaller({ session: null, user: null })
      const result = await (caller[routerName] as { list: () => Promise<unknown[]> }).list()
      expect(Array.isArray(result)).toBe(true)
    })
  })
})
