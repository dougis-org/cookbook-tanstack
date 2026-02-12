import { describe, it, expect, vi } from "vitest"

vi.mock("@/db", () => ({
  db: {},
}))

vi.mock("@/db/schema", () => ({
  users: {},
  sessions: {},
  accounts: {},
  verifications: {},
}))

vi.mock("@/lib/auth", () => ({
  auth: {
    api: { getSession: vi.fn() },
  },
}))

describe("tRPC client setup", () => {
  it("exports queryClient", async () => {
    const { queryClient } = await import("@/lib/trpc")
    expect(queryClient).toBeDefined()
    expect(typeof queryClient.fetchQuery).toBe("function")
  })

  it("exports trpc proxy", async () => {
    const { trpc } = await import("@/lib/trpc")
    expect(trpc).toBeDefined()
  })
})
