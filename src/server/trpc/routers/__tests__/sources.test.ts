// @vitest-environment node
import { describe, it, expect, vi, afterAll } from "vitest"
import { withDbTx, closeTestPool, type TestDb } from "@/test-helpers/with-db-tx"
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

async function seedUser(db: TestDb) {
  const id = uid()
  const [user] = await db
    .insert(schema.users)
    .values({ email: `src-${id}@test.com`, username: `src-${id}`, displayUsername: `SrcUser ${id}` })
    .returning()
  return user
}

async function makeAnonCaller(db: TestDb) {
  const { appRouter } = await import("@/server/trpc/router")
  return appRouter.createCaller({ db: db as never, session: null, user: null })
}

async function makeAuthCaller(db: TestDb, userId: string) {
  const { appRouter } = await import("@/server/trpc/router")
  return appRouter.createCaller({ db: db as never, session: { id: "s1" } as never, user: { id: userId } as never })
}

// ─── sources.list ─────────────────────────────────────────────────────────────

describe("sources.list", () => {
  it("returns an array (publicly accessible without auth)", async () => {
    await withDbTx(async (db) => {
      const caller = await makeAnonCaller(db)
      expect(Array.isArray(await caller.sources.list())).toBe(true)
    })
  })

  it("includes a newly inserted source", async () => {
    await withDbTx(async (db) => {
      const id = uid()
      await db.insert(schema.sources).values({ name: `ListSource-${id}` })
      const caller = await makeAnonCaller(db)
      const result = await caller.sources.list()
      expect(result).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: `ListSource-${id}` })]),
      )
    })
  })
})

// ─── sources.search ───────────────────────────────────────────────────────────

describe("sources.search", () => {
  it("returns sources matching query (case-insensitive partial match)", async () => {
    await withDbTx(async (db) => {
      const id = uid()
      await db.insert(schema.sources).values([
        { name: `BonAppetit-${id}` },
        { name: `NewYorkTimes-${id}` },
      ])
      const caller = await makeAnonCaller(db)
      const result = await caller.sources.search({ query: `bonappetit-${id}` })
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ name: `BonAppetit-${id}` })
    })
  })

  it("returns empty array when no sources match", async () => {
    await withDbTx(async (db) => {
      const caller = await makeAnonCaller(db)
      expect(await caller.sources.search({ query: "no-such-source-xyz-99999" })).toEqual([])
    })
  })

  it("limits results to at most 10", async () => {
    await withDbTx(async (db) => {
      const id = uid()
      await db.insert(schema.sources).values(
        Array.from({ length: 15 }, (_, i) => ({ name: `SearchLimit-${id}-${i}` })),
      )
      const caller = await makeAnonCaller(db)
      expect((await caller.sources.search({ query: `SearchLimit-${id}` })).length).toBeLessThanOrEqual(10)
    })
  })
})

// ─── sources.create ──────────────────────────────────────────────────────────

describe("sources.create", () => {
  it("rejects unauthenticated requests", async () => {
    await withDbTx(async (db) => {
      const caller = await makeAnonCaller(db)
      await expect(caller.sources.create({ name: "Test" })).rejects.toThrow("UNAUTHORIZED")
    })
  })

  it.each([
    [{ name: "My Cookbook" },                              { name: "My Cookbook" }],
    [{ name: "Web Source", url: "https://example.com" },   { name: "Web Source", url: "https://example.com" }],
  ])("creates source with input %o and returns the record", async (input, expected) => {
    await withDbTx(async (db) => {
      const user = await seedUser(db)
      const caller = await makeAuthCaller(db, user.id)
      expect(await caller.sources.create(input)).toMatchObject(expected)
    })
  })
})
