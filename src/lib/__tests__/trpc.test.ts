import { describe, it, expect, vi } from "vitest"

vi.mock("@/db", () => ({ db: {} }))
vi.mock("@/db/schema", () => ({ users: {}, sessions: {}, accounts: {}, verifications: {} }))
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }))

describe("tRPC client setup", () => {
  it("exports getQueryClient factory", async () => {
    const { getQueryClient } = await import("@/lib/trpc")
    expect(getQueryClient).toBeDefined()
    const qc = getQueryClient()
    expect(typeof qc.fetchQuery).toBe("function")
  })

  it("exports trpc proxy", async () => {
    const { trpc } = await import("@/lib/trpc")
    expect(trpc).toBeDefined()
  })
})
