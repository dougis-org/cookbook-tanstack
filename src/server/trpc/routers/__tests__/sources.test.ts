// @vitest-environment node
import { describe, it, expect, vi } from "vitest"
import { withCleanDb } from "@/test-helpers/with-clean-db"
import { User, Source } from "@/db/models"

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }))

const RUN_ID = Date.now()
let seq = 0
function uid() {
  return `${RUN_ID}-${++seq}`
}

async function seedUser() {
  const id = uid()
  return new User({ email: `src-${id}@test.com`, username: `src-${id}`, displayUsername: `SrcUser ${id}` }).save()
}

async function makeAnonCaller() {
  const { appRouter } = await import("@/server/trpc/router")
  return appRouter.createCaller({ session: null, user: null })
}

async function makeAuthCaller(userId: string) {
  const { appRouter } = await import("@/server/trpc/router")
  return appRouter.createCaller({ session: { id: "s1" } as never, user: { id: userId } as never })
}

// ─── sources.list ─────────────────────────────────────────────────────────────

describe("sources.list", () => {
  it("returns an array (publicly accessible without auth)", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller()
      expect(Array.isArray(await caller.sources.list())).toBe(true)
    })
  })

  it("includes a newly inserted source", async () => {
    await withCleanDb(async () => {
      const id = uid()
      await new Source({ name: `ListSource-${id}` }).save()
      const caller = await makeAnonCaller()
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
    await withCleanDb(async () => {
      const id = uid()
      await new Source({ name: `BonAppetit-${id}` }).save()
      await new Source({ name: `NewYorkTimes-${id}` }).save()
      const caller = await makeAnonCaller()
      const result = await caller.sources.search({ query: `bonappetit-${id}` })
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ name: `BonAppetit-${id}` })
    })
  })

  it("returns empty array when no sources match", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller()
      expect(await caller.sources.search({ query: "no-such-source-xyz-99999" })).toEqual([])
    })
  })

  it("limits results to at most 10", async () => {
    await withCleanDb(async () => {
      const id = uid()
      await Promise.all(
        Array.from({ length: 15 }, (_, i) => new Source({ name: `SearchLimit-${id}-${i}` }).save()),
      )
      const caller = await makeAnonCaller()
      expect((await caller.sources.search({ query: `SearchLimit-${id}` })).length).toBeLessThanOrEqual(10)
    })
  })
})

// ─── sources.create ──────────────────────────────────────────────────────────

describe("sources.create", () => {
  it("rejects unauthenticated requests", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller()
      await expect(caller.sources.create({ name: "Test" })).rejects.toThrow("UNAUTHORIZED")
    })
  })

  it.each([
    [{ name: "My Cookbook" },                              { name: "My Cookbook" }],
    [{ name: "Web Source", url: "https://example.com" },   { name: "Web Source", url: "https://example.com" }],
  ])("creates source with input %o and returns the record", async (input, expected) => {
    await withCleanDb(async () => {
      const user = await seedUser()
      const caller = await makeAuthCaller(user.id)
      expect(await caller.sources.create(input)).toMatchObject(expected)
    })
  })
})
