import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import {
  holdVerificationEmailRequest,
  mockAuthClient,
  mockSendVerificationEmail,
  setupAuthCallbacks,
  TEST_USER,
  unverifiedAuth,
  verifiedAuth,
} from "@/test-helpers/auth"
import { validateVerifyEmailSearch } from "@/routes/auth/verify-email"

describe("verify-email route validateSearch", () => {
  it("NFR-1: strips from if it contains ://", () => {
    const result = validateVerifyEmailSearch({
      from: "https://evil.com",
      error: undefined,
    })
    expect(result.from).toBeUndefined()
  })

  it("NFR-1: strips from if it starts with //", () => {
    const result = validateVerifyEmailSearch({
      from: "//evil.com/steal",
      error: undefined,
    })
    expect(result.from).toBeUndefined()
  })

  it("preserves valid relative from path", () => {
    const result = validateVerifyEmailSearch({
      from: "/recipes/new",
      error: undefined,
    })
    expect(result.from).toBe("/recipes/new")
  })

  it("returns undefined when from is missing", () => {
    const result = validateVerifyEmailSearch({
      error: undefined,
    })
    expect(result.from).toBeUndefined()
  })

  it("preserves from with query string", () => {
    const result = validateVerifyEmailSearch({
      from: "/recipes?sort=newest",
      error: undefined,
    })
    expect(result.from).toBe("/recipes?sort=newest")
  })

  it("NFR-1: strips from if it is a javascript: URI (XSS prevention)", () => {
    const result = validateVerifyEmailSearch({
      from: "javascript:alert('xss')",
      error: undefined,
    })
    expect(result.from).toBeUndefined()
  })

  it("NFR-1: strips from if it contains a data: URI", () => {
    const result = validateVerifyEmailSearch({
      from: "data:text/html,<script>alert('xss')</script>",
      error: undefined,
    })
    expect(result.from).toBeUndefined()
  })
})

const mockUseAuth = vi.fn()
const mockUseQuery = vi.fn().mockReturnValue({ data: undefined })

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

vi.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

vi.mock("@/lib/trpc", () => ({
  trpc: { users: { me: { queryOptions: () => ({ queryKey: ["users", "me"] }) } } },
}))

import VerifyEmailPage from "@/components/auth/VerifyEmailPage"

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendVerificationEmail.mockResolvedValue({})
    mockUseAuth.mockReturnValue(unverifiedAuth)
    mockUseQuery.mockReturnValue({ data: undefined })
  })

  it("renders success state when the session email is verified", () => {
    mockUseAuth.mockReturnValue(verifiedAuth)

    render(<VerifyEmailPage />)

    expect(screen.getByText(/email verified/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /continue/i })).toHaveAttribute("href", "/")
  })

  it("FR-4: navigates to from prop when verified", () => {
    mockUseAuth.mockReturnValue(verifiedAuth)

    render(<VerifyEmailPage from="/recipes/new" />)

    expect(screen.getByText(/email verified/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /continue/i })).toHaveAttribute("href", "/recipes/new")
  })

  it("FR-5: falls back to / when from is absent", () => {
    mockUseAuth.mockReturnValue(verifiedAuth)

    render(<VerifyEmailPage />)

    expect(screen.getByRole("link", { name: /continue/i })).toHaveAttribute("href", "/")
  })

  it("renders success state when verified even if an error param is present", () => {
    mockUseAuth.mockReturnValue(verifiedAuth)

    render(<VerifyEmailPage error="INVALID_TOKEN" />)

    expect(screen.getByText(/email verified/i)).toBeInTheDocument()
    expect(screen.queryByText(/link may be invalid/i)).not.toBeInTheDocument()
  })

  it("renders error state when an error param is present", () => {
    render(<VerifyEmailPage error="INVALID_TOKEN" />)

    expect(screen.getByText(/link may be invalid/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /resend verification email/i })).toBeInTheDocument()
  })

  it("renders a default verify-email state when unverified and no error is present", () => {
    render(<VerifyEmailPage />)

    expect(screen.getByText(/verify your email/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /resend verification email/i })).toBeInTheDocument()
  })

  it("resends verification email from the error state", async () => {
    render(<VerifyEmailPage error="INVALID_TOKEN" />)

    fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }))

    await waitFor(() => {
      expect(mockSendVerificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: TEST_USER.email }),
        expect.any(Object),
      )
    })
  })

  it("shows resend loading and success feedback", async () => {
    const resolveResend = holdVerificationEmailRequest()

    render(<VerifyEmailPage />)
    fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }))

    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled()
    resolveResend()

    await waitFor(() => {
      expect(screen.getByText(/new verification link sent/i)).toBeInTheDocument()
    })
  })

  it("shows resend error feedback", async () => {
    setupAuthCallbacks(mockSendVerificationEmail, "error", "Too many requests")

    render(<VerifyEmailPage error="INVALID_TOKEN" />)
    fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }))

    await waitFor(() => {
      expect(screen.getByText(/Too many requests/i)).toBeInTheDocument()
    })
  })

  it("encodes from in callbackURL when resending", async () => {
    render(<VerifyEmailPage from="/recipes/new" />)
    fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }))

    await waitFor(() => {
      expect(mockSendVerificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          callbackURL: expect.stringContaining(`from=${encodeURIComponent("/recipes/new")}`),
        }),
        expect.any(Object),
      )
    })
  })

  it("shows error when BetterAuth resolves with error payload without firing callbacks", async () => {
    mockSendVerificationEmail.mockResolvedValue({ error: { message: "Rate limit exceeded" } })

    render(<VerifyEmailPage />)
    fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }))

    await waitFor(() => {
      expect(screen.getByText(/Rate limit exceeded/i)).toBeInTheDocument()
    })
  })
})
