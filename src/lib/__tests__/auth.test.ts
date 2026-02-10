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
})
