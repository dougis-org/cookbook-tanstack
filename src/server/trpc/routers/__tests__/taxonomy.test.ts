// @vitest-environment node
import { describe, it, expect, vi, afterAll } from "vitest"
import { withDbTx, closeTestPool } from "@/test-helpers/with-db-tx"
import * as schema from "@/db/schema"

// Prevent the module-level Pool in src/db/index.ts from connecting;
// the router receives ctx.db from the caller, not this singleton.
vi.mock("@/db", () => ({ db: {} }))
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }))

afterAll(async () => {
  await closeTestPool()
})

describe.each(["meals", "courses", "preparations"] as const)("%s.list", (routerName) => {
  const tableMap = {
    meals: schema.meals,
    courses: schema.courses,
    preparations: schema.preparations,
  } as const

  it("returns an empty array when no rows exist", async () => {
    await withDbTx(async (db) => {
      const { appRouter } = await import("@/server/trpc/router")
      const caller = appRouter.createCaller({ db: db as never, session: null, user: null })
      const result = await (caller[routerName] as { list: () => Promise<unknown[]> }).list()
      expect(result).toEqual([])
    })
  })

  it("returns all inserted rows", async () => {
    await withDbTx(async (db) => {
      await db.insert(tableMap[routerName]).values({ name: "Breakfast", slug: "breakfast" })

      const { appRouter } = await import("@/server/trpc/router")
      const caller = appRouter.createCaller({ db: db as never, session: null, user: null })
      const result = await (caller[routerName] as { list: () => Promise<unknown[]> }).list()

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ name: "Breakfast", slug: "breakfast" })
    })
  })

  it("returns multiple rows in insertion order", async () => {
    await withDbTx(async (db) => {
      await db.insert(tableMap[routerName]).values([
        { name: "Alpha", slug: "alpha" },
        { name: "Beta", slug: "beta" },
      ])

      const { appRouter } = await import("@/server/trpc/router")
      const caller = appRouter.createCaller({ db: db as never, session: null, user: null })
      const result = await (caller[routerName] as { list: () => Promise<unknown[]> }).list()

      expect(result).toHaveLength(2)
    })
  })
})
