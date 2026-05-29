import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

const mockRequestVerificationEmail = vi.hoisted(() => vi.fn())
const mockGetVerificationEmailErrorMessage = vi.hoisted(() =>
  vi.fn((error: unknown) => (error instanceof Error ? error.message : "Unable to send verification email"))
)

vi.mock("@/components/auth/verificationEmail", () => ({
  requestVerificationEmail: mockRequestVerificationEmail,
  getVerificationEmailErrorMessage: mockGetVerificationEmailErrorMessage,
}))

vi.mock("@tanstack/react-router", async () => {
  const { createRouterMock } = await import("@/test-helpers/mocks")
  return createRouterMock()
})

import PostSubmitVerifyGate from "@/components/recipes/PostSubmitVerifyGate"

const TEST_PROPS = {
  recipeId: "recipe-abc",
  recipeName: "Grandma's Lasagna",
  email: "cook@example.com",
}

describe("PostSubmitVerifyGate", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequestVerificationEmail.mockResolvedValue(undefined)
  })

  it("renders the recipe name", () => {
    render(<PostSubmitVerifyGate {...TEST_PROPS} />)

    expect(screen.getByText(/Grandma's Lasagna/)).toBeInTheDocument()
  })

  it("renders the spec copy with no emoji", () => {
    render(<PostSubmitVerifyGate {...TEST_PROPS} />)

    expect(screen.getByText("One more step — verify your email to publish this recipe.")).toBeInTheDocument()
    const gate = screen.getByTestId("post-submit-verify-gate")
    expect(gate.textContent).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u)
  })

  it("renders a resend verification email button", () => {
    render(<PostSubmitVerifyGate {...TEST_PROPS} />)

    expect(screen.getByRole("button", { name: /resend verification email/i })).toBeInTheDocument()
  })

  it("triggers requestVerificationEmail with the provided email on button click", async () => {
    render(<PostSubmitVerifyGate {...TEST_PROPS} />)

    fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }))

    await waitFor(() => {
      expect(mockRequestVerificationEmail).toHaveBeenCalledWith("cook@example.com")
    })
  })

  it("shows loading state while the request is in flight", async () => {
    let resolveRequest!: () => void
    mockRequestVerificationEmail.mockReturnValue(
      new Promise<void>((resolve) => { resolveRequest = resolve })
    )

    render(<PostSubmitVerifyGate {...TEST_PROPS} />)
    fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }))

    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled()
    resolveRequest()

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /sending/i })).not.toBeInTheDocument()
    })
  })

  it("shows success state after a successful resend", async () => {
    render(<PostSubmitVerifyGate {...TEST_PROPS} />)

    fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }))

    await waitFor(() => {
      expect(screen.getByText(/verification email resent/i)).toBeInTheDocument()
    })
  })

  it("disables the button after a successful resend", async () => {
    render(<PostSubmitVerifyGate {...TEST_PROPS} />)

    fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }))

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /resend verification email/i })).toBeDisabled()
    })
  })

  it("shows error state after a failed resend", async () => {
    mockRequestVerificationEmail.mockRejectedValue(new Error("Too many requests"))

    render(<PostSubmitVerifyGate {...TEST_PROPS} />)
    fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Too many requests")
    })
  })

  it("keeps the button enabled after an error so the user can retry", async () => {
    mockRequestVerificationEmail.mockRejectedValue(new Error("Network error"))

    render(<PostSubmitVerifyGate {...TEST_PROPS} />)
    fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }))

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /resend verification email/i })).not.toBeDisabled()
    })
  })
})
