import { describe, it, expect, vi, beforeEach } from "vitest"

const mockDb = vi.fn(() => ({}))
const mockSendEmail = vi.fn().mockResolvedValue({ messageId: "test-id" })

vi.mock("@/db", () => ({
  getMongoClient: vi.fn(() => ({ db: mockDb })),
}))

vi.mock("@/lib/mail", () => ({
  sendEmail: mockSendEmail,
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

  it("has sendResetPassword hook configured", async () => {
    const { auth } = await import("@/lib/auth")
    expect(auth.options.emailAndPassword?.sendResetPassword).toBeDefined()
    expect(typeof auth.options.emailAndPassword?.sendResetPassword).toBe("function")
  })

  it("has sendVerificationEmail hook configured", async () => {
    const { auth } = await import("@/lib/auth")
    expect(auth.options.emailVerification?.sendVerificationEmail).toBeDefined()
    expect(typeof auth.options.emailVerification?.sendVerificationEmail).toBe("function")
  })
})

describe("auth email hooks behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("sendResetPassword hook sends email to user with reset url", async () => {
    const { auth } = await import("@/lib/auth")
    const hook = auth.options.emailAndPassword?.sendResetPassword
    await hook?.({ user: { email: "user@example.com" } as any, url: "https://example.com/reset" })
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "user@example.com" })
    )
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining("https://example.com/reset") })
    )
  })

  it("sendVerificationEmail hook sends email to user with verification url", async () => {
    const { auth } = await import("@/lib/auth")
    const hook = auth.options.emailVerification?.sendVerificationEmail
    await hook?.({ user: { email: "user@example.com" } as any, url: "https://example.com/verify" })
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "user@example.com" })
    )
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining("https://example.com/verify") })
    )
  })
})
