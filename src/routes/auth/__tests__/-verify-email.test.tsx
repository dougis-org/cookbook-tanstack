import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import {
  expectVerificationEmailRequest,
  holdVerificationEmailRequest,
  mockAuthClient,
  mockSendVerificationEmail,
  unverifiedAuth,
  verifiedAuth,
} from "@/test-helpers/auth"

const mockUseAuth = vi.fn()

vi.mock("@tanstack/react-router", async () => {
  const { createRouterMock } = await import("@/test-helpers/mocks")
  return createRouterMock()
})

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock("@/lib/auth-client", () => ({
  authClient: mockAuthClient,
}))

import VerifyEmailPage from "@/components/auth/VerifyEmailPage"

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendVerificationEmail.mockResolvedValue({})
    mockUseAuth.mockReturnValue(unverifiedAuth)
  })

  it("renders success state when the session email is verified", () => {
    mockUseAuth.mockReturnValue(verifiedAuth)

    render(<VerifyEmailPage />)

    expect(screen.getByText(/email verified/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /continue to app/i })).toHaveAttribute("href", "/")
  })

  it("renders success state when verified even if an error param is present", () => {
    mockUseAuth.mockReturnValue(verifiedAuth)

    render(<VerifyEmailPage error="INVALID_TOKEN" />)

    expect(screen.getByText(/email verified/i)).toBeInTheDocument()
    expect(screen.queryByText(/verification link is invalid or has expired/i)).not.toBeInTheDocument()
  })

  it("renders error state when an error param is present", () => {
    render(<VerifyEmailPage error="INVALID_TOKEN" />)

    expect(screen.getByText(/verification link is invalid or has expired/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /resend verification email/i })).toBeInTheDocument()
  })

  it("renders a default verify-email state when unverified and no error is present", () => {
    render(<VerifyEmailPage />)

    expect(screen.getByText(/please verify your email/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /resend verification email/i })).toBeInTheDocument()
  })

  it("resends verification email from the error state", async () => {
    render(<VerifyEmailPage error="INVALID_TOKEN" />)

    fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }))

    await waitFor(() => {
      expectVerificationEmailRequest()
    })
  })

  it("shows resend loading and success feedback", async () => {
    const resolveResend = holdVerificationEmailRequest()

    render(<VerifyEmailPage />)
    fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }))

    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled()
    resolveResend()

    await waitFor(() => {
      expect(screen.getByText(/verification email sent/i)).toBeInTheDocument()
    })
  })

  it("shows resend error feedback", async () => {
    mockSendVerificationEmail.mockRejectedValue(new Error("Too many requests"))

    render(<VerifyEmailPage error="INVALID_TOKEN" />)
    fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Too many requests")
    })
  })
})
