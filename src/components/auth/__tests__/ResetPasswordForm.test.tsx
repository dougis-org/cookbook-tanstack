import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { createRouterMock } from "@/test-helpers/mocks"
import { mockAuthClient, mockResetPassword, setupAuthCallbacks } from "@/test-helpers/auth"
import ResetPasswordForm from "@/components/auth/ResetPasswordForm"

const mockNavigate = vi.fn()

vi.mock("@tanstack/react-router", () => ({
  ...createRouterMock(),
  useNavigate: () => mockNavigate,
}))

vi.mock("@/lib/auth-client", () => ({
  authClient: mockAuthClient,
}))

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockResetPassword.mockResolvedValue({})
  })

  function fillForm(values?: { password?: string; confirmPassword?: string }) {
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: values?.password ?? "password123" },
    })
    fireEvent.change(screen.getByLabelText(/^confirm password/i), {
      target: { value: values?.confirmPassword ?? "password123" },
    })
  }

  it("sends resetPassword for a valid submission", async () => {
    render(<ResetPasswordForm token="reset-token" />)

    fillForm()
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }))

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith(
        {
          newPassword: "password123",
          token: "reset-token",
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
      )
    })
  })

  it("shows an error and does not submit when passwords do not match", async () => {
    render(<ResetPasswordForm token="reset-token" />)

    fillForm({ confirmPassword: "different123" })
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Passwords do not match")
    })
    expect(mockResetPassword).not.toHaveBeenCalled()
  })

  it("shows a readable Better Auth error message", async () => {
    setupAuthCallbacks(mockResetPassword, "error", "Reset token expired")

    render(<ResetPasswordForm token="reset-token" />)

    fillForm()
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Reset token expired")
    })
  })

  it("navigates to login after a successful reset", async () => {
    setupAuthCallbacks(mockResetPassword, "success")

    render(<ResetPasswordForm token="reset-token" />)

    fillForm()
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/auth/login" })
    })
  })
})
