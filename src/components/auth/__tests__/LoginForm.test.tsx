import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

const mockNavigate = vi.fn()
const mockSignInEmail = vi.fn()

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>{children}</a>
  ),
  useNavigate: () => mockNavigate,
}))

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      email: (...args: unknown[]) => mockSignInEmail(...args),
    },
  },
}))

import LoginForm from "@/components/auth/LoginForm"

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSignInEmail.mockResolvedValue({})
  })

  it("renders all form fields", () => {
    render(<LoginForm />)

    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByText("Remember me")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument()
  })

  it("shows validation errors on empty submit", async () => {
    render(<LoginForm />)

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText("Email is required")).toBeInTheDocument()
      expect(screen.getByText("Password is required")).toBeInTheDocument()
    })

    expect(mockSignInEmail).not.toHaveBeenCalled()
  })

  it("calls signIn on valid submission", async () => {
    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "test@example.com" } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "password123" } })
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => {
      expect(mockSignInEmail).toHaveBeenCalledWith(
        {
          email: "test@example.com",
          password: "password123",
          rememberMe: false,
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
      )
    })
  })

  it("passes rememberMe when checked", async () => {
    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "test@example.com" } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "password123" } })
    fireEvent.click(screen.getByText("Remember me"))
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => {
      expect(mockSignInEmail).toHaveBeenCalledWith(
        expect.objectContaining({ rememberMe: true }),
        expect.any(Object),
      )
    })
  })

  it("shows server error messages", async () => {
    mockSignInEmail.mockImplementation((_data: unknown, callbacks: { onError: (ctx: { error: { message: string } }) => void }) => {
      callbacks.onError({ error: { message: "Invalid credentials" } })
    })

    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "test@example.com" } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "wrongpass" } })
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials")
    })
  })

  it("has links to register and forgot password", () => {
    render(<LoginForm />)

    expect(screen.getByText("Create one")).toHaveAttribute("href", "/auth/register")
    expect(screen.getByText("Forgot password?")).toHaveAttribute("href", "/auth/forgot-password")
  })
})
