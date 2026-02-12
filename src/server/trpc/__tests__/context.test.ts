import { describe, it, expect, vi, beforeEach } from "vitest"

const mockDb = { select: vi.fn() }
const mockGetSession = vi.fn()

vi.mock("@/db", () => ({
  db: mockDb,
}))

vi.mock("@/db/schema", () => ({
  users: {},
  sessions: {},
  accounts: {},
  verifications: {},
}))

vi.mock("@/lib/auth", () => ({
  auth: {
    api: { getSession: mockGetSession },
  },
}))

describe("createContext", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns db, session, and user when authenticated", async () => {
    const { createContext } = await import("@/server/trpc/context")

    mockGetSession.mockResolvedValue({
      session: { id: "session-1" },
      user: { id: "user-1", email: "test@example.com" },
    })

    const ctx = await createContext({
      req: new Request("http://localhost/api/trpc"),
      resHeaders: new Headers(),
      info: {} as never,
    })

    expect(ctx.db).toBe(mockDb)
    expect(ctx.session).toEqual({ id: "session-1" })
    expect(ctx.user).toEqual({ id: "user-1", email: "test@example.com" })
  })

  it("returns null session and user when unauthenticated", async () => {
    const { createContext } = await import("@/server/trpc/context")

    mockGetSession.mockResolvedValue(null)

    const ctx = await createContext({
      req: new Request("http://localhost/api/trpc"),
      resHeaders: new Headers(),
      info: {} as never,
    })

    expect(ctx.db).toBe(mockDb)
    expect(ctx.session).toBeNull()
    expect(ctx.user).toBeNull()
  })
})
