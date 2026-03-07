// @vitest-environment node
/**
 * tRPC integration tests.
 *
 * Structural checks (router shape, auth enforcement, Zod validation) are
 * run against the real appRouter with a real MongoDB instance behind it.
 * Most of these tests fail before any DB query is issued (auth check / Zod
 * parse), so the DB is not touched for those cases.
 */
import { describe, it, expect, vi, afterAll, beforeAll } from "vitest"
import { withCleanDb } from "@/test-helpers/with-clean-db"
import { Meal, Course, Preparation } from "@/db/models"
import type { AppRouter } from "@/server/trpc/router"

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }))

// A valid 24-hex-char ObjectId string that will not match any document
const VALID_OBJECT_ID = "000000000000000000000000"
const authCtx = { session: { id: "s1" } as never, user: { id: "u1" } as never }
const anonCtx = { session: null, user: null }

// Unique prefix per test run for slug-based uniqueness
const RUN_ID = Date.now()

// Import the router once for the entire suite
let appRouter: AppRouter
beforeAll(async () => {
  ;({ appRouter } = await import("@/server/trpc/router"))
})

afterAll(async () => {
  vi.restoreAllMocks()
})

describe("tRPC integration", () => {
  describe("router structure", () => {
    it("has all expected sub-routers", () => {
      const routers = Object.keys(appRouter._def.record)
      expect(routers).toEqual(
        expect.arrayContaining([
          "recipes",
          "cookbooks",
          "classifications",
          "sources",
          "meals",
          "courses",
          "preparations",
          "users",
        ]),
      )
    })
  })

  describe("auth middleware enforcement", () => {
    const protectedProcedures = [
      { path: "recipes.create", input: { name: "Test" } },
      { path: "recipes.update", input: { id: VALID_OBJECT_ID, name: "Test" } },
      { path: "recipes.delete", input: { id: VALID_OBJECT_ID } },
      { path: "cookbooks.create", input: { name: "Test" } },
      { path: "cookbooks.update", input: { id: VALID_OBJECT_ID, name: "Test" } },
      { path: "cookbooks.delete", input: { id: VALID_OBJECT_ID } },
      { path: "sources.create", input: { name: "Test" } },
      { path: "users.me", input: undefined },
      { path: "users.updateProfile", input: { name: "Test" } },
    ]

    for (const { path, input } of protectedProcedures) {
      it(`rejects unauthenticated call to ${path}`, async () => {
        const caller = appRouter.createCaller({ ...anonCtx })
        const [routerName, procName] = path.split(".") as [keyof typeof caller, string]
        const proc = (caller[routerName] as Record<string, Function>)[procName]
        await expect(proc(input)).rejects.toThrow("UNAUTHORIZED")
      })
    }
  })

  describe("Zod validation", () => {
    it("rejects empty name for recipes.create", async () => {
      const caller = appRouter.createCaller({ ...authCtx })
      await expect(caller.recipes.create({ name: "" })).rejects.toThrow()
    })

    it("rejects invalid URL for sources.create", async () => {
      const caller = appRouter.createCaller({ ...authCtx })
      await expect(caller.sources.create({ name: "Test", url: "not-a-url" })).rejects.toThrow()
    })

    it("rejects empty users.updateProfile input", async () => {
      const caller = appRouter.createCaller({ ...authCtx })
      await expect(caller.users.updateProfile({})).rejects.toThrow()
    })

    it("rejects cookbooks.update with only an id", async () => {
      const caller = appRouter.createCaller({ ...authCtx })
      await expect(caller.cookbooks.update({ id: VALID_OBJECT_ID })).rejects.toThrow()
    })
  })

  describe("public access", () => {
    it.each(["meals", "courses", "preparations"] as const)(
      "%s.list is accessible without auth and returns seeded data",
      async (routerName) => {
        await withCleanDb(async () => {
          const ModelMap = { meals: Meal, courses: Course, preparations: Preparation }
          const slug = `integration-${routerName}-${RUN_ID}`
          await new ModelMap[routerName]({ name: "Integration Item", slug }).save()

          const caller = appRouter.createCaller({ ...anonCtx })
          const result = await (caller[routerName] as { list: () => Promise<unknown[]> }).list()

          expect(result).toEqual(
            expect.arrayContaining([expect.objectContaining({ slug })]),
          )
        })
      },
    )
  })
})
