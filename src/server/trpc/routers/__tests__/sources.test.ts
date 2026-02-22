// @vitest-environment node
import { describe, it, expect, vi, afterAll } from "vitest"
import { withDbTx, closeTestPool } from "@/test-helpers/with-db-tx"
import * as schema from "@/db/schema"

vi.mock("@/db", () => ({ db: {} }))
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }))

afterAll(async () => {
  await closeTestPool()
})

const RUN_ID = Date.now()
let seq = 0
function uid() {
  return `${RUN_ID}-${++seq}`
}

async function seedUser(db: Parameters<Parameters<typeof withDbTx>[0]>[0]) {
  const id = uid()
  const [user] = await db
    .insert(schema.users)
    .values({ email: `src-${id}@test.com`, username: `src-${id}`, displayUsername: `SrcUser ${id}` })
    .returning()
  return user
}

// ─── sources.list ─────────────────────────────────────────────────────────────

describe("sources.list", () => {
  it("returns an array (publicly accessible without auth)", async () => {
    await withDbTx(async (db) => {
      const { appRouter } = await import("@/server/trpc/router")
      const caller = appRouter.createCaller({ db: db as never, session: null, user: null })
      const result = await caller.sources.list()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  it("includes a newly inserted source", async () => {
    await withDbTx(async (db) => {
      const id = uid()
      await db.insert(schema.sources).values({ name: `ListSource-${id}` })

      const { appRouter } = await import("@/server/trpc/router")
      const caller = appRouter.createCaller({ db: db as never, session: null, user: null })
      const result = await caller.sources.list()

      expect(result).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: `ListSource-${id}` })]),
      )
    })
  })
})

// ─── sources.search ───────────────────────────────────────────────────────────

describe("sources.search", () => {
  it("returns sources matching query string (case-insensitive partial match)", async () => {
    await withDbTx(async (db) => {
      const id = uid()
      await db.insert(schema.sources).values([
        { name: `BonAppetit-${id}` },
        { name: `NewYorkTimes-${id}` },
      ])

      const { appRouter } = await import("@/server/trpc/router")
      const caller = appRouter.createCaller({ db: db as never, session: null, user: null })
      const result = await caller.sources.search({ query: `bonappetit-${id}` })

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ name: `BonAppetit-${id}` })
    })
  })

  it("returns empty array when no sources match", async () => {
    await withDbTx(async (db) => {
      const { appRouter } = await import("@/server/trpc/router")
      const caller = appRouter.createCaller({ db: db as never, session: null, user: null })
      const result = await caller.sources.search({ query: "no-such-source-xyz-99999" })
      expect(result).toEqual([])
    })
  })

  it("limits results to at most 10", async () => {
    await withDbTx(async (db) => {
      const id = uid()
      await db.insert(schema.sources).values(
        Array.from({ length: 15 }, (_, i) => ({ name: `SearchLimit-${id}-${i}` })),
      )

      const { appRouter } = await import("@/server/trpc/router")
      const caller = appRouter.createCaller({ db: db as never, session: null, user: null })
      const result = await caller.sources.search({ query: `SearchLimit-${id}` })

      expect(result.length).toBeLessThanOrEqual(10)
    })
  })

  it("is publicly accessible without authentication", async () => {
    await withDbTx(async (db) => {
      const { appRouter } = await import("@/server/trpc/router")
      const caller = appRouter.createCaller({ db: db as never, session: null, user: null })
      await expect(caller.sources.search({ query: "test" })).resolves.toBeDefined()
    })
  })
})

// ─── sources.create ──────────────────────────────────────────────────────────

describe("sources.create", () => {
  it("rejects unauthenticated requests", async () => {
    await withDbTx(async (db) => {
      const { appRouter } = await import("@/server/trpc/router")
      const caller = appRouter.createCaller({ db: db as never, session: null, user: null })
      await expect(caller.sources.create({ name: "Test" })).rejects.toThrow("UNAUTHORIZED")
    })
  })

  it("creates a source and returns it", async () => {
    await withDbTx(async (db) => {
      const user = await seedUser(db)

      const { appRouter } = await import("@/server/trpc/router")
      const caller = appRouter.createCaller({
        db: db as never,
        session: { id: "s1" } as never,
        user: { id: user.id } as never,
      })
      const result = await caller.sources.create({ name: "My Cookbook" })
      expect(result).toMatchObject({ name: "My Cookbook" })
    })
  })

  it("creates a source with an optional URL", async () => {
    await withDbTx(async (db) => {
      const user = await seedUser(db)

      const { appRouter } = await import("@/server/trpc/router")
      const caller = appRouter.createCaller({
        db: db as never,
        session: { id: "s1" } as never,
        user: { id: user.id } as never,
      })
      const result = await caller.sources.create({ name: "Web Source", url: "https://example.com" })
      expect(result).toMatchObject({ name: "Web Source", url: "https://example.com" })
    })
  })
})
