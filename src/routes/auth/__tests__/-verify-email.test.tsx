import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

const mockUseAuth = vi.fn()
const mockSendVerificationEmail = vi.fn()

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    sendVerificationEmail: (...args: unknown[]) => mockSendVerificationEmail(...args),
  },
}))

import VerifyEmailPage from "@/components/auth/VerifyEmailPage"

const unverifiedAuth = {
  session: {
    user: {
      id: "user-1",
      email: "cook@example.com",
      emailVerified: false,
    },
  },
  isPending: false,
  isLoggedIn: true,
  userId: "user-1",
}

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendVerificationEmail.mockResolvedValue({})
    mockUseAuth.mockReturnValue(unverifiedAuth)
  })

  it("renders success state when the session email is verified", () => {
    mockUseAuth.mockReturnValue({
      ...unverifiedAuth,
      session: { user: { ...unverifiedAuth.session.user, emailVerified: true } },
    })

    render(<VerifyEmailPage />)

    expect(screen.getByText(/email verified/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /continue to app/i })).toHaveAttribute("href", "/")
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
      expect(mockSendVerificationEmail).toHaveBeenCalledWith({
        email: "cook@example.com",
        callbackURL: "/auth/verify-email",
      })
    })
  })

  it("shows resend loading and success feedback", async () => {
    let resolveResend: (value: unknown) => void = () => {}
    mockSendVerificationEmail.mockImplementation(
      () => new Promise((resolve) => {
        resolveResend = resolve
      }),
    )

    render(<VerifyEmailPage />)
    fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }))

    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled()
    resolveResend({})

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
