import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import {
  loggedOutAuth,
  mockAuthClient,
  mockSendVerificationEmail,
  unverifiedAuth,
  verifiedAuth,
} from "@/test-helpers/auth"

const mockUseAuth = vi.fn()
const mockPathname = vi.hoisted(() => ({ value: "/" }))

vi.mock("@tanstack/react-router", async () => {
  const { createRouterMock } = await import("@/test-helpers/mocks")
  return createRouterMock({
    extras: {
      useRouterState: ({ select }: { select: (state: { location: { pathname: string } }) => unknown }) =>
        select({ location: { pathname: mockPathname.value } }),
    },
  })
})

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock("@/lib/auth-client", () => ({
  authClient: mockAuthClient,
}))

import VerificationBanner from "@/components/auth/VerificationBanner"

describe("VerificationBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname.value = "/"
    mockSendVerificationEmail.mockResolvedValue({})
    mockUseAuth.mockReturnValue(unverifiedAuth)
  })

  it("renders for an authenticated user with an unverified email", () => {
    render(<VerificationBanner />)

    expect(screen.getByText(/verify your email/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /resend verification email/i })).toBeInTheDocument()
  })

  it("does not render when the user is verified", () => {
    mockUseAuth.mockReturnValue(verifiedAuth)

    render(<VerificationBanner />)

    expect(screen.queryByText(/verify your email/i)).not.toBeInTheDocument()
  })

  it("does not render when there is no session", () => {
    mockUseAuth.mockReturnValue(loggedOutAuth)

    render(<VerificationBanner />)

    expect(screen.queryByText(/verify your email/i)).not.toBeInTheDocument()
  })

  it("does not render on auth routes", () => {
    mockPathname.value = "/auth/login"

    render(<VerificationBanner />)

    expect(screen.queryByText(/verify your email/i)).not.toBeInTheDocument()
  })

  it("sends a verification email to the session email", async () => {
    render(<VerificationBanner />)

    fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }))

    await waitFor(() => {
      expect(mockSendVerificationEmail).toHaveBeenCalledWith({
        email: "cook@example.com",
        callbackURL: "/auth/verify-email",
      })
    })
  })

  it("shows loading feedback while resend is pending", async () => {
    let resolveResend: (value: unknown) => void = () => {}
    mockSendVerificationEmail.mockImplementation(
      () => new Promise((resolve) => {
        resolveResend = resolve
      }),
    )

    render(<VerificationBanner />)
    fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }))

    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled()
    resolveResend({})

    await waitFor(() => {
      expect(screen.getByText(/verification email sent/i)).toBeInTheDocument()
    })
  })

  it("shows success feedback after resend", async () => {
    render(<VerificationBanner />)

    fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }))

    await waitFor(() => {
      expect(screen.getByText(/verification email sent/i)).toBeInTheDocument()
    })
  })

  it("shows error feedback after resend failure", async () => {
    mockSendVerificationEmail.mockRejectedValue(new Error("Too many requests"))

    render(<VerificationBanner />)
    fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Too many requests")
    })
  })

  it("does not throw or render when emailVerified is missing", () => {
    mockUseAuth.mockReturnValue({
      ...unverifiedAuth,
      session: { user: { id: "user-1", email: "cook@example.com" } },
    })

    expect(() => render(<VerificationBanner />)).not.toThrow()
    expect(screen.queryByText(/verify your email/i)).not.toBeInTheDocument()
  })
})
