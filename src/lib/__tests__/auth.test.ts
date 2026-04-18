import { describe, it, expect, vi, beforeEach } from "vitest"

const mockDb = vi.fn(() => ({}))
const mockSendEmail = vi.fn().mockResolvedValue({ messageId: "test-id" })

vi.mock("@/db", () => ({
  getMongoClient: vi.fn(() => ({ db: mockDb })),
}))

vi.mock("@/lib/mail", () => ({
  sendEmail: mockSendEmail,
}))

async function getAuth() {
  const { auth } = await import("@/lib/auth")
  return auth
}

function assertIsFunction(value: unknown) {
  expect(value).toBeDefined()
  expect(typeof value).toBe("function")
}

function assertEmailSentTo(to: string, urlContaining: string) {
  expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({ to }))
  expect(mockSendEmail).toHaveBeenCalledWith(
    expect.objectContaining({ text: expect.stringContaining(urlContaining) })
  )
}

describe("auth server config", () => {
  it("exports an auth instance with handler", async () => {
    const auth = await getAuth()
    expect(auth).toBeDefined()
    assertIsFunction(auth.handler)
  })

  it("exposes getSession on the API", async () => {
    assertIsFunction((await getAuth()).api.getSession)
  })

  it("exposes signUpEmail on the API", async () => {
    assertIsFunction((await getAuth()).api.signUpEmail)
  })

  it("initializes the auth adapter from the Mongo client db handle", async () => {
    vi.resetModules()
    mockDb.mockClear()

    await import("@/lib/auth")

    expect(mockDb).toHaveBeenCalledOnce()
  })

  it("has sendResetPassword hook configured", async () => {
    assertIsFunction((await getAuth()).options.emailAndPassword?.sendResetPassword)
  })

  it("has sendVerificationEmail hook configured", async () => {
    assertIsFunction((await getAuth()).options.emailVerification?.sendVerificationEmail)
  })
})

describe("auth email hooks behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("sendResetPassword hook sends email to user with reset url", async () => {
    const { auth } = await import("@/lib/auth")
    const hook = auth.options.emailAndPassword?.sendResetPassword
    await hook?.({
      user: { email: "user@example.com" } as any,
      url: "https://example.com/reset",
      token: "test-token",
    })
    assertEmailSentTo("user@example.com", "https://example.com/reset")
  })

  it("sendVerificationEmail hook sends email to user with verification url", async () => {
    const { auth } = await import("@/lib/auth")
    const hook = auth.options.emailVerification?.sendVerificationEmail
    await hook?.({
      user: { email: "user@example.com" } as any,
      url: "https://example.com/verify",
      token: "test-token",
    })
    assertEmailSentTo("user@example.com", "https://example.com/verify")
  })
})
