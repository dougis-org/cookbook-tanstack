import { describe, it, expect, vi } from "vitest"

const mockDb = vi.fn(() => ({}))

vi.mock("@/db", () => ({
  getMongoClient: vi.fn(() => ({ db: mockDb })),
}))

describe("auth server config", () => {
  it("exports an auth instance with handler", async () => {
    const { auth } = await import("@/lib/auth")
    expect(auth).toBeDefined()
    expect(auth.handler).toBeDefined()
    expect(typeof auth.handler).toBe("function")
  })

  it("exposes getSession on the API", async () => {
    const { auth } = await import("@/lib/auth")
    expect(auth.api.getSession).toBeDefined()
    expect(typeof auth.api.getSession).toBe("function")
  })

  it("exposes signUpEmail on the API", async () => {
    const { auth } = await import("@/lib/auth")
    expect(auth.api.signUpEmail).toBeDefined()
    expect(typeof auth.api.signUpEmail).toBe("function")
  })

  it("initializes the auth adapter from the Mongo client db handle", async () => {
    vi.resetModules()
    mockDb.mockClear()

    await import("@/lib/auth")

    expect(mockDb).toHaveBeenCalledOnce()
  })
})
