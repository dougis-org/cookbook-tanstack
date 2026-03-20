// @vitest-environment node
import { describe, it, expect, vi } from "vitest"
import { withCleanDb } from "@/test-helpers/with-clean-db"
import { Meal, Course, Preparation, Recipe } from "@/db/models"
import { seedUserWithBetterAuth } from "./test-helpers"

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

  const fieldMap = {
    meals: "mealIds",
    courses: "courseIds",
    preparations: "preparationIds",
  } as const

  it("includes an inserted row in the result with a string id field", async () => {
    await withCleanDb(async () => {
      const slug = `${routerName}-single-${RUN_ID}`
      await new ModelMap[routerName]({ name: "Breakfast", slug }).save()

      const { appRouter } = await import("@/server/trpc/router")
      const caller = appRouter.createCaller({ session: null, user: null })
      const result = await (caller[routerName] as { list: () => Promise<unknown[]> }).list()

      expect(result).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: "Breakfast", slug })]),
      )
      // Each item must have a string `id` (mapped from MongoDB _id) so that
      // the recipes filter chips can use it as a URL search parameter.
      for (const item of result as { id?: unknown }[]) {
        expect(typeof item.id).toBe("string")
      }
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

  it("includes recipeCount=0 when no recipes reference the taxonomy item", async () => {
    await withCleanDb(async () => {
      const slug = `${routerName}-noref-${RUN_ID}`
      await new ModelMap[routerName]({ name: "Unused", slug }).save()

      const { appRouter } = await import("@/server/trpc/router")
      const caller = appRouter.createCaller({ session: null, user: null })
      const result = await (caller[routerName] as { list: () => Promise<{ slug: string; recipeCount: number }[]> }).list()
      const inserted = result.find((r) => r.slug === slug)
      expect(typeof inserted?.recipeCount).toBe("number")
      expect(inserted?.recipeCount).toBe(0)
    })
  })

  it("counts recipes that reference the taxonomy item", async () => {
    await withCleanDb(async () => {
      const slug = `${routerName}-ref-${RUN_ID}`
      const taxDoc = await new ModelMap[routerName]({ name: "Referenced", slug }).save()
      const user = await seedUserWithBetterAuth()

      await new Recipe({ name: "R1", userId: user.id, isPublic: true, [fieldMap[routerName]]: [taxDoc._id] }).save()
      await new Recipe({ name: "R2", userId: user.id, isPublic: true, [fieldMap[routerName]]: [taxDoc._id] }).save()

      const { appRouter } = await import("@/server/trpc/router")
      const caller = appRouter.createCaller({ session: null, user: null })
      const result = await (caller[routerName] as { list: () => Promise<{ slug: string; recipeCount: number }[]> }).list()

      const inserted = result.find((r) => r.slug === slug)
      expect(inserted?.recipeCount).toBe(2)
    })
  })
})
