import { beforeEach, describe, expect, it, vi } from "vitest"

const mockBetterAuth = vi.fn((config) => ({
  __config: config,
  handler: vi.fn(),
  api: {
    getSession: vi.fn(),
    signUpEmail: vi.fn(),
  },
}))

const mockMongoDbAdapter = vi.fn(() => "mongodb-adapter")
const mockTanstackStartCookies = vi.fn(() => "tanstack-start-cookies-plugin")
const mockUsername = vi.fn(() => "username-plugin")

vi.mock("better-auth", () => ({
  betterAuth: mockBetterAuth,
}))

vi.mock("better-auth/adapters/mongodb", () => ({
  mongodbAdapter: mockMongoDbAdapter,
}))

vi.mock("better-auth/tanstack-start", () => ({
  tanstackStartCookies: mockTanstackStartCookies,
}))

vi.mock("better-auth/plugins", () => ({
  username: mockUsername,
}))

vi.mock("@/db", () => ({
  getMongoClient: vi.fn(() => ({
    db: vi.fn(() => ({})),
  })),
}))

describe("auth configuration", () => {
  beforeEach(() => {
    vi.resetModules()
    mockBetterAuth.mockClear()
    mockMongoDbAdapter.mockClear()
    mockTanstackStartCookies.mockClear()
    mockUsername.mockClear()
  })

  it("pins the session and cookie cache timings used by the app", async () => {
    await import("@/lib/auth")

    expect(mockBetterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        session: expect.objectContaining({
          expiresIn: 60 * 60 * 24 * 7,
          updateAge: 60 * 60 * 24,
          cookieCache: expect.objectContaining({
            enabled: true,
            maxAge: 5 * 60,
          }),
        }),
      }),
    )
  })

  it("keeps tanstackStartCookies as the final plugin", async () => {
    await import("@/lib/auth")

    const config = mockBetterAuth.mock.calls[0]?.[0]

    expect(config.plugins).toEqual([
      "username-plugin",
      "tanstack-start-cookies-plugin",
    ])
  })

  it("includes user.additionalFields.tier with type string and default home-cook", async () => {
    await import("@/lib/auth")

    const config = mockBetterAuth.mock.calls[0]?.[0]

    expect(config.user?.additionalFields?.tier).toMatchObject({
      type: "string",
      defaultValue: "home-cook",
    })
  })

  it("includes user.additionalFields.isAdmin with type boolean and default false", async () => {
    await import("@/lib/auth")

    const config = mockBetterAuth.mock.calls[0]?.[0]

    expect(config.user?.additionalFields?.isAdmin).toMatchObject({
      type: "boolean",
      defaultValue: false,
    })
  })

  it("preserves existing config keys (emailAndPassword, session, plugins)", async () => {
    await import("@/lib/auth")

    const config = mockBetterAuth.mock.calls[0]?.[0]

    expect(config.emailAndPassword).toBeDefined()
    expect(config.session).toBeDefined()
    expect(config.plugins).toBeDefined()
  })
})
