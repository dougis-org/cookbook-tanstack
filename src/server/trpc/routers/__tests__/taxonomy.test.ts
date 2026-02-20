// @vitest-environment node
import { describe, it, expect, vi, afterAll } from "vitest"
import { withDbTx, closeTestPool } from "@/test-helpers/with-db-tx"
import * as schema from "@/db/schema"

vi.mock("@/db", () => ({ db: {} }))
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }))

afterAll(async () => {
  await closeTestPool()
})

// Use a unique prefix per test run so assertions are independent of other
// data that may exist in the shared container. Integration tests verify
// "our record is present", not "only our record exists".
const RUN_ID = Date.now()

describe.each(["meals", "courses", "preparations"] as const)("%s.list", (routerName) => {
  const tableMap = {
    meals: schema.meals,
    courses: schema.courses,
    preparations: schema.preparations,
  } as const

  it("includes an inserted row in the result", async () => {
    await withDbTx(async (db) => {
      const slug = `${routerName}-single-${RUN_ID}`
      await db.insert(tableMap[routerName]).values({ name: "Breakfast", slug })

      const { appRouter } = await import("@/server/trpc/router")
      const caller = appRouter.createCaller({ db: db as never, session: null, user: null })
      const result = await (caller[routerName] as { list: () => Promise<unknown[]> }).list()

      expect(result).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: "Breakfast", slug })]),
      )
    })
  })

  it("includes all inserted rows in the result", async () => {
    await withDbTx(async (db) => {
      const slugA = `${routerName}-alpha-${RUN_ID}`
      const slugB = `${routerName}-beta-${RUN_ID}`
      await db.insert(tableMap[routerName]).values([
        { name: "Alpha", slug: slugA },
        { name: "Beta", slug: slugB },
      ])

      const { appRouter } = await import("@/server/trpc/router")
      const caller = appRouter.createCaller({ db: db as never, session: null, user: null })
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
    await withDbTx(async (db) => {
      const { appRouter } = await import("@/server/trpc/router")
      const caller = appRouter.createCaller({ db: db as never, session: null, user: null })
      const result = await (caller[routerName] as { list: () => Promise<unknown[]> }).list()
      expect(Array.isArray(result)).toBe(true)
    })
  })
})
