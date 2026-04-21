import { beforeEach, describe, expect, it, vi } from "vitest"
import { mockAuthClient, mockSendVerificationEmail } from "@/test-helpers/auth"

vi.mock("@/lib/auth-client", () => ({
  authClient: mockAuthClient,
}))

import { getVerificationEmailErrorMessage, requestVerificationEmail } from "@/components/auth/verificationEmail"

describe("verificationEmail helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendVerificationEmail.mockResolvedValue({})
  })

  it("requests verification email with the verify-email callback URL", async () => {
    await requestVerificationEmail("cook@example.com")

    expect(mockSendVerificationEmail).toHaveBeenCalledWith({
      email: "cook@example.com",
      callbackURL: "/auth/verify-email",
    })
  })

  it("throws BetterAuth response error messages", async () => {
    mockSendVerificationEmail.mockResolvedValue({ error: { message: "Too many requests" } })

    await expect(requestVerificationEmail("cook@example.com")).rejects.toThrow("Too many requests")
  })

  it("throws fallback text when BetterAuth returns an error without a message", async () => {
    mockSendVerificationEmail.mockResolvedValue({ error: {} })

    await expect(requestVerificationEmail("cook@example.com")).rejects.toThrow(
      "Unable to send verification email",
    )
  })

  it("throws fallback text when BetterAuth returns a blank error message", async () => {
    mockSendVerificationEmail.mockResolvedValue({ error: { message: "   " } })

    await expect(requestVerificationEmail("cook@example.com")).rejects.toThrow(
      "Unable to send verification email",
    )
  })

  it("extracts Error instances and plain message objects", () => {
    expect(getVerificationEmailErrorMessage(new Error("Network error"))).toBe("Network error")
    expect(getVerificationEmailErrorMessage({ message: "Rate limited" })).toBe("Rate limited")
  })

  it("falls back for non-standard error shapes", () => {
    expect(getVerificationEmailErrorMessage({ error: { message: "Nested" } })).toBe(
      "Unable to send verification email",
    )
    expect(getVerificationEmailErrorMessage({ message: "" })).toBe(
      "Unable to send verification email",
    )
    expect(getVerificationEmailErrorMessage("failed")).toBe("Unable to send verification email")
  })
})
