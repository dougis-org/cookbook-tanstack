import { describe, it, expect, vi, beforeEach } from "vitest"

const mockGetSession = vi.fn()

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mockGetSession } } }))

const fetchOpts = {
  req: new Request("http://localhost/api/trpc"),
  resHeaders: new Headers(),
  info: {} as never,
}

describe("createContext", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns session and user when authenticated", async () => {
    const { createContext } = await import("@/server/trpc/context")
    mockGetSession.mockResolvedValue({
      session: { id: "session-1" },
      user: { id: "user-1", email: "test@example.com" },
    })

    const ctx = await createContext(fetchOpts)

    expect(ctx.session).toEqual({ id: "session-1" })
    expect(ctx.user).toEqual({ id: "user-1", email: "test@example.com" })
  })

  it("returns null session and user when unauthenticated", async () => {
    const { createContext } = await import("@/server/trpc/context")
    mockGetSession.mockResolvedValue(null)

    const ctx = await createContext(fetchOpts)

    expect(ctx.session).toBeNull()
    expect(ctx.user).toBeNull()
  })

  it("passes the incoming request headers to Better Auth session lookup", async () => {
    const { createContext } = await import("@/server/trpc/context")
    mockGetSession.mockResolvedValue(null)
    const headers = new Headers({
      cookie: "better-auth.session_token=test-token",
      "x-forwarded-host": "localhost:3000",
    })

    await createContext({
      ...fetchOpts,
      req: new Request("http://localhost/api/trpc", { headers }),
    })

    expect(mockGetSession).toHaveBeenCalledWith({
      headers: expect.any(Headers),
    })

    const [{ headers: passedHeaders }] = mockGetSession.mock.calls[0] as [
      { headers: Headers },
    ]

    expect(passedHeaders.get("cookie")).toBe(
      "better-auth.session_token=test-token",
    )
    expect(passedHeaders.get("x-forwarded-host")).toBe("localhost:3000")
  })

  it("does not include a db property on the context", async () => {
    const { createContext } = await import("@/server/trpc/context")
    mockGetSession.mockResolvedValue(null)

    const ctx = await createContext(fetchOpts)

    expect(ctx).not.toHaveProperty("db")
  })
})
