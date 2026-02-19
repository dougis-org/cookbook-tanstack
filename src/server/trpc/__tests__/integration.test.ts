// @vitest-environment node
/**
 * tRPC integration tests.
 *
 * Structural checks (router shape, auth enforcement, Zod validation) are
 * run against the real appRouter with a real DB behind it.  Because these
 * tests fail before any DB query is issued (auth check / Zod parse), the DB
 * is never touched and results are identical to the old mock-based approach —
 * but we no longer need to maintain the schema mock objects.
 */
import { describe, it, expect, vi, afterAll } from "vitest"
import { withDbTx, closeTestPool } from "@/test-helpers/with-db-tx"

vi.mock("@/db", () => ({ db: {} }))
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }))

afterAll(async () => {
  await closeTestPool()
})

const VALID_UUID = "00000000-0000-0000-0000-000000000000"
const authCtx = { session: { id: "s1" } as never, user: { id: "u1" } as never }
const anonCtx = { session: null, user: null }

describe("tRPC integration", () => {
  describe("router structure", () => {
    it("has all expected sub-routers", async () => {
      const { appRouter } = await import("@/server/trpc/router")
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
      { path: "recipes.update", input: { id: VALID_UUID, name: "Test" } },
      { path: "recipes.delete", input: { id: VALID_UUID } },
      { path: "cookbooks.create", input: { name: "Test" } },
      { path: "cookbooks.update", input: { id: VALID_UUID, name: "Test" } },
      { path: "cookbooks.delete", input: { id: VALID_UUID } },
      { path: "sources.create", input: { name: "Test" } },
      { path: "users.me", input: undefined },
      { path: "users.updateProfile", input: { name: "Test" } },
    ]

    for (const { path, input } of protectedProcedures) {
      it(`rejects unauthenticated call to ${path}`, async () => {
        await withDbTx(async (db) => {
          const { appRouter } = await import("@/server/trpc/router")
          const caller = appRouter.createCaller({ db: db as never, ...anonCtx })
          const [routerName, procName] = path.split(".") as [keyof typeof caller, string]
          const proc = (caller[routerName] as Record<string, Function>)[procName]
          await expect(proc(input)).rejects.toThrow("UNAUTHORIZED")
        })
      })
    }
  })

  describe("Zod validation", () => {
    it("rejects invalid UUID for recipes.byId", async () => {
      await withDbTx(async (db) => {
        const { appRouter } = await import("@/server/trpc/router")
        const caller = appRouter.createCaller({ db: db as never, ...anonCtx })
        await expect(caller.recipes.byId({ id: "not-a-uuid" })).rejects.toThrow()
      })
    })

    it("rejects invalid UUID for classifications.byId", async () => {
      await withDbTx(async (db) => {
        const { appRouter } = await import("@/server/trpc/router")
        const caller = appRouter.createCaller({ db: db as never, ...anonCtx })
        await expect(caller.classifications.byId({ id: "invalid" })).rejects.toThrow()
      })
    })

    it("rejects empty name for recipes.create", async () => {
      await withDbTx(async (db) => {
        const { appRouter } = await import("@/server/trpc/router")
        const caller = appRouter.createCaller({ db: db as never, ...authCtx })
        await expect(caller.recipes.create({ name: "" })).rejects.toThrow()
      })
    })

    it("rejects invalid URL for sources.create", async () => {
      await withDbTx(async (db) => {
        const { appRouter } = await import("@/server/trpc/router")
        const caller = appRouter.createCaller({ db: db as never, ...authCtx })
        await expect(caller.sources.create({ name: "Test", url: "not-a-url" })).rejects.toThrow()
      })
    })

    it("rejects empty users.updateProfile input", async () => {
      await withDbTx(async (db) => {
        const { appRouter } = await import("@/server/trpc/router")
        const caller = appRouter.createCaller({ db: db as never, ...authCtx })
        await expect(caller.users.updateProfile({})).rejects.toThrow()
      })
    })

    it("rejects cookbooks.update with only an id", async () => {
      await withDbTx(async (db) => {
        const { appRouter } = await import("@/server/trpc/router")
        const caller = appRouter.createCaller({ db: db as never, ...authCtx })
        await expect(caller.cookbooks.update({ id: VALID_UUID })).rejects.toThrow()
      })
    })
  })

  describe("public access", () => {
    it.each(["meals", "courses", "preparations"] as const)(
      "allows unauthenticated access to %s.list",
      async (routerName) => {
        await withDbTx(async (db) => {
          const { appRouter } = await import("@/server/trpc/router")
          const caller = appRouter.createCaller({ db: db as never, ...anonCtx })
          // With an empty DB the result is an empty array — the test verifies
          // the route is publicly accessible (no UNAUTHORIZED error thrown).
          const result = await (caller[routerName] as { list: () => Promise<unknown[]> }).list()
          expect(Array.isArray(result)).toBe(true)
        })
      },
    )
  })
})
