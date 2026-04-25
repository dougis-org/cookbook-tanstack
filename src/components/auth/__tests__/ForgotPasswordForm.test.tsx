import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { createRouterMock } from "@/test-helpers/mocks"
import {
  mockAuthClient,
  mockRequestPasswordReset,
  setupAuthCallbacks,
} from "@/test-helpers/auth"
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm"

vi.mock("@tanstack/react-router", () => createRouterMock())

vi.mock("@/lib/auth-client", () => ({
  authClient: mockAuthClient,
}))

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequestPasswordReset.mockResolvedValue({})
  })

  it("sends requestPasswordReset for a valid submission", async () => {
    render(<ForgotPasswordForm />)

    fireEvent.change(screen.getByLabelText(/^email/i), {
      target: { value: "test@example.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }))

    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledWith(
        {
          email: "test@example.com",
          redirectTo: "/auth/reset-password",
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
      )
    })
  })

  it("shows the neutral confirmation state after a successful submission", async () => {
    setupAuthCallbacks(mockRequestPasswordReset, "success")

    render(<ForgotPasswordForm />)

    fireEvent.change(screen.getByLabelText(/^email/i), {
      target: { value: "test@example.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/if an account with that email exists/i),
      ).toBeInTheDocument()
    })
    expect(
      screen.getByRole("link", { name: /back to sign in/i }),
    ).toHaveAttribute("href", "/auth/login")
    expect(
      screen.queryByRole("button", { name: /send reset link/i }),
    ).not.toBeInTheDocument()
  })

  it("shows a readable client error message", async () => {
    setupAuthCallbacks(mockRequestPasswordReset, "error", "Too many requests")

    render(<ForgotPasswordForm />)

    fireEvent.change(screen.getByLabelText(/^email/i), {
      target: { value: "test@example.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Too many requests")
    })
  })

  it("blocks submission for an invalid email", async () => {
    render(<ForgotPasswordForm />)

    fireEvent.change(screen.getByLabelText(/^email/i), {
      target: { value: "invalid" },
    })
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }))

    await waitFor(() => {
      expect(screen.getByText("Please enter a valid email")).toBeInTheDocument()
    })
    expect(mockRequestPasswordReset).not.toHaveBeenCalled()
  })
})
